"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy } from "lucide-react";

export default function ObjectionsPage() {
  const [objection, setObjection] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!objection) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/handle-objection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objection }) });
      const data = await res.json();
      if (res.ok) setResponse(data.response);
      else toast.error(data.error || "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl lg:max-w-3xl">
      <div><h1 className="text-2xl font-bold">Objection Handler</h1><p className="text-muted-foreground text-sm mt-1">AI responses to client objections — tailored to your profile</p></div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Objection</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">What did the prospect say?</Label><Textarea value={objection} onChange={e => setObjection(e.target.value)} placeholder="e.g. Your rate is too high, we can find someone cheaper..." rows={3} className="mt-1" /></div>
          <Button onClick={handle} disabled={loading || !objection} className="w-full">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Response</>}</Button>
        </CardContent>
      </Card>
      {response && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">AI Response</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(response); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </div>
          </CardHeader>
          <CardContent><Textarea value={response} onChange={e => setResponse(e.target.value)} rows={8} className="resize-none" /></CardContent>
        </Card>
      )}
    </div>
  );
}
