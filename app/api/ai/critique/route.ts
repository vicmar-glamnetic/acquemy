import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { message, channel } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const systemPrompt = buildSystemPrompt(user!);
  const prompt = `Critique this ${channel || "outreach"} message. Score each 0-100.
Return ONLY JSON, no commentary:
{"persuasiveness": <0-100>, "clarity": <0-100>, "spamRisk": <0-100 where higher = more spammy>, "suggestions": ["fix 1", "fix 2", "fix 3"]}
Each suggestion must be a short, specific, actionable rewrite instruction.

MESSAGE:
${message}`;

  try {
    const raw = await callClaude(prompt, systemPrompt);
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    return NextResponse.json({
      persuasiveness: Number(parsed.persuasiveness) || 0,
      clarity: Number(parsed.clarity) || 0,
      spamRisk: Number(parsed.spamRisk) || 0,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s: unknown) => typeof s === "string").slice(0, 4) : [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze message" }, { status: 502 });
  }
}
