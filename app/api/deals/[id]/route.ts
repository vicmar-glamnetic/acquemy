import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.deal.findFirst({ where: { id, userId: user!.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["stage", "value", "currency", "notes", "aiNextAction"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) data[key] = body[key];

  // Reset the stage timer only when the stage actually changes.
  if (typeof data.stage === "string" && data.stage !== existing.stage) {
    data.stageEnteredAt = new Date();
    await prisma.activity.create({
      data: { userId: user!.id, type: "deal_stage_changed", description: `Deal moved to ${data.stage}`, prospectId: existing.prospectId, dealId: existing.id },
    }).catch(() => {});
  }

  const updated = await prisma.deal.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await prisma.deal.deleteMany({ where: { id, userId: user!.id } });
  return NextResponse.json({ success: true });
}
