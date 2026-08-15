import { ACCENTS, type ViewSpec } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length];
}

const EMOJIS = ["🦜", "🚀", "🌟", "🔮", "🌊", "🍀", "⚡", "🧭", "🎯", "📡"];

function svgFor(query: string): string {
  const h = hash(query);
  const cx = 60 + (h % 160);
  const cy = 60 + ((h >> 4) % 120);
  const color = pick(ACCENTS, h);
  const color2 = pick(ACCENTS, h >> 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.85"/><stop offset="1" stop-color="${color2}" stop-opacity="0.5"/></linearGradient></defs><rect width="400" height="220" fill="url(#g)" rx="16"/><circle cx="${cx}" cy="${cy}" r="70" fill="#fff" opacity="0.18"/><circle cx="${360 - cx}" cy="${170 - cy}" r="46" fill="#fff" opacity="0.14"/><circle cx="${cx}" cy="${220 - cy}" r="30" fill="#fff" opacity="0.2"/><text x="200" y="118" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff">${query.slice(0, 24)}</text></svg>`;
}

export function generateMockView(query: string): ViewSpec {
  const h = hash(query);
  const accent = pick(ACCENTS, h);
  const emoji = pick(EMOJIS, h >> 2);
  const queryTitle = query.length > 0 ? query[0].toUpperCase() + query.slice(1) : "Something";

  return {
    title: `${queryTitle}`,
    subtitle: `A live view generated for "${query}" — explore by clicking anything.`,
    accent,
    blocks: [
      { type: "hero", emoji, title: queryTitle, subtitle: `Here's a mock view (no API key set). Connect DEEPSEEK_API_KEY for real AI-generated pages.` },
      { type: "stat", label: "Depth", value: "1 level", delta: "+1" },
      { type: "stat", label: "Vibe", value: "dynamic", delta: "live" },
      { type: "stat", label: "Blocks", value: String(5 + (h % 6)) },
      { type: "svg", title: "Illustration", svg: svgFor(query), width: 400, height: 220, caption: "Mock SVG graphic" },
      {
        type: "card",
        title: "Drill deeper",
        value: "Click me",
        body: "Every clickable element sends a new query and generates a new page.",
        emoji: "👆",
        accent,
        action: { label: "explore more about " + query, action: `explore more about ${query}` },
      },
      { type: "list", items: [
        { title: "Why this is safe", subtitle: "The model only emits a JSON spec — never executable code.", emoji: "🛡️" },
        { title: "SVG graphics", subtitle: "Drawn by the model, rendered as inert data-URI images.", emoji: "🎨" },
        { title: "The loop", subtitle: "Search → live UI → click → next live UI.", emoji: "♾️", action: { label: "how does the loop work", action: "explain how the live UI loop works" } },
      ]},
      { type: "chart", kind: "bar", title: "Signal", labels: ["a", "b", "c", "d", "e"], values: [4 + (h % 3), 7, 3 + (h % 2), 9, 5] },
      { type: "chip", items: [
        { label: "Details", action: `detailed breakdown of ${query}` },
        { label: "Chart it", action: `visualize ${query} as a chart` },
        { label: "Compare", action: `compare ${query} with alternatives` },
        { label: "History", action: `history of ${query}` },
      ]},
    ],
    suggestions: [
      `deep dive into ${query}`,
      `top facts about ${query}`,
      `visual timeline of ${query}`,
      `compare ${query} vs alternatives`,
    ],
    footer: `Mock view — add DEEPSEEK_API_KEY to generate real pages.`,
  };
}
