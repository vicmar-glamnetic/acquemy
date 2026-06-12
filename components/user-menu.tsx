"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTheme, type Theme } from "@/components/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, LogOut, Sun, Moon, Monitor, ChevronDown, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { key: Theme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "Auto", icon: Monitor },
];

export function UserMenu() {
  const { data: session } = useSession();
  const { theme, setTheme, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-accent transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar className="w-7 h-7">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary font-medium">
            {name.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1.5 z-50"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-medium">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
            role="menuitem"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Profile &amp; Settings
          </Link>

          <div className="px-2.5 py-2">
            <p className="text-xs text-muted-foreground mb-1.5">Appearance</p>
            <div className="flex gap-0.5 rounded-lg bg-secondary p-0.5">
              {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs transition-colors",
                    mounted && theme === key
                      ? "bg-card shadow-sm text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          <button
            onClick={() => { setOpen(false); setConfirmLogout(true); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}

      {/* Logout confirmation */}
      <Dialog open={confirmLogout} onOpenChange={v => !signingOut && setConfirmLogout(v)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Sign out?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be signed out of Acquemy and returned to the login screen.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmLogout(false)} disabled={signingOut}>Cancel</Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => { setSigningOut(true); signOut({ callbackUrl: "/login" }); }}
              disabled={signingOut}
            >
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-1.5" />Sign out</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
