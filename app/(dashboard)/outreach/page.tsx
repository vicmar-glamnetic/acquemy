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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkles, Copy, Loader2, Clock, Search, Check, Save, Wand2, RotateCcw, X,
  Undo2, Mail, FileText, Trash2, Shuffle, Gauge, Type,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const CHANNELS = ["Cold Email", "LinkedIn DM", "Upwork Cover Letter", "Twitter DM", "WhatsApp"];
const TONES = ["Professional", "Friendly", "Bold", "Story-driven"];
const CHANNEL_LIMITS: Record<string, number> = { "Twitter DM": 280, "LinkedIn DM": 1300, "WhatsApp": 1000 };

const QUICK_REFINES = [
  { label: "Shorter", instr: "Make it shorter and more concise — cut about 30% while keeping the key points." },
  { label: "Friendlier", instr: "Make the tone warmer, friendlier, and more conversational." },
  { label: "More persuasive", instr: "Make it more persuasive with a stronger, specific value proposition." },
  { label: "More formal", instr: "Make it more formal and professional." },
  { label: "Stronger CTA", instr: "End with a single clear, low-friction call to action." },
  { label: "Fix grammar", instr: "Fix grammar, spelling, and clarity without changing the meaning." },
];

interface Message { id: string; channel: string; tone: string; content: string; sent: boolean; createdAt: string; prospect?: { name: string; company: string }; }
interface Prospect { id: string; name: string; company: string; niche: string; role?: string; email?: string; scoreReason?: string; }
interface Template { id: string; name: string; channel: string; subject?: string; content: string; createdAt: string; }
interface Critique { persuasiveness: number; clarity: number; spamRisk: number; suggestions: string[]; }

function splitSubject(text: string): { subject: string; body: string } {
  const lines = text.split("\n");
  // Match "Subject:", "**Subject:**", "Subject :" etc.
  const idx = lines.findIndex(l => /^\s*\*{0,2}\s*subject\s*\*{0,2}\s*:/i.test(l));
  if (idx === -1) return { subject: "", body: text.trim() };
  const subject = lines[idx].replace(/^\s*\*{0,2}\s*subject\s*\*{0,2}\s*:\s*/i, "").replace(/\*\*/g, "").trim();
  const body = lines.filter((_, i) => i !== idx).join("\n").trim();
  return { subject, body };
}

