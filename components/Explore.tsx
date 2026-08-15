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
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
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
    setScore({ right: 0, total: 0, streak: 0 });
  };

  const onScore = (correct: boolean) => {
    setScore((s) => ({
      right: s.right + (correct ? 1 : 0),
      total: s.total + 1,
      streak: correct ? s.streak + 1 : 0,
    }));
  };

  useEffect(() => {
    viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current?.title, loading]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-[#262626] bg-[#0d0d0d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#e5e5e5]"
          >
            <span className="h-5 w-5 rounded bg-[#3b82f6]" />
            Still Life
          </button>
          {score.total > 0 && (
            <span className="text-sm text-[#d4d4d4]">
              {score.right}/{score.total}
              {score.streak > 1 ? ` · streak ${score.streak}` : ""}
            </span>
          )}

          {history.length > 0 && (
            <>
              <div className="mx-1 hidden h-4 w-px bg-[#262626] sm:block" />
              <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-sm text-[#d4d4d4] transition-colors hover:text-[#fafafa]"
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-12">
        {!current && !loading ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[#fafafa] sm:text-4xl">
              Ask anything. Get facts & a quiz.
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-[#d4d4d4]">
              Every query becomes a concise page of facts, a multiple-choice quiz, and a
              question to think about. Tap anything to continue.
            </p>

            <div className="mt-10 w-full max-w-lg">
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
                  className="rounded border border-[#404040] bg-[#171717] px-3 py-1.5 text-sm text-[#e5e5e5] transition-colors hover:border-[#737373] hover:text-[#fafafa]"
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
              <div className="mb-6 flex items-center justify-between rounded border border-red-900/50 bg-red-950/20 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
                <div className="flex gap-2">
                  {loadingQuery && (
                    <button
                      onClick={() => runAction(loadingQuery)}
                      className="rounded bg-red-500/15 px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-red-500/25"
                    >
                      Retry
                    </button>
                  )}
                  <button onClick={reset} className="rounded px-3 py-1.5 text-sm text-[#d4d4d4] hover:text-[#fafafa]">
                    New search
                  </button>
                </div>
              </div>
            )}

            {current && (
              <div key={current.query} className="animate-view">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-xl font-semibold tracking-tight text-[#fafafa]">
                    {current.title}
                  </h2>
                  {mockMode && (
                    <span className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-sm text-amber-200">
                      demo
                    </span>
                  )}
                </div>
                <ViewRenderer
                  view={current.view}
                  onAction={runAction}
                  onScore={onScore}
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

      <footer className="pb-6 text-center text-xs text-[#a3a3a3]">
        Still Life · Generated on demand · Press / to search
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
          ? "flex w-full max-w-md items-center gap-2 rounded border border-[#262626] bg-[#171717] px-3 py-1.5 transition-colors focus-within:border-[#404040]"
          : "flex w-full items-center gap-3 rounded border border-[#262626] bg-[#171717] px-4 py-3 shadow-sm transition-colors focus-within:border-[#404040]"
      }
    >
      {loading ? (
        <svg className="h-4 w-4 shrink-0 animate-spin text-[#737373]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0 text-[#525252]" viewBox="0 0 24 24" fill="none">
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
        className="min-w-0 flex-1 bg-transparent text-sm text-[#e5e5e5] placeholder-[#a3a3a3] outline-none"
        disabled={loading}
      />
      {value && !loading && (
        <button
          type="submit"
          className="shrink-0 rounded bg-[#e5e5e5] px-3 py-1 text-xs font-medium text-[#0d0d0d] transition-colors hover:bg-white"
        >
          Ask
        </button>
      )}
    </form>
  );
};

function LoadingView({ query }: { query: string }) {
  return (
    <div className="animate-view space-y-6">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-spin rounded-none border border-[#3b82f6] border-t-transparent" />
        <p className="text-sm text-[#e5e5e5]">Generating page for “{query}”…</p>
      </div>
      <Skeleton blocks={5} />
    </div>
  );
}

function LoadingOverlay({ query }: { query: string }) {
  return (
    <div className="mt-8 space-y-5 rounded border border-[#262626] bg-[#171717]/50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-spin rounded-none border border-[#3b82f6] border-t-transparent" />
        <p className="text-sm text-[#e5e5e5]">Building next page — “{query}”…</p>
      </div>
      <Skeleton blocks={3} />
    </div>
  );
}

function Skeleton({ blocks }: { blocks: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          className={`rounded border border-[#262626] bg-[#171717] p-4 shadow-sm ${
            i === 0 ? "h-28" : i % 3 === 1 ? "h-20" : "h-14"
          }`}
        >
          <div className="h-2.5 w-1/3 rounded bg-[#262626]" />
          {i === 0 && (
            <>
              <div className="mt-3 h-6 w-2/3 rounded bg-[#262626]/70" />
              <div className="mt-2 h-2.5 w-1/2 rounded bg-[#262626]/50" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
