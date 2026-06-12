import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { message, instruction, channel, tone } = await req.json();
  if (!message || !instruction) return NextResponse.json({ error: "message and instruction required" }, { status: 400 });

  const systemPrompt = buildSystemPrompt(user!);
  const prompt = `Revise the following ${channel || "outreach"} message based on the instruction.
Keep it authentic, in first person as the freelancer. If the message has a "Subject:" line, keep that format.
Return ONLY the revised message text — no preamble, quotes, or commentary.

INSTRUCTION: ${instruction}
${tone ? `TONE: ${tone}` : ""}

CURRENT MESSAGE:
${message}`;

  let content: string;
  try {
    content = (await callClaude(prompt, systemPrompt)).trim();
  } catch (err) {
    return NextResponse.json({ error: `AI failed: ${err instanceof Error ? err.message.slice(0, 120) : "Unknown"}` }, { status: 502 });
  }
  return NextResponse.json({ content });
}
