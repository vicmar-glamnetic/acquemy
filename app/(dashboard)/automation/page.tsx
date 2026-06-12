"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Bell, CheckCircle2, Loader2, Link2, Globe, Copy, Check, Save, UserPlus, ExternalLink } from "lucide-react";

export default function AutomationPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ added: number; message: string; sources?: Record<string, number> } | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [importedName, setImportedName] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState<"url" | "snippet" | null>(null);

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/contact-form`;

  async function scanJobBoards() {
    setScanning(true); setScanResult(null);
    try {
      const res = await fetch("/api/scan/job-boards", { method: "POST" });
      const data = await res.json();
      setScanResult(data);
      data.added > 0 ? toast.success(data.message) : toast.info(data.message);
    } catch { toast.error("Scan failed"); }
    finally { setScanning(false); }
  }

  async function importLinkedIn() {
    if (!linkedinUrl) return;
    setLinkedinLoading(true); setImportedName("");
    try {
      const res = await fetch("/api/linkedin/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedinUrl }) });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setImportedName(data.prospect.name);
      setLinkedinUrl("");
      toast.success(`${data.prospect.name} added to prospects!`);
    } catch { toast.error("Import failed. Check the URL."); }
    finally { setLinkedinLoading(false); }
  }

  function copyText(text: string, type: "url" | "snippet") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const snippet = `await fetch("${webhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-webhook-secret": "${webhookSecret || "YOUR_SECRET"}" },
  body: JSON.stringify({ name, email, company, message, source: "website" })
});`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Automation</h1>
        <p className="text-muted-foreground text-sm mt-1">3 lead sources — all funneling into your prospects pipeline</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Find Jobs Now</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Scans 14 platforms simultaneously — We Work Remotely, Remote OK, Jobicy, Remote.co, Himalayas, Freelancer.com, Reddit communities, and more. AI scores each match using your profile.</p>
          <Button onClick={scanJobBoards} disabled={scanning} size="sm">
            {scanning ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Scanning...</> : <><Zap className="w-3 h-3 mr-2" />Scan for Jobs</>}
          </Button>
          {scanResult && (
            <div className={`text-xs p-3 rounded-lg space-y-1.5 ${scanResult.added > 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/50"}`}>
              <div className={`flex items-center gap-2 ${scanResult.added > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                {scanResult.added > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                {scanResult.message}
                {scanResult.added > 0 && <a href="/prospects" className="underline">View →</a>}
              </div>
              {scanResult.sources && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {Object.entries(scanResult.sources).map(([src, count]) => count > 0 && (
                    <span key={src} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{src}: {count}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4 text-sky-400" />LinkedIn Import</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Paste a LinkedIn profile URL — AI enriches the data and adds them as a prospect.</p>
          <div className="flex gap-2">
            <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username/" className="flex-1" onKeyDown={e => e.key === "Enter" && importLinkedIn()} />
            <Button onClick={importLinkedIn} disabled={linkedinLoading || !linkedinUrl} size="sm">
              {linkedinLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}Import
            </Button>
          </div>
          {importedName && <div className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />{importedName} added!</div>}
          <p className="text-xs text-muted-foreground">Add <code className="text-sky-400">PROXYCURL_API_KEY</code> env var for richer data. <a href="https://nubela.co/proxycurl" target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-0.5">Free credits <ExternalLink className="w-3 h-3" /></a></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" />Website Contact Form Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Add this to your website contact form. Anyone who submits becomes a prospect — AI scored and emailed to you instantly.</p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="flex-1 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copyText(webhookUrl, "url")}>{copied === "url" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Webhook Secret (set as WEBHOOK_SECRET env var too)</Label>
            <div className="flex gap-2">
              <Input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="your-secret" className="flex-1 font-mono text-xs" />
              <Button variant="outline" size="sm"><Save className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Code snippet for your website</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyText(snippet, "snippet")}>{copied === "snippet" ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}</Button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto text-muted-foreground whitespace-pre-wrap">{snippet}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
