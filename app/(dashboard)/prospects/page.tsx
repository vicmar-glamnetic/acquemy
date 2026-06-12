"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Search, Download, Upload, Trash2, Edit2, Archive, ExternalLink, Sparkles, Loader2,
  Users, Send, Filter, ArchiveRestore, GitBranch, Bell, Copy, Check, Clock, ChevronLeft, ChevronRight, Link2,
} from "lucide-react";
import { STATUS_COLORS, formatDate } from "@/lib/utils";
import Papa from "papaparse";

interface Prospect {
  id: string; name: string; company: string; country: string; niche: string;
  role: string; email?: string; linkedinUrl?: string; notes?: string;
  score: number; scoreReason?: string; status: string; archived: boolean;
  source?: string; createdAt: string;
}

interface Activity { id: string; type: string; description: string; createdAt: string; }

const EMPTY = { name: "", company: "", country: "", niche: "", role: "", email: "", linkedinUrl: "", notes: "" };
const PAGE_SIZE = 10;

const SCORE_FILTERS = [
  { value: "all", label: "All scores" },
  { value: "high", label: "🔥 80+ Hot" },
  { value: "mid", label: "60–79 Warm" },
  { value: "low", label: "40–59 Cool" },
  { value: "poor", label: "Below 40" },
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prospect | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [outreachResult, setOutreachResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProspects(); }, []);
  // Reset pagination & selection whenever the filtered set changes.
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, filterStatus, filterScore, showArchived]);

  async function fetchProspects() {
    setLoading(true);
    const res = await fetch("/api/prospects");
    if (res.ok) setProspects(await res.json());
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name || !form.company) { toast.error("Name and company are required"); return; }
    setSaving(true);
    try {
      let score = 0, scoreReason = "";
      if (!editProspect) {
        setScoring(true);
        const r = await fetch("/api/ai/score-prospect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (r.ok) { const d = await r.json(); score = d.score; scoreReason = d.reason; }
        setScoring(false);
      }
      const res = await fetch(editProspect ? `/api/prospects/${editProspect.id}` : "/api/prospects", {
        method: editProspect ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, score, scoreReason }),
      });
      if (res.ok) {
        toast.success(editProspect ? "Prospect updated!" : "Prospect added and scored by AI!");
        setAddOpen(false); setEditProspect(null); setForm(EMPTY); fetchProspects();
      } else toast.error("Failed to save prospect");
    } finally { setSaving(false); setScoring(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/prospects/${deleteTarget.id}`, { method: "DELETE" });
    toast.success(`${deleteTarget.name} deleted`);
    setDeleteTarget(null); setDeleting(false); fetchProspects();
  }

  async function handleArchive(p: Prospect) {
    await fetch(`/api/prospects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !p.archived }) });
    toast.success(p.archived ? "Prospect restored" : "Prospect archived");
    fetchProspects();
  }

  async function handleStatusChange(p: Prospect, status: string) {
    await fetch(`/api/prospects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchProspects();
  }

  async function handleRescore() {
    if (!editProspect) return;
    setScoring(true);
    try {
      const r = await fetch("/api/ai/score-prospect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) { toast.error("Re-scoring failed"); return; }
      const d = await r.json();
      await fetch(`/api/prospects/${editProspect.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: d.score, scoreReason: d.reason }) });
      setEditProspect({ ...editProspect, score: d.score, scoreReason: d.reason });
      toast.success(`Re-scored: ${d.score}/100`);
      fetchProspects();
    } finally { setScoring(false); }
  }

  async function handleGenerateOutreach() {
    if (!editProspect) return;
    setActionBusy("outreach"); setOutreachResult(null);
    try {
      const r = await fetch("/api/ai/generate-message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectName: form.name, company: form.company, role: form.role || "Decision maker", need: form.niche || "their project", channel: "Cold Email", tone: "Professional", prospectId: editProspect.id }),
      });
      if (!r.ok) { toast.error("Outreach generation failed"); return; }
      const d = await r.json();
      setOutreachResult(d.content);
    } finally { setActionBusy(null); }
  }

  async function handlePushPipeline() {
    if (!editProspect) return;
    setActionBusy("pipeline");
    try {
      const r = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospectId: editProspect.id, stage: "Discovered" }) });
      if (r.ok) { toast.success(`${form.name} added to pipeline`); refreshActivities(editProspect.id); }
      else toast.error("Failed to add to pipeline");
    } finally { setActionBusy(null); }
  }

  async function handleScheduleFollowup() {
    if (!editProspect) return;
    setActionBusy("followup");
    try {
      const when = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const r = await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospectId: editProspect.id, step: 1, channel: "Email", scheduledAt: when.toISOString() }) });
      if (r.ok) toast.success("Follow-up scheduled in 3 days");
      else toast.error("Failed to schedule follow-up");
    } finally { setActionBusy(null); }
  }

  function copyOutreach() {
    if (!outreachResult) return;
    navigator.clipboard.writeText(outreachResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function refreshActivities(id: string) {
    setActivitiesLoading(true);
    const r = await fetch(`/api/prospects/${id}`);
    if (r.ok) { const d = await r.json(); setActivities(d.activities || []); }
    setActivitiesLoading(false);
  }

  async function openEdit(p: Prospect) {
    setEditProspect(p);
    setForm({ name: p.name, company: p.company, country: p.country || "", niche: p.niche, role: p.role || "", email: p.email || "", linkedinUrl: p.linkedinUrl || "", notes: p.notes || "" });
    setOutreachResult(null); setActivities([]);
    setAddOpen(true);
    refreshActivities(p.id);
  }

  function handleSendEmail(p: Prospect) {
    if (!p.email) return;
    window.location.href = `mailto:${p.email}?subject=Working together&body=Hi ${p.name},%0D%0A%0D%0A`;
  }

  function handleExport() {
    const csv = Papa.unparse(prospects.map(p => ({ Name: p.name, Company: p.company, Country: p.country, Niche: p.niche, Role: p.role, Email: p.email, Score: p.score, Status: p.status })));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "prospects.csv"; a.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse(file, { header: true, complete: async (results) => {
      let count = 0;
      for (const row of results.data as Record<string, string>[]) {
        if (!row.Name && !row.name) continue;
        const r = await fetch("/api/prospects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: row.Name || row.name, company: row.Company || row.company || "", country: row.Country || row.country || "", niche: row.Niche || row.niche || "", role: row.Role || row.role || "", email: row.Email || row.email || "" }) });
        if (r.ok) count++;
      }
      toast.success(`Imported ${count} prospects`); fetchProspects();
    }});
  }

  async function handleLinkedinImport() {
    if (!importUrl.includes("linkedin.com")) { toast.error("Enter a valid LinkedIn profile URL"); return; }
    setImporting(true);
    try {
      const r = await fetch("/api/linkedin/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedinUrl: importUrl }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { toast.success(d.alreadyExists ? "Prospect already exists" : "Imported from LinkedIn!"); setImportOpen(false); setImportUrl(""); fetchProspects(); }
      else toast.error(d.error || "Import failed");
    } finally { setImporting(false); }
  }

  // ---- Bulk actions ----
  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectPage(ids: string[], allSelected: boolean) {
    setSelected(prev => {
      const n = new Set(prev);
      ids.forEach(id => allSelected ? n.delete(id) : n.add(id));
      return n;
    });
  }
  async function bulkArchive() {
    setBulkBusy(true);
    await Promise.all([...selected].map(id => fetch(`/api/prospects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !showArchived }) })));
    toast.success(`${selected.size} ${showArchived ? "restored" : "archived"}`);
    setSelected(new Set()); setBulkBusy(false); fetchProspects();
  }
  async function bulkDelete() {
    setBulkBusy(true);
    await Promise.all([...selected].map(id => fetch(`/api/prospects/${id}`, { method: "DELETE" })));
    toast.success(`${selected.size} deleted`);
    setSelected(new Set()); setBulkBusy(false); fetchProspects();
  }

  const filtered = prospects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !search || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.niche.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesArchive = showArchived ? p.archived : !p.archived;
    const matchesScore =
      filterScore === "all" ||
      (filterScore === "high" && p.score >= 80) ||
      (filterScore === "mid" && p.score >= 60 && p.score < 80) ||
      (filterScore === "low" && p.score >= 40 && p.score < 60) ||
      (filterScore === "poor" && p.score < 40);
    return matchesSearch && matchesStatus && matchesArchive && matchesScore;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds = paged.map(p => p.id);
  const allPageSelected = paged.length > 0 && pageIds.every(id => selected.has(id));
  const windowStart = Math.max(1, safePage - 2);
  const windowEnd = Math.min(totalPages, safePage + 2);
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  function scoreColor(s: number) { return s >= 80 ? "text-emerald-500" : s >= 60 ? "text-blue-500" : s >= 40 ? "text-amber-500" : "text-red-500"; }
  function scoreBg(s: number) { return s >= 80 ? "bg-emerald-500/10" : s >= 60 ? "bg-blue-500/10" : s >= 40 ? "bg-amber-500/10" : "bg-red-500/10"; }

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} {showArchived ? "archived" : "active"} · AI-scored leads</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" onClick={handleExport} />}><Download className="w-4 h-4" /></TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} />}><Upload className="w-4 h-4" /></TooltipTrigger>
              <TooltipContent>Import CSV</TooltipContent>
            </Tooltip>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Link2 className="w-4 h-4 mr-1.5" />Import LinkedIn</Button>
            <Button variant="outline" size="sm" onClick={() => setShowArchived(v => !v)}>
              {showArchived ? <><ArchiveRestore className="w-4 h-4 mr-1.5" />Active</> : <><Archive className="w-4 h-4 mr-1.5" />Archived</>}
            </Button>
            <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setEditProspect(null); setForm(EMPTY); setOutreachResult(null); setActivities([]); } }}>
              <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Prospect</Button>} />
              <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-lg">{editProspect ? "Edit Prospect" : "Add New Prospect"}</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-medium">Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="John Smith" /></div>
                    <div><Label className="text-xs font-medium">Company <span className="text-red-500">*</span></Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="mt-1" placeholder="Acme Inc." /></div>
                    <div><Label className="text-xs font-medium">Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="mt-1" placeholder="USA" /></div>
                    <div><Label className="text-xs font-medium">Niche</Label><Input value={form.niche} onChange={e => setForm(p => ({ ...p, niche: e.target.value }))} className="mt-1" placeholder="eCommerce" /></div>
                    <div><Label className="text-xs font-medium">Their Role</Label><Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1" placeholder="Founder, CTO..." /></div>
                    <div><Label className="text-xs font-medium">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" placeholder="john@acme.com" /></div>
                    <div className="col-span-2">
                      <Label className="text-xs font-medium">LinkedIn / Job URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={form.linkedinUrl} onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className="flex-1" placeholder="https://linkedin.com/in/..." />
                        {form.linkedinUrl && (
                          <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <Button type="button" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                              <ExternalLink className="w-4 h-4" />View
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2"><Label className="text-xs font-medium">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="mt-1 max-h-36 overflow-y-auto" placeholder="Context, how you found them..." /></div>
                  </div>

                  {editProspect ? (
                    <>
                      <div className="flex items-center justify-between gap-3 bg-muted/50 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-base font-bold leading-none ${scoreColor(editProspect.score)}`}>{editProspect.score}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-tight">AI fit score</p>
                            {editProspect.scoreReason && <p className="text-[10px] text-muted-foreground truncate">{editProspect.scoreReason}</p>}
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleRescore} disabled={scoring} className="shrink-0">
                          {scoring ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />}Re-score
                        </Button>
                      </div>

                      {/* Per-prospect actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateOutreach} disabled={actionBusy !== null}>
                          {actionBusy === "outreach" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />}Outreach
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handlePushPipeline} disabled={actionBusy !== null}>
                          {actionBusy === "pipeline" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5 mr-1.5 text-violet-500" />}Pipeline
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleScheduleFollowup} disabled={actionBusy !== null}>
                          {actionBusy === "followup" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-500" />}Follow-up
                        </Button>
                      </div>

                      {outreachResult && (
                        <div className="rounded-lg border border-border bg-muted/40 p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary" />Generated outreach</span>
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={copyOutreach}>
                              {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
                            </Button>
                          </div>
                          <p className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">{outreachResult}</p>
                        </div>
                      )}

                      {/* Activity timeline */}
                      <div>
                        <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />Activity</p>
                        {activitiesLoading ? (
                          <p className="text-xs text-muted-foreground">Loading…</p>
                        ) : activities.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No activity yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {activities.map(a => (
                              <div key={a.id} className="flex gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <p className="text-muted-foreground leading-relaxed">{a.description} <span className="text-muted-foreground/50">· {formatDate(a.createdAt)}</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-lg"><Sparkles className="w-3 h-3 text-primary" />Claude will auto-score this prospect based on your profile</p>
                  )}

                  <Button onClick={handleSave} disabled={saving} className="w-full h-10">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{scoring ? "Scoring with AI..." : "Saving..."}</> : editProspect ? "Update Prospect" : "Add & Score Prospect"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, company, or niche..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterScore} onValueChange={v => setFilterScore(v ?? "all")}>
            <SelectTrigger className="w-40"><Sparkles className="w-3 h-3 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCORE_FILTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["new","contacted","warm","cold","lost"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk action bar */}
        {!loading && paged.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer px-1 select-none">
              <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "var(--primary)" }} checked={allPageSelected} onChange={() => toggleSelectPage(pageIds, allPageSelected)} />
              {selected.size > 0 ? `${selected.size} selected` : "Select page"}
            </label>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={bulkArchive} disabled={bulkBusy}>
                  {showArchived ? <ArchiveRestore className="w-3.5 h-3.5 mr-1.5" /> : <Archive className="w-3.5 h-3.5 mr-1.5" />}{showArchived ? "Restore" : "Archive"}
                </Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30" onClick={bulkDelete} disabled={bulkBusy}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            )}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{search ? "No prospects found" : showArchived ? "No archived prospects" : "No prospects yet"}</h3>
              <p className="text-sm text-muted-foreground mb-4">{search ? "Try a different search term" : "Add your first prospect or scan job boards to get started"}</p>
              {!search && !showArchived && <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Add Your First Prospect</Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paged.map(p => (
              <Card key={p.id} className={`hover:shadow-sm transition-all duration-150 ${selected.has(p.id) ? "ring-2 ring-primary/40" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded shrink-0 cursor-pointer" style={{ accentColor: "var(--primary)" }} checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${scoreBg(p.score)}`}>
                      <span className={`text-lg font-bold leading-none ${scoreColor(p.score)}`}>{p.score}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">score</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <Select value={p.status} onValueChange={v => v && handleStatusChange(p, v)}>
                          <SelectTrigger className={`h-5 text-[10px] px-2 border-0 w-auto gap-1 rounded-full ${STATUS_COLORS[p.status] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["new","contacted","warm","cold","lost"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{p.company}{p.country ? ` · ${p.country}` : ""}{p.niche ? ` · ${p.niche}` : ""}</p>
                      {p.scoreReason && <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{p.scoreReason}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.role && <Badge variant="outline" className="text-xs hidden lg:flex">{p.role}</Badge>}
                      {p.linkedinUrl && (
                        <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">View link</span>
                          </Button>
                        </a>
                      )}
                      {p.email && (
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="outline" size="icon" className="h-8 w-8 hover:text-blue-500 hover:border-blue-500/40" onClick={() => handleSendEmail(p)} />}>
                            <Send className="w-3.5 h-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Email {p.email}</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon" className="h-8 w-8 hover:text-foreground hover:border-foreground/30" onClick={() => openEdit(p)} />}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon" className="h-8 w-8 hover:text-amber-500 hover:border-amber-500/40" onClick={() => handleArchive(p)} />}>
                          {p.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </TooltipTrigger>
                        <TooltipContent>{p.archived ? "Restore" : "Archive"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon" className="h-8 w-8 hover:text-red-500 hover:border-red-500/40" onClick={() => setDeleteTarget(p)} />}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 flex-wrap gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  {windowStart > 1 && (
                    <>
                      <Button variant={safePage === 1 ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(1)}>1</Button>
                      {windowStart > 2 && <span className="px-1 text-muted-foreground">…</span>}
                    </>
                  )}
                  {pageNumbers.map(n => (
                    <Button key={n} variant={n === safePage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(n)}>{n}</Button>
                  ))}
                  {windowEnd < totalPages && (
                    <>
                      {windowEnd < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
                      <Button variant={safePage === totalPages ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(totalPages)}>{totalPages}</Button>
                    </>
                  )}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import from LinkedIn dialog */}
        <Dialog open={importOpen} onOpenChange={v => { setImportOpen(v); if (!v) setImportUrl(""); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Import from LinkedIn</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Paste a LinkedIn profile URL and AI will create a prospect from it.</p>
            <Input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="mt-1" onKeyDown={e => e.key === "Enter" && handleLinkedinImport()} />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleLinkedinImport} disabled={importing}>
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</> : <><Link2 className="w-4 h-4 mr-2" />Import</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Prospect</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from {deleteTarget?.company}? This cannot be undone.
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
