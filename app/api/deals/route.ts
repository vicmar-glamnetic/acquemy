import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const deals = await prisma.deal.findMany({
    where: { userId: user.id },
    include: { prospect: { select: { id: true, name: true, company: true, niche: true, role: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json();
  const { prospectId, stage, value, notes } = body;
  if (!prospectId) return NextResponse.json({ error: "prospectId required" }, { status: 400 });

  const deal = await prisma.deal.create({
    data: { userId: user.id, prospectId, stage: stage || "Discovered", value: value || 0, notes: notes || "" },
  });
  return NextResponse.json(deal, { status: 201 });
}
