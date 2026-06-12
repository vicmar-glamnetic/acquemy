import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, callClaude } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { objection, prospectId } = await req.json();
  if (!objection) return NextResponse.json({ error: "objection required" }, { status: 400 });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const systemPrompt = buildSystemPrompt(fullUser);
  const prompt = `A prospect said: "${objection}"

Write a confident, professional response that:
- Acknowledges their concern empathetically
- Reframes the objection positively
- Reinforces the value you provide
- Keeps the conversation moving forward
- Is 2-4 sentences, conversational tone

Return only the response text.`;

  let response: string;
  try {
    response = await callClaude(prompt, systemPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI failed: ${msg.slice(0, 120)}` }, { status: 502 });
  }

  await prisma.objection.create({ data: { userId: user.id, text: objection, response, prospectId: prospectId || null } }).catch(() => {});
  return NextResponse.json({ response });
}
