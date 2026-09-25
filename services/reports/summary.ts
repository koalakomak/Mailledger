import { prisma } from "@/lib/db/prisma";
import { getGmailClient } from "@/lib/google/client";

export type SummaryPeriod = "daily" | "weekly" | "monthly";

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function wibParts(date: Date) {
  const w = new Date(date.getTime() + TZ_OFFSET_MS);
  return {
    y: w.getUTCFullYear(),
    m: w.getUTCMonth(),
    d: w.getUTCDate(),
    dow: w.getUTCDay(),
  };
}

/** Rentang periode dalam WIB (start inklusif, end eksklusif). */
function periodRangeWib(period: SummaryPeriod, now: Date = new Date()): { start: Date; endExclusive: Date } {
  const { y, m, d } = wibParts(now);

  if (period === "daily") {
    return {
      start: new Date(Date.UTC(y, m, d, -7, 0, 0)),
      endExclusive: new Date(Date.UTC(y, m, d + 1, -7, 0, 0)),
    };
  }

  if (period === "weekly") {
    return {
      start: new Date(Date.UTC(y, m, d - 6, -7, 0, 0)),
      endExclusive: new Date(Date.UTC(y, m, d + 1, -7, 0, 0)),
    };
  }

  // monthly: bulan kalender sebelumnya
  const py = m === 0 ? y - 1 : y;
  const pm = m === 0 ? 11 : m - 1;
  return {
    start: new Date(Date.UTC(py, pm, 1, -7, 0, 0)),
    endExclusive: new Date(Date.UTC(y, m, 1, -7, 0, 0)),
  };
}

function periodLabel(period: SummaryPeriod, range: { start: Date; endExclusive: Date }): string {
  const fmt = (dt: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...opts }).format(dt);

  if (period === "daily") {
    const p = wibParts(range.start);
    return DAY_ID[p.dow] + ", " + fmt(range.start, { day: "numeric", month: "long", year: "numeric" });
  }
  if (period === "weekly") {
    const end = new Date(range.endExclusive.getTime() - 24 * 60 * 60 * 1000);
    return fmt(range.start, { day: "numeric", month: "short" }) + " - " + fmt(end, { day: "numeric", month: "short", year: "numeric" });
  }
  return fmt(new Date(range.start.getTime() + 3 * 24 * 60 * 60 * 1000), { month: "long", year: "numeric" });
}

