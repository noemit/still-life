"use client";

import { useState, type CSSProperties } from "react";
import type { Action, Block, ViewSpec } from "@/lib/types";

const DEFAULT_ACCENT = "#6366f1";

interface ViewRendererProps {
  view: ViewSpec;
  onAction: (action: string) => void;
  disabled?: boolean;
}

export function ViewRenderer({ view, onAction, disabled }: ViewRendererProps) {
  const accent = view.accent ?? DEFAULT_ACCENT;
  return (
    <div className="animate-view space-y-6" style={{ "--accent": accent } as CSSProperties}>
      {view.subtitle && (
        <p className="-mt-2 max-w-3xl text-base leading-relaxed text-zinc-400">
          {view.subtitle}
        </p>
      )}
      {view.blocks.map((block, i) => (
        <BlockView
          key={`${view.title}-${i}`}
          block={block}
          onAction={onAction}
          disabled={disabled}
        />
      ))}
      {view.suggestions && view.suggestions.length > 0 && (
        <div className="pt-2">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">
            Keep exploring
          </p>
          <div className="flex flex-wrap gap-2">
            {view.suggestions.map((s, i) => (
              <button
                key={i}
                disabled={disabled}
                onClick={() => onAction(s)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">
                  →
                </span>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {view.footer && (
        <p className="pt-2 text-xs text-zinc-600">{view.footer}</p>
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
        <div className="space-y-2">
          {block.emoji && <div className="text-5xl">{block.emoji}</div>}
          <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-400">{block.subtitle}</p>
          )}
        </div>
      );
    case "paragraph":
      return <p className="max-w-3xl text-base leading-relaxed text-zinc-300">{block.text}</p>;
    case "stat":
      return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm text-zinc-500">{block.label}</p>
          <p className="mt-1 text-3xl font-bold text-white">{block.value}</p>
          {block.delta && (
            <p className="mt-1 inline-block rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              {block.delta}
            </p>
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
              ? "rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              : block.variant === "outline"
                ? "rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-50"
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
  const content = (
    <>
      <span className="text-[var(--accent)]">›</span> {item.label}
      {item.action && <span className="text-zinc-600">→</span>}
    </>
  );
  if (!item.action)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300">
        {content}
      </span>
    );
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(item.action!)}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {content}
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
      <div className="flex items-center gap-2">
        <span className="text-xl">✨</span>
        {block.category && (
          <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            {block.category}
          </span>
        )}
      </div>
      <p className="mt-2 text-lg font-medium leading-relaxed text-zinc-100">{block.fact}</p>
      {block.source && <p className="mt-1 text-xs text-zinc-500">Source: {block.source}</p>}
      {block.action?.action && (
        <p className="mt-2 text-xs font-medium text-[var(--accent)]">
          {block.action.label ?? "Learn more"} →
        </p>
      )}
    </>
  );
  if (!block.action?.action) {
    return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">{inner}</div>;
  }
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(block.action!.action!)}
      className="group w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {inner}
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Quiz</p>
      <p className="mb-4 text-lg font-medium text-zinc-100">{block.question}</p>
      <div className="grid gap-2">
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
                  ? "rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-2.5 text-left text-sm font-medium text-emerald-300"
                  : status === "wrong"
                    ? "rounded-xl border border-red-500/60 bg-red-500/15 px-4 py-2.5 text-left text-sm font-medium text-red-300"
                    : status === "dim"
                      ? "rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2.5 text-left text-sm text-zinc-500"
                      : "rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:border-[var(--accent)] hover:bg-zinc-800/50"
              }
            >
              <span className="mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-4 animate-view">
          <p className={isCorrect ? "text-sm font-semibold text-emerald-400" : "text-sm font-semibold text-red-400"}>
            {isCorrect ? "Correct! 🎉" : "Not quite."}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">{block.explanation}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Think about it</p>
      <p className="text-lg font-medium text-zinc-100">{block.question}</p>
      {block.hint && (
        <p className="mt-2 text-sm italic text-zinc-500">Hint: {block.hint}</p>
      )}
      {!revealed ? (
        <button
          disabled={disabled}
          onClick={() => setRevealed(true)}
          className="mt-4 rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Show answer
        </button>
      ) : (
        <div className="mt-4 animate-view">
          <p className="text-sm font-semibold text-emerald-400">Answer</p>
          <p className="mt-1 text-base leading-relaxed text-zinc-200">{block.answer}</p>
          {block.action?.action && (
            <button
              disabled={disabled}
              onClick={() => onAction(block.action!.action!)}
              className="mt-3 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {block.action.label ?? "Explore"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
