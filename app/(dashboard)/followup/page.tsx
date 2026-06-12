import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function FollowUpPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const followUps = await prisma.followUp.findMany({
    where: { userId, status: "pending" },
    orderBy: { scheduledAt: "asc" },
    include: { prospect: { select: { name: true, company: true, email: true } } },
    take: 50,
  });

  const today = new Date();
  const due = followUps.filter(f => new Date(f.scheduledAt) <= today);
  const upcoming = followUps.filter(f => new Date(f.scheduledAt) > today);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Follow-Up</h1><p className="text-muted-foreground text-sm mt-1">{due.length} due today · {upcoming.length} upcoming</p></div>

      {due.length === 0 && upcoming.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-muted-foreground">No follow-ups scheduled. Generate outreach sequences from the Outreach page.</p>
        </CardContent></Card>
      ) : (
        <>
          {due.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-amber-400 flex items-center gap-2"><Bell className="w-3.5 h-3.5" />Due Today ({due.length})</h2>
              {due.map(f => (
                <Card key={f.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{f.prospect.name} — {f.prospect.company}</p>
                      <p className="text-xs text-muted-foreground">Step {f.step} · {f.channel} · {formatDate(f.scheduledAt)}</p>
                      <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{f.content}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 shrink-0">Due</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Upcoming ({upcoming.length})</h2>
              {upcoming.slice(0, 10).map(f => (
                <Card key={f.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{f.prospect.name} — {f.prospect.company}</p>
                      <p className="text-xs text-muted-foreground">Step {f.step} · {f.channel} · {formatDate(f.scheduledAt)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{formatDate(f.scheduledAt)}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
