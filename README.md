# Still Life ∞

Ask anything → get a bite-sized page of **fun facts, surprising stats, a multiple-choice quiz, and a thought-provoking question**. Tap any fact, quiz action, chip, or button to generate the next page. A fast, text-only, dynamic AI-UI loop.

## How it works

1. You type a topic (or tap anything on the current page — every fact, quiz, and chip carries an `action`).
2. `POST /api/view` sends the query + session history to DeepSeek via the **Orca Router** in **JSON mode**.
3. DeepSeek returns a **structured view spec** — NOT executable code. It can only compose blocks from a fixed registry (hero, paragraph, stat, funFact, quiz, question, chip, button).
4. The spec is validated with zod (with automatic retry on invalid output), then rendered by the client component registry.
5. The page is text-only: no images, no SVG, no charts, no external media. That keeps generation fast and the output safe.

This is the safety model: the model emits **data**, never code. No eval, no arbitrary imports, no script execution. The infinite click-to-generate loop is fully serverless-friendly (no server state — history lives client-side).

## Running

```bash
npm install
npm run dev        # → http://localhost:3000
```

**No API key?** The app runs in **demo mode** with a mock generator so you can click through the whole experience offline. For real AI pages, set the key:

```bash
cp .env.example .env.local   # add ORCAROUTER_API_KEY
```

The backend uses the **Orca Router** (an OpenAI-compatible gateway to DeepSeek models) via the `openai` SDK — see `lib/deepseek.ts`. Defaults:

- Base URL: `https://api.orcarouter.ai/v1`
- Model: `deepseek/deepseek-v4-flash-free` (override with `ORCAROUTER_MODEL`)
- Reasoning/thinking is turned **off** (`reasoning_effort: "none"`) for speed.

## Deploy to Vercel

```bash
npx vercel --prod
```

Add `ORCAROUTER_API_KEY` (and optional `ORCAROUTER_MODEL`) as an environment variable in the Vercel project. The route is a Node serverless function with a 60s max duration.

If you import this repo into Vercel via GitHub, set the environment variable **before** the first deploy so the API route has the key.

## Project layout

- `app/api/view/route.ts` — generation endpoint (DeepSeek + JSON-mode retry, or mock)
- `lib/types.ts` — the view-spec schema (the contract between model and renderer)
- `lib/deepseek.ts` — DeepSeek client + strict system prompt with an example page
- `components/ViewRenderer.tsx` — the component registry that renders specs safely
- `components/Explore.tsx` — the search → loading → view → click loop UI

## The block registry

`hero` · `paragraph` · `stat` · `button` · `chip` · `quiz` · `funFact` · `question`
