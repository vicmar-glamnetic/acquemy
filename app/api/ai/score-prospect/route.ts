import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { name, company, country, niche, role, notes } = await req.json();
  const systemPrompt = buildSystemPrompt(user!);

  try {
    const result = await callClaude(
      `Score this prospect for ${user!.name || "this freelancer"} (0-100).\n\nProspect: ${name} | ${company} | ${country} | ${niche} | ${role}\nNotes: ${notes || "None"}\n\nRespond with JSON only: {"score": 75, "reason": "one sentence"}`,
      systemPrompt
    );
    const parsed = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || "{}");
    return NextResponse.json({ score: parsed.score || 50, reason: parsed.reason || "AI scored" });
  } catch {
    return NextResponse.json({ score: 50, reason: "Could not score" });
  }
}
