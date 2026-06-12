import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GitBranch, Mail, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { GettingStarted } from "@/components/getting-started";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const [prospects, deals, messages, activities] = await Promise.all([
    prisma.prospect.count({ where: { userId, archived: false } }),
    prisma.deal.findMany({ where: { userId }, select: { stage: true, value: true } }),
    prisma.message.count({ where: { userId } }),
    prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8, include: { prospect: { select: { name: true } } } }),
  ]);

  const pipelineValue = deals.reduce((s, d) => s + d.value, 0);
  const activeDeals = deals.filter(d => !["Won", "Lost"].includes(d.stage)).length;
  const isProfileIncomplete = !user?.niche || !user?.skills;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "there"}</h1>
        <p className="text-muted-foreground text-sm mt-1">Your client acquisition overview</p>
      </div>

      <GettingStarted />

      {isProfileIncomplete && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm flex-1">Complete your profile so the AI can personalize outreach for you.</p>
          <Link href="/profile" className={buttonVariants({ size: "sm", variant: "outline" })}>Complete Profile</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Prospects", value: prospects, icon: Users, color: "text-blue-400" },
          { label: "Active Deals", value: activeDeals, icon: GitBranch, color: "text-violet-400" },
          { label: "Messages Sent", value: messages, icon: Mail, color: "text-emerald-400" },
          { label: "Pipeline Value", value: formatCurrency(pipelineValue), icon: TrendingUp, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { href: "/prospects", label: "Add Prospect", icon: Users },
              { href: "/outreach", label: "Generate Message", icon: Sparkles },
              { href: "/automation", label: "Scan for Jobs", icon: TrendingUp },
              { href: "/pipeline", label: "View Pipeline", icon: GitBranch },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={buttonVariants({ variant: "outline", size: "sm", className: "justify-start gap-2" })}>
                <Icon className="w-3.5 h-3.5" />{label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet. Add your first prospect!</p>
            ) : (
              <div className="space-y-2">
                {activities.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-muted-foreground text-xs leading-relaxed">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
