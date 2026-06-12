import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Users, Zap, BarChart3, Mail, Search, Briefcase,
  ArrowRight, CheckCircle2, UserCircle, Target, Send,
} from "lucide-react";

const STEPS = [
  {
    icon: UserCircle,
    step: "01",
    title: "Build your profile",
    desc: "Upload your resume or describe your niche, skills, and ideal client. This is what Acquemy's AI uses to personalize everything.",
  },
  {
    icon: Target,
    step: "02",
    title: "AI finds & scores matches",
    desc: "Acquemy scans 16+ job platforms and ranks every opportunity by how well it fits you — so you only pursue the right-fit clients.",
  },
  {
    icon: Send,
    step: "03",
    title: "AI writes your outreach",
    desc: "AI drafts a personalized cold email or proposal for each prospect in your voice. Review, tweak, and send in one click.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Manage the deal to close",
    desc: "Track every conversation in a Kanban pipeline with follow-up reminders, objection help, and AI pricing guidance.",
  },
];

const FEATURES = [
  { icon: Search, title: "Right-fit lead discovery", desc: "Scans We Work Remotely, Remote OK, Reddit, Freelancer.com and 12+ more — surfacing only clients that match your niche." },
  { icon: Sparkles, title: "AI personalized to you", desc: "Every proposal and message is written specifically for your skills, experience, and the client in front of you." },
  { icon: Mail, title: "One-click outreach", desc: "AI writes a tailored cold email and Resend delivers it instantly — no copy-pasting, no blank-page paralysis." },
  { icon: BarChart3, title: "Full pipeline management", desc: "Kanban board, deal tracking, AI pipeline coaching, and weekly performance reports keep every opportunity moving." },
  { icon: Users, title: "Multi-source leads", desc: "Import from LinkedIn, Upwork RSS, your website contact form, or add manually — all feeding one unified pipeline." },
  { icon: Zap, title: "Works for any freelancer", desc: "Developer, designer, writer, marketer — Acquemy adapts its AI to your niche and your target clients." },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">Acquemy</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          <Sparkles className="w-3 h-3" />Powered by AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
          Land the right clients,<br /><span className="text-primary">not just any clients</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Acquemy is your AI co-pilot for freelance client acquisition. It finds opportunities that fit your skills, scores them, writes your outreach, and manages your pipeline — so you can focus on doing the work.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"><Button size="lg" className="px-8 rounded-xl w-full sm:w-auto">Start for free <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          <Link href="/login"><Button size="lg" variant="outline" className="px-8 rounded-xl w-full sm:w-auto">Sign in</Button></Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Free forever · No credit card required</p>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">How Acquemy lands you clients</h2>
          <p className="text-muted-foreground mt-2">From empty pipeline to signed client in four steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="relative p-6 rounded-2xl border border-border bg-card">
              <span className="text-5xl font-extrabold text-accent absolute top-4 right-5 select-none">{step}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 relative">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 relative">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to win clients</h2>
          <p className="text-muted-foreground mt-2">One workspace from discovery to closed deal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcome strip */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { stat: "16+", label: "Job platforms scanned for you, continuously" },
            { stat: "Less guesswork", label: "AI scores every lead so you chase the right ones" },
            { stat: "More replies", label: "Personalized outreach written for each client" },
          ].map((s) => (
            <div key={s.label} className="p-6 rounded-2xl bg-secondary text-center">
              <div className="text-2xl font-bold text-primary mb-1">{s.stat}</div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-primary text-primary-foreground px-8 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Stop hunting. Start closing.</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Build your profile in minutes and let your AI co-pilot bring the right clients to you.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-10 rounded-xl font-semibold">
              Get started free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-5 mt-6 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Free forever</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />No credit card</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Acquemy</span>
          </div>
          <span>© {new Date().getFullYear()} Acquemy · AI client acquisition for freelancers</span>
        </div>
      </footer>
    </div>
  );
}
