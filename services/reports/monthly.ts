import { prisma } from "@/lib/db/prisma";
import { getGmailClient } from "@/lib/google/client";

const MONTH_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Rentang bulan lalu dalam WIB (Asia/Jakarta). */
function prevMonthRangeWib(now: Date = new Date()): { start: Date; endExclusive: Date } {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = wib.getUTCFullYear();
  const m = wib.getUTCMonth();
  const py = m === 0 ? y - 1 : y;
  const pm = m === 0 ? 11 : m - 1;
  const start = new Date(Date.UTC(py, pm, 1, 0 - 7, 0, 0));
  const endExclusive = new Date(Date.UTC(y, m, 1, 0 - 7, 0, 0));
  return { start, endExclusive };
}

function monthLabel(range: { start: Date }): string {
  const wib = new Date(range.start.getTime() + 7 * 60 * 60 * 1000);
  return MONTH_ID[wib.getUTCMonth()] + " " + wib.getUTCFullYear();
}

function fmtRp(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface MonthlyReportResult {
  userId: string;
  email?: string;
  month?: string;
  totalIncome?: number;
  totalExpense?: number;
  sent?: boolean;
  error?: string;
}

export async function generateMonthlyReport(userId: string): Promise<MonthlyReportResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return { userId, error: "User tidak ditemukan" };

  const range = prevMonthRangeWib();
  const where = {
    userId,
    transactionDate: { gte: range.start, lt: range.endExclusive },
  };

  const [incomeAgg, expenseAgg, byCategory, totalCount] = await Promise.all([
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
  ]);

  const totalIncome = Number(incomeAgg._sum.amount || 0);
  const totalExpense = Number(expenseAgg._sum.amount || 0);
  const month = monthLabel(range);

  const catRows = byCategory
    .filter((c) => c.category && Number(c._sum.amount) > 0)
    .map((c, i) => {
      const color = i === 0 ? "#10b981" : "#94a3b8";
      return (
        "<tr>" +
        '<td style="padding:6px 10px;color:#334155;">' + esc(c.category || "Lainnya") + "</td>" +
        '<td style="padding:6px 10px;text-align:right;color:' + color + ';font-weight:600;">' + fmtRp(Number(c._sum.amount)) + "</td>" +
        "</tr>"
      );
    })
    .join("");

  const html =
    "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;\">" +
    "<h2 style=\"color:#0f172a;\">Ringkasan Keuangan MailLedger</h2>" +
    "<p style=\"color:#64748b;\">Periode <strong>" + esc(month) + "</strong></p>" +
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
    '<tr><td style="padding:8px 10px;background:#f1f5f9;border-radius:8px;">Pemasukan</td><td style="padding:8px 10px;text-align:right;font-weight:700;color:#059669;">' + fmtRp(totalIncome) + "</td></tr>" +
    '<tr><td style="padding:8px 10px;background:#fef2f2;border-radius:8px;">Pengeluaran</td><td style="padding:8px 10px;text-align:right;font-weight:700;color:#e11d48;">' + fmtRp(totalExpense) + "</td></tr>" +
    '<tr><td style="padding:8px 10px;">Total transaksi</td><td style="padding:8px 10px;text-align:right;color:#334155;">' + totalCount + "</td></tr>" +
    "</table>" +
    (catRows ? "<h4 style=\"color:#0f172a;\">Kategori Pengeluaran Terbesar</h4><table style=\"width:100%;border-collapse:collapse;\">" + catRows + "</table>" : "") +
    '<p style="color:#94a3b8;font-size:12px;margin-top:20px;">Dikirim otomatis oleh MailLedger.</p>' +
    "</div>";

  return sendMonthlyEmail(user.id, user.email, month, html, { totalIncome, totalExpense, month, userId: user.id, email: user.email });
}

async function sendMonthlyEmail(
  userId: string,
  to: string,
  month: string,
  html: string,
  base: MonthlyReportResult
): Promise<MonthlyReportResult> {
  try {
    const { gmail } = await getGmailClient(userId);
    const from = to;
    const subject = "Ringkasan Keuangan MailLedger — " + month;
    const headers =
      "To: " + to + "\r\n" +
      "From: " + from + "\r\n" +
      "Subject: " + subject + "\r\n" +
      "MIME-Version: 1.0\r\n" +
      "Content-Type: text/html; charset=utf-8\r\n\r\n";
    const raw = Buffer.from(headers + html, "utf-8").toString("base64url");
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    return { ...base, sent: true };
  } catch (e: any) {
    console.warn("Gagal mengirim rekap bulanan untuk " + to + ":", e.message);
    return { ...base, sent: false, error: e.message || "Gagal mengirim" };
  }
}
