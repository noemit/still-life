"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Action, Block, GlossaryTerm, ViewSpec } from "@/lib/types";

const DEFAULT_ACCENT = "#60a5fa";

interface ViewRendererProps {
  view: ViewSpec;
  onAction: (action: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}

const BLOCK_ORDER: Record<Block["type"], number> = {
  hero: 0,
  funFact: 1,
  quiz: 2,
  mythFact: 3,
  guessNumber: 4,
  rank3: 5,
  eli5: 6,
  question: 7,
  paragraph: 8,
  stat: 9,
  chip: 10,
  button: 11,
};

function orderedBlocks(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => BLOCK_ORDER[a.type] - BLOCK_ORDER[b.type]);
}

export function ViewRenderer({ view, onAction, onScore, disabled }: ViewRendererProps) {
  const accent = view.accent ?? DEFAULT_ACCENT;
  const blocks = orderedBlocks(view.blocks);
  return (
    <div
      className="animate-view space-y-5"
      style={{ "--accent": accent } as CSSProperties}
    >
      {view.subtitle && (
        <p className="-mt-1 max-w-2xl text-base leading-relaxed text-[#d4d4d4]">
          {view.subtitle}
        </p>
      )}
      {groupBlocks(blocks).map((group, i) =>
        group.kind === "facts" ? (
          <FactList
            key={`${view.title}-facts-${i}`}
            facts={group.facts}
            onAction={onAction}
            disabled={disabled}
          />
        ) : (
          <BlockView
            key={`${view.title}-${i}`}
            block={group.block}
            onAction={onAction}
            onScore={onScore}
            disabled={disabled}
          />
        )
      )}
      {view.suggestions && view.suggestions.length > 0 && (
        <div className="pt-2">
          <p className="mb-2 text-sm font-medium text-[#93c5fd]">Keep exploring</p>
          <div className="flex flex-wrap gap-2">
            {view.suggestions.map((s, i) => (
              <button
                key={i}
                disabled={disabled}
                onClick={() => onAction(s)}
                className="rounded border border-[#404040] bg-[#171717] px-2.5 py-1.5 text-sm text-[#e5e5e5] transition-colors hover:border-[#737373] hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {view.footer && (
        <p className="pt-1 text-xs text-[#a3a3a3]">{view.footer}</p>
      )}
    </div>
  );
}

type Group =
  | { kind: "facts"; facts: Extract<Block, { type: "funFact" }>[] }
  | { kind: "block"; block: Block };

function groupBlocks(blocks: Block[]): Group[] {
  const out: Group[] = [];
  for (const block of blocks) {
    if (block.type === "funFact") {
      const last = out[out.length - 1];
      if (last?.kind === "facts") last.facts.push(block);
      else out.push({ kind: "facts", facts: [block] });
    } else {
      out.push({ kind: "block", block });
    }
  }
  return out;
}

function BlockView({
  block,
  onAction,
  onScore,
  disabled,
}: {
  block: Block;
  onAction: (a: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-2 pb-1">
          {block.emoji && <div className="text-2xl">{block.emoji}</div>}
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-[#fafafa]">
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="max-w-2xl text-base text-[#d4d4d4]">{block.subtitle}</p>
          )}
        </div>
      );
    case "paragraph":
      return <p className="max-w-2xl text-base leading-relaxed text-[#e5e5e5]">{block.text}</p>;
    case "stat":
      return (
        <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
          <p className="text-sm font-medium text-[#93c5fd]">{block.label}</p>
          <p className="mt-1 text-2xl font-semibold text-[#fafafa]">{block.value}</p>
          {block.delta && <p className="mt-1 text-sm text-[#d4d4d4]">{block.delta}</p>}
        </div>
      );
    case "button":
      return (
        <button
          disabled={disabled}
          onClick={() => onAction(block.action)}
          className={
            block.variant === "primary"
              ? "rounded bg-[#fafafa] px-4 py-2 text-sm font-medium text-[#0d0d0d] shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              : block.variant === "outline"
                ? "rounded border border-[#737373] px-4 py-2 text-sm font-medium text-[#fafafa] transition-colors hover:border-[#a3a3a3] disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded px-4 py-2 text-sm font-medium text-[#e5e5e5] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {block.label}
        </button>
      );
    case "chip":
      return (
        <div className="flex flex-wrap gap-2">
          {block.items.map((item, i) => (
            <Chip key={i} item={item} onAction={onAction} disabled={disabled} />
          ))}
        </div>
      );
    case "quiz":
      return <QuizBlock block={block} onAction={onAction} onScore={onScore} disabled={disabled} />;
    case "funFact":
      return null;
    case "question":
      return <QuestionBlock block={block} onAction={onAction} disabled={disabled} />;
    case "mythFact":
      return <MythFactBlock block={block} onAction={onAction} onScore={onScore} disabled={disabled} />;
    case "guessNumber":
      return <GuessNumberBlock block={block} onAction={onAction} onScore={onScore} disabled={disabled} />;
    case "rank3":
      return <Rank3Block block={block} onAction={onAction} onScore={onScore} disabled={disabled} />;
    case "eli5":
      return <Eli5Block block={block} />;
    default:
      return null;
  }
}

function Chip({
  item,
  onAction,
  disabled,
}: {
  item: Action;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  if (!item.action)
    return (
      <span className="rounded border border-[#404040] bg-[#171717] px-2.5 py-1.5 text-sm text-[#d4d4d4]">
        {item.label}
      </span>
    );
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(item.action!)}
      className="rounded border border-[#404040] bg-[#171717] px-2.5 py-1.5 text-sm text-[#e5e5e5] transition-colors hover:border-[#737373] hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {item.label}
    </button>
  );
}

function FactText({ text, terms }: { text: string; terms?: GlossaryTerm[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!terms?.length) {
    return <span className="min-w-0 flex-1 text-base leading-snug text-[#f5f5f5]">{text}</span>;
  }
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length);
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length) {
    let hit: { term: GlossaryTerm; at: number } | null = null;
    for (const term of sorted) {
      const at = rest.toLowerCase().indexOf(term.term.toLowerCase());
      if (at >= 0 && (!hit || at < hit.at)) hit = { term, at };
    }
    if (!hit) {
      parts.push(rest);
      break;
    }
    if (hit.at > 0) parts.push(rest.slice(0, hit.at));
    const raw = rest.slice(hit.at, hit.at + hit.term.term.length);
    const t = hit.term;
    parts.push(
      <button
        key={key++}
        type="button"
        onClick={() => setOpen((cur) => (cur === t.term ? null : t.term))}
        className="underline decoration-[#60a5fa] decoration-dotted underline-offset-2 text-[#fafafa]"
      >
        {raw}
      </button>
    );
    rest = rest.slice(hit.at + t.term.length);
  }
  const def = terms.find((t) => t.term === open);
  return (
    <span className="min-w-0 flex-1">
      <span className="text-base leading-snug text-[#f5f5f5]">{parts}</span>
      {def && (
        <span className="mt-1.5 block text-sm leading-relaxed text-[#d4d4d4]">
          {def.term}: {def.definition}
        </span>
      )}
    </span>
  );
}

function FactList({
  facts,
  onAction,
  disabled,
}: {
  facts: Extract<Block, { type: "funFact" }>[];
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded border border-[#404040] bg-[#171717] shadow-sm">
      <div className="border-b border-[#404040] px-4 py-3">
        <p className="text-sm font-medium text-[#fafafa]">Facts</p>
      </div>
      <ol className="divide-y divide-[#2a2a2a]">
        {facts.map((fact, i) => {
          const clickable = Boolean(fact.action?.action) && !fact.terms?.length;
          const row = (
            <>
              <span className="w-7 shrink-0 text-lg leading-none">{fact.emoji}</span>
              <FactText text={fact.fact} terms={fact.terms} />
            </>
          );
          return (
            <li key={i}>
              {clickable ? (
                <button
                  disabled={disabled}
                  onClick={() => onAction(fact.action!.action!)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {row}
                </button>
              ) : (
                <div className="flex items-start gap-3 px-4 py-3">{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function QuizBlock({
  block,
  onAction,
  onScore,
  disabled,
}: {
  block: Extract<Block, { type: "quiz" }>;
  onAction: (a: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const isCorrect = picked === block.correctIndex;

  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <p className="text-sm font-medium text-[#93c5fd]">Quiz</p>
      <p className="mt-1 text-lg font-medium text-[#fafafa]">{block.question}</p>
      <div className="mt-3 grid gap-1.5">
        {block.options.map((opt, i) => {
          const status = answered
            ? i === block.correctIndex
              ? "correct"
              : i === picked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={i}
              disabled={disabled || answered}
              onClick={() => {
                setPicked(i);
                onScore?.(i === block.correctIndex);
              }}
              className={
                status === "correct"
                  ? "rounded border border-emerald-400/50 bg-emerald-500/15 px-3 py-2.5 text-left text-sm text-emerald-200"
                  : status === "wrong"
                    ? "rounded border border-red-400/50 bg-red-500/15 px-3 py-2.5 text-left text-sm text-red-200"
                    : status === "dim"
                      ? "rounded border border-[#404040] bg-[#0d0d0d] px-3 py-2.5 text-left text-sm text-[#a3a3a3]"
                      : "rounded border border-[#404040] bg-[#0d0d0d] px-3 py-2.5 text-left text-sm text-[#e5e5e5] transition-colors hover:border-[#737373] hover:bg-[#1a1a1a]"
              }
            >
              <span className="mr-2 text-[#a3a3a3]">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 animate-view">
          <p className={isCorrect ? "text-sm font-medium text-emerald-300" : "text-sm font-medium text-red-300"}>
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#e5e5e5]">{block.explanation}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {block.action.label ?? "Continue"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MythFactBlock({
  block,
  onAction,
  onScore,
  disabled,
}: {
  block: Extract<Block, { type: "mythFact" }>;
  onAction: (a: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}) {
  const [pick, setPick] = useState<"myth" | "fact" | null>(null);
  const correct = pick === block.verdict;

  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <p className="text-sm font-medium text-[#93c5fd]">Myth or fact</p>
      <p className="mt-1 text-lg font-medium text-[#fafafa]">{block.claim}</p>
      <div className="mt-3 flex gap-2">
        {(["myth", "fact"] as const).map((opt) => (
          <button
            key={opt}
            disabled={disabled || pick !== null}
            onClick={() => {
              setPick(opt);
              onScore?.(opt === block.verdict);
            }}
            className={
              pick === null
                ? "rounded border border-[#404040] bg-[#0d0d0d] px-4 py-2 text-sm text-[#e5e5e5] hover:border-[#737373]"
                : opt === block.verdict
                  ? "rounded border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200"
                  : pick === opt
                    ? "rounded border border-red-400/50 bg-red-500/15 px-4 py-2 text-sm text-red-200"
                    : "rounded border border-[#404040] px-4 py-2 text-sm text-[#737373]"
            }
          >
            {opt === "myth" ? "Myth" : "Fact"}
          </button>
        ))}
      </div>
      {pick && (
        <div className="mt-3 animate-view">
          <p className={correct ? "text-sm font-medium text-emerald-300" : "text-sm font-medium text-red-300"}>
            {correct ? "Correct" : "Incorrect"} · this is a {block.verdict}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#e5e5e5]">{block.explanation}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d]"
            >
              {block.action.label ?? "Continue"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GuessNumberBlock({
  block,
  onAction,
  onScore,
  disabled,
}: {
  block: Extract<Block, { type: "guessNumber" }>;
  onAction: (a: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [guess, setGuess] = useState<number | null>(null);
  const close =
    guess !== null &&
    block.answer !== 0 &&
    Math.abs(guess - block.answer) / Math.abs(block.answer) <= 0.15;
  const exact = guess === block.answer;
  const ok = exact || close;

  const submit = () => {
    const n = Number(value);
    if (Number.isNaN(n) || guess !== null) return;
    setGuess(n);
    const hit = n === block.answer || (block.answer !== 0 && Math.abs(n - block.answer) / Math.abs(block.answer) <= 0.15);
    onScore?.(hit);
  };

  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <p className="text-sm font-medium text-[#93c5fd]">Guess the number</p>
      <p className="mt-1 text-lg font-medium text-[#fafafa]">{block.prompt}</p>
      {block.hint && <p className="mt-1 text-sm text-[#d4d4d4]">Hint: {block.hint}</p>}
      {guess === null ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            className="w-32 rounded border border-[#404040] bg-[#0d0d0d] px-3 py-2 text-sm text-[#fafafa] outline-none focus:border-[#737373]"
            placeholder={block.unit ?? "0"}
          />
          <button
            type="submit"
            disabled={disabled || value === ""}
            className="rounded bg-[#fafafa] px-3 py-2 text-sm font-medium text-[#0d0d0d] disabled:opacity-50"
          >
            Guess
          </button>
        </form>
      ) : (
        <div className="mt-3 animate-view">
          <p className={ok ? "text-sm font-medium text-emerald-300" : "text-sm font-medium text-red-300"}>
            {exact ? "Exact" : close ? "Close" : "Not quite"} · {block.answer}
            {block.unit ? ` ${block.unit}` : ""}
          </p>
          {block.explanation && (
            <p className="mt-1 text-sm leading-relaxed text-[#e5e5e5]">{block.explanation}</p>
          )}
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d]"
            >
              {block.action.label ?? "Continue"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Rank3Block({
  block,
  onAction,
  onScore,
  disabled,
}: {
  block: Extract<Block, { type: "rank3" }>;
  onAction: (a: string) => void;
  onScore?: (correct: boolean) => void;
  disabled?: boolean;
}) {
  const [order, setOrder] = useState(block.items);
  const [checked, setChecked] = useState(false);
  const right = order.join("\0") === block.correctOrder.join("\0");

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length || checked) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <p className="text-sm font-medium text-[#93c5fd]">Rank these</p>
      <p className="mt-1 text-lg font-medium text-[#fafafa]">{block.prompt}</p>
      <ol className="mt-3 space-y-1.5">
        {order.map((item, i) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded border border-[#404040] bg-[#0d0d0d] px-3 py-2"
          >
            <span className="w-5 text-sm text-[#a3a3a3]">{i + 1}</span>
            <span className="flex-1 text-sm text-[#f5f5f5]">{item}</span>
            {!checked && (
              <span className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  className="px-2 text-sm text-[#d4d4d4] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || i === order.length - 1}
                  onClick={() => move(i, 1)}
                  className="px-2 text-sm text-[#d4d4d4] disabled:opacity-30"
                >
                  ↓
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!checked ? (
        <button
          disabled={disabled}
          onClick={() => {
            setChecked(true);
            onScore?.(order.join("\0") === block.correctOrder.join("\0"));
          }}
          className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d]"
        >
          Check order
        </button>
      ) : (
        <div className="mt-3 animate-view">
          <p className={right ? "text-sm font-medium text-emerald-300" : "text-sm font-medium text-red-300"}>
            {right ? "Correct order" : `Correct: ${block.correctOrder.join(" → ")}`}
          </p>
          {block.explanation && (
            <p className="mt-1 text-sm leading-relaxed text-[#e5e5e5]">{block.explanation}</p>
          )}
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d]"
            >
              {block.action.label ?? "Continue"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Eli5Block({ block }: { block: Extract<Block, { type: "eli5" }> }) {
  const [mode, setMode] = useState<"simple" | "deeper">("simple");
  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#93c5fd]">{block.title ?? "Explain"}</p>
        <div className="flex gap-1">
          {(["simple", "deeper"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "rounded bg-[#fafafa] px-2.5 py-1 text-xs font-medium text-[#0d0d0d]"
                  : "rounded border border-[#404040] px-2.5 py-1 text-xs text-[#d4d4d4]"
              }
            >
              {m === "simple" ? "ELI5" : "Deeper"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-base leading-relaxed text-[#f5f5f5]">
        {mode === "simple" ? block.simple : block.deeper}
      </p>
    </div>
  );
}

function QuestionBlock({
  block,
  onAction,
  disabled,
}: {
  block: Extract<Block, { type: "question" }>;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded border border-[#404040] bg-[#171717] p-4 shadow-sm">
      <p className="text-sm font-medium text-[#93c5fd]">Question</p>
      <p className="mt-1 text-lg font-medium text-[#fafafa]">{block.question}</p>
      {block.hint && <p className="mt-1 text-sm text-[#d4d4d4]">Hint: {block.hint}</p>}
      {!revealed ? (
        <button
          disabled={disabled}
          onClick={() => setRevealed(true)}
          className="mt-3 rounded border border-[#737373] px-3 py-1.5 text-sm font-medium text-[#fafafa] transition-colors hover:border-[#a3a3a3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reveal answer
        </button>
      ) : (
        <div className="mt-3 animate-view">
          <p className="text-sm font-medium text-[#fafafa]">Answer</p>
          <p className="mt-1 text-base leading-relaxed text-[#e5e5e5]">{block.answer}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {block.action.label ?? "Explore"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
