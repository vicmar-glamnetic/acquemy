import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const prospect = await prisma.prospect.findFirst({
    where: { id, userId: user!.id },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 12 } },
  });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const prospect = await prisma.prospect.updateMany({
    where: { id, userId: user!.id },
    data: body,
  });
  if (prospect.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await prisma.prospect.deleteMany({ where: { id, userId: user!.id } });
  return NextResponse.json({ success: true });
}
