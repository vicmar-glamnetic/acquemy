import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, callClaude } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { platform } = await req.json();
  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const systemPrompt = buildSystemPrompt(fullUser);
  const prompt = `Give me specific, actionable tips for winning clients on ${platform} as a freelancer with my specific skills and niche.

Cover:
1. Profile optimization tips for my niche
2. How to find the best-fit jobs/clients
3. How to write proposals/pitches that convert
4. Pricing strategy for this platform
5. Common mistakes to avoid

Be specific to my niche and skills. Format with clear sections.`;

  let tips: string;
  try {
    tips = await callClaude(prompt, systemPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI failed: ${msg.slice(0, 120)}` }, { status: 502 });
  }

  return NextResponse.json({ tips });
}
