import { NextRequest, NextResponse } from "next/server";
import { generateView, hasApiKey } from "@/lib/deepseek";
import { generateMockView } from "@/lib/mock";
import { historyEntrySchema } from "@/lib/request-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const querySchema = historyEntrySchema;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "query (string) and history (array) are required", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { query, history } = parsed.data;

  try {
    const view = hasApiKey()
      ? await generateView(query, history)
      : generateMockView(query);
    return NextResponse.json({ view, query });
  } catch (err) {
    const message = err instanceof Error ? err.message : "generation failed";
    console.error("[api/view]", message);
    return NextResponse.json(
      { error: message },
      { status: err instanceof Error && /DeepSeek|timed|timeout/i.test(message) ? 502 : 500 }
    );
  }
}
