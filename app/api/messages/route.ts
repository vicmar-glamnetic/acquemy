import { NextResponse } from "next/server";
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
