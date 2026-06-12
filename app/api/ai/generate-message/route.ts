import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { prospectName, company, role, need, channel, tone, referencePortfolio, prospectId } = await req.json();
  const systemPrompt = buildSystemPrompt(user!);

  const channelGuide: Record<string, string> = {
    "Cold Email": "Write a cold email. Subject: first, then body. Under 150 words. One clear CTA.",
    "LinkedIn DM": "Write a LinkedIn DM. 3-4 sentences. Conversational, end with a soft question.",
    "Upwork Cover Letter": "Write an Upwork cover letter. Lead with their problem, show relevant experience, 150-200 words.",
    "Twitter DM": "Write a Twitter/X DM. Max 3 sentences. Very conversational.",
    "WhatsApp": "Write a WhatsApp message. Casual but professional. 2-4 sentences.",
  };

  const prompt = `Write an outreach message to a prospect.

PROSPECT: ${prospectName} | ${company} | ${role}
THEIR NEED: ${need}
CHANNEL: ${channel} — ${channelGuide[channel] || "Professional outreach"}
TONE: ${tone}
${referencePortfolio?.length ? `Reference this portfolio work naturally: ${referencePortfolio.join(", ")}` : ""}

Write as ${user!.name || "the freelancer"} in first person. Be specific to ${company}.`;

  let content: string;
  try {
    content = await callClaude(prompt, systemPrompt);
  } catch (err) {
    return NextResponse.json({ error: `AI failed: ${err instanceof Error ? err.message.slice(0, 120) : "Unknown"}` }, { status: 502 });
  }

  let messageId: string | null = null;
  try {
    const msg = await prisma.message.create({
      data: { userId: user!.id, prospectId: prospectId || null, channel, tone, content },
    });
    messageId = msg.id;
    if (prospectId) {
      await prisma.activity.create({
        data: { userId: user!.id, type: "message_generated", description: `Generated ${channel} for ${prospectName}`, prospectId },
      });
    }
  } catch {
    // return content even if DB fails
  }

  return NextResponse.json({ content, messageId });
}
