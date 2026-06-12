import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { callClaude, buildSystemPrompt } from "@/lib/anthropic";

const JOB_FEEDS = [
  { url: "https://weworkremotely.com/remote-jobs.rss", source: "We Work Remotely" },
  { url: "https://remoteok.com/remote-shopify-jobs.rss", source: "Remote OK" },
  { url: "https://remoteok.com/remote-ecommerce-jobs.rss", source: "Remote OK" },
  { url: "https://remoteok.com/remote-javascript-jobs.rss", source: "Remote OK" },
  { url: "https://jobicy.com/feed/", source: "Jobicy" },
  { url: "https://remote.co/remote-jobs/developer/feed/", source: "Remote.co" },
  { url: "https://himalayas.app/jobs/rss", source: "Himalayas" },
  { url: "https://www.workingnomads.com/feed/development-jobs/", source: "Working Nomads" },
  { url: "https://nodesk.co/remote-jobs/rss/", source: "NoDesk" },
  { url: "https://authenticjobs.com/feed/", source: "Authentic Jobs" },
  { url: "https://www.reddit.com/r/forhire/search.rss?q=developer&sort=new&restrict_sr=1", source: "Reddit r/forhire" },
  { url: "https://www.reddit.com/r/freelance/search.rss?q=developer&sort=new&restrict_sr=1", source: "Reddit r/freelance" },
  { url: "https://www.reddit.com/r/ecommerce/search.rss?q=developer+hire&sort=new&restrict_sr=1", source: "Reddit r/ecommerce" },
  { url: "https://www.freelancer.com/rss.xml", source: "Freelancer.com" },
];

interface FeedItem { title: string; description: string; link: string; company: string; source: string; }

function parseRSS(xml: string, source: string, keywords: string[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const c = match[1];
    const title = (c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || c.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
    const desc = (c.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || c.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.replace(/<[^>]*>/g, "").trim().slice(0, 600) || "";
    const link = (c.match(/<link>(.*?)<\/link>/) || c.match(/<guid[^>]*>(.*?)<\/guid>/))?.[1]?.trim() || "";
    const company = (c.match(/<company><!\[CDATA\[(.*?)\]\]><\/company>/) || c.match(/<company>(.*?)<\/company>/))?.[1]?.trim() || "Unknown";
    const combined = (title + " " + desc).toLowerCase();
    if (title && keywords.some(k => combined.includes(k.toLowerCase()))) {
      items.push({ title, description: desc, link, company, source });
    }
  }
  return items;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  // Build keywords strictly from user's niche and skills only
  const userKeywords: string[] = [];
  if (user!.niche) userKeywords.push(...user!.niche.toLowerCase().split(/[\s,/]+/).filter(s => s.length > 2));
  if (user!.skills) userKeywords.push(...user!.skills.toLowerCase().split(",").map(s => s.trim()).filter(s => s.length > 2).slice(0, 8));
  // Fallback only if profile is completely empty
  const keywords = userKeywords.length > 0 ? [...new Set(userKeywords)] : ["freelance developer"];

  const feedResults = await Promise.allSettled(
    JOB_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`${feed.source}: HTTP ${res.status}`);
      return { items: parseRSS(await res.text(), feed.source, keywords), source: feed.source };
    })
  );

  const allItems: FeedItem[] = [];
  const sourceSummary: Record<string, number> = {};
  for (const result of feedResults) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value.items);
      if (result.value.items.length > 0) sourceSummary[result.value.source] = result.value.items.length;
    }
  }

  const seen = new Set<string>();
  const unique = allItems.filter(item => { if (!item.link || seen.has(item.link)) return false; seen.add(item.link); return true; });

  const existing = await prisma.prospect.findMany({
    where: { userId: user!.id, linkedinUrl: { in: unique.map(i => i.link) } },
    select: { linkedinUrl: true },
  });
  const existingLinks = new Set(existing.map(e => e.linkedinUrl));
  const newItems = unique.filter(item => !existingLinks.has(item.link)).slice(0, 8);

  if (newItems.length === 0) {
    return NextResponse.json({ added: 0, message: "No new opportunities found right now", sources: sourceSummary });
  }

  const systemPrompt = buildSystemPrompt(user!);
  const jobsText = newItems.map((j, i) => `JOB ${i + 1} [${j.source}]:\nTitle: ${j.title}\nCompany: ${j.company}\nDesc: ${j.description}`).join("\n---\n");

  type Score = { index: number; score: number; reason: string; country: string; niche: string };
  let scores: Score[] = [];
  try {
    const analysis = await callClaude(
      `Score these job postings for ${user!.name || "this freelancer"} based on their profile.\n\n${jobsText}\n\nJSON array only:\n[{"index":1,"score":80,"reason":"one sentence","country":"USA or Unknown","niche":"their specialty"}]`,
      systemPrompt
    );
    scores = JSON.parse(analysis.match(/\[[\s\S]*\]/)?.[0] || "[]");
  } catch {
    scores = newItems.map((_, i) => ({ index: i + 1, score: 60, reason: "Job posting match", country: "Unknown", niche: user!.niche || "Freelance" }));
  }

  let added = 0;
  for (let i = 0; i < newItems.length; i++) {
    const job = newItems[i];
    const score = scores.find(s => s.index === i + 1) || { score: 60, reason: "Job match", country: "Unknown", niche: user!.niche || "Freelance" };
    const created = await prisma.prospect.create({
      data: {
        userId: user!.id,
        name: job.company !== "Unknown" ? job.company : `${job.source} Lead`,
        company: job.company !== "Unknown" ? job.company : `${job.source} Lead`,
        country: score.country || "Unknown",
        niche: score.niche || user!.niche || "Freelance",
        role: "Hiring Manager",
        linkedinUrl: job.link,
        notes: `Job: ${job.title}\nSource: ${job.source}\nURL: ${job.link}\n\n${job.description}`,
        score: score.score || 60,
        scoreReason: score.reason || "Job board match",
        status: "new",
      },
    });
    await prisma.activity.create({
      data: { userId: user!.id, type: "prospect_added", description: `Auto-found via ${job.source}: ${job.title}`, prospectId: created.id },
    });
    added++;
  }

  return NextResponse.json({
    added, totalFound: unique.length, feedsScanned: Object.keys(sourceSummary).length,
    message: `Scanned ${Object.keys(sourceSummary).length} platforms · Found ${unique.length} matches · Added ${added} new prospects`,
    sources: sourceSummary,
  });
}
