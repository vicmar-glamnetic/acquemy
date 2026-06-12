"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const PLATFORMS = ["Upwork", "Freelancer.com", "Toptal", "Guru.com", "LinkedIn", "Contra", "Fiverr", "PeoplePerHour"];

export default function PlatformsPage() {
  const [platform, setPlatform] = useState("Upwork");
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(false);

  async function getTips() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/platform-tips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
      const data = await res.json();
      if (res.ok) setTips(data.tips); else toast.error(data.error || "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl lg:max-w-3xl">
      <div><h1 className="text-2xl font-bold">Platforms</h1><p className="text-muted-foreground text-sm mt-1">AI tips for winning on each freelance platform</p></div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Get Platform Tips</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">Platform</Label>
            <Select value={platform} onValueChange={v => v && setPlatform(v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={getTips} disabled={loading} className="w-full">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><Sparkles className="w-4 h-4 mr-2" />Get {platform} Tips</>}</Button>
        </CardContent>
      </Card>
      {tips && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{platform} Strategy</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(tips); toast.success("Copied!"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </div>
          </CardHeader>
          <CardContent><Textarea value={tips} onChange={e => setTips(e.target.value)} rows={12} className="resize-none" /></CardContent>
        </Card>
      )}
    </div>
  );
}
