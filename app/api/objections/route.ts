import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const objections = await prisma.objection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(objections);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { text, response, prospectId } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const objection = await prisma.objection.create({
    data: { userId: user.id, text, response: response || "", prospectId: prospectId || null },
  });
  return NextResponse.json(objection, { status: 201 });
}
