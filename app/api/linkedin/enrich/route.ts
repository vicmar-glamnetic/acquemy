import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { linkedinUrl } = await req.json();
  if (!linkedinUrl || !linkedinUrl.includes("linkedin.com")) {
    return NextResponse.json({ error: "Valid LinkedIn URL required" }, { status: 400 });
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let name = "", company = "", niche = "", bio = "";
  let usedProxycurl = false;

  if (process.env.PROXYCURL_API_KEY) {
    try {
      const pcRes = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}`, {
        headers: { Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}` },
      });
      if (pcRes.ok) {
        const pc = await pcRes.json();
        name = [pc.first_name, pc.last_name].filter(Boolean).join(" ");
        company = pc.experiences?.[0]?.company || "";
        niche = pc.occupation || pc.headline || "";
        bio = pc.summary || "";
        usedProxycurl = true;
      }
    } catch {}
  }

  if (!name) {
    const slug = linkedinUrl.split("linkedin.com/in/")[1]?.replace(/\/$/, "") || "";
    const systemPrompt = buildSystemPrompt(fullUser);
    const inference = await callClaude(
      `Based on the LinkedIn profile URL slug "${slug}", infer likely details. Return JSON only: {"name":"...","company":"...","niche":"...","bio":"..."}. Make reasonable guesses based on the slug.`,
      systemPrompt
    ).catch(() => "{}");
    try {
      const parsed = JSON.parse(inference.match(/\{[\s\S]*\}/)?.[0] || "{}");
      name = parsed.name || slug.replace(/-/g, " ");
      company = parsed.company || "";
      niche = parsed.niche || "";
      bio = parsed.bio || "";
    } catch {}
  }

  const existing = await prisma.prospect.findFirst({ where: { userId: user.id, linkedinUrl } });
  if (existing) return NextResponse.json({ prospect: existing, usedProxycurl, alreadyExists: true });

  const prospect = await prisma.prospect.create({
    data: { userId: user.id, name, company, niche, email: "", linkedinUrl, bio, status: "new", score: 50, source: "LinkedIn" },
  });

  await prisma.activity.create({ data: { userId: user.id, type: "prospect_added", description: `LinkedIn import: ${name} from ${company || "unknown"}`, prospectId: prospect.id } });

  return NextResponse.json({ prospect, usedProxycurl });
}
