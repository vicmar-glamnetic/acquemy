"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCircle, Globe, Users, Sparkles, GitBranch, Bell,
  X, ChevronDown, ChevronUp, Rocket, CheckCircle2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "acquemy:getting-started-dismissed";

const TOUR = [
  {
    icon: UserCircle,
    title: "1. Complete your profile",
    desc: "Add your niche, skills, and ideal client. The AI uses this to personalize every match and message.",
    href: "/profile",
    cta: "Set up profile",
  },
  {
    icon: Globe,
    title: "2. Connect platforms & scan",
    desc: "Pick the job platforms to monitor, then run a scan to pull in fresh opportunities that fit you.",
    href: "/platforms",
    cta: "Browse platforms",
  },
  {
    icon: Users,
    title: "3. Review your prospects",
    desc: "Every lead is AI-scored by fit. Focus on the high scorers and archive the ones that aren't right.",
    href: "/prospects",
    cta: "View prospects",
  },
  {
    icon: Sparkles,
    title: "4. Generate outreach",
    desc: "Let Claude draft a personalized cold email or proposal in your voice, then send it in one click.",
    href: "/outreach",
    cta: "Try outreach",
  },
  {
    icon: GitBranch,
    title: "5. Work your pipeline",
    desc: "Drag deals across stages on the Kanban board and track value from first contact to closed-won.",
    href: "/pipeline",
    cta: "Open pipeline",
  },
  {
    icon: Bell,
    title: "6. Stay on top of follow-ups",
    desc: "Acquemy reminds you when to follow up and helps handle objections so no opportunity goes cold.",
    href: "/followup",
    cta: "See follow-ups",
  },
];

export function GettingStarted() {
  const [dismissed, setDismissed] = useState(true); // hidden until we read storage (avoids flash)
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  if (dismissed) {
    return (
      <button
        onClick={() => { localStorage.removeItem(STORAGE_KEY); setDismissed(false); setOpen(true); }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Rocket className="w-4 h-4" />
        Show getting-started tour
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-accent/60 to-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Rocket className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold leading-tight">Welcome to Acquemy — here&apos;s a quick tour</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Six steps to go from empty pipeline to your first signed client.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(o => !o)} aria-label={open ? "Collapse" : "Expand"}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismiss} aria-label="Dismiss tour">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOUR.map(({ icon: Icon, title, desc, href, cta }) => (
              <div key={title} className="flex flex-col p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-medium text-sm">{title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <Link
                  href={href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 justify-center text-xs h-8")}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              You can reopen this anytime from the dashboard.
            </p>
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-xs">
              Got it, hide tour
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
