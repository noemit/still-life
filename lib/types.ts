import { z } from "zod";

const ACCENTS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
];

export const accentSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .refine((c) => ACCENTS.includes(c.toLowerCase()), "accent must be one of the allowed palette")
  .transform((c) => c.toLowerCase());

// ---- Spec types (the contract between the model and the renderer) ----

export interface ActionSpec {
  label: string;
  action?: string;
}

export interface HeroSpec {
  type: "hero";
  title: string;
  subtitle?: string;
  emoji?: string;
}

export interface ParagraphSpec {
  type: "paragraph";
  text: string;
}

export interface StatSpec {
  type: "stat";
  label: string;
  value: string;
  delta?: string;
}

export interface ButtonSpec {
  type: "button";
  label: string;
  variant: "primary" | "ghost" | "outline";
  action: string;
}

export interface ChipSpec {
  type: "chip";
  items: ActionSpec[];
}

export interface QuizSpec {
  type: "quiz";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  action?: ActionSpec;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface FunFactSpec {
  type: "funFact";
  fact: string;
  emoji: string;
  category?: string;
  source?: string;
  terms?: GlossaryTerm[];
  action?: ActionSpec;
}

export interface QuestionSpec {
  type: "question";
  question: string;
  hint?: string;
  answer?: string;
  action?: ActionSpec;
}

export interface MythFactSpec {
  type: "mythFact";
  claim: string;
  verdict: "myth" | "fact";
  explanation: string;
  action?: ActionSpec;
}

export interface GuessNumberSpec {
  type: "guessNumber";
  prompt: string;
  answer: number;
  unit?: string;
  hint?: string;
  explanation?: string;
  action?: ActionSpec;
}

export interface Rank3Spec {
  type: "rank3";
  prompt: string;
  items: string[];
  correctOrder: string[];
  explanation?: string;
  action?: ActionSpec;
}

export interface Eli5Spec {
  type: "eli5";
  title?: string;
  simple: string;
  deeper: string;
}

export type BlockSpec =
  | HeroSpec
  | ParagraphSpec
  | StatSpec
  | ButtonSpec
  | ChipSpec
  | QuizSpec
  | FunFactSpec
  | QuestionSpec
  | MythFactSpec
  | GuessNumberSpec
  | Rank3Spec
  | Eli5Spec;

export interface ViewSpec {
  title: string;
  subtitle?: string;
  accent?: string;
  blocks: BlockSpec[];
  suggestions?: string[];
  footer?: string;
}

// ---- Zod schemas (validated on the server; drives auto-retry) ----

const actionSchema = z.object({
  label: z.string().max(80),
  action: z.string().max(300).optional(),
});

const heroSchema = z.object({
  type: z.literal("hero"),
  title: z.string().max(120),
  subtitle: z.string().max(300).optional(),
  emoji: z.string().max(8).optional(),
});

const paragraphSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string().max(800),
});

const statSchema = z.object({
  type: z.literal("stat"),
  label: z.string().max(60),
  value: z.string().max(40),
  delta: z.string().max(20).optional(),
});

const buttonSchema = z.object({
  type: z.literal("button"),
  label: z.string().max(60),
  variant: z.enum(["primary", "ghost", "outline"]).default("primary"),
  action: z.string().max(300),
});

const chipSchema = z.object({
  type: z.literal("chip"),
  items: z.array(actionSchema).max(12).min(1),
});

export const quizSchema = z
  .object({
    type: z.literal("quiz"),
    question: z.string().max(300),
    options: z.array(z.string().max(120)).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
    explanation: z.string().max(800),
    action: actionSchema.optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "correctIndex must be within options array",
  });

const termSchema = z.object({
  term: z.string().max(40),
  definition: z.string().max(240),
});

const funFactSchema = z.object({
  type: z.literal("funFact"),
  fact: z.string().max(200),
  emoji: z.string().max(8),
  category: z.string().max(40).optional(),
  source: z.string().max(120).optional(),
  terms: z.array(termSchema).max(3).optional(),
  action: actionSchema.optional(),
});

const mythFactSchema = z.object({
  type: z.literal("mythFact"),
  claim: z.string().max(240),
  verdict: z.enum(["myth", "fact"]),
  explanation: z.string().max(400),
  action: actionSchema.optional(),
});

const guessNumberSchema = z.object({
  type: z.literal("guessNumber"),
  prompt: z.string().max(240),
  answer: z.number(),
  unit: z.string().max(30).optional(),
  hint: z.string().max(160).optional(),
  explanation: z.string().max(400).optional(),
  action: actionSchema.optional(),
});

const rank3Schema = z
  .object({
    type: z.literal("rank3"),
    prompt: z.string().max(240),
    items: z.array(z.string().max(80)).length(3),
    correctOrder: z.array(z.string().max(80)).length(3),
    explanation: z.string().max(400).optional(),
    action: actionSchema.optional(),
  })
  .refine(
    (r) => [...r.items].sort().join("|") === [...r.correctOrder].sort().join("|"),
    { message: "correctOrder must be a permutation of items" }
  );

const eli5Schema = z.object({
  type: z.literal("eli5"),
  title: z.string().max(80).optional(),
  simple: z.string().max(500),
  deeper: z.string().max(800),
});

const questionSchema = z.object({
  type: z.literal("question"),
  question: z.string().max(300),
  hint: z.string().max(300).optional(),
  answer: z.string().max(500).optional(),
  action: actionSchema.optional(),
});

export const blockSchema = z.discriminatedUnion("type", [
  heroSchema,
  paragraphSchema,
  statSchema,
  buttonSchema,
  chipSchema,
  quizSchema,
  funFactSchema,
  questionSchema,
  mythFactSchema,
  guessNumberSchema,
  rank3Schema,
  eli5Schema,
]);

export const viewSchema = z
  .object({
    title: z.string().max(120),
    subtitle: z.string().max(300).optional(),
    accent: accentSchema.optional(),
    blocks: z.array(blockSchema).max(22),
    suggestions: z.array(z.string().max(120)).max(6).optional(),
    footer: z.string().max(200).optional(),
  })
  .refine((v) => v.blocks.some((b) => b.type === "quiz"), {
    message: "page must include a quiz",
  })
  .refine((v) => v.blocks.filter((b) => b.type === "funFact").length >= 8, {
    message: "page must include at least 8 funFact blocks",
  });

export type Block = BlockSpec;
export type Action = ActionSpec;

export interface HistoryEntry {
  query: string;
  title: string;
}

export interface GenerateResponse {
  view: ViewSpec;
  query: string;
}

export { ACCENTS };
