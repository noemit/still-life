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

export function generateMockView(query: string): ViewSpec {
  const h = hash(query);
  const accent = pick(ACCENTS, h);
  const emoji = pick(EMOJIS, h >> 2);
  const queryTitle = query.length > 0 ? query[0].toUpperCase() + query.slice(1) : "Something";

  return {
    title: `${queryTitle}`,
    subtitle: `Quick facts and a quiz about "${query}" — tap anything to keep going.`,
    accent,
    blocks: [
      { type: "hero", emoji, title: queryTitle, subtitle: `Mock view (no API key). Add ORCAROUTER_API_KEY for real AI facts and quizzes.` },
      { type: "funFact", emoji: "📌", fact: `"${query}" shows up in ${100 + (h % 900)} trivia questions a year.` },
      { type: "funFact", emoji: "⏱️", fact: `People spend about ${2 + (h % 10)} minutes on "${query}" before clicking away.` },
      { type: "funFact", emoji: "📈", fact: `Search interest in "${query}" peaks on ${["Monday", "Wednesday", "Friday", "Sunday"][h % 4]}s.` },
      { type: "funFact", emoji: "🌀", fact: `There are at least ${3 + (h % 7)} common myths about "${query}".` },
      { type: "funFact", emoji: "🏫", fact: `"${query}" appears in about ${20 + (h % 40)} classroom quizzes each year.` },
      { type: "funFact", emoji: "📚", fact: `The first known write-up of "${query}" is often misdated by decades.` },
      { type: "funFact", emoji: "🌍", fact: `At least ${4 + (h % 6)} countries have a local saying about "${query}".` },
      { type: "funFact", emoji: "🧪", fact: `Most "facts" about "${query}" online recycle the same three sources.` },
      { type: "funFact", emoji: "🎯", fact: `A typical quiz on "${query}" has a ${40 + (h % 30)}% first-try success rate.` },
      { type: "funFact", emoji: "✨", fact: `The most shared tidbit about "${query}" is usually the least accurate.` },
      {
        type: "quiz",
        question: "Which of these is a mock answer?",
        options: ["A real fact", "A fake fact", "Both", "Neither"],
        correctIndex: 3,
        explanation: "In mock mode everything is synthetic, so the only safe answer is 'Neither'.",
        action: { label: "explain mock mode", action: "explain mock mode" },
      },
      {
        type: "question",
        question: `What would happen if "${query}" suddenly became twice as interesting?`,
        hint: "Think about attention spans.",
        answer: "You'd probably click even more follow-ups.",
        action: { label: "explore", action: `what if ${query} was more interesting` },
      },
      { type: "button", label: "Drill deeper", variant: "primary", action: `explore more about ${query}` },
      { type: "chip", items: [
        { label: "Details", action: `detailed breakdown of ${query}` },
        { label: "Quiz me", action: `quiz me about ${query}` },
        { label: "Compare", action: `compare ${query} with alternatives` },
        { label: "History", action: `history of ${query}` },
      ]},
    ],
    suggestions: [
      `deep dive into ${query}`,
      `top facts about ${query}`,
      `quiz me about ${query}`,
      `compare ${query} vs alternatives`,
    ],
    footer: `Mock view — add ORCAROUTER_API_KEY to generate real pages.`,
  };
}
