# Acquemy

**Your AI co-pilot for freelance client acquisition.**

Acquemy helps freelancers land the *right* clients — not just any clients. It continuously scans 30+ remote-job feeds, AI-scores every opportunity against your profile, writes and refines your outreach, and tracks every deal from first contact to closed-won.

> Live: [acquemy.ai](https://acquemy.ai) · Built for freelancers worldwide, with a focus on the Philippines remote-work community.

---

## ✨ Features

| Area | What it does |
|------|--------------|
| **Dashboard** | At-a-glance stats, a getting-started tour for new users, and recent activity. |
| **Prospects** | AI-scored leads with search, **score & status filters**, pagination, bulk actions, CSV import/export, and a rich edit modal (re-score, generate outreach, push to pipeline, schedule follow-up, activity timeline). |
| **Pipeline** | Drag-and-drop Kanban across stages, weighted forecast & win-rate stats, days-in-stage / stale-deal flags, and **AI "next action" coaching** per deal. |
| **Outreach** | Generate messages per channel/tone, **edit live**, and an AI-refine loop (quick actions, custom instructions, undo/version history, A/B variations, critique scoring). Auto subject-line extraction + ideas. Open prefilled drafts in **Gmail or Yahoo**. Save reusable **templates** with `{{merge}}` fields. |
| **Platforms** | A job-board directory (Philippines, global marketplaces, remote boards) with quick-launch links and per-board AI strategy tips. |
| **Automation** | One-click (and daily-cron) scanning of 30+ job feeds into Prospects. |
| **Objections / Pricing / Follow-Up / Analytics / Profile** | AI objection handling, pricing guidance, follow-up scheduling, performance analytics, and a detailed freelancer profile that personalizes all AI output. |

### The job scanner
Scans **35 live RSS feeds** in parallel across We Work Remotely, Remote OK, Working Nomads, Remotive, Jobicy, Himalayas, Jobspresso, SkipTheDrive, Authentic Jobs, WordPress Jobs, NoDesk, Freelancer.com, and Reddit — spanning **dev, design, marketing, writing, customer support, VA, finance, sales, SEO, and data**. Each new posting is parsed into a clean company/role and AI-scored against your profile. Runs on demand and via a daily cron (`vercel.json`).

---

## 🧱 Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, shadcn-style UI components on [Base UI](https://base-ui.com), Montserrat font, custom "Emerald Ink" theme (light-default, follows system)
- **Database:** PostgreSQL (Neon) via Prisma 7
- **Auth:** NextAuth (credentials + Google OAuth)
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Drag & drop:** `@hello-pangea/dnd` · **Charts:** Recharts
- **Email:** opens prefilled Gmail/Yahoo web compose (no server-side sending required)
- **Hosting:** Vercel (Git-connected auto-deploy)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- An [Anthropic API key](https://console.anthropic.com)

### 1. Install
```bash
npm install
```

### 2. Environment
Create `.env` (see `.env.example`):
```bash
DATABASE_URL="postgresql://..."        # Neon / Postgres connection string
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."                   # openssl rand -base64 32
GOOGLE_CLIENT_ID="..."                  # optional — for Google sign-in
GOOGLE_CLIENT_SECRET="..."
ANTHROPIC_API_KEY="..."                 # required for all AI features
# Optional integrations
PROXYCURL_API_KEY="..."                 # richer LinkedIn enrichment
BLOB_READ_WRITE_TOKEN="..."             # resume uploads (Vercel Blob)
```

### 3. Database
This project uses Prisma's schema-push workflow (no migrations folder):
```bash
npx prisma db push      # sync schema to the database
npx prisma generate     # regenerate the client (db push does NOT auto-run this on Prisma 7)
```

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
app/
  (auth)/            login & register
  (dashboard)/       dashboard, prospects, pipeline, outreach, platforms,
                     objections, pricing, followup, automation, analytics, profile
  api/
    ai/              score-prospect, generate-message, refine-message, deal-coach,
                     subject-lines, variations, critique, pricing, platform-tips,
                     handle-objection
    scan/job-boards  RSS job scanner (cron + on-demand)
    prospects, deals, messages, templates, followups, profile, settings, ...
components/
  ui/                shadcn-style primitives (Base UI)
  sidebar, user-menu, theme, providers, getting-started
lib/
  prisma, anthropic, auth, session, resend, utils
prisma/schema.prisma
```

### Data model (Prisma)
`User`, `Template`, `Prospect`, `Deal`, `Message`, `FollowUp`, `Objection`, `Proposal`, `Activity`, `UserSetting` + NextAuth (`Account`, `Session`, `VerificationToken`).

---

## 🤖 AI endpoints
All AI runs through `lib/anthropic.ts` (`buildSystemPrompt` injects the user's profile so every output is personalized):

- **score-prospect** — rates a lead's fit (0–100) with a reason
- **generate-message / refine-message** — write & iteratively improve outreach
- **subject-lines / variations / critique** — subject ideas, A/B variants, persuasion/spam scoring
- **deal-coach** — suggests the next best action for a pipeline deal
- **pricing / platform-tips / handle-objection** — pricing guidance, per-platform strategy, objection responses

---

## ☁️ Deployment

Hosted on **Vercel**, connected to GitHub for automatic deploys (push to `main` → production). `build` runs `prisma generate && next build`, so the client is regenerated on every deploy.

A daily cron (`vercel.json`) triggers `/api/scan/job-boards` to refresh prospects. The scan route sets `maxDuration = 60` for the parallel fan-out + AI scoring.

> **Note:** Schema changes are applied with `prisma db push` against the database directly (this project has no `prisma/migrations` folder). After any schema change, run `prisma generate` so the client picks it up.

---

## 📄 License
Private project. All rights reserved.
