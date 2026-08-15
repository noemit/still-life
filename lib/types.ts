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

export interface SectionSpec {
  type: "section";
  heading: string;
  blocks: BlockSpec[];
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

export interface CardSpec {
  type: "card";
  title: string;
  value?: string;
  body?: string;
  emoji?: string;
  accent?: string;
  action?: ActionSpec;
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

export interface ListItemSpec {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: ActionSpec;
}

export interface ListSpec {
  type: "list";
  items: ListItemSpec[];
}

export interface TableSpec {
  type: "table";
  columns: string[];
  rows: string[][];
}

export interface ChartSpec {
  type: "chart";
  kind: "bar" | "line" | "donut";
  title?: string;
  labels: string[];
  values: number[];
  color?: string;
  action?: ActionSpec;
}

export interface SvgSpec {
  type: "svg";
  title?: string;
  svg: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface FormFieldSpec {
  key: string;
  label: string;
  placeholder?: string;
}

export interface FormSpec {
  type: "form";
  title?: string;
  fields: FormFieldSpec[];
  submitLabel: string;
  action: string;
}

export interface CodeSpec {
  type: "code";
  language?: string;
  code: string;
}

export interface QuoteSpec {
  type: "quote";
  text: string;
  author?: string;
}

export interface LinkSpec {
  type: "link";
  label: string;
  url: string;
}

export interface ImageSpec {
  type: "image";
  url: string;
  caption?: string;
}

export type BlockSpec =
  | SectionSpec
  | HeroSpec
  | ParagraphSpec
  | StatSpec
  | CardSpec
  | ButtonSpec
  | ChipSpec
  | ListSpec
  | TableSpec
  | ChartSpec
  | SvgSpec
  | FormSpec
  | CodeSpec
  | QuoteSpec
  | LinkSpec
  | ImageSpec;

export interface ViewSpec {
  title: string;
  subtitle?: string;
  accent?: string;
  blocks: BlockSpec[];
  suggestions?: string[];
  footer?: string;
}

// ---- Zod schemas (validated on the server; drives auto-retry) ----
// Note: sections may contain any leaf block but NOT other sections, which
// keeps the schema acyclic (no z.lazy needed).

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
  text: z.string().max(1200),
});

const statSchema = z.object({
  type: z.literal("stat"),
  label: z.string().max(60),
  value: z.string().max(40),
  delta: z.string().max(20).optional(),
});

const cardSchema = z.object({
  type: z.literal("card"),
  title: z.string().max(80),
  value: z.string().max(60).optional(),
  body: z.string().max(400).optional(),
  emoji: z.string().max(8).optional(),
  accent: accentSchema.optional(),
  action: actionSchema.optional(),
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

const listSchema = z.object({
  type: z.literal("list"),
  items: z
    .array(
      z.object({
        title: z.string().max(120),
        subtitle: z.string().max(240).optional(),
        emoji: z.string().max(8).optional(),
        action: actionSchema.optional(),
      })
    )
    .max(12)
    .min(1),
});

const tableSchema = z.object({
  type: z.literal("table"),
  columns: z.array(z.string().max(40)).max(6),
  rows: z.array(z.array(z.string().max(80))).max(12),
});

const chartSchema = z.object({
  type: z.literal("chart"),
  kind: z.enum(["bar", "line", "donut"]).default("bar"),
  title: z.string().max(80).optional(),
  labels: z.array(z.string().max(40)).max(12),
  values: z.array(z.number()).max(12),
  color: accentSchema.optional(),
  action: actionSchema.optional(),
});

const svgSchema = z.object({
  type: z.literal("svg"),
  title: z.string().max(80).optional(),
  svg: z.string().max(6000),
  width: z.number().int().min(100).max(1600).optional(),
  height: z.number().int().min(100).max(1600).optional(),
  caption: z.string().max(160).optional(),
});

const formFieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z0-9_]+$/).max(30),
  label: z.string().max(60),
  placeholder: z.string().max(80).optional(),
});

const formSchema = z.object({
  type: z.literal("form"),
  title: z.string().max(80).optional(),
  fields: z.array(formFieldSchema).max(4),
  submitLabel: z.string().max(40).default("Go"),
  action: z.string().max(300),
});

const codeSchema = z.object({
  type: z.literal("code"),
  language: z.string().max(20).optional(),
  code: z.string().max(2000),
});

const quoteSchema = z.object({
  type: z.literal("quote"),
  text: z.string().max(400),
  author: z.string().max(80).optional(),
});

const linkSchema = z.object({
  type: z.literal("link"),
  label: z.string().max(80),
  url: z.string().url().max(300),
});

const imageSchema = z.object({
  type: z.literal("image"),
  url: z.string().url().max(500),
  caption: z.string().max(160).optional(),
});

const leafSchema = z.discriminatedUnion("type", [
  heroSchema,
  paragraphSchema,
  statSchema,
  cardSchema,
  buttonSchema,
  chipSchema,
  listSchema,
  tableSchema,
  chartSchema,
  svgSchema,
  formSchema,
  codeSchema,
  quoteSchema,
  linkSchema,
  imageSchema,
]);

const sectionSchema = z.object({
  type: z.literal("section"),
  heading: z.string().max(120),
  blocks: z.array(leafSchema).max(10),
});

export const blockSchema = z.discriminatedUnion("type", [sectionSchema, ...leafSchema.options]);

export const viewSchema = z.object({
  title: z.string().max(120),
  subtitle: z.string().max(300).optional(),
  accent: accentSchema.optional(),
  blocks: z.array(blockSchema).max(20),
  suggestions: z.array(z.string().max(120)).max(8).optional(),
  footer: z.string().max(200).optional(),
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
