import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PIPELINE_STAGES = ["Discovered", "Contacted", "Discovery Call", "Proposal Sent", "Closing", "Won", "Lost"] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-violet-500/20 text-violet-400",
  warm: "bg-amber-500/20 text-amber-400",
  cold: "bg-slate-500/20 text-slate-400",
  lost: "bg-red-500/20 text-red-400",
};

export function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysSince(d: string | Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
