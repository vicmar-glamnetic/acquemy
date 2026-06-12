"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GitBranch, Mail, Globe, MessageSquare,
  DollarSign, Bell, Zap, BarChart3, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/prospects", icon: Users, label: "Prospects" },
  { href: "/pipeline", icon: GitBranch, label: "Pipeline" },
  { href: "/outreach", icon: Mail, label: "Outreach" },
  { href: "/platforms", icon: Globe, label: "Platforms" },
  { href: "/objections", icon: MessageSquare, label: "Objections" },
  { href: "/pricing", icon: DollarSign, label: "Pricing" },
  { href: "/followup", icon: Bell, label: "Follow-Up" },
  { href: "/automation", icon: Zap, label: "Automation" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 h-screen flex flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">Acquemy</span>
            <span className="text-[10px] text-muted-foreground block leading-none">.ai</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              pathname === href
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
