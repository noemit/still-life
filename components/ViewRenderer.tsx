"use client";

import { useState, type CSSProperties } from "react";
import type { Action, Block, ViewSpec } from "@/lib/types";

const DEFAULT_ACCENT = "#60a5fa";

interface ViewRendererProps {
  view: ViewSpec;
  onAction: (action: string) => void;
  disabled?: boolean;
}

const BLOCK_ORDER: Record<Block["type"], number> = {
  hero: 0,
  funFact: 1,
  quiz: 2,
  question: 3,
  paragraph: 4,
  stat: 5,
  chip: 6,
  button: 7,
};

function orderedBlocks(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => BLOCK_ORDER[a.type] - BLOCK_ORDER[b.type]);
}

export function ViewRenderer({ view, onAction, disabled }: ViewRendererProps) {
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
            disabled={disabled}
          />
        )
      )}
      {view.suggestions && view.suggestions.length > 0 && (
        <div className="pt-2">
          <p className="mb-2 text-xs font-medium text-[#93c5fd]">Keep exploring</p>
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
  disabled,
}: {
  block: Block;
  onAction: (a: string) => void;
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
          <p className="text-xs font-medium text-[#93c5fd]">{block.label}</p>
          <p className="mt-1 text-2xl font-semibold text-[#fafafa]">{block.value}</p>
          {block.delta && (
            <p className="mt-1 text-sm text-[#d4d4d4]">{block.delta}</p>
          )}
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
      return <QuizBlock block={block} onAction={onAction} disabled={disabled} />;
    case "funFact":
      return null;
    case "question":
      return <QuestionBlock block={block} onAction={onAction} disabled={disabled} />;
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
          const clickable = Boolean(fact.action?.action);
          const row = (
            <>
              <span className="w-7 shrink-0 text-lg leading-none">{fact.emoji}</span>
              <span className="min-w-0 flex-1 text-base leading-snug text-[#f5f5f5]">{fact.fact}</span>
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
  disabled,
}: {
  block: Extract<Block, { type: "quiz" }>;
  onAction: (a: string) => void;
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
              onClick={() => setPicked(i)}
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
      {block.hint && (
        <p className="mt-1 text-sm text-[#d4d4d4]">Hint: {block.hint}</p>
      )}
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
