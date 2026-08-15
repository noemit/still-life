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
    <div className="animate-view space-y-8" style={{ "--accent": accent } as CSSProperties}>
      {view.subtitle && (
        <p className="-mt-4 max-w-3xl text-base leading-relaxed text-zinc-400">
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
    case "section":
      return (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <span className="h-4 w-1 rounded-full bg-[var(--accent)]" />
            {block.heading}
          </h3>
          <div className="space-y-4">
            {block.blocks.map((b, i) => (
              <BlockView key={i} block={b} onAction={onAction} disabled={disabled} />
            ))}
          </div>
        </section>
      );
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
    case "card":
      return (
        <CardBlock block={block} onAction={onAction} disabled={disabled} />
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
    case "list":
      return (
        <div className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {block.items.map((item, i) => (
            <ListRow key={i} item={item} onAction={onAction} disabled={disabled} />
          ))}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {block.columns.map((c, i) => (
                  <th key={i} className="px-4 py-3 font-medium text-zinc-400">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-zinc-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "chart":
      return <ChartBlock block={block} onAction={onAction} disabled={disabled} />;
    case "svg":
      return <SvgBlock block={block} />;
    case "form":
      return <FormBlock block={block} onAction={onAction} disabled={disabled} />;
    case "code":
      return (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-black/60 p-4">
          <pre className="font-mono text-sm leading-relaxed text-emerald-300">
            {block.code}
          </pre>
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-[var(--accent)] pl-4">
          <p className="text-lg italic text-zinc-200">“{block.text}”</p>
          {block.author && <cite className="mt-2 block text-sm text-zinc-500">— {block.author}</cite>}
        </blockquote>
      );
    case "link":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
        >
          {block.label} ↗
        </a>
      );
    case "image":
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- AI-provided image URLs */}
          <img
            src={block.url}
            alt={block.caption ?? "image"}
            className="max-h-[480px] rounded-2xl border border-zinc-800 object-contain"
          />
          {block.caption && <figcaption className="text-sm text-zinc-500">{block.caption}</figcaption>}
        </figure>
      );
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

function CardBlock({
  block,
  onAction,
  disabled,
}: {
  block: Extract<Block, { type: "card" }>;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const clickable = Boolean(block.action?.action);
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        {block.emoji && <span className="text-3xl">{block.emoji}</span>}
        {block.value && (
          <span className="text-2xl font-bold text-white">{block.value}</span>
        )}
      </div>
      <p className="font-semibold text-zinc-100">{block.title}</p>
      {block.body && <p className="text-sm leading-relaxed text-zinc-400">{block.body}</p>}
      {block.action?.action && (
        <p className="mt-2 text-xs font-medium text-[var(--accent)]">
          {block.action.label ?? "Open"} →
        </p>
      )}
    </>
  );
  if (!clickable) {
    return (
      <div
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
        style={block.accent ? { borderTopColor: block.accent, borderTopWidth: 2 } : undefined}
      >
        {inner}
      </div>
    );
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

function ListRow({
  item,
  onAction,
  disabled,
}: {
  item: Extract<Block, { type: "list" }>["items"][number];
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const clickable = Boolean(item.action?.action);
  const inner = (
    <>
      {item.emoji && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-xl">{item.emoji}</span>}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-100">{item.title}</p>
        {item.subtitle && <p className="mt-0.5 text-sm text-zinc-400">{item.subtitle}</p>}
      </div>
      {clickable && (
        <span className="text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">→</span>
      )}
    </>
  );
  if (!clickable) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        {inner}
      </div>
    );
  }
  return (
    <button
      disabled={disabled}
      onClick={() => onAction(item.action!.action!)}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {inner}
    </button>
  );
}

function ChartBlock({
  block,
  onAction,
  disabled,
}: {
  block: Extract<Block, { type: "chart" }>;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const accent = block.color ?? "var(--accent)";

  let chart: React.ReactNode;
  if (block.kind === "line") {
    const max = Math.max(...block.values, 1);
    const pts = block.values
      .map((v, i) => `${(i / (block.values.length - 1)) * 100},${110 - (v / max) * 100}`)
      .join(" ");
    chart = (
      <svg viewBox="0 0 100 120" className="h-48 w-full">
        <polyline
          points={pts}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {block.values.map((v, i) => (
          <circle
            key={i}
            cx={(i / (block.values.length - 1)) * 100}
            cy={110 - (v / max) * 100}
            r="2"
            fill="var(--accent)"
          />
        ))}
      </svg>
    );
  } else if (block.kind === "donut") {
    const total = block.values.reduce((a, b) => a + b, 0) || 1;
    const segments = block.values.map((v, i) => {
      const frac = v / total;
      const cumulative = block.values
        .slice(0, i)
        .reduce((a, b) => a + (b / total) * 220, 0);
      const seg = (
        <circle
          key={i}
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={i % 2 === 0 ? accent : "rgba(148,163,184,0.25)"}
          strokeWidth="14"
          strokeDasharray={`${frac * 220} ${220 - frac * 220}`}
          strokeDashoffset={-cumulative}
        />
      );
      return seg;
    });
    chart = (
      <svg viewBox="0 0 100 100" className="mx-auto h-44 w-44 -rotate-90">
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="14" />
        {segments}
      </svg>
    );
  } else {
    const max = Math.max(...block.values, 1);
    chart = (
      <div className="flex h-48 items-end gap-3">
        {block.values.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <div
              className={`w-full max-w-12 rounded-t-lg ${i === block.values.length - 1 ? "bg-[var(--accent)]" : "bg-zinc-700"}`}
              style={{ height: `${(v / max) * 100}%` }}
            />
            <span className="mt-2 text-[11px] text-zinc-500">{block.labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  const inner = (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      {block.title && (
        <p className="mb-4 text-sm font-medium text-zinc-300">{block.title}</p>
      )}
      {chart}
      {block.action?.action && (
        <p className="mt-3 text-xs font-medium text-[var(--accent)]">
          {block.action.label ?? "Open"} →
        </p>
      )}
    </div>
  );

  if (!block.action?.action) return inner;
  return (
    <button disabled={disabled} onClick={() => onAction(block.action!.action!)} className="block w-full text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
      {inner}
    </button>
  );
}

const SCRIPT_RE = /<script[\s\S]*?<\/script>|on\w+\s*=\s*["'][^"']*["']|<\s*(script|iframe|object|embed|foreignObject)\b/i;

export function svgToDataUri(svg: string): string {
  const clean = svg.replace(SCRIPT_RE, "").replace(/javascript:/gi, "");
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

function SvgBlock({ block }: { block: Extract<Block, { type: "svg" }> }) {
  const [src] = useState(() => svgToDataUri(block.svg));
  return (
    <figure className="space-y-2">
      {block.title && <p className="text-sm font-medium text-zinc-300">{block.title}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG data URIs are inert images by design */}
      <img
        src={src}
        alt={block.title ?? "AI-generated graphic"}
        width={block.width}
        height={block.height}
        className="max-h-[560px] rounded-2xl border border-zinc-800 bg-white object-contain"
      />
      {block.caption && <figcaption className="text-sm text-zinc-500">{block.caption}</figcaption>}
    </figure>
  );
}

function FormBlock({
  block,
  onAction,
  disabled,
}: {
  block: Extract<Block, { type: "form" }>;
  onAction: (a: string) => void;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = block.action.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) =>
      (values[key] ?? "").trim()
    );
    if (resolved.trim()) onAction(resolved);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      {block.title && <p className="mb-4 text-sm font-medium text-zinc-300">{block.title}</p>}
      <div className="flex flex-wrap items-end gap-3">
        {block.fields.map((f) => (
          <label key={f.key} className="flex min-w-44 flex-1 flex-col gap-1.5">
            <span className="text-xs text-zinc-500">{f.label}</span>
            <input
              type="text"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-[var(--accent)]"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {block.submitLabel}
        </button>
      </div>
    </form>
  );
}
