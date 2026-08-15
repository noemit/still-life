"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ViewRenderer } from "@/components/ViewRenderer";
import type { GenerateResponse, ViewSpec } from "@/lib/types";

interface HistoryItem {
  query: string;
  title: string;
  view: ViewSpec;
}

const STARTERS = [
  "Surprising facts about octopuses",
  "Why is the sky blue?",
  "Quiz me on world capitals",
  "Fun facts about ancient Rome",
  "What would happen if humans could photosynthesize?",
  "Myths vs facts about sharks",
];

export function Explore() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = history[history.length - 1];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runAction = useCallback(async (action: string) => {
    const trimmed = action.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setLoadingQuery(trimmed);
    setError(null);
    setInput(trimmed);

    try {
      const res = await fetch("/api/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          history: history.map((h) => ({ query: h.query, title: h.title })),
        }),
      });
      const data = (await res.json()) as GenerateResponse & {
        mock?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      setMockMode(Boolean(data.mock));
      setHistory((h) => [...h, { query: trimmed, title: data.view.title, view: data.view }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [history, loading]);

  const goTo = (index: number) => {
    setHistory((h) => h.slice(0, index + 1));
    setError(null);
  };

  const reset = () => {
    setHistory([]);
    setLoading(false);
    setError(null);
    setInput("");
  };

  useEffect(() => {
    viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current?.title, loading]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1] text-xs text-white">
              ∞
            </span>
            Still Life
          </button>

          {history.length > 0 && (
            <>
              <div className="mx-1 hidden h-5 w-px bg-zinc-800 sm:block" />
              <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-zinc-500 transition-colors hover:text-[#6366f1]"
                  >
                    {h.query.length > 22 ? h.query.slice(0, 22) + "…" : h.query}
                  </button>
                ))}
              </div>
              <SearchInput
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={(q) => runAction(q)}
                loading={loading}
                compact
                placeholder="Ask anything…"
              />
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-10">
        {!current && !loading ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6366f1]/15 text-3xl text-[#6366f1]">
              ∞
            </div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ask anything.{" "}
              <span className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                Get facts & a quiz.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-zinc-400">
              Every search generates a bite-sized page of fun facts, surprising stats, and a
              multiple-choice quiz. Tap anything to dive deeper.
            </p>

            <div className="mt-10 w-full max-w-xl">
              <SearchInput
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={(q) => runAction(q)}
                loading={loading}
                placeholder='Try "Surprising facts about octopuses"…'
                autoFocus
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => runAction(s)}
                  className="rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-[#6366f1] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={viewRef} className="scroll-mt-20">
            {loading && !current && <LoadingView query={loadingQuery} />}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4">
                <p className="text-sm text-red-300">{error}</p>
                <div className="flex gap-2">
                  {loadingQuery && (
                    <button
                      onClick={() => runAction(loadingQuery)}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/30"
                    >
                      Retry
                    </button>
                  )}
                  <button onClick={reset} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white">
                    New search
                  </button>
                </div>
              </div>
            )}

            {current && (
              <div key={current.query} className="animate-view">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {current.title}
                  </h2>
                  {mockMode && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                      demo mode · no API key
                    </span>
                  )}
                </div>
                <ViewRenderer
                  view={current.view}
                  onAction={runAction}
                  disabled={loading}
                />
              </div>
            )}

            {loading && current && (
              <div className="animate-view">
                <LoadingOverlay query={loadingQuery} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="pb-8 text-center text-xs text-zinc-600">
        Still Life — facts and quizzes generated on demand. Keyboard:{" "}
        <kbd className="rounded border border-zinc-800 px-1.5 py-0.5">/</kbd> to search
      </footer>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  loading: boolean;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
  compact,
  autoFocus,
  inputRef,
}: SearchInputProps) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value);
      }}
      className={
        compact
          ? "flex w-full max-w-md items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 transition-colors focus-within:border-[#6366f1]"
          : "flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-4 shadow-2xl shadow-black/40 transition-colors focus-within:border-[#6366f1]"
      }
    >
      {loading ? (
        <svg className="h-5 w-5 shrink-0 animate-spin text-[#6366f1]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="h-5 w-5 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-white placeholder-zinc-600 outline-none"
        disabled={loading}
      />
      {value && !loading && (
        <button
          type="submit"
          className="shrink-0 rounded-full bg-[#6366f1] px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          Generate
        </button>
      )}
    </form>
  );
};

function LoadingView({ query }: { query: string }) {
  return (
    <div className="animate-view space-y-8">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
        <h2 className="text-xl font-semibold text-zinc-200">Generating page for “{query}”…</h2>
      </div>
      <Skeleton blocks={6} />
    </div>
  );
}

function LoadingOverlay({ query }: { query: string }) {
  return (
    <div className="mt-10 space-y-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-6">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
        <h3 className="text-lg font-semibold text-zinc-200">
          Building next page — “{query}”…
        </h3>
      </div>
      <Skeleton blocks={4} />
    </div>
  );
}

function Skeleton({ blocks }: { blocks: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 ${
            i === 0 ? "h-40" : i % 3 === 1 ? "h-24" : "h-16"
          }`}
        >
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-zinc-800" />
          {i === 0 && (
            <>
              <div className="mt-4 h-8 w-2/3 animate-pulse rounded-full bg-zinc-800/80" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-zinc-800/60" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
