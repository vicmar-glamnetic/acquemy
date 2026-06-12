"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, ExternalLink, CheckCircle2 } from "lucide-react";

interface Board { name: string; url: string; region: "PH" | "Global" | "Remote"; desc: string; scanned?: boolean; }

const BOARDS: Board[] = [
  // Philippines
  { name: "OnlineJobs.ph", url: "https://www.onlinejobs.ph/", region: "PH", desc: "The largest PH remote-work marketplace — employers post long-term & part-time roles." },
  { name: "VirtualStaff.ph", url: "https://www.virtualstaff.ph/", region: "PH", desc: "Filipino virtual staff & VA roles, full and part-time." },
  { name: "eVirtualAssistants", url: "https://www.evirtualassistants.com/", region: "PH", desc: "VA-focused job board for Filipino freelancers." },
  { name: "Remote Workmate", url: "https://remoteworkmate.com/", region: "PH", desc: "Curated remote roles for Filipino professionals." },
  { name: "Kalibrr", url: "https://www.kalibrr.com/", region: "PH", desc: "Popular PH/SEA platform — filter for remote & contract." },
  { name: "JobStreet PH", url: "https://www.jobstreet.com.ph/", region: "PH", desc: "Large PH job board — search remote/freelance roles." },
  { name: "FreeUp", url: "https://freeup.net/", region: "PH", desc: "Vetted freelancer marketplace, strong with VAs & ecommerce." },
  // Global marketplaces
  { name: "Upwork", url: "https://www.upwork.com/", region: "Global", desc: "Largest freelance marketplace — send proposals to clients." },
  { name: "Fiverr", url: "https://www.fiverr.com/", region: "Global", desc: "Productized gigs — buyers come to you." },
  { name: "Freelancer.com", url: "https://www.freelancer.com/", region: "Global", desc: "Bidding marketplace across every niche." },
  { name: "Contra", url: "https://contra.com/", region: "Global", desc: "Commission-free freelance platform." },
  { name: "PeoplePerHour", url: "https://www.peopleperhour.com/", region: "Global", desc: "UK/EU-leaning freelance marketplace." },
  { name: "Toptal", url: "https://www.toptal.com/", region: "Global", desc: "Top-tier vetted network for senior talent." },
  // Remote boards (auto-scanned)
  { name: "We Work Remotely", url: "https://weworkremotely.com/", region: "Remote", desc: "High-quality remote roles across categories.", scanned: true },
  { name: "Remote OK", url: "https://remoteok.com/", region: "Remote", desc: "Big remote board, many niches.", scanned: true },
  { name: "Working Nomads", url: "https://www.workingnomads.com/", region: "Remote", desc: "Curated remote jobs by category.", scanned: true },
  { name: "Himalayas", url: "https://himalayas.app/", region: "Remote", desc: "Modern remote job board.", scanned: true },
  { name: "Jobicy", url: "https://jobicy.com/", region: "Remote", desc: "Remote jobs across fields.", scanned: true },
];

const GROUPS: { label: string; region: Board["region"]; hint: string }[] = [
  { label: "🇵🇭 Philippines job boards", region: "PH", hint: "Browse & apply directly — add promising leads as prospects." },
  { label: "Global freelance marketplaces", region: "Global", hint: "Pitch clients with AI-written proposals." },
  { label: "Remote job boards", region: "Remote", hint: "Acquemy auto-scans these into your Prospects." },
];

const REGION_BADGE: Record<Board["region"], string> = {
  PH: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Global: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Remote: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function PlatformsPage() {
  const [tipsFor, setTipsFor] = useState<string | null>(null);
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(false);

  async function getTips(platform: string) {
    setTipsFor(platform); setTips(""); setLoading(true);
    try {
      const res = await fetch("/api/ai/platform-tips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
      const data = await res.json();
      if (res.ok) setTips(data.tips); else toast.error(data.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platforms</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Where to find clients — open a board, or get AI strategy tips for it</p>
      </div>

      {GROUPS.map(group => (
        <div key={group.region} className="space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base font-semibold">{group.label}</h2>
            <span className="text-xs text-muted-foreground">{group.hint}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BOARDS.filter(b => b.region === group.region).map(b => (
              <Card key={b.name} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm">{b.name}</span>
                    <Badge className={`text-[10px] border-0 ${REGION_BADGE[b.region]}`}>{b.region === "Remote" ? "Remote" : b.region === "PH" ? "PH" : "Global"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{b.desc}</p>
                  {b.scanned && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Auto-scanned into Prospects</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open</Button>
                    </a>
                    <Button size="sm" className="flex-1" onClick={() => getTips(b.name)}><Sparkles className="w-3.5 h-3.5 mr-1.5" />AI tips</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* AI tips dialog */}
      <Dialog open={!!tipsFor} onOpenChange={v => !v && setTipsFor(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg">{tipsFor} — AI strategy</DialogTitle>
              {tips && <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(tips); toast.success("Copied!"); }}><Copy className="w-3.5 h-3.5 mr-1" />Copy</Button>}
            </div>
          </DialogHeader>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Getting tips tailored to your profile…</div>
          ) : (
            <Textarea value={tips} onChange={e => setTips(e.target.value)} rows={16} className="text-sm field-sizing-fixed" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
