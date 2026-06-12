import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, callClaude } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { projectType, scope, timeline, clientBudget } = await req.json();
  if (!projectType) return NextResponse.json({ error: "projectType required" }, { status: 400 });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const systemPrompt = buildSystemPrompt(fullUser);
  const prompt = `Help me price this project:

Project Type: ${projectType}
Scope: ${scope || "Not specified"}
Timeline: ${timeline || "Flexible"}
Client Budget: ${clientBudget || "Unknown"}

Based on my experience level, niche, and market rates for my skills, provide:
1. Recommended price range
2. Suggested pricing structure (fixed / hourly / retainer)
3. What to include in the scope
4. How to present this to the client
5. Red flags if client pushes back too hard

Be specific with numbers.`;

  let pricing: string;
  try {
    pricing = await callClaude(prompt, systemPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI failed: ${msg.slice(0, 120)}` }, { status: 502 });
  }

  return NextResponse.json({ pricing });
}
