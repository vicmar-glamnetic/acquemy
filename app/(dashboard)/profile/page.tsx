"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Save, Upload, CheckCircle2, User, Briefcase, Globe, DollarSign, X, Plus, Phone, Mail, AtSign, Clock, Languages, Link2, Code2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RATE_TYPES = [
  { value: "hr", label: "/hr" },
  { value: "day", label: "/day" },
  { value: "month", label: "/mo" },
  { value: "project", label: "/project" },
];

const DIAL_CODES = [
  "+1 United States","+1 Canada","+7 Russia","+20 Egypt","+27 South Africa","+30 Greece",
  "+31 Netherlands","+32 Belgium","+33 France","+34 Spain","+36 Hungary","+39 Italy",
  "+40 Romania","+41 Switzerland","+43 Austria","+44 United Kingdom","+45 Denmark","+46 Sweden",
  "+47 Norway","+48 Poland","+49 Germany","+51 Peru","+52 Mexico","+54 Argentina","+55 Brazil",
  "+56 Chile","+57 Colombia","+58 Venezuela","+60 Malaysia","+61 Australia","+62 Indonesia",
  "+63 Philippines","+64 New Zealand","+65 Singapore","+66 Thailand","+81 Japan","+82 South Korea",
  "+84 Vietnam","+86 China","+90 Turkey","+91 India","+92 Pakistan","+93 Afghanistan",
  "+94 Sri Lanka","+95 Myanmar","+98 Iran","+212 Morocco","+213 Algeria","+216 Tunisia",
  "+234 Nigeria","+251 Ethiopia","+254 Kenya","+255 Tanzania","+256 Uganda","+263 Zimbabwe",
  "+351 Portugal","+352 Luxembourg","+353 Ireland","+358 Finland","+359 Bulgaria","+370 Lithuania",
  "+371 Latvia","+372 Estonia","+380 Ukraine","+381 Serbia","+385 Croatia","+386 Slovenia",
  "+420 Czech Republic","+421 Slovakia","+880 Bangladesh","+886 Taiwan","+962 Jordan","+966 Saudi Arabia",
  "+968 Oman","+971 UAE","+972 Israel","+973 Bahrain","+974 Qatar","+977 Nepal","+994 Azerbaijan",
  "+995 Georgia","+998 Uzbekistan",
];

const TIMEZONES = [
  "GMT-12:00 (Baker Island)","GMT-11:00 (Pago Pago)","GMT-10:00 (Hawaii — HST)",
  "GMT-09:00 (Alaska — AKST)","GMT-08:00 (Los Angeles — PST)","GMT-07:00 (Denver — MST)",
  "GMT-06:00 (Chicago — CST)","GMT-05:00 (New York — EST)","GMT-04:00 (Santiago)",
  "GMT-03:00 (São Paulo / Buenos Aires)","GMT-02:00 (South Georgia)","GMT-01:00 (Azores)",
  "GMT+00:00 (London — GMT/UTC)","GMT+01:00 (Berlin / Paris — CET)","GMT+02:00 (Cairo / Athens — EET)",
  "GMT+03:00 (Moscow / Istanbul)","GMT+03:30 (Tehran)","GMT+04:00 (Dubai — GST)",
  "GMT+04:30 (Kabul)","GMT+05:00 (Karachi)","GMT+05:30 (India — IST)","GMT+05:45 (Kathmandu)",
  "GMT+06:00 (Dhaka)","GMT+06:30 (Yangon)","GMT+07:00 (Bangkok / Jakarta)",
  "GMT+08:00 (Singapore / Manila / Beijing)","GMT+09:00 (Tokyo — JST)","GMT+09:30 (Adelaide)",
  "GMT+10:00 (Sydney — AEST)","GMT+11:00 (Solomon Islands)","GMT+12:00 (Auckland — NZST)",
  "GMT+13:00 (Samoa)",
];

