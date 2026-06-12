"use client";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIPELINE_STAGES, formatCurrency, cn } from "@/lib/utils";
import {
  GitBranch, Plus, Loader2, Sparkles, Trash2, Clock, AlertTriangle,
  TrendingUp, DollarSign, Trophy, Target, Lightbulb, Search, Check,
} from "lucide-react";

interface Prospect { id: string; name: string; company: string; niche: string; role?: string; email?: string; }
interface Deal {
  id: string; prospectId: string; stage: string; value: number; currency: string;
  notes?: string; aiNextAction?: string; stageEnteredAt: string; createdAt: string; prospect: Prospect;
}

const STAGE_PROB: Record<string, number> = {
  "Discovered": 0.1, "Contacted": 0.2, "Discovery Call": 0.4,
  "Proposal Sent": 0.6, "Closing": 0.8, "Won": 1, "Lost": 0,
};
const STAGE_ACCENT: Record<string, string> = {
  "Discovered": "bg-slate-400", "Contacted": "bg-blue-400", "Discovery Call": "bg-violet-400",
  "Proposal Sent": "bg-amber-400", "Closing": "bg-orange-400", "Won": "bg-emerald-500", "Lost": "bg-red-400",
};
const TERMINAL = ["Won", "Lost"];

function daysInStage(d: Deal) { return Math.floor((Date.now() - new Date(d.stageEnteredAt).getTime()) / 86400000); }
function isStale(d: Deal) { return !TERMINAL.includes(d.stage) && daysInStage(d) >= 7; }

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editForm, setEditForm] = useState({ value: "", notes: "", stage: "Discovered" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coaching, setCoaching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ prospectId: "", value: "", stage: "Discovered" });
  const [prospectSearch, setProspectSearch] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [dRes, pRes] = await Promise.all([fetch("/api/deals"), fetch("/api/prospects")]);
    if (dRes.ok) setDeals(await dRes.json());
    if (pRes.ok) setProspects(await pRes.json());
    setLoading(false);
  }
  async function fetchDeals() {
    const r = await fetch("/api/deals");
    if (r.ok) setDeals(await r.json());
  }

  async function moveDeal(dealId: string, newStage: string) {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, stageEnteredAt: new Date().toISOString() } : d));
    const r = await fetch(`/api/deals/${dealId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: newStage }) });
    if (!r.ok) { toast.error("Failed to move deal"); fetchDeals(); }
    else if (newStage === "Won") toast.success("🎉 Deal won!");
    else if (newStage === "Lost") toast("Deal marked as lost");
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    moveDeal(draggableId, destination.droppableId);
  }

  function openDeal(d: Deal) {
    setSelectedDeal(d);
    setEditForm({ value: d.value ? String(d.value) : "", notes: d.notes || "", stage: d.stage });
  }

  async function saveDeal() {
    if (!selectedDeal) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/deals/${selectedDeal.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: Number(editForm.value) || 0, notes: editForm.notes, stage: editForm.stage }),
      });
      if (r.ok) { toast.success("Deal updated"); setSelectedDeal(null); fetchDeals(); }
      else toast.error("Failed to update deal");
    } finally { setSaving(false); }
  }

  async function deleteDeal() {
    if (!selectedDeal) return;
    setDeleting(true);
    await fetch(`/api/deals/${selectedDeal.id}`, { method: "DELETE" });
    toast.success("Deal removed from pipeline");
    setDeleting(false); setSelectedDeal(null); fetchDeals();
  }

  async function getCoach() {
    if (!selectedDeal) return;
    setCoaching(true);
    try {
      const r = await fetch("/api/ai/deal-coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dealId: selectedDeal.id }) });
      if (!r.ok) { toast.error("AI suggestion failed"); return; }
      const d = await r.json();
      setSelectedDeal(prev => prev ? { ...prev, aiNextAction: d.aiNextAction } : prev);
      setDeals(prev => prev.map(x => x.id === selectedDeal.id ? { ...x, aiNextAction: d.aiNextAction } : x));
    } finally { setCoaching(false); }
  }

  async function addDeal() {
    if (!addForm.prospectId) { toast.error("Pick a prospect"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospectId: addForm.prospectId, stage: addForm.stage, value: Number(addForm.value) || 0 }) });
      if (r.ok) { toast.success("Deal added to pipeline"); setAddOpen(false); setAddForm({ prospectId: "", value: "", stage: "Discovered" }); fetchDeals(); }
      else toast.error("Failed to add deal");
    } finally { setSaving(false); }
  }

  // ---- Derived stats ----
  const activeDeals = deals.filter(d => !TERMINAL.includes(d.stage));
  const openValue = activeDeals.reduce((s, d) => s + d.value, 0);
  const weighted = activeDeals.reduce((s, d) => s + d.value * (STAGE_PROB[d.stage] ?? 0), 0);
  const wonDeals = deals.filter(d => d.stage === "Won");
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
  const lostCount = deals.filter(d => d.stage === "Lost").length;
  const winRate = wonDeals.length + lostCount > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostCount)) * 100) : 0;
  const prospectsWithoutDeal = prospects.filter(p => !deals.some(d => d.prospectId === p.id));
  const filteredProspects = prospectsWithoutDeal.filter(p => {
    const q = prospectSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || (p.niche || "").toLowerCase().includes(q);
  });

  const stats = [
    { label: "Open pipeline", value: formatCurrency(openValue), sub: `${activeDeals.length} active deals`, icon: DollarSign, color: "text-blue-500" },
    { label: "Weighted forecast", value: formatCurrency(Math.round(weighted)), sub: "by stage probability", icon: TrendingUp, color: "text-violet-500" },
    { label: "Won", value: formatCurrency(wonValue), sub: `${wonDeals.length} deals`, icon: Trophy, color: "text-emerald-500" },
    { label: "Win rate", value: `${winRate}%`, sub: `${wonDeals.length}W · ${lostCount}L`, icon: Target, color: "text-amber-500" },
  ];

  const selectedDays = selectedDeal ? daysInStage(selectedDeal) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Drag deals across stages · AI-coached</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Add Deal</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1,2,3,4,5].map(i => <div key={i} className="min-w-65 h-64 rounded-xl bg-muted/40 animate-pulse" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><GitBranch className="w-6 h-6 text-muted-foreground" /></div>
          <h3 className="font-semibold mb-1">No deals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add a prospect to your pipeline to start tracking deals.</p>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Add Your First Deal</Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const total = stageDeals.reduce((s, d) => s + d.value, 0);
              return (
                <div key={stage} className="min-w-65 w-65 shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STAGE_ACCENT[stage]}`} />
                      <span className="text-xs font-semibold">{stage}</span>
                      <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
                    </div>
                    {total > 0 && <span className="text-[11px] text-muted-foreground">{formatCurrency(total)}</span>}
                  </div>
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={`space-y-2 rounded-xl p-2 min-h-32 transition-colors ${snapshot.isDraggingOver ? "bg-accent/60" : "bg-muted/30"}`}>
                        {stageDeals.map((deal, idx) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={idx}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                onClick={() => openDeal(deal)}
                                className={`rounded-lg border bg-card p-3 cursor-pointer hover:border-primary/40 transition-all ${snap.isDragging ? "shadow-lg ring-2 ring-primary/30" : "border-border"}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium leading-tight">{deal.prospect.name}</p>
                                  {deal.aiNextAction && <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.prospect.company}</p>
                                <div className="flex items-center justify-between mt-2">
                                  {deal.value > 0 ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(deal.value)}</span> : <span className="text-xs text-muted-foreground">No value</span>}
                                  {!TERMINAL.includes(deal.stage) && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] ${isStale(deal) ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                                      {isStale(deal) ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{daysInStage(deal)}d
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-6 text-[11px] text-muted-foreground/60">Drop here</div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Deal detail modal */}
      <Dialog open={!!selectedDeal} onOpenChange={v => !v && setSelectedDeal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedDeal && (
            <>
              <DialogHeader><DialogTitle className="text-lg">{selectedDeal.prospect.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {selectedDeal.prospect.company}{selectedDeal.prospect.role ? ` · ${selectedDeal.prospect.role}` : ""}
                  {!TERMINAL.includes(selectedDeal.stage) && (
                    <span className={`ml-auto inline-flex items-center gap-1 text-xs ${isStale(selectedDeal) ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                      {isStale(selectedDeal) ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}{selectedDays}d in stage
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Stage</Label>
                    <Select value={editForm.stage} onValueChange={v => v && setEditForm(f => ({ ...f, stage: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Deal value</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input type="number" min="0" value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} placeholder="0" className="pl-7" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Notes</Label>
                  <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1 max-h-36 field-sizing-fixed overflow-auto" placeholder="Deal context, next steps, blockers..." />
                </div>

                {/* AI Next Action */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" />AI next action</span>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={getCoach} disabled={coaching}>
                      {coaching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1 text-primary" />}{selectedDeal.aiNextAction ? "Refresh" : "Suggest"}
                    </Button>
                  </div>
                  {selectedDeal.aiNextAction
                    ? <p className="text-xs leading-relaxed">{selectedDeal.aiNextAction}</p>
                    : <p className="text-xs text-muted-foreground">Let AI suggest the best next move for this deal.</p>}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 shrink-0" onClick={deleteDeal} disabled={deleting}>
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                  <Button className="flex-1" onClick={saveDeal} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save changes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add deal modal */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setAddForm({ prospectId: "", value: "", stage: "Discovered" }); setProspectSearch(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Deal to Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs font-medium">Prospect</Label>
              {prospectsWithoutDeal.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1.5">All your prospects are already in the pipeline. Add prospects first.</p>
              ) : (
                <>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={prospectSearch} onChange={e => setProspectSearch(e.target.value)} placeholder="Search by name, company, or niche..." className="pl-9" />
                  </div>
                  <div className="mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border">
                    {filteredProspects.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matching prospects</p>
                    ) : filteredProspects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAddForm(f => ({ ...f, prospectId: p.id }))}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center justify-between gap-2 border-b border-border last:border-0 transition-colors",
                          addForm.prospectId === p.id ? "bg-primary/10" : "hover:bg-accent"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.company}{p.niche ? ` · ${p.niche}` : ""}</span>
                        </span>
                        {addForm.prospectId === p.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Stage</Label>
                <Select value={addForm.stage} onValueChange={v => v && setAddForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Value</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" min="0" value={addForm.value} onChange={e => setAddForm(f => ({ ...f, value: e.target.value }))} placeholder="0" className="pl-7" />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={addDeal} disabled={saving || prospectsWithoutDeal.length === 0}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : "Add Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
