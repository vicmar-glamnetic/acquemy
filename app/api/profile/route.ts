import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { prisma } = await import("@/lib/prisma");
  const body = await req.json();

  const allowed = ["name", "bio", "niche", "location", "website", "skills", "experience",
    "rate", "portfolioLinks", "targetMarkets", "resumeUrl", "onboarded",
    "headline", "phone", "contactEmail", "linkedin", "github", "twitter",
    "languages", "timezone", "availability"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const updated = await prisma.user.update({ where: { id: user!.id }, data });
  return NextResponse.json(updated);
}
