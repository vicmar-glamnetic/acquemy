import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const settings = await prisma.userSetting.findMany({ where: { userId: user.id } });
  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value; });
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body: Record<string, string> = await req.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.userSetting.upsert({ where: { userId_key: { userId: user.id, key } }, create: { userId: user.id, key, value }, update: { value } })
    )
  );
  return NextResponse.json({ ok: true });
}
