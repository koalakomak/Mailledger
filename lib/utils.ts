import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "IDR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency || "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Indonesia bagian barat (WIB / Asia/Jakarta) adalah UTC+7 tanpa DST. */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format tanggal/waktu SELALU dalam zona WIB (Asia/Jakarta), apa pun zona perangkat. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Konversi Date (UTC) menjadi nilai input datetime-local dalam jam WIB. */
export function toWibDateTimeLocal(date: Date | string): string {
  const d = new Date(date);
  const w = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  return (
    w.getUTCFullYear() + "-" + pad(w.getUTCMonth() + 1) + "-" + pad(w.getUTCDate()) +
    "T" + pad(w.getUTCHours()) + ":" + pad(w.getUTCMinutes())
  );
}

/** Parse nilai input datetime-local yang dianggap jam WIB menjadi ISO UTC. */
export function fromWibDateTimeLocal(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return new Date().toISOString();
  const utcMs = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5], 0, 0);
  return new Date(utcMs).toISOString();
}
