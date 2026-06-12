import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/anthropic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-webhook-secret, x-user-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  const userId = req.headers.get("x-user-id");

  if (!userId) return NextResponse.json({ error: "x-user-id header required" }, { status: 400, headers: CORS });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers: CORS });

  const setting = await prisma.userSetting.findUnique({ where: { userId_key: { userId, key: "webhookSecret" } } });
  if (setting?.value && secret !== setting.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS }); }

  const { name, email, message, company, website } = body;
  if (!name || !email || !message) return NextResponse.json({ error: "name, email, message required" }, { status: 400, headers: CORS });

  const scoreText = await callClaude(
    `Rate this website contact form submission as a freelance lead. Message: "${message}". Name: ${name}, Company: ${company || "N/A"}. Score 0-100, then one sentence why. Format: SCORE: 75\nREASON: they want...`,
    `You are an AI helping ${user.name || "a freelancer"} assess leads.`
  ).catch(() => "SCORE: 60\nREASON: Standard contact.");

  const scoreMatch = scoreText.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 60;

  const prospect = await prisma.prospect.create({
    data: { userId, name, email, company: company || "", bio: message, niche: "website contact", status: "new", score, source: "Contact Form", website: website || "" },
  });

  await prisma.activity.create({ data: { userId, type: "prospect_added", description: `Contact form: ${name} (${email}) — score ${score}`, prospectId: prospect.id } });

  return NextResponse.json({ ok: true, prospectId: prospect.id, score }, { headers: CORS });
}
