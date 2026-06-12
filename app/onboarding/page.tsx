"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Upload, CheckCircle2 } from "lucide-react";

const STEPS = ["Basic Info", "Your Skills", "Portfolio & Rate", "Done"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", bio: "", niche: "", location: "", website: "",
    skills: "", experience: "", rate: "",
    portfolioLinks: "", targetMarkets: "", resumeUrl: "",
  });

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/upload-resume", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      update("resumeUrl", data.url);
      if (data.extracted) {
        if (data.extracted.skills) update("skills", data.extracted.skills);
        if (data.extracted.experience) update("experience", data.extracted.experience);
        if (data.extracted.niche) update("niche", data.extracted.niche);
        toast.success("Resume uploaded and AI extracted your skills!");
      } else {
        toast.success("Resume uploaded!");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setResumeUploading(false);
    }
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const portfolioArray = form.portfolioLinks.split(",").map(s => s.trim()).filter(Boolean);
      const marketsArray = form.targetMarkets.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          portfolioLinks: JSON.stringify(portfolioArray),
          targetMarkets: JSON.stringify(marketsArray),
          onboarded: true,
        }),
      });
      if (res.ok) {
        toast.success("Profile saved! Welcome to Acquemy.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-xl">Acquemy</span>
          </div>
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">The AI uses this to personalize everything — outreach, proposals, scoring</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {STEPS.map((s, i) => <span key={s} className={i === step ? "text-primary font-medium" : ""}>{s}</span>)}
          </div>
          <Progress value={(step / (STEPS.length - 1)) * 100} className="h-1" />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          {step === 0 && (
            <>
              <h2 className="font-semibold">Basic Information</h2>
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Jane Smith" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">What do you do? (Your niche) *</Label>
                <Input value={form.niche} onChange={e => update("niche", e.target.value)} placeholder="e.g. Shopify Developer, UX Designer, Copywriter" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Short Bio</Label>
                <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Brief description of what you do and who you help..." rows={3} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="City, Country" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://yoursite.com" className="mt-1" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold">Skills & Experience</h2>
              <div className="border border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Upload your resume — AI will extract your skills automatically</p>
                <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleResumeUpload} />
                <Button variant="outline" size="sm" disabled={resumeUploading} onClick={() => resumeRef.current?.click()}>
                  {resumeUploading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading...</> : "Upload Resume"}
                </Button>
                {form.resumeUrl && <p className="text-xs text-emerald-400 mt-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Resume uploaded</p>}
              </div>
              <div>
                <Label className="text-xs">Skills (comma-separated)</Label>
                <Textarea value={form.skills} onChange={e => update("skills", e.target.value)} placeholder="e.g. Shopify, React, TypeScript, Figma, Copywriting..." rows={3} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Years of Experience / Background</Label>
                <Textarea value={form.experience} onChange={e => update("experience", e.target.value)} placeholder="e.g. 5+ years building Shopify stores for DTC brands, previously at Agency X..." rows={2} className="mt-1" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold">Portfolio & Rate</h2>
              <div>
                <Label className="text-xs">Portfolio / Past Client URLs (comma-separated)</Label>
                <Textarea value={form.portfolioLinks} onChange={e => update("portfolioLinks", e.target.value)} placeholder="client1.com, client2.com, myportfolio.com/case-study..." rows={3} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Your Rate</Label>
                <Input value={form.rate} onChange={e => update("rate", e.target.value)} placeholder="e.g. $75/hr, $3,000/project, Negotiable" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Target Markets (comma-separated)</Label>
                <Input value={form.targetMarkets} onChange={e => update("targetMarkets", e.target.value)} placeholder="e.g. USA, Australia, UK, Europe" className="mt-1" />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">You&apos;re all set!</h2>
              <p className="text-muted-foreground text-sm">Acquemy will use your profile to personalize every AI-generated message, proposal, and outreach email.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && step < 3 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
            )}
            {step < 2 && (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1" disabled={step === 0 && !form.name}>Next</Button>
            )}
            {step === 2 && (
              <Button onClick={() => setStep(3)} className="flex-1">Preview</Button>
            )}
            {step === 3 && (
              <Button onClick={handleFinish} className="flex-1" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Go to Dashboard →"}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <button onClick={() => router.push("/dashboard")} className="hover:underline">Skip for now</button>
        </p>
      </div>
    </div>
  );
}
