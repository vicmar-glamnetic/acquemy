import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const followUps = await prisma.followUp.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: "asc" },
    include: { prospect: { select: { name: true, company: true, email: true } } },
  });
  return NextResponse.json(followUps);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { prospectId, step, channel, scheduledAt, content } = await req.json();
  if (!prospectId) return NextResponse.json({ error: "prospectId required" }, { status: 400 });
  const followUp = await prisma.followUp.create({
    data: { userId: user.id, prospectId, step: step || 1, channel: channel || "Email", scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(), content: content || "" },
  });
  return NextResponse.json(followUp, { status: 201 });
}
