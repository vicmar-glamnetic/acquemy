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
import { Plus, Search, Download, Upload, Trash2, Edit2, Archive, ExternalLink, Sparkles, Loader2, Users, Send, Filter, ArchiveRestore } from "lucide-react";
import { STATUS_COLORS, formatDate } from "@/lib/utils";
import Papa from "papaparse";

interface Prospect {
  id: string; name: string; company: string; country: string; niche: string;
  role: string; email?: string; linkedinUrl?: string; notes?: string;
  score: number; scoreReason?: string; status: string; archived: boolean;
  createdAt: string;
}

const EMPTY = { name: "", company: "", country: "", niche: "", role: "", email: "", linkedinUrl: "", notes: "" };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prospect | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProspects(); }, []);

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

  function openEdit(p: Prospect) {
    setEditProspect(p);
    setForm({ name: p.name, company: p.company, country: p.country || "", niche: p.niche, role: p.role || "", email: p.email || "", linkedinUrl: p.linkedinUrl || "", notes: p.notes || "" });
    setAddOpen(true);
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

  const filtered = prospects.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !search || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.niche.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesArchive = showArchived ? p.archived : !p.archived;
    return matchesSearch && matchesStatus && matchesArchive;
  });

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
            <Button variant="outline" size="sm" onClick={() => setShowArchived(v => !v)}>
              {showArchived ? <><ArchiveRestore className="w-4 h-4 mr-1.5" />Active</> : <><Archive className="w-4 h-4 mr-1.5" />Archived</>}
            </Button>
            <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setEditProspect(null); setForm(EMPTY); } }}>
              <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Prospect</Button>} />
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="text-lg">{editProspect ? "Edit Prospect" : "Add New Prospect"}</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-medium">Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="John Smith" /></div>
                    <div><Label className="text-xs font-medium">Company <span className="text-red-500">*</span></Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="mt-1" placeholder="Acme Inc." /></div>
                    <div><Label className="text-xs font-medium">Country</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="mt-1" placeholder="USA" /></div>
                    <div><Label className="text-xs font-medium">Niche</Label><Input value={form.niche} onChange={e => setForm(p => ({ ...p, niche: e.target.value }))} className="mt-1" placeholder="eCommerce" /></div>
                    <div><Label className="text-xs font-medium">Their Role</Label><Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1" placeholder="Founder, CTO..." /></div>
                    <div><Label className="text-xs font-medium">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" placeholder="john@acme.com" /></div>
                    <div className="col-span-2"><Label className="text-xs font-medium">LinkedIn / Job URL</Label><Input value={form.linkedinUrl} onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className="mt-1" placeholder="https://linkedin.com/in/..." /></div>
                    <div className="col-span-2"><Label className="text-xs font-medium">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1" placeholder="Context, how you found them..." /></div>
                  </div>
                  {!editProspect && <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-lg"><Sparkles className="w-3 h-3 text-primary" />Claude will auto-score this prospect based on your profile</p>}
                  <Button onClick={handleSave} disabled={saving} className="w-full h-10">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{scoring ? "Scoring with AI..." : "Saving..."}</> : editProspect ? "Update Prospect" : "Add & Score Prospect"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, company, or niche..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["new","contacted","warm","cold","lost"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

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
            {filtered.map(p => (
              <Card key={p.id} className="hover:shadow-sm transition-all duration-150">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-1 shrink-0">
                      {p.role && <Badge variant="outline" className="text-xs hidden sm:flex">{p.role}</Badge>}
                      {p.email && (
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500" onClick={() => handleSendEmail(p)} />}>
                            <Send className="w-3.5 h-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Email {p.email}</TooltipContent>
                        </Tooltip>
                      )}
                      {p.linkedinUrl && (
                        <Tooltip>
                          <TooltipTrigger render={<a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500"><ExternalLink className="w-3.5 h-3.5" /></Button></a>} />
                          <TooltipContent>Open link</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} />}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:text-amber-500" onClick={() => handleArchive(p)} />}>
                          {p.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </TooltipTrigger>
                        <TooltipContent>{p.archived ? "Restore" : "Archive"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => setDeleteTarget(p)} />}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
