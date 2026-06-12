import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface UserProfile {
  name?: string | null;
  bio?: string | null;
  skills?: string | null;
  niche?: string | null;
  location?: string | null;
  website?: string | null;
  portfolioLinks?: string | null;
  rate?: string | null;
  targetMarkets?: string | null;
  experience?: string | null;
}

export function buildSystemPrompt(user: UserProfile): string {
  const portfolio = (() => {
    try { return JSON.parse(user.portfolioLinks || "[]").join(", "); } catch { return user.portfolioLinks || ""; }
  })();
  const markets = (() => {
    try { return JSON.parse(user.targetMarkets || "[]").join(", "); } catch { return user.targetMarkets || "worldwide"; }
  })();

  return `You are an AI assistant helping ${user.name || "a freelancer"} acquire new clients.

FREELANCER PROFILE:
- Name: ${user.name || "Unknown"}
- Specialty/Niche: ${user.niche || "Freelancer"}
- Skills: ${user.skills || "General freelancing"}
- Experience: ${user.experience || "Experienced professional"}
- Location: ${user.location || "Remote"}
- Rate: ${user.rate || "Competitive rates"}
- Website: ${user.website || ""}
- Portfolio: ${portfolio || "Available on request"}
- Target Markets: ${markets || "Global"}
- About: ${user.bio || "Experienced freelancer available for projects"}

Your job is to help this freelancer:
1. Score and qualify prospects
2. Write personalized outreach messages
3. Handle objections professionally
4. Generate project proposals
5. Build follow-up sequences
6. Coach them through their pipeline

Always write from their first-person perspective. Personalize everything to their specific niche and skills. Reference their portfolio and experience naturally.`;
}

export async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const content = message.content[0];
  if (content.type === "text") return content.text;
  return "";
}
