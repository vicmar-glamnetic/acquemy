"use client";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  allowCustom?: boolean;
  /** Fixed dropdown width in px (defaults to matching the trigger). Useful for narrow triggers. */
  menuWidth?: number;
}

type Rect = { top: number; bottom: number; left: number; width: number };

export function SearchableSelect({ options, value, onChange, placeholder = "Select...", searchPlaceholder = "Search...", className, allowCustom = false, menuWidth }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const estimated = 300; // ~ search box + options list height
    setPlacement(spaceBelow < estimated && r.top > spaceBelow ? "top" : "bottom");
    setRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
  }, []);

  // Keep the floating popover aligned to the trigger while open.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            left: Math.max(8, Math.min(rect.left, window.innerWidth - (menuWidth ?? rect.width) - 8)),
            width: menuWidth ?? rect.width,
            minWidth: rect.width,
            ...(placement === "bottom"
              ? { top: rect.bottom + 4 }
              : { bottom: window.innerHeight - rect.top + 4 }),
          }}
          className="z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              onKeyDown={e => {
                if (e.key === "Escape") { setOpen(false); setQuery(""); }
                if (e.key === "Enter" && filtered.length === 1) select(filtered[0]);
                if (e.key === "Enter" && allowCustom && query && filtered.length === 0) select(query);
              }}
            />
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {allowCustom ? (
                  <button onClick={() => select(query)} className="text-primary hover:underline">
                    Use &ldquo;{query}&rdquo;
                  </button>
                ) : "No results found"}
              </div>
            ) : filtered.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => select(option)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  value === option && "bg-primary/10 text-primary"
                )}
              >
                <Check className={cn("w-3.5 h-3.5 shrink-0", value === option ? "opacity-100 text-primary" : "opacity-0")} />
                {option}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
