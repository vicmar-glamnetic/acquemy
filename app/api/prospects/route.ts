import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const archived = searchParams.get("archived") === "true";

  const prospects = await prisma.prospect.findMany({
    where: { userId: user!.id, archived, ...(status && { status }) },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { deals: true, messages: true } } },
  });
  return NextResponse.json(prospects);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json();
  const { name, company, country, niche, role, email, linkedinUrl, notes, score, scoreReason } = body;

  const prospect = await prisma.prospect.create({
    data: { userId: user!.id, name, company, country, niche, role, email, linkedinUrl, notes, score: score || 0, scoreReason },
  });
  await prisma.activity.create({
    data: { userId: user!.id, type: "prospect_added", description: `Added ${name} from ${company}`, prospectId: prospect.id },
  });
  return NextResponse.json(prospect, { status: 201 });
}
