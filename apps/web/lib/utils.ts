import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nowJstIso(): string {
  // Asia/Tokyo の現地時刻要素を組み立てる（Date自体は UTC 基準だが toISOString のように Z へ変換しない）
  const d = new Date();
  const fmt = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return `${fmt.year}-${fmt.month}-${fmt.day}T${fmt.hour}:${fmt.minute}:${fmt.second}.${ms}+09:00`;
}