import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const messages = await prisma.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { prospect: { select: { name: true, company: true } } },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { content, channel, tone, prospectId } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
  const message = await prisma.message.create({
    data: { userId: user.id, content, channel: channel || "Cold Email", tone: tone || "Professional", prospectId: prospectId || null },
  });
  return NextResponse.json(message, { status: 201 });
}
