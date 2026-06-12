import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const templates = await prisma.template.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { name, channel, subject, content } = await req.json();
  if (!name?.trim() || !content?.trim()) return NextResponse.json({ error: "name and content required" }, { status: 400 });
  const template = await prisma.template.create({
    data: { userId: user.id, name: name.trim(), channel: channel || "Cold Email", subject: subject || null, content },
  });
  return NextResponse.json(template, { status: 201 });
}
