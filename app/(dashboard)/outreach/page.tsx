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
import { Sparkles, Copy, Loader2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

const CHANNELS = ["Cold Email", "LinkedIn DM", "Upwork Cover Letter", "Twitter DM", "WhatsApp"];
const TONES = ["Professional", "Friendly", "Bold", "Story-driven"];

interface Message { id: string; channel: string; tone: string; content: string; sent: boolean; createdAt: string; prospect?: { name: string; company: string }; }

export default function OutreachPage() {
  const [form, setForm] = useState({ prospectName: "", company: "", role: "", need: "", channel: "Cold Email", tone: "Professional" });
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => { fetch("/api/messages").then(r => r.json()).then(setMessages).catch(() => {}); }, []);

  async function handleGenerate() {
    if (!form.prospectName || !form.company || !form.need) { toast.error("Fill name, company, and need"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setGenerated(data.content); toast.success("Generated!"); }
      else toast.error(data.error || "Generation failed");
    } catch { toast.error("Network error"); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Outreach</h1><p className="text-muted-foreground text-sm mt-1">AI-powered message generator for every channel</p></div>
      <Tabs defaultValue="generate">
        <TabsList><TabsTrigger value="generate">Generate</TabsTrigger><TabsTrigger value="history">History ({messages.length})</TabsTrigger></TabsList>
        <TabsContent value="generate" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Message Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Prospect Name *</Label><Input value={form.prospectName} onChange={e => setForm(f => ({ ...f, prospectName: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="text-xs">Company *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label className="text-xs">Their Role</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-1" /></div>
                <div><Label className="text-xs">Their Need / Pain Point *</Label><Textarea value={form.need} onChange={e => setForm(f => ({ ...f, need: e.target.value }))} rows={2} className="mt-1" /></div>
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
                <Button onClick={handleGenerate} disabled={generating} className="w-full">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Message</>}
                </Button>
              </CardContent>
            </Card>
            <div>
              {generated ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{form.channel}</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generated); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
                    </div>
                  </CardHeader>
                  <CardContent><Textarea value={generated} onChange={e => setGenerated(e.target.value)} rows={14} className="font-mono text-sm resize-none" /></CardContent>
                </Card>
              ) : (
                <Card className="border-dashed h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground py-16">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>Fill in the form and click Generate</p>
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
                    <div className="flex gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{msg.channel}</Badge>
                      <Badge variant="outline" className="text-xs">{msg.tone}</Badge>
                      {msg.prospect && <span className="text-xs text-muted-foreground">{msg.prospect.name}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60"><Clock className="w-3 h-3" />{formatDate(msg.createdAt)}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}><Copy className="w-3 h-3" /></Button>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
