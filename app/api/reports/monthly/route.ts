import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateMonthlyReport } from "@/services/reports/monthly";

/**
 * Endpoint rekap bulanan (dipanggil GitHub Actions tiap tanggal 1).
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

  try {
    const activeUsers = await prisma.user.findMany({
      where: { userSources: { some: { isActive: true } } },
      select: { id: true },
    });

    const results = [];
    for (const u of activeUsers) {
      const res = await generateMonthlyReport(u.id);
      results.push({ userId: u.id, sent: res.sent, error: res.error, email: res.email ? res.email.replace(/^(.{3}).*(@.*)$/, "$1***$2") : undefined });
    }

    return NextResponse.json({ success: true, data: { users: activeUsers.length, results } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { code: "REPORT_ERROR", message: err.message || "Gagal membuat rekap bulanan" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
