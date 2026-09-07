import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncAllActiveSourcesForUser } from "@/services/transactions/pipeline";

/**
 * Vercel Cron endpoint (see /vercel.json).
 * Optional protection: when CRON_SECRET is set, requests must carry it in the
 * "x-cron-secret" header or as a Bearer token.
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
      where: {
        userSources: {
          some: { isActive: true },
        },
      },
      select: { id: true },
    });

    const results = [];
    for (const user of activeUsers) {
      try {
        const res = await syncAllActiveSourcesForUser(user.id, 1);
        results.push(...res);
      } catch (err: any) {
        results.push({ userId: user.id, error: err.message || "Sync failed" });
      }
    }

    return NextResponse.json({
      success: true,
      data: { usersSynced: activeUsers.length, results },
    });
  } catch (err: any) {
    console.error("Vercel cron sync failed:", err);
    return NextResponse.json({
      success: false,
      error: { code: "CRON_SYNC_ERROR", message: err.message || "Cron sync failed" },
    }, { status: 500 });
  }
}

export const maxDuration = 60;

// Prevent Next.js from statically evaluating this route (and calling Gmail/DB) at build time.
export const dynamic = "force-dynamic";