function fmtRp(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(d);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface SummaryResult {
  userId: string;
  email?: string;
  period: SummaryPeriod;
  label?: string;
  totalIncome?: number;
  totalExpense?: number;
  transactionCount?: number;
  sent?: boolean;
  error?: string;
}

/** Kirim ringkasan keuangan untuk periode tertentu lewat email pengguna sendiri. */
export async function sendSummaryReport(
  userId: string,
  period: SummaryPeriod,
  now: Date = new Date()
): Promise<SummaryResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return { userId, period, error: "User tidak ditemukan" };

  const range = periodRangeWib(period, now);
  const where = { userId, transactionDate: { gte: range.start, lt: range.endExclusive } };
  const label = periodLabel(period, range);

  const [incomeAgg, expenseAgg, byCategory, totalCount, items] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...where, type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...where, type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.transaction.count({ where }),
    period === "daily"
      ? prisma.transaction.findMany({
          where,
          orderBy: { transactionDate: "asc" },
          take: 25,
          select: { merchant: true, amount: true, type: true, transactionDate: true, category: true },
        })
      : Promise.resolve([] as any[]),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount || 0);
  const totalExpense = Number(expenseAgg._sum.amount || 0);

  const catRows = byCategory
    .filter((c) => c.category && Number(c._sum.amount) > 0)
    .map((c, i) => {
      const color = i === 0 ? "#0f766e" : "#64748b";
      return (
        "<tr>" +
        '<td style="padding:6px 10px;color:#334155;">' + esc(c.category || "Lainnya") + "</td>" +
        '<td style="padding:6px 10px;text-align:right;color:' + color + ';font-weight:600;">' + fmtRp(Number(c._sum.amount)) + "</td>" +
        "</tr>"
      );
    })
    .join("");

  const itemRows = items
    .map((t: any) => {
      const sign = t.type === "INCOME" ? "+" : "-";
      const color = t.type === "INCOME" ? "#059669" : "#e11d48";
      return (
        "<tr>" +
        '<td style="padding:6px 10px;color:#334155;">' + esc(t.merchant) +
        '<div style="font-size:11px;color:#94a3b8;">' + esc(t.category || "Tanpa kategori") + " · " + fmtTime(new Date(t.transactionDate)) + " WIB</div></td>" +
        '<td style="padding:6px 10px;text-align:right;color:' + color + ';font-weight:600;white-space:nowrap;">' + sign + fmtRp(Number(t.amount)) + "</td>" +
        "</tr>"
      );
    })
    .join("");

  const periodWord = period === "daily" ? "Hari Ini" : period === "weekly" ? "7 Hari Terakhir" : "Bulan Lalu";

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;">' +
    '<h2 style="color:#0f172a;margin-bottom:4px;">Ringkasan Keuangan MailLedger</h2>' +
    '<p style="color:#64748b;margin-top:0;">' + periodWord + " · <strong>" + esc(label) + "</strong></p>" +
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
    '<tr><td style="padding:8px 10px;background:#ecfdf5;border-radius:8px;">Pemasukan</td><td style="padding:8px 10px;text-align:right;font-weight:700;color:#059669;">' + fmtRp(totalIncome) + "</td></tr>" +
    '<tr><td style="padding:8px 10px;background:#fef2f2;border-radius:8px;">Pengeluaran</td><td style="padding:8px 10px;text-align:right;font-weight:700;color:#e11d48;">' + fmtRp(totalExpense) + "</td></tr>" +
    '<tr><td style="padding:8px 10px;">Total transaksi</td><td style="padding:8px 10px;text-align:right;color:#334155;">' + totalCount + "</td></tr>" +
    "</table>" +
    (itemRows ? '<h4 style="color:#0f172a;margin-bottom:4px;">Rincian Transaksi</h4><table style="width:100%;border-collapse:collapse;">' + itemRows + "</table>" : "") +
    (catRows ? '<h4 style="color:#0f172a;margin:16px 0 4px;">Kategori Pengeluaran Terbesar</h4><table style="width:100%;border-collapse:collapse;">' + catRows + "</table>" : "") +
    (totalCount === 0 ? '<p style="color:#64748b;">Belum ada transaksi pada periode ini.</p>' : "") +
    '<p style="color:#94a3b8;font-size:12px;margin-top:20px;">Dikirim otomatis oleh MailLedger. Atur frekuensi di halaman Pengaturan aplikasi.</p>' +
    "</div>";

  const subject = "Ringkasan " + periodWord + " MailLedger — " + label;

  try {
    const { gmail } = await getGmailClient(userId);
    const headers =
      "To: " + user.email + "\r\n" +
      "From: " + user.email + "\r\n" +
      "Subject: " + subject + "\r\n" +
      "MIME-Version: 1.0\r\n" +
      "Content-Type: text/html; charset=utf-8\r\n\r\n";
    const raw = Buffer.from(headers + html, "utf-8").toString("base64url");
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    return {
      userId, email: user.email, period, label,
      totalIncome, totalExpense, transactionCount: totalCount, sent: true,
    };
  } catch (e: any) {
    console.warn("Gagal mengirim ringkasan " + period + " untuk " + user.email + ":", e.message);
    return {
      userId, email: user.email, period, label,
      totalIncome, totalExpense, transactionCount: totalCount,
      sent: false, error: e.message || "Gagal mengirim",
    };
  }
}

/** Kompatibilitas: ringkasan bulanan (bulan lalu). */
export async function generateMonthlyReport(userId: string): Promise<SummaryResult> {
  return sendSummaryReport(userId, "monthly");
}
