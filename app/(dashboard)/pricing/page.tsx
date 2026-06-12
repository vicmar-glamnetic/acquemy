"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy } from "lucide-react";

export default function PricingPage() {
  const [form, setForm] = useState({ projectType: "", scope: "", timeline: "", clientBudget: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) setResult(data.pricing); else toast.error(data.error || "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl lg:max-w-3xl">
      <div><h1 className="text-2xl font-bold">Pricing Calculator</h1><p className="text-muted-foreground text-sm mt-1">AI-powered pricing based on your rate and project scope</p></div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">Project Type</Label><Input value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))} placeholder="e.g. Custom theme build, store migration, speed optimization" className="mt-1" /></div>
          <div><Label className="text-xs">Scope / Requirements</Label><Textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} placeholder="What does the project involve?" rows={3} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Timeline</Label><Input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))} placeholder="e.g. 2 weeks, 1 month" className="mt-1" /></div>
            <div><Label className="text-xs">Client&apos;s Budget (if known)</Label><Input value={form.clientBudget} onChange={e => setForm(f => ({ ...f, clientBudget: e.target.value }))} placeholder="e.g. $2,000-$5,000" className="mt-1" /></div>
          </div>
          <Button onClick={handle} disabled={loading || !form.projectType} className="w-full">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</> : <><Sparkles className="w-4 h-4 mr-2" />Calculate Pricing</>}</Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pricing Recommendation</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </div>
          </CardHeader>
          <CardContent><Textarea value={result} onChange={e => setResult(e.target.value)} rows={10} className="resize-none" /></CardContent>
        </Card>
      )}
    </div>
  );
}