export default function OutreachPage() {
  const [tab, setTab] = useState("generate");
  const [form, setForm] = useState({ prospectName: "", company: "", role: "", need: "", channel: "Cold Email", tone: "Professional" });
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [prospectEmail, setProspectEmail] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [history, setHistory] = useState<{ subject: string; body: string }[]>([]);

  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [variations, setVariations] = useState<string[] | null>(null);
  const [varBusy, setVarBusy] = useState(false);
  const [critique, setCritique] = useState<Critique | null>(null);
  const [critBusy, setCritBusy] = useState(false);
  const [subjectIdeas, setSubjectIdeas] = useState<string[] | null>(null);
  const [subjBusy, setSubjBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectSearch, setProspectSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");

  useEffect(() => {
    fetch("/api/messages").then(r => r.json()).then(setMessages).catch(() => {});
    fetch("/api/prospects").then(r => r.json()).then(setProspects).catch(() => {});
    fetch("/api/templates").then(r => r.json()).then(setTemplates).catch(() => {});
  }, []);

  function refreshMessages() { fetch("/api/messages").then(r => r.json()).then(setMessages).catch(() => {}); }
  function refreshTemplates() { fetch("/api/templates").then(r => r.json()).then(setTemplates).catch(() => {}); }
  function snapshot() { if (subject.trim() || body.trim()) setHistory(h => [...h, { subject, body }]); }
  function undo() {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setSubject(prev.subject); setBody(prev.body);
      return h.slice(0, -1);
    });
  }

  const isEmail = form.channel === "Cold Email";
  const limit = CHANNEL_LIMITS[form.channel] || 0;
  const overLimit = limit > 0 && body.length > limit;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const busy = generating || refining || varBusy;

  function loadProspect(p: Prospect) {
    setForm(f => ({ ...f, prospectName: p.name, company: p.company, role: p.role || "", need: p.scoreReason || p.niche || "" }));
    setProspectId(p.id); setProspectEmail(p.email || ""); setProspectSearch("");
  }
  function clearProspect() { setProspectId(null); setProspectEmail(""); }

  async function handleGenerate() {
    if (!form.prospectName || !form.company || !form.need) { toast.error("Fill name, company, and need"); return; }
    snapshot();
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, prospectId }) });
      const data = await res.json();
      if (res.ok) {
        const { subject: s, body: b } = isEmail ? splitSubject(data.content) : { subject: "", body: data.content.trim() };
        setSubject(s); setBody(b); setEditorOpen(true);
        setVariations(null); setCritique(null); setSubjectIdeas(null);
        toast.success("Message generated!"); refreshMessages();
        if (isEmail && b.trim()) getSubjectIdeas(b); // auto-suggest better subject lines
      } else toast.error(data.error || "Generation failed");
    } catch { toast.error("Network error"); }
    finally { setGenerating(false); }
  }

  async function refine(instruction: string) {
    if (!body.trim() || !instruction.trim()) return;
    snapshot();
    setRefining(true);
    try {
      const res = await fetch("/api/ai/refine-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: body, instruction, channel: form.channel, tone: form.tone }) });
      const data = await res.json();
      if (res.ok) setBody(data.content);
      else toast.error(data.error || "Refine failed");
    } catch { toast.error("Network error"); }
    finally { setRefining(false); }
  }
  async function applyCustomRefine() {
    const instr = refineInstruction.trim();
    if (!instr) return;
    await refine(instr); setRefineInstruction("");
  }
  function improveDraft() { refine("Polish and improve this draft: tighten the wording, improve flow and persuasiveness, and fix grammar. Keep my intent and key points."); }

  async function getVariations() {
    if (!form.prospectName || !form.company) { toast.error("Fill name and company first"); return; }
    setVarBusy(true);
    try {
      const res = await fetch("/api/ai/variations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) setVariations(data.variations);
      else toast.error(data.error || "Failed");
    } finally { setVarBusy(false); }
  }
  function useVariation(v: string) {
    snapshot();
    const { subject: s, body: b } = isEmail ? splitSubject(v) : { subject: "", body: v.trim() };
    setSubject(s); setBody(b); setEditorOpen(true); setVariations(null);
    toast.success("Variation loaded");
  }

  async function runCritique() {
    if (!body.trim()) return;
    setCritBusy(true);
    try {
      const res = await fetch("/api/ai/critique", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: body, channel: form.channel }) });
      const data = await res.json();
      if (res.ok) setCritique(data);
      else toast.error(data.error || "Failed");
    } finally { setCritBusy(false); }
  }

  async function getSubjectIdeas(bodyText = body) {
    if (!bodyText.trim()) return;
    setSubjBusy(true);
    try {
      const res = await fetch("/api/ai/subject-lines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: bodyText, company: form.company }) });
      const data = await res.json();
      if (res.ok) setSubjectIdeas(data.subjects);
      else toast.error(data.error || "Failed");
    } finally { setSubjBusy(false); }
  }

  function copyAll() {
    const text = subject ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(text); toast.success("Copied!");
  }
  function openCompose(provider: "gmail" | "yahoo") {
    const to = encodeURIComponent(prospectEmail || "");
    const su = encodeURIComponent(subject || "");
    const bd = encodeURIComponent(body);
    const url = provider === "gmail"
      ? `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`
      : `https://compose.mail.yahoo.com/?to=${to}&subject=${su}&body=${bd}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function saveDraft() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const content = subject ? `Subject: ${subject}\n\n${body}` : body;
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, channel: form.channel, tone: form.tone, prospectId }) });
      if (res.ok) { toast.success("Saved to history"); refreshMessages(); }
      else toast.error("Failed to save");
    } finally { setSaving(false); }
  }

  async function saveTemplate() {
    if (!tplName.trim() || !body.trim()) { toast.error("Name and message required"); return; }
    const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: tplName, channel: form.channel, subject, content: body }) });
    if (res.ok) { toast.success("Template saved"); setSaveTplOpen(false); setTplName(""); refreshTemplates(); }
    else toast.error("Failed to save template");
  }
  function useTemplate(t: Template) {
    const fill = (s: string) => s
      .replace(/\{\{\s*name\s*\}\}/gi, form.prospectName || "{{name}}")
      .replace(/\{\{\s*company\s*\}\}/gi, form.company || "{{company}}")
      .replace(/\{\{\s*role\s*\}\}/gi, form.role || "{{role}}");
    snapshot();
    setSubject(t.subject ? fill(t.subject) : "");
    setBody(fill(t.content));
    setForm(f => ({ ...f, channel: t.channel }));
    setEditorOpen(true); setTab("generate");
    toast.success("Template loaded — merge fields filled from the form");
  }
  async function deleteTemplate(id: string) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    toast.success("Template deleted"); refreshTemplates();
  }

  const filteredProspects = prospects.filter(p => {
    const q = prospectSearch.toLowerCase();
    return q && (p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || (p.niche || "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Outreach</h1><p className="text-muted-foreground text-sm mt-0.5">Generate, refine with AI, edit live, and open in your email app</p></div>
      <Tabs value={tab} onValueChange={v => setTab(v as string)}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History ({messages.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — inputs */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Message Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {prospects.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <Label className="text-xs">Autofill from a prospect (optional)</Label>
                    {prospectId ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />Linked to {form.prospectName}{prospectEmail ? ` · ${prospectEmail}` : " (no email)"}
                        <button onClick={clearProspect} className="ml-1 text-muted-foreground hover:text-foreground inline-flex"><X className="w-3 h-3" /></button>
                      </p>
                    ) : (
                      <>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={prospectSearch} onChange={e => setProspectSearch(e.target.value)} placeholder="Search prospects..." className="pl-9 h-9" />
                        </div>
                        {prospectSearch && (
                          <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-card">
                            {filteredProspects.length === 0 ? <p className="px-3 py-3 text-center text-xs text-muted-foreground">No matches</p> :
                              filteredProspects.slice(0, 20).map(p => (
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
                <div><Label className="text-xs">Their Need / Pain Point *</Label><Textarea value={form.need} onChange={e => setForm(f => ({ ...f, need: e.target.value }))} rows={7} className="mt-1 field-sizing-fixed" placeholder="What problem are they trying to solve? Any context from the job post, their goals, tech stack, timeline…" /></div>
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
                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={busy} className="flex-1">
                    {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : body ? <><RotateCcw className="w-4 h-4 mr-2" />Regenerate</> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
                  </Button>
                  <Button variant="outline" onClick={getVariations} disabled={busy} title="Generate 3 variations">
                    {varBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                  </Button>
                </div>
                {!body && !editorOpen && (
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setEditorOpen(true)}>
                    <FileText className="w-4 h-4 mr-1.5" />…or write it yourself & let AI improve it
                  </Button>
                )}

                {/* Variations */}
                {variations && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Pick a variation:</p>
                    {variations.map((v, i) => (
                      <button key={i} onClick={() => useVariation(v)} className="w-full text-left rounded-lg border border-border bg-card p-2.5 hover:border-primary/40 transition-colors">
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{v}</p>
                        <span className="text-[11px] text-primary mt-1 inline-block">Use this →</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RIGHT — editor + AI tools */}
            <div>
              {body || editorOpen ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">{form.channel}</Badge>
                        <Badge variant="outline" className="text-xs">{form.tone}</Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0} title="Undo last AI change"><Undo2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="outline" size="sm" onClick={copyAll}><Copy className="w-3.5 h-3.5 mr-1" />Copy</Button>
                        <Button variant="outline" size="sm" onClick={() => setSaveTplOpen(true)} disabled={!body.trim()} title="Save as template"><FileText className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" onClick={saveDraft} disabled={saving || !body.trim()}>{saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEmail && (
                      <div>
                        <Label className="text-xs flex items-center gap-1.5"><Type className="w-3.5 h-3.5 text-muted-foreground" />Subject line</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Auto-generated from your message…" className="mt-1" />
                        <div className="mt-1.5">
                          {subjBusy ? (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Finding stronger subject ideas…</p>
                          ) : subjectIdeas && subjectIdeas.length > 0 ? (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" />{subjectIdeas.length} subject ideas to improve — tap one</span>
                                <button onClick={() => getSubjectIdeas()} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" />More</button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {subjectIdeas.map((s, i) => (
                                  <button key={i} onClick={() => setSubject(s)} className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors", subject === s ? "border-primary bg-primary/15 text-primary font-medium" : "border-border bg-card hover:border-primary hover:text-primary")}>{s}</button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => getSubjectIdeas()} disabled={!body.trim()}>
                              <Sparkles className="w-3 h-3 mr-1 text-primary" />Suggest subject ideas
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <Textarea value={body} onChange={e => setBody(e.target.value)} rows={13} placeholder="Write or generate your message…" className="text-sm leading-relaxed resize-none field-sizing-fixed" />
                      {(refining) && (
                        <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Refining…</span>
                        </div>
                      )}
                    </div>
                    <p className={cn("text-[11px] text-right", overLimit ? "text-red-500 font-medium" : "text-muted-foreground")}>
                      {words} words · {body.length}{limit ? `/${limit}` : ""} chars{overLimit ? " — over limit" : ""}
                    </p>

                    {/* AI refine */}
                    <div className="rounded-lg border border-primary/20 bg-accent/40 p-3 space-y-2.5">
                      <p className="text-xs font-medium flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-primary" />Refine with AI</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REFINES.map(q => (
                          <button key={q.label} type="button" onClick={() => refine(q.instr)} disabled={busy || !body.trim()}
                            className={cn("px-2.5 py-1 rounded-full text-xs border border-border bg-card transition-colors", (busy || !body.trim()) ? "opacity-50" : "hover:border-primary hover:text-primary")}>
                            {q.label}
                          </button>
                        ))}
                        <button type="button" onClick={improveDraft} disabled={busy || !body.trim()}
                          className={cn("px-2.5 py-1 rounded-full text-xs border border-primary/40 text-primary bg-card transition-colors", (busy || !body.trim()) ? "opacity-50" : "hover:bg-primary/10")}>
                          ✨ Improve my draft
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Input value={refineInstruction} onChange={e => setRefineInstruction(e.target.value)} placeholder="Or tell AI exactly what to change…" className="h-9" disabled={busy}
                          onKeyDown={e => { if (e.key === "Enter") applyCustomRefine(); }} />
                        <Button size="sm" className="h-9 shrink-0" onClick={applyCustomRefine} disabled={busy || !refineInstruction.trim()}>
                          {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1" />Apply</>}
                        </Button>
                      </div>
                    </div>

                    {/* Critique */}
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-violet-500" />AI critique</span>
                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={runCritique} disabled={critBusy || !body.trim()}>
                          {critBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1 text-primary" />}Analyze
                        </Button>
                      </div>
                      {critique && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "Persuasive", val: critique.persuasiveness, good: true },
                              { label: "Clarity", val: critique.clarity, good: true },
                              { label: "Spam risk", val: critique.spamRisk, good: false },
                            ].map(m => (
                              <div key={m.label}>
                                <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">{m.label}</span><span className="font-medium">{m.val}</span></div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className={cn("h-full rounded-full", m.good ? (m.val >= 70 ? "bg-emerald-500" : m.val >= 40 ? "bg-amber-500" : "bg-red-500") : (m.val <= 30 ? "bg-emerald-500" : m.val <= 60 ? "bg-amber-500" : "bg-red-500"))} style={{ width: `${m.val}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          {critique.suggestions.length > 0 && (
                            <div className="space-y-1">
                              {critique.suggestions.map((s, i) => (
                                <button key={i} onClick={() => refine(s)} disabled={busy} className="w-full text-left flex items-start gap-1.5 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors">
                                  <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" /><span>{s}</span>
                                </button>
                              ))}
                              <p className="text-[10px] text-muted-foreground/60">Tap a suggestion to apply it with AI.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Email actions */}
                    {isEmail && (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => openCompose("gmail")} disabled={!body.trim()}>
                            <Mail className="w-4 h-4 mr-1.5" />Compose in Gmail
                          </Button>
                          <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => openCompose("yahoo")} disabled={!body.trim()}>
                            <Mail className="w-4 h-4 mr-1.5" />Compose in Yahoo
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground text-center">
                          {prospectEmail ? `Recipient: ${prospectEmail}` : "Opens a prefilled draft — add the “To” there."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground py-16">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Fill in the form and click Generate.</p>
                    <p className="text-xs mt-1">Then refine with AI, critique it, or open it in your email app.</p>
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
                      {msg.sent && <Badge className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">Sent</Badge>}
                      {msg.prospect && <span className="text-xs text-muted-foreground">{msg.prospect.name}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60"><Clock className="w-3 h-3" />{formatDate(msg.createdAt)}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { const { subject: s, body: b } = splitSubject(msg.content); setSubject(s); setBody(b); setForm(f => ({ ...f, channel: msg.channel, tone: msg.tone })); setEditorOpen(true); setTab("generate"); toast.success("Loaded into editor"); }}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-3">
          {templates.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No templates yet.</p>
              <p className="text-xs mt-1">Generate a message, then click the <FileText className="w-3 h-3 inline" /> icon to save it. Use {"{{name}}"}, {"{{company}}"}, {"{{role}}"} as merge fields.</p>
            </CardContent></Card>
          ) : templates.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-xs">{t.channel}</Badge>
                  </div>
                  {t.subject && <p className="text-xs text-muted-foreground truncate">Subject: {t.subject}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap mt-0.5">{t.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" onClick={() => useTemplate(t)}>Use</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Save as template dialog */}
      <Dialog open={saveTplOpen} onOpenChange={v => { setSaveTplOpen(v); if (!v) setTplName(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Save as template</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Tip: use {"{{name}}"}, {"{{company}}"}, {"{{role}}"} so it auto-fills next time.</p>
          <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Template name (e.g. Shopify intro)" autoFocus onKeyDown={e => e.key === "Enter" && saveTemplate()} />
          <div className="flex gap-2 mt-1">
            <Button variant="outline" className="flex-1" onClick={() => setSaveTplOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveTemplate}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