const AVAILABILITY_OPTIONS = [
  "Full-time (40+ hrs/week)",
  "Part-time (20 hrs/week)",
  "A few hours/week",
  "Open to new projects",
  "Booked — not available",
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bangladesh","Belarus","Belgium","Bolivia","Bosnia","Brazil","Bulgaria","Cambodia",
  "Canada","Chile","China","Colombia","Costa Rica","Croatia","Czech Republic","Denmark",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hong Kong","Hungary",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan",
  "Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Latvia","Lebanon","Lithuania",
  "Luxembourg","Malaysia","Malta","Mexico","Moldova","Morocco","Myanmar","Nepal",
  "Netherlands","New Zealand","Nicaragua","Nigeria","North Macedonia","Norway","Oman",
  "Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Puerto Rico","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Serbia","Singapore",
  "Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden",
  "Switzerland","Taiwan","Tanzania","Thailand","Tunisia","Turkey","UAE","Uganda","UK",
  "Ukraine","Uruguay","USA","Uzbekistan","Venezuela","Vietnam","Zimbabwe",
  "Worldwide / Remote",
];

const TARGET_MARKETS = ["USA","UK","Canada","Australia","Europe","Germany","Netherlands","UAE","Singapore","Worldwide"];

const SKILL_CATEGORIES: Record<string, string[]> = {
  "eCommerce": [
    "Shopify","Shopify Plus","Liquid","Hydrogen","Klaviyo","WooCommerce","BigCommerce","Magento",
    "Amazon FBA","Etsy","eBay","Dropshipping","Print on Demand","Product Sourcing",
    "Conversion Rate Optimization","eCommerce Strategy","Inventory Management","Order Fulfillment",
  ],
  "Web Dev": [
    "React","Next.js","Vue.js","Angular","TypeScript","JavaScript","Node.js","PHP","Python","Ruby on Rails",
    "Laravel","Django","WordPress","Webflow","Wix","Squarespace","HTML/CSS","Tailwind CSS","GraphQL",
    "REST APIs","PostgreSQL","MySQL","MongoDB","Firebase","Supabase","AWS","Google Cloud","Azure",
    "Docker","Kubernetes","CI/CD","Git","DevOps","Linux","Nginx",
  ],
  "Mobile": [
    "React Native","Flutter","Swift","iOS Development","Android Development","Kotlin",
    "Expo","App Store Optimization","Mobile UI Design","Firebase","Push Notifications",
  ],
  "Design": [
    "UI/UX Design","Figma","Adobe XD","Sketch","Photoshop","Illustrator","InDesign","After Effects",
    "Premiere Pro","Brand Design","Logo Design","Graphic Design","Print Design","Packaging Design",
    "Wireframing","Prototyping","Motion Graphics","3D Design","Blender","Canva","Typography",
  ],
  "Video & Media": [
    "Video Editing","Premiere Pro","Final Cut Pro","DaVinci Resolve","After Effects","Motion Graphics",
    "YouTube Content","Short-form Video","Reels & TikTok","Podcast Production","Podcast Editing",
    "Scriptwriting","Voiceover","Animation","Whiteboard Animation","Color Grading","Subtitles & Captions",
  ],
  "Writing": [
    "Copywriting","Content Writing","Blog Writing","Technical Writing","Ghostwriting","Proofreading",
    "Editing","SEO Writing","Sales Copy","Email Copy","Ad Copy","UX Writing","Grant Writing",
    "Resume Writing","Academic Writing","Scriptwriting","White Papers","Case Studies","Press Releases",
  ],
  "Marketing": [
    "SEO","Local SEO","On-Page SEO","Link Building","Google Ads","Facebook Ads","Instagram Ads",
    "TikTok Ads","LinkedIn Ads","Pinterest Ads","Email Marketing","Klaviyo","Mailchimp","HubSpot",
    "Social Media Management","Content Strategy","Influencer Marketing","Affiliate Marketing",
    "Growth Hacking","Analytics","Google Analytics","Meta Pixel","A/B Testing","Community Management",
  ],
  "Business & Finance": [
    "Business Strategy","Market Research","Competitive Analysis","Business Planning","Pitch Decks",
    "Bookkeeping","Accounting","QuickBooks","Xero","Financial Modeling","Tax Preparation",
    "Invoicing","Payroll","Financial Planning","Investment Analysis","Fundraising",
  ],
  "Admin & Ops": [
    "Virtual Assistant","Executive Assistant","Data Entry","Calendar Management","Email Management",
    "Customer Support","CRM Management","Salesforce","HubSpot CRM","Notion","Airtable","Monday.com",
    "Asana","Trello","Project Management","Operations","Process Automation","Zapier","Make (Integromat)",
  ],
  "Sales": [
    "Lead Generation","Cold Outreach","Cold Calling","Sales Copywriting","CRM","B2B Sales",
    "B2C Sales","SaaS Sales","Account Management","Business Development","LinkedIn Outreach",
    "Sales Strategy","Proposal Writing","Contract Negotiation","Upselling & Cross-selling",
  ],
  "Legal & HR": [
    "Contract Drafting","Legal Research","Trademark Registration","Copyright","Privacy Policy",
    "Terms of Service","HR Management","Recruiting","Onboarding","Performance Reviews",
    "Compliance","Employment Law","Labor Relations","Payroll HR",
  ],
  "AI & Data": [
    "AI Prompting","ChatGPT","Claude","Midjourney","Stable Diffusion","Machine Learning",
    "Data Analysis","Python for Data","Pandas","SQL","Tableau","Power BI","Data Visualization",
    "Web Scraping","Automation","n8n","Zapier","Make","API Integration","Chatbot Development",
  ],
};

