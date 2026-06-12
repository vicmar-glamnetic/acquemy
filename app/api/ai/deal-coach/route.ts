import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { dealId } = await req.json();
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId: user!.id },
    include: { prospect: { select: { name: true, company: true, niche: true, role: true, notes: true, score: true } } },
  });
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const daysInStage = Math.floor((Date.now() - new Date(deal.stageEnteredAt).getTime()) / 86400000);
  const systemPrompt = buildSystemPrompt(user!);
  const prompt = `You are a freelance sales coach. Suggest the single best NEXT ACTION for this deal.

DEAL
- Prospect: ${deal.prospect.name} (${deal.prospect.role || "unknown role"}) at ${deal.prospect.company}
- Niche: ${deal.prospect.niche}
- Stage: ${deal.stage} (in this stage for ${daysInStage} day${daysInStage === 1 ? "" : "s"})
- Value: ${deal.value ? `$${deal.value}` : "not set"}
- Notes: ${deal.notes || "none"}

Reply with ONE concrete, specific next action in 1-2 sentences (what to do and why it moves the deal forward). No preamble.`;

  let aiNextAction: string;
  try {
    aiNextAction = (await callClaude(prompt, systemPrompt)).trim();
  } catch (err) {
    return NextResponse.json({ error: `AI failed: ${err instanceof Error ? err.message.slice(0, 120) : "Unknown"}` }, { status: 502 });
  }

  await prisma.deal.update({ where: { id: deal.id }, data: { aiNextAction } }).catch(() => {});
  return NextResponse.json({ aiNextAction });
}
