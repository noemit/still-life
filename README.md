# Still Life / LiveUI ∞

Search anything → an AI (DeepSeek) builds a real, interactive page on the fly. Click anything on that page → it generates the next one. A "living", dynamic AI-UI loop.

## How it works

1. You type a query (or click anything on the current page — cards, chips, list rows, charts, suggestion pills all carry an `action`).
2. `POST /api/view` sends the query + session history to DeepSeek in **JSON mode**.
3. DeepSeek returns a **structured view spec** — NOT executable code. It can only compose blocks from a fixed registry (hero, cards, stats, lists, tables, charts, forms, quotes, code display, links, and raw SVG graphics).
4. The spec is validated with zod (with automatic retry on invalid output), then rendered by the client component registry.
5. SVG graphics are rendered as inert `data:image/svg+xml` `<img>` URIs — the model draws the SVG, the browser never executes it.

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

The backend uses the **Orca Router** (an OpenAI-compatible gateway to DeepSeek models) via the `openai` SDK — see `lib/deepseek.ts`. Model: `deepseek/deepseek-v4-flash-free` (override with `ORCAROUTER_MODEL`).

## Deploy to Vercel

```bash
npx vercel --prod
```

Add `ORCAROUTER_API_KEY` (and optional `ORCAROUTER_MODEL`) as an environment variable in the Vercel project. The route is a Node serverless function with a 60s max duration.

If you import this repo into Vercel via GitHub, set the environment variable **before** the first deploy so the API route has the key.

## Project layout

- `app/api/view/route.ts` — generation endpoint (DeepSeek + JSON-mode retry, or mock)
- `lib/types.ts` — the view-spec schema (the contract between model and renderer)
- `lib/deepseek.ts` — DeepSeek client + strict system prompt
- `components/ViewRenderer.tsx` — the component registry that renders specs safely
- `components/Explore.tsx` — the search → loading → view → click loop UI

## The block registry

`hero` · `paragraph` · `stat` · `card` · `button` · `chip` · `list` · `table` · `chart` (bar/line/donut) · `svg` · `form` (with `{{field}}` template queries) · `code` (display-only) · `quote` · `link` · `image` · `section`
