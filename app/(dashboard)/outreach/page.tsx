"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Loader2, Clock, Search, Check, Save, Wand2, RotateCcw, X } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const CHANNELS = ["Cold Email", "LinkedIn DM", "Upwork Cover Letter", "Twitter DM", "WhatsApp"];
const TONES = ["Professional", "Friendly", "Bold", "Story-driven"];

const QUICK_REFINES = [
  { label: "Shorter", instr: "Make it shorter and more concise — cut about 30% while keeping the key points." },
  { label: "Friendlier", instr: "Make the tone warmer, friendlier, and more conversational." },
  { label: "More persuasive", instr: "Make it more persuasive with a stronger, specific value proposition." },
  { label: "More formal", instr: "Make it more formal and professional." },
  { label: "Stronger CTA", instr: "End with a single clear, low-friction call to action." },
  { label: "Fix grammar", instr: "Fix grammar, spelling, and clarity without changing the meaning." },
  { label: "Add a P.S.", instr: "Add a short, compelling P.S. line at the end." },
];

interface Message { id: string; channel: string; tone: string; content: string; sent: boolean; createdAt: string; prospect?: { name: string; company: string }; }
interface Prospect { id: string; name: string; company: string; niche: string; role?: string; email?: string; scoreReason?: string; }

export default function OutreachPage() {
  const [form, setForm] = useState({ prospectName: "", company: "", role: "", need: "", channel: "Cold Email", tone: "Professional" });
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectSearch, setProspectSearch] = useState("");

  useEffect(() => {
    fetch("/api/messages").then(r => r.json()).then(setMessages).catch(() => {});
    fetch("/api/prospects").then(r => r.json()).then(setProspects).catch(() => {});
  }, []);

  function refreshMessages() { fetch("/api/messages").then(r => r.json()).then(setMessages).catch(() => {}); }

  function loadProspect(p: Prospect) {
    setForm(f => ({ ...f, prospectName: p.name, company: p.company, role: p.role || "", need: p.scoreReason || p.niche || "" }));
    setProspectId(p.id);
    setProspectSearch("");
  }
  function clearProspect() { setProspectId(null); }

  async function handleGenerate() {
    if (!form.prospectName || !form.company || !form.need) { toast.error("Fill name, company, and need"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, prospectId }) });
      const data = await res.json();
      if (res.ok) { setGenerated(data.content); toast.success("Message generated!"); refreshMessages(); }
      else toast.error(data.error || "Generation failed");
    } catch { toast.error("Network error"); }
    finally { setGenerating(false); }
  }

  async function refine(instruction: string) {
    if (!generated || !instruction.trim()) return;
    setRefining(true);
    try {
      const res = await fetch("/api/ai/refine-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: generated, instruction, channel: form.channel, tone: form.tone }) });
      const data = await res.json();
      if (res.ok) { setGenerated(data.content); }
      else toast.error(data.error || "Refine failed");
    } catch { toast.error("Network error"); }
    finally { setRefining(false); }
  }

  async function applyCustomRefine() {
    const instr = refineInstruction.trim();
    if (!instr) return;
    await refine(instr);
    setRefineInstruction("");
  }

  async function saveDraft() {
    if (!generated.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: generated, channel: form.channel, tone: form.tone, prospectId }) });
      if (res.ok) { toast.success("Saved to history"); refreshMessages(); }
      else toast.error("Failed to save");
    } finally { setSaving(false); }
  }

  const filteredProspects = prospects.filter(p => {
    const q = prospectSearch.toLowerCase();
    return q && (p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || (p.niche || "").toLowerCase().includes(q));
  });
  const words = generated.trim() ? generated.trim().split(/\s+/).length : 0;
  const busy = generating || refining;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Outreach</h1><p className="text-muted-foreground text-sm mt-0.5">Generate, refine with AI, and edit your message live</p></div>
      <Tabs defaultValue="generate">
        <TabsList><TabsTrigger value="generate">Generate</TabsTrigger><TabsTrigger value="history">History ({messages.length})</TabsTrigger></TabsList>

        <TabsContent value="generate" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — inputs */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Message Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Autofill from prospect */}
                {prospects.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <Label className="text-xs">Autofill from a prospect (optional)</Label>
                    {prospectId ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />Linked to {form.prospectName}
                        <button onClick={clearProspect} className="ml-1 text-muted-foreground hover:text-foreground inline-flex items-center"><X className="w-3 h-3" /></button>
                      </p>
                    ) : (
                      <>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={prospectSearch} onChange={e => setProspectSearch(e.target.value)} placeholder="Search prospects..." className="pl-9 h-9" />
                        </div>
                        {prospectSearch && (
                          <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-card">
                            {filteredProspects.length === 0 ? (
                              <p className="px-3 py-3 text-center text-xs text-muted-foreground">No matches</p>
                            ) : filteredProspects.slice(0, 20).map(p => (
                              <button key={p.id} type="button" onClick={() => loadProspect(p)} className="w-full text-left px-3 py-2 border-b border-border last:border-0 hover:bg-accent transition-colors">
                                <span className="block truncate text-sm font-medium">{p.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{p.company}{p.niche ? ` · ${p.niche}` : ""}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Prospect Name *</Label><Input value={form.prospectName} onChange={e => setForm(f => ({ ...f, prospectName: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="text-xs">Company *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label className="text-xs">Their Role</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-1" /></div>
                <div><Label className="text-xs">Their Need / Pain Point *</Label><Textarea value={form.need} onChange={e => setForm(f => ({ ...f, need: e.target.value }))} rows={2} className="mt-1 field-sizing-fixed max-h-28 overflow-auto" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Channel</Label>
                    <Select value={form.channel} onValueChange={v => v && setForm(f => ({ ...f, channel: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Tone</Label>
                    <Select value={form.tone} onValueChange={v => v && setForm(f => ({ ...f, tone: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={busy} className="w-full">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : generated ? <><RotateCcw className="w-4 h-4 mr-2" />Regenerate</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Message</>}
                </Button>
              </CardContent>
            </Card>

            {/* RIGHT — editable message + AI refine */}
            <div>
              {generated ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">{form.channel}</Badge>
                        <Badge variant="outline" className="text-xs">{form.tone}</Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generated); toast.success("Copied!"); }}><Copy className="w-3.5 h-3.5 mr-1" />Copy</Button>
                        <Button size="sm" onClick={saveDraft} disabled={saving}>{saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Textarea value={generated} onChange={e => setGenerated(e.target.value)} rows={14} className="text-sm leading-relaxed resize-none field-sizing-fixed" />
                      {refining && (
                        <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Refining…</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">{words} words · {generated.length} chars</p>

                    {/* AI refine */}
                    <div className="rounded-lg border border-primary/20 bg-accent/40 p-3 space-y-2.5">
                      <p className="text-xs font-medium flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-primary" />Refine with AI</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REFINES.map(q => (
                          <button key={q.label} type="button" onClick={() => refine(q.instr)} disabled={busy}
                            className={cn("px-2.5 py-1 rounded-full text-xs border border-border bg-card transition-colors", busy ? "opacity-50" : "hover:border-primary hover:text-primary")}>
                            {q.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={refineInstruction} onChange={e => setRefineInstruction(e.target.value)} placeholder="Or tell AI exactly what to change…" className="h-9" disabled={busy}
                          onKeyDown={e => { if (e.key === "Enter") applyCustomRefine(); }} />
                        <Button size="sm" className="h-9 shrink-0" onClick={applyCustomRefine} disabled={busy || !refineInstruction.trim()}>
                          {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1" />Apply</>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground py-16">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Fill in the form and click Generate.</p>
                    <p className="text-xs mt-1">Then refine it with AI or edit it directly here.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {messages.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No messages yet</CardContent></Card> :
            messages.map(msg => (
              <Card key={msg.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-1 items-center flex-wrap">
                      <Badge variant="outline" className="text-xs">{msg.channel}</Badge>
                      <Badge variant="outline" className="text-xs">{msg.tone}</Badge>
                      {msg.prospect && <span className="text-xs text-muted-foreground">{msg.prospect.name}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60"><Clock className="w-3 h-3" />{formatDate(msg.createdAt)}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setGenerated(msg.content); setForm(f => ({ ...f, channel: msg.channel, tone: msg.tone })); toast.success("Loaded into editor"); }}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
