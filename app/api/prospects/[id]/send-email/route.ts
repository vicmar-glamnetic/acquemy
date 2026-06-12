import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";
import { sendEmail } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const prospect = await prisma.prospect.findFirst({ where: { id, userId: user!.id } });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!prospect.email) return NextResponse.json({ error: "No email address" }, { status: 400 });

  const systemPrompt = buildSystemPrompt(user!);

  let emailContent: string;
  try {
    emailContent = await callClaude(
      `Write a personalized cold email to this prospect.

PROSPECT:
- Name: ${prospect.name}
- Company: ${prospect.company}
- Country: ${prospect.country}
- Niche: ${prospect.niche}
- Role: ${prospect.role}
- Notes: ${prospect.notes || "None"}
- Why a good fit: ${prospect.scoreReason || "Relevant opportunity"}

FORMAT:
Subject: [compelling subject line]

[email body — 100-130 words, personalized to ${prospect.company}, one clear CTA to schedule a 15-min call]

Sign off with your name and website.`,
      systemPrompt
    );
  } catch (err) {
    return NextResponse.json({ error: `AI failed: ${err instanceof Error ? err.message.slice(0, 100) : "Unknown"}` }, { status: 502 });
  }

  const lines = emailContent.split("\n");
  const subjectLine = lines.find(l => l.toLowerCase().startsWith("subject:"));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, "").trim() : `Introduction from ${user!.name}`;
  const body = lines.filter(l => !l.toLowerCase().startsWith("subject:")).join("\n").trim();

  try {
    await sendEmail({
      to: prospect.email,
      subject,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6;">${body.replace(/\n/g, "<br/>")}</div>`,
    });
  } catch (err) {
    return NextResponse.json({ error: `Send failed: ${err instanceof Error ? err.message.slice(0, 100) : "Unknown"}` }, { status: 502 });
  }

  await prisma.message.create({
    data: { userId: user!.id, prospectId: id, channel: "Cold Email", tone: "Professional", content: emailContent, sent: true, sentAt: new Date() },
  });
  await prisma.prospect.update({ where: { id }, data: { status: "contacted" } });
  await prisma.activity.create({
    data: { userId: user!.id, type: "email_sent", description: `Cold email sent to ${prospect.name} (${prospect.email})`, prospectId: id },
  });

  return NextResponse.json({ success: true, subject });
}
