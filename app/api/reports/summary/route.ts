import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendSummaryReport, type SummaryPeriod } from "@/services/reports/summary";

const PERIODS: SummaryPeriod[] = ["daily", "weekly", "monthly"];

/**
 * Endpoint ringkasan otomatis (dipanggil GitHub Actions).
 * Hanya mengirim ke pengguna yang mengaktifkan opsi terkait di Pengaturan.
 * Dilindungi CRON_SECRET (header x-cron-secret) bila diatur.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const supplied =
      req.headers.get("x-cron-secret") ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (supplied !== secret) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "daily") as SummaryPeriod;
  if (!PERIODS.includes(period)) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "period harus daily, weekly, atau monthly" } }, { status: 400 });
  }

  const optInField =
    period === "daily" ? { summaryDaily: true } : period === "weekly" ? { summaryWeekly: true } : { summaryMonthly: true };

  try {
    const users = await prisma.user.findMany({
      where: { ...optInField, userSources: { some: { isActive: true } } },
      select: { id: true },
    });

    const results = [];
    for (const u of users) {
      const res = await sendSummaryReport(u.id, period);
      results.push({
        userId: u.id,
        sent: res.sent,
        error: res.error,
        email: res.email ? res.email.replace(/^(.{3}).*(@.*)$/, "$1***$2") : undefined,
      });
    }

    return NextResponse.json({ success: true, data: { period, users: users.length, results } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { code: "SUMMARY_ERROR", message: err.message || "Gagal mengirim ringkasan" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
