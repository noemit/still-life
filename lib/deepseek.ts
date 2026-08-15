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

export const SYSTEM_PROMPT = `You are "Still Life", a fast facts-and-quiz engine. You take any topic and return ONE playful JSON page full of surprising facts, a multiple-choice quiz, and a thought-provoking question.

Output ONLY valid JSON. No markdown, no prose outside JSON, no code fences.

Top-level schema:
{
  "title": string (max 100),
  "subtitle": string (max 180, optional),
  "accent": one of #6366f1, #10b981, #f59e0b, #ef4444, #06b6d4, #a855f7, #ec4899, #84cc16 (optional),
  "blocks": [ ... ],   // 6 to 10 blocks
  "suggestions": [ "up to 6 short follow-up questions" ]
}

Allowed block types — use ONLY these:
1. {"type":"hero","title":"...","subtitle":"...","emoji":"🐙"}
2. {"type":"paragraph","text":"..."}
3. {"type":"stat","label":"...","value":"...","delta":"+12%" optional}
4. {"type":"funFact","fact":"short surprising fact","category":"Animals","source":"...","action":{"label":"more","action":"follow-up query"}}
5. {"type":"quiz","question":"...","options":["A","B","C","D"],"correctIndex":1,"explanation":"why the answer is right","action":{"label":"dive deeper","action":"follow-up query"}}
6. {"type":"question","question":"open-ended wonder question","hint":"small clue","answer":"revealed answer","action":{"label":"explore","action":"follow-up query"}}
7. {"type":"chip","items":[{"label":"...","action":"..."}]}
8. {"type":"button","label":"...","action":"..."}

Example page:
{
  "title": "Octopus Oddities",
  "subtitle": "Three hearts, blue blood, and a brain in each arm.",
  "accent": "#ec4899",
  "blocks": [
    {"type":"hero","title":"Octopus Oddities","subtitle":"Surprising truths about the ocean's escape artist.","emoji":"🐙"},
    {"type":"stat","label":"Hearts","value":"3"},
    {"type":"funFact","fact":"Octopuses have blue blood because it uses copper to transport oxygen.","category":"Biology","action":{"label":"why blue blood?","action":"why do octopuses have blue blood"}},
    {"type":"quiz","question":"How many arms does an octopus have?","options":["6","8","10","12"],"correctIndex":1,"explanation":"Octopuses have eight arms — and each arm has its own cluster of neurons that can act independently.","action":{"label":"arm brains","action":"do octopus arms have their own brains"}},
    {"type":"question","question":"What would happen if humans had eight independent arms?","hint":"Think about multitasking.","answer":"We'd probably be amazing musicians and terrible at sitting still.","action":{"label":"more what-ifs","action":"what if humans had octopus arms"}},
    {"type":"chip","items":[{"label":"octopus intelligence","action":"octopus intelligence examples"},{"label":"giant pacific octopus","action":"giant pacific octopus facts"}]}
  ],
  "suggestions": ["octopus intelligence examples", "giant pacific octopus facts", "how do octopuses camouflage"]
}

REQUIRED on every page:
- At least 2 funFact blocks
- At least 1 quiz block with exactly 3 or 4 options
- At least 1 question block

FORBIDDEN: SVG, images, charts, tables, sections, code blocks, external URLs, cards, lists.

Rules:
1. Be brief and playful. One fun fact per card. Explanations under 2 sentences.
2. Use lots of actions: funFact actions, quiz actions, chips, buttons. Actions are follow-up queries that generate the next page.
3. "suggestions" should feel like a natural trivia trail.
4. If unsure of a fact, say so in the subtitle or footer instead of inventing precise numbers.
5. Output a single JSON object and nothing else.`;

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
    max_tokens: 4096,
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
