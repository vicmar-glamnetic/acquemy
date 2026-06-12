import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { body, company } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  const systemPrompt = buildSystemPrompt(user!);
  const prompt = `Write 3 short, compelling cold-email subject lines for the message below${company ? ` (to ${company})` : ""}.
Rules: under 8 words each, specific, no clickbait, no quotes. Return ONLY a JSON array of 3 strings, nothing else.

MESSAGE:
${body}`;

  let subjects: string[] = [];
  try {
    const raw = await callClaude(prompt, systemPrompt);
    const match = raw.match(/\[[\s\S]*\]/);
    subjects = match ? JSON.parse(match[0]) : [];
  } catch {
    return NextResponse.json({ error: "Failed to generate subject lines" }, { status: 502 });
  }
  return NextResponse.json({ subjects: subjects.filter(s => typeof s === "string").slice(0, 3) });
}
