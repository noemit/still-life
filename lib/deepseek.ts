import OpenAI from "openai";
import { viewSchema, type HistoryEntry, type ViewSpec } from "./types";

const BASE_URL = process.env.ORCAROUTER_BASE_URL ?? "https://api.orcarouter.ai/v1";
const API_KEY = process.env.ORCAROUTER_API_KEY ?? "";
const MODEL = process.env.ORCAROUTER_MODEL ?? "deepseek/deepseek-v4-flash-free";

export const hasApiKey = () => API_KEY.length > 0;

// The OpenAI SDK validates that the key is non-empty at instantiation, so use a
// placeholder when none is configured. If no key is set, mock mode runs and this
// client is never called.
const client = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY || "sk-placeholder" });

export const SYSTEM_PROMPT = `You are "LiveUI", an engine that turns any search query into a rendered, interactive web page. You output ONLY valid JSON — never markdown, never prose, never a code fence. The JSON must validate against this exact schema:

{
  "title": string (max 120),
  "subtitle": string (max 300, optional),
  "accent": one of #6366f1, #10b981, #f59e0b, #ef4444, #06b6d4, #a855f7, #ec4899, #84cc16 (optional),
  "blocks": [ ... ],   // 1 to ~20 blocks
  "suggestions": [ "up to 8 short strings the user might want to drill into next" ],
  "footer": string (max 200, optional)
}

Each block is one of these types (discriminated by "type"):

- {"type":"section","heading":"...","blocks":[...]}  — nested group of other blocks (max 10)
- {"type":"hero","title":"...","subtitle":"...","emoji":"🦜"}
- {"type":"paragraph","text":"..."}
- {"type":"stat","label":"...","value":"...","delta":"+12%" optional}
- {"type":"card","title":"...","value":"...","body":"...","emoji":"...","accent":"#...","action":{"label":"...","action":"..."} optional}
- {"type":"button","label":"...","variant":"primary|ghost|outline","action":"..."}
- {"type":"chip","items":[{"label":"...","action":"..."}]}  — row of clickable quick-actions
- {"type":"list","items":[{"title":"...","subtitle":"...","emoji":"...","action":{...} optional}]}
- {"type":"table","columns":["..."],"rows":[["..."]]}  — max 6 cols, 12 rows
- {"type":"chart","kind":"bar|line|donut","title":"...","labels":["..."],"values":[numbers],"color":"#...","action":{...} optional}
- {"type":"svg","title":"...","svg":"<raw svg markup>","width":400,"height":300,"caption":"..."}
- {"type":"form","title":"...","fields":[{"key":"city","label":"City","placeholder":"..."}],"submitLabel":"Go","action":"a query string, e.g. 'weather for {{city}}'"}
- {"type":"code","language":"python","code":"..."}  — display-only, never executed
- {"type":"quote","text":"...","author":"..."}
- {"type":"link","label":"...","url":"https://..."}
- {"type":"image","url":"https://...","caption":"..."}

RULES:
1. Answer the user's CURRENT query specifically. Be concrete, factual, current, and genuinely useful — pull real figures from your knowledge rather than generic filler.
2. Make the page interactive: at least 2–3 elements should carry an "action" string. An action is ANY follow-up query the user might type next (e.g. "compare prices vs last year", "recipe: tuna tartare", "convert 40km to miles"). Clicking that element must feel like a natural "drill in". The action string is what generates the next page.
3. Draw things with SVG. Use {"type":"svg"} blocks liberally for diagrams, illustrations, maps, schematics, logos, infographics — anywhere a picture helps. Write clean, self-contained inline SVG (viewBox-based, no external refs, no <script>, no <foreignObject>, no JS animation, single color + soft fills is fine). Keep under 6000 chars.
4. For charts prefer the native chart block (bar/line/donut) unless a bespoke diagram needs raw SVG.
5. "suggestions" should be the 3–8 best next clicks; reuse the strongest actions you already used.
6. Form "action" may contain {{fieldKey}} placeholders that the UI will substitute with the user's typed values. Field keys are lowercase a-z0-9_.
7. Never emit executable code beyond the display-only "code" block. Never claim to have run anything.
8. If you don't know, be honest in the subtitle/footer rather than inventing precise numbers — but try to give useful, sourced approximations.
9. Respect a dark, modern, "AI live view" aesthetic in wording — but do NOT emit styling/classes; the renderer styles everything.
10. Output a single JSON object and nothing else.`;

function buildMessages(query: string, history: HistoryEntry[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (history.length > 0) {
    const transcript = history
      .map((h) => `User searched: ${h.query}\nGenerated view titled: ${h.title}`)
      .join("\n\n");
    messages.push({
      role: "user",
      content: `Here is what has already been explored in this session:\n\n${transcript}\n\nBuild the next view in this same session. It should naturally continue from what was already shown, not repeat it.`,
    });
    messages.push({
      role: "assistant",
      content: `Understood — I'll continue the session and build a view for the next query that builds on the context above.`,
    });
  }

  messages.push({ role: "user", content: `Query: ${query}` });
  return messages;
}

async function callOrcaRouter(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  useJsonMode: boolean
): Promise<string> {
  const payload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    // Turn the model's reasoning/thinking mode OFF: faster, cheaper, and keeps
    // the token budget for the JSON output instead of hidden thinking.
    reasoning_effort: "none",
  };
  if (useJsonMode) payload.response_format = { type: "json_object" };

  try {
    const res = await client.chat.completions.create(payload);
    const content = res.choices?.[0]?.message?.content;
    if (!content) throw new EmptyContentError();
    return content;
  } catch (err) {
    if (useJsonMode && isJsonModeUnsupported(err)) {
      return callOrcaRouter(messages, false);
    }
    throw err;
  }
}

function isJsonModeUnsupported(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status?: number }).status;
    if (status === 400 || status === 404) return true;
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return /response_format|json_object|json mode|not supported|invalid.*format/i.test(msg);
}

class EmptyContentError extends Error {
  constructor() {
    super("model returned no content");
  }
}

export async function generateView(
  query: string,
  history: HistoryEntry[]
): Promise<ViewSpec> {
  const messages = buildMessages(query, history);
  let lastError = "model returned invalid JSON";
  let emptyStreak = 0;

  for (let attempt = 0; attempt < 4; attempt++) {
    let raw: string;
    try {
      raw = await callOrcaRouter(messages, true);
    } catch (err) {
      if (err instanceof EmptyContentError) {
        emptyStreak += 1;
        lastError = `model returned empty content (x${emptyStreak})`;
        messages.push({
          role: "user",
          content: `Your last response was empty. Respond now with ONLY the single valid JSON object. Do not repeat prior reasoning.`,
        });
        continue;
      }
      throw new Error(err instanceof Error ? err.message : "request failed");
    }

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch {
      lastError = `attempt ${attempt + 1}: invalid JSON from model`;
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `That was not valid JSON. Respond with ONLY a single valid JSON object matching the schema.`,
      });
      continue;
    }

    const parsed = viewSchema.safeParse(json);
    if (parsed.success) return parsed.data;

    lastError = `attempt ${attempt + 1}: schema validation failed (${parsed.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".")} ${i.message}`)
      .join("; ")})`;
    messages.push({ role: "assistant", content: cleaned });
    messages.push({
      role: "user",
      content: `Schema errors: ${lastError}. Fix ONLY these and return the corrected JSON object.`,
    });
  }

  throw new Error(`model could not produce a valid view: ${lastError}`);
}
