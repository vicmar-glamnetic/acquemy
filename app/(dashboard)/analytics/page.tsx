import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, Mail, GitBranch } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const [prospects, deals, messages, activities] = await Promise.all([
    prisma.prospect.findMany({ where: { userId }, select: { status: true, score: true, niche: true, country: true } }),
    prisma.deal.findMany({ where: { userId }, select: { stage: true, value: true } }),
    prisma.message.findMany({ where: { userId }, select: { channel: true, sent: true } }),
    prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: { type: true, description: true, createdAt: true } }),
  ]);

  const totalPipeline = deals.reduce((s, d) => s + d.value, 0);
  const wonDeals = deals.filter(d => d.stage === "Won");
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
  const avgScore = prospects.length ? Math.round(prospects.reduce((s, p) => s + p.score, 0) / prospects.length) : 0;

  const stageBreakdown = ["Discovered","Contacted","Discovery Call","Proposal Sent","Closing","Won","Lost"].map(stage => ({
    stage, count: deals.filter(d => d.stage === stage).length
  })).filter(s => s.count > 0);

  const niches: [string, number][] = Object.entries(prospects.reduce((acc: Record<string, number>, p) => { acc[p.niche] = (acc[p.niche] || 0) + 1; return acc; }, {}))
    .map(([k, v]) => [k, v as number])
    .sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5) as [string, number][];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground text-sm mt-1">Your acquisition performance at a glance</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Prospects", value: prospects.length, icon: Users, color: "text-blue-400" },
          { label: "Pipeline Value", value: formatCurrency(totalPipeline), icon: TrendingUp, color: "text-violet-400" },
          { label: "Won Revenue", value: formatCurrency(wonValue), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Avg Lead Score", value: avgScore + "/100", icon: GitBranch, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">{label}</span><Icon className={`w-4 h-4 ${color}`} /></div>
            <p className="text-2xl font-bold">{value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            {stageBreakdown.length === 0 ? <p className="text-sm text-muted-foreground">No deals yet</p> :
              <div className="space-y-2">
                {stageBreakdown.map(({ stage, count }) => (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-32 truncate">{stage}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / deals.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Niches</CardTitle></CardHeader>
          <CardContent>
            {niches.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> :
              <div className="space-y-2">
                {niches.map(([niche, count]) => (
                  <div key={niche} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{niche}</span>
                    <span className="font-medium">{count} prospects</span>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet</p> :
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-muted-foreground text-xs leading-relaxed">{a.description}</p>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