const NICHE_SUGGESTIONS = [
  "Shopify Developer","Shopify Plus Developer","Fullstack Developer","Frontend Developer","Backend Developer",
  "Mobile App Developer","WordPress Developer","Webflow Developer","React Developer","Python Developer",
  "UI/UX Designer","Web Designer","Brand Designer","Graphic Designer","Motion Designer",
  "Video Editor","Podcast Editor","Content Creator","Animator",
  "Copywriter","Content Writer","Technical Writer","Ghostwriter","SEO Writer",
  "SEO Specialist","Email Marketer","Digital Marketer","Social Media Manager","Paid Ads Specialist",
  "eCommerce Consultant","Amazon FBA Specialist","Dropshipping Expert",
  "Virtual Assistant","Executive Assistant","Project Manager","Operations Manager",
  "Sales Consultant","Lead Generation Specialist","Business Development",
  "Bookkeeper","Accountant","Financial Analyst",
  "AI Consultant","Data Analyst","Automation Specialist",
];

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "", bio: "", niche: "", location: "", website: "",
    skills: "", experience: "", portfolioLinks: "", targetMarkets: "", resumeUrl: "",
    headline: "", phone: "", contactEmail: "", linkedin: "", github: "",
    twitter: "", languages: "", timezone: "", availability: "",
  });
  const [rateAmount, setRateAmount] = useState("");
  const [rateType, setRateType] = useState("hr");
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState(Object.keys(SKILL_CATEGORIES)[0]);
  const resumeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      const skills = data.skills ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const markets = (() => {
        try { const arr = JSON.parse(data.targetMarkets || "[]"); return Array.isArray(arr) ? arr : []; }
        catch { return data.targetMarkets ? data.targetMarkets.split(",").map((s: string) => s.trim()) : []; }
      })();
      const portfolioLinks = (() => {
        try { const arr = JSON.parse(data.portfolioLinks || "[]"); return Array.isArray(arr) ? arr.join(", ") : data.portfolioLinks || ""; }
        catch { return data.portfolioLinks || ""; }
      })();
      setSelectedSkills(skills);
      setSelectedMarkets(markets);
      // Parse rate string like "$75/hr" or "$3000/project"
      const rateStr = data.rate || "";
      const rateMatch = rateStr.match(/\$?([\d,]+)\s*\/\s*(hr|hour|day|month|project)?/i);
      if (rateMatch) {
        setRateAmount(rateMatch[1].replace(/,/g, ""));
        setRateType(rateMatch[2]?.toLowerCase() === "hour" ? "hr" : (rateMatch[2]?.toLowerCase() || "hr"));
      }
      // Parse phone like "+44 7700 900123" into dial code + number
      const phRaw = data.phone || "";
      const phMatch = phRaw.match(/^(\+\d{1,4})[\s-]*(.*)$/);
      if (phMatch) { setPhoneCode(phMatch[1]); setPhoneNumber(phMatch[2].trim()); }
      else if (phRaw) { setPhoneNumber(phRaw); }
      setForm({ name: data.name || "", bio: data.bio || "", niche: data.niche || "", location: data.location || "", website: data.website || "", skills: skills.join(", "), experience: data.experience || "", portfolioLinks, targetMarkets: markets.join(", "), resumeUrl: data.resumeUrl || "",
        headline: data.headline || "", phone: data.phone || "", contactEmail: data.contactEmail || data.email || "", linkedin: data.linkedin || "", github: data.github || "", twitter: data.twitter || "", languages: data.languages || "", timezone: data.timezone || "", availability: data.availability || "" });
      setLoading(false);
    });
  }, []);

  function toggleSkill(skill: string) {
    setSelectedSkills(prev => {
      const next = prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill];
      setForm(f => ({ ...f, skills: next.join(", ") }));
      return next;
    });
  }

  function addCustomSkill() {
    const s = customSkill.trim();
    if (!s || selectedSkills.includes(s)) { setCustomSkill(""); return; }
    toggleSkill(s);
    setCustomSkill("");
  }

  function toggleMarket(m: string) {
    setSelectedMarkets(prev => {
      const next = prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m];
      setForm(f => ({ ...f, targetMarkets: next.join(", ") }));
      return next;
    });
  }

  function updatePhone(code: string, number: string) {
    setForm(f => ({ ...f, phone: number.trim() ? `${code} ${number.trim()}` : "" }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const portfolioArray = form.portfolioLinks.split(",").map(s => s.trim()).filter(Boolean);
      const rate = rateAmount ? `$${rateAmount}/${rateType}` : "";
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rate, skills: selectedSkills.join(", "), portfolioLinks: JSON.stringify(portfolioArray), targetMarkets: JSON.stringify(selectedMarkets) }),
      });
      if (res.ok) toast.success("Profile saved! AI will use your updated profile.");
      else toast.error("Failed to save profile");
    } finally { setSaving(false); }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/profile/upload-resume", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.extracted?.skills) {
        const newSkills = data.extracted.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        setSelectedSkills(prev => {
          const merged = [...new Set([...prev, ...newSkills])];
          setForm(f => ({ ...f, skills: merged.join(", "), resumeUrl: data.url }));
          return merged;
        });
      }
      if (data.extracted?.niche) setForm(f => ({ ...f, niche: data.extracted.niche }));
      if (data.extracted?.experience) setForm(f => ({ ...f, experience: data.extracted.experience }));
      toast.success("Resume uploaded! Skills auto-filled from your CV.");
    } catch { toast.error("Upload failed — try a .txt or .pdf file"); }
    finally { setUploading(false); }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/40" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">The AI uses this to personalize outreach, scoring, and proposals</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Contact details */}
        <div className="lg:col-span-1 space-y-4">

          {/* Contact Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary" />Contact Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Full Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Headline / Title</Label>
                <Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Senior Shopify Developer" className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">A one-line title clients see first</p>
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />Contact Email</Label>
                <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="you@example.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />Phone</Label>
                <div className="flex gap-2 mt-1">
                  <SearchableSelect
                    className="w-24 shrink-0"
                    menuWidth={250}
                    options={DIAL_CODES}
                    value={phoneCode}
                    onChange={v => { const code = v.split(" ")[0]; setPhoneCode(code); updatePhone(code, phoneNumber); }}
                    placeholder="+1"
                    searchPlaceholder="Search country / code..."
                    allowCustom
                  />
                  <Input type="tel" inputMode="tel" value={phoneNumber} onChange={e => { setPhoneNumber(e.target.value); updatePhone(phoneCode, e.target.value); }} placeholder="555 000 1234" className="flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Your Niche / Specialty</Label>
                <SearchableSelect
                  className="mt-1"
                  options={NICHE_SUGGESTIONS}
                  value={form.niche}
                  onChange={v => setForm(f => ({ ...f, niche: v }))}
                  placeholder="Select or type your niche"
                  searchPlaceholder="Search or type your niche..."
                  allowCustom
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Location</Label>
                <SearchableSelect
                  className="mt-1"
                  options={COUNTRIES}
                  value={form.location}
                  onChange={v => setForm(f => ({ ...f, location: v }))}
                  placeholder="Select country"
                  searchPlaceholder="Search country..."
                />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />Timezone</Label>
                <SearchableSelect
                  className="mt-1"
                  options={TIMEZONES}
                  value={form.timezone}
                  onChange={v => setForm(f => ({ ...f, timezone: v }))}
                  placeholder="Select timezone"
                  searchPlaceholder="Search timezone..."
                  allowCustom
                />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" />Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Bio</Label>
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Brief description of what you do and who you help..." className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Online Presence & Availability */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" />Online Presence</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-muted-foreground" />LinkedIn</Label>
                <Input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/you" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-muted-foreground" />GitHub</Label>
                <Input value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="github.com/you" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5 text-muted-foreground" />X / Twitter</Label>
                <Input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} placeholder="@yourhandle" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-muted-foreground" />Languages</Label>
                <Input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="English, Spanish" className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated</p>
              </div>
              <div>
                <Label className="text-xs font-medium">Availability</Label>
                <SearchableSelect
                  className="mt-1"
                  options={AVAILABILITY_OPTIONS}
                  value={form.availability}
                  onChange={v => setForm(f => ({ ...f, availability: v }))}
                  placeholder="Select availability"
                  searchPlaceholder="Search or type..."
                  allowCustom
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Markets */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Target Markets</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Where are the clients you want to work with?</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_MARKETS.map(m => (
                  <button key={m} onClick={() => toggleMarket(m)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedMarkets.includes(m)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}>
                    {m}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">

          {/* Resume Upload */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4 text-primary" />Resume</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("rounded-xl border-2 border-dashed p-6 text-center transition-colors", form.resumeUrl ? "border-emerald-500/30 bg-emerald-500/5" : "border-border hover:border-primary/40")}>
                {form.resumeUrl ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Resume uploaded</p>
                      <p className="text-xs text-muted-foreground">AI is using your resume to personalize outreach</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={() => resumeRef.current?.click()}>Replace</Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Upload your resume</p>
                    <p className="text-xs text-muted-foreground mb-3">AI will extract your skills, experience, and niche automatically</p>
                    <Button variant="outline" size="sm" disabled={uploading} onClick={() => resumeRef.current?.click()}>
                      {uploading ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Uploading & Extracting...</> : "Choose File (.pdf, .doc, .txt)"}
                    </Button>
                  </>
                )}
                <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleResumeUpload} />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Skills</CardTitle>
                <span className="text-xs text-muted-foreground">{selectedSkills.length} selected</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected skills */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg min-h-[42px]">
                  {selectedSkills.map(skill => (
                    <span key={skill} className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                      {skill}
                      <button onClick={() => toggleSkill(skill)} className="hover:opacity-70 transition-opacity ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* Category tabs */}
              <div className="flex gap-1 flex-wrap">
                {Object.keys(SKILL_CATEGORIES).map(cat => (
                  <button key={cat} onClick={() => setActiveSkillTab(cat)}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                      activeSkillTab === cat
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Skills grid */}
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES[activeSkillTab as keyof typeof SKILL_CATEGORIES].map(skill => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      selectedSkills.includes(skill)
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50"
                    )}>
                    {skill}
                  </button>
                ))}
              </div>

              {/* Custom skill input */}
              <div className="flex gap-2">
                <Input value={customSkill} onChange={e => setCustomSkill(e.target.value)} placeholder="Add a custom skill..." className="text-sm" onKeyDown={e => e.key === "Enter" && addCustomSkill()} />
                <Button variant="outline" size="icon" onClick={addCustomSkill} className="shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Rate & Portfolio */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Rate & Portfolio</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Your Rate</Label>
                <div className="flex mt-1 gap-0">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      value={rateAmount}
                      onChange={e => setRateAmount(e.target.value)}
                      placeholder="0"
                      className="pl-7 rounded-r-none"
                    />
                  </div>
                  <Select value={rateType} onValueChange={v => v && setRateType(v)}>
                    <SelectTrigger className="w-28 rounded-l-none border-l-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {rateAmount && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Displayed as: <span className="font-medium text-foreground">${rateAmount}/{rateType}</span>
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium">Portfolio / Past Client URLs</Label>
                <Textarea value={form.portfolioLinks} onChange={e => setForm(f => ({ ...f, portfolioLinks: e.target.value }))} rows={3} placeholder="https://client1.com, https://myportfolio.com/case-study..." className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated URLs</p>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Experience</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} rows={5} placeholder="e.g. 5+ years building Shopify stores for DTC brands. Previously led development at Agency X. Delivered 50+ projects across fashion, health, and tech verticals..." className="resize-none" />
              <p className="text-[10px] text-muted-foreground mt-1.5">Used by AI to write outreach that highlights your relevant background</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile save button */}
      <div className="lg:hidden">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
        </Button>
      </div>
    </div>
  );
}
