"use client";

import { useState, type CSSProperties } from "react";
import type { Action, Block, ViewSpec } from "@/lib/types";

const DEFAULT_ACCENT = "#3b82f6";

interface ViewRendererProps {
  view: ViewSpec;
  onAction: (action: string) => void;
  disabled?: boolean;
}

const BLOCK_ORDER: Record<Block["type"], number> = {
  hero: 0,
  quiz: 1,
  funFact: 2,
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
      className="animate-view space-y-4"
      style={{ "--accent": accent } as CSSProperties}
    >
      {view.subtitle && (
        <p className="-mt-1 max-w-2xl text-sm leading-relaxed text-[#737373]">
          {view.subtitle}
        </p>
      )}
      {blocks.map((block, i) => (
        <BlockView
          key={`${view.title}-${i}`}
          block={block}
          onAction={onAction}
          disabled={disabled}
        />
      ))}
      {view.suggestions && view.suggestions.length > 0 && (
        <div className="pt-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#525252]">
            Keep exploring
          </p>
          <div className="flex flex-wrap gap-2">
            {view.suggestions.map((s, i) => (
              <button
                key={i}
                disabled={disabled}
                onClick={() => onAction(s)}
                className="rounded border border-[#262626] bg-[#171717] px-2.5 py-1.5 text-xs text-[#a3a3a3] transition-colors hover:border-[#404040] hover:text-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {view.footer && (
        <p className="pt-1 text-[10px] uppercase tracking-wider text-[#525252]">{view.footer}</p>
      )}
    </div>
  );
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
        <div className="space-y-1 pb-2">
          {block.emoji && <div className="text-2xl text-[#737373]">{block.emoji}</div>}
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-[#e5e5e5]">
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="max-w-2xl text-sm text-[#737373]">{block.subtitle}</p>
          )}
        </div>
      );
    case "paragraph":
      return <p className="max-w-2xl text-sm leading-relaxed text-[#a3a3a3]">{block.text}</p>;
    case "stat":
      return (
        <div className="rounded border border-[#262626] bg-[#171717] p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#525252]">{block.label}</p>
          <p className="mt-1 text-2xl font-semibold text-[#e5e5e5]">{block.value}</p>
          {block.delta && (
            <p className="mt-1 text-[10px] text-[#737373]">{block.delta}</p>
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
              ? "rounded bg-[#e5e5e5] px-4 py-2 text-xs font-medium text-[#0d0d0d] shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              : block.variant === "outline"
                ? "rounded border border-[#404040] px-4 py-2 text-xs font-medium text-[#e5e5e5] transition-colors hover:border-[#737373] disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded px-4 py-2 text-xs font-medium text-[#a3a3a3] transition-colors hover:text-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
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
      return <FunFactBlock block={block} onAction={onAction} disabled={disabled} />;
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
      <span className="rounded border border-[#262626] bg-[#171717] px-2.5 py-1.5 text-xs text-[#737373]">
        {item.label}
      </span>
    );
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(item.action!)}
      className="rounded border border-[#262626] bg-[#171717] px-2.5 py-1.5 text-xs text-[#a3a3a3] transition-colors hover:border-[#404040] hover:text-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {item.label}
    </button>
  );
}

function FunFactBlock({
  block,
  onAction,
  disabled,
}: {
  block: Extract<Block, { type: "funFact" }>;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      {block.category && (
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#3b82f6]">
          {block.category}
        </p>
      )}
      <p className="mt-1 text-sm leading-relaxed text-[#d4d4d4]">{block.fact}</p>
      {block.source && <p className="mt-2 text-[10px] text-[#525252]">Source: {block.source}</p>}
    </>
  );
  if (!block.action?.action) {
    return (
      <div className="rounded border-l-2 border-l-[#3b82f6] border-[#262626] bg-[#171717] p-4 shadow-sm">
        {inner}
      </div>
    );
  }
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(block.action!.action!)}
      className="group w-full rounded border-l-2 border-l-[#3b82f6] border-[#262626] bg-[#171717] p-4 text-left shadow-sm transition-colors hover:border-[#404040] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {inner}
      <p className="mt-2 text-[10px] font-medium text-[#3b82f6]">
        {block.action.label ?? "Continue"} →
      </p>
    </button>
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
    <div className="rounded border border-[#262626] bg-[#171717] p-4 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#3b82f6]">Quiz</p>
      <p className="mt-1 text-sm font-medium text-[#e5e5e5]">{block.question}</p>
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
                  ? "rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-left text-xs text-emerald-300"
                  : status === "wrong"
                    ? "rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-left text-xs text-red-300"
                    : status === "dim"
                      ? "rounded border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-left text-xs text-[#525252]"
                      : "rounded border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-left text-xs text-[#a3a3a3] transition-colors hover:border-[#404040] hover:text-[#e5e5e5]"
              }
            >
              <span className="mr-2 text-[#525252]">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 animate-view">
          <p className={isCorrect ? "text-xs font-medium text-emerald-400" : "text-xs font-medium text-red-400"}>
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#a3a3a3]">{block.explanation}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#e5e5e5] px-3 py-1.5 text-xs font-medium text-[#0d0d0d] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="rounded border border-[#262626] bg-[#171717] p-4 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#3b82f6]">Question</p>
      <p className="mt-1 text-sm font-medium text-[#e5e5e5]">{block.question}</p>
      {block.hint && (
        <p className="mt-1 text-xs text-[#737373]">Hint: {block.hint}</p>
      )}
      {!revealed ? (
        <button
          disabled={disabled}
          onClick={() => setRevealed(true)}
          className="mt-3 rounded border border-[#404040] px-3 py-1.5 text-xs font-medium text-[#a3a3a3] transition-colors hover:border-[#737373] hover:text-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reveal answer
        </button>
      ) : (
        <div className="mt-3 animate-view">
          <p className="text-xs font-medium text-[#e5e5e5]">Answer</p>
          <p className="mt-1 text-sm leading-relaxed text-[#a3a3a3]">{block.answer}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded bg-[#e5e5e5] px-3 py-1.5 text-xs font-medium text-[#0d0d0d] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {block.action.label ?? "Explore"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
