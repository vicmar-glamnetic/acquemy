import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

const DELIM = "===VARIATION===";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { prospectName, company, role, need, channel, tone } = await req.json();
  if (!prospectName || !company) return NextResponse.json({ error: "prospectName and company required" }, { status: 400 });

  const systemPrompt = buildSystemPrompt(user!);
  const prompt = `Write 3 DISTINCT variations of a ${channel || "Cold Email"} outreach message — each with a different angle/hook (e.g. results-led, problem-led, curiosity-led).

PROSPECT: ${prospectName} | ${company} | ${role || "decision maker"}
THEIR NEED: ${need || "growing their business"}
TONE: ${tone || "Professional"}

Write as ${user!.name || "the freelancer"} in first person, specific to ${company}.
Separate the 3 variations with a line containing exactly: ${DELIM}
Return only the 3 messages separated by that delimiter — no titles, numbers, or commentary.`;

  let variations: string[] = [];
  try {
    const raw = await callClaude(prompt, systemPrompt);
    variations = raw.split(DELIM).map(v => v.trim()).filter(Boolean).slice(0, 3);
  } catch (err) {
    return NextResponse.json({ error: `AI failed: ${err instanceof Error ? err.message.slice(0, 120) : "Unknown"}` }, { status: 502 });
  }
  return NextResponse.json({ variations });
}
