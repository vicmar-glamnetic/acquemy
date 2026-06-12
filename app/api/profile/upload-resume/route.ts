import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  const isText = !isPdf;

  let extracted: { skills?: string; experience?: string; niche?: string } | null = null;

  try {
    const prompt = `Extract key professional information from this resume. Return JSON only, no explanation:\n{"skills":"comma-separated list of technical and soft skills","experience":"1-2 sentence summary of years of experience and type of work","niche":"their main specialty in one short phrase e.g. Shopify Developer, React Developer, UI/UX Designer"}`;

    let messageContent;

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      messageContent = [
        {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
        },
        { type: "text" as const, text: prompt },
      ];
    } else {
      const text = await file.text();
      if (text.length < 50) throw new Error("File too short");
      messageContent = [{ type: "text" as const, text: `${prompt}\n\nRESUME:\n${text.slice(0, 6000)}` }];
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: "You are a resume parser. Extract key professional information and return only valid JSON.",
      messages: [{ role: "user", content: messageContent }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    extracted = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "null");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not parse resume: ${msg.slice(0, 100)}` }, { status: 422 });
  }

  if (!extracted) return NextResponse.json({ error: "AI could not extract resume data" }, { status: 422 });

  await prisma.user.update({
    where: { id: user!.id },
    data: {
      resumeUrl: file.name,
      ...(extracted.skills && { skills: extracted.skills }),
      ...(extracted.experience && { experience: extracted.experience }),
      ...(extracted.niche && { niche: extracted.niche }),
    },
  });

  return NextResponse.json({ url: file.name, extracted });
}
