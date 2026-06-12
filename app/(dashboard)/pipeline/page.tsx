import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PIPELINE_STAGES, formatCurrency } from "@/lib/utils";
import { GitBranch } from "lucide-react";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const deals = await prisma.deal.findMany({
    where: { userId },
    include: { prospect: { select: { name: true, company: true, niche: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Pipeline</h1><p className="text-muted-foreground text-sm mt-1">Your deals by stage</p></div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const total = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div key={stage} className="min-w-[200px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
              </div>
              {total > 0 && <p className="text-xs text-emerald-400">{formatCurrency(total)}</p>}
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <Card key={deal.id} className="cursor-pointer hover:bg-accent/30 transition-colors">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{deal.prospect.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{deal.prospect.company}</p>
                      {deal.value > 0 && <p className="text-xs text-emerald-400 mt-1">{formatCurrency(deal.value)}</p>}
                    </CardContent>
                  </Card>
                ))}
                {stageDeals.length === 0 && <div className="border border-dashed border-border rounded-lg p-4 text-center"><GitBranch className="w-4 h-4 text-muted-foreground mx-auto mb-1" /><p className="text-xs text-muted-foreground">Empty</p></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
