import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { SpreadsheetConnectSchema } from "@/lib/validation/schemas";
import { appendTransactionsToSheet, ensureSheetStructure } from "@/services/sheets/syncer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = SpreadsheetConnectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: parsed.error.format() } }, { status: 400 });
  }

  const { spreadsheetId, sheetName, columnMapping } = parsed.data;

  try {
    // 1. Ensure sheet exists and has headers
    await ensureSheetStructure(userId, spreadsheetId, sheetName);

    // 2. Upsert connection (single active connection per user)
    const existing = await prisma.spreadsheetConnection.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    let connection;
    if (existing) {
      connection = await prisma.spreadsheetConnection.update({
        where: { id: existing.id },
        data: {
          spreadsheetId,
          sheetName,
          columnMapping: columnMapping || {},
          isActive: true,
        },
      });
    } else {
      connection = await prisma.spreadsheetConnection.create({
        data: {
          userId,
          spreadsheetId,
          sheetName,
          columnMapping: columnMapping || {},
          isActive: true,
        },
      });
    }

    // 3. If the target spreadsheet changed (or this is a first connection),
    // reset the sync flag so ALL AUTO/CONFIRMED transactions are (re)written
    // to the new sheet. appendTransactionsToSheet dedupes by email message id,
    // so re-connecting the same spreadsheet stays idempotent.
    if (!existing || existing.spreadsheetId !== spreadsheetId) {
      await prisma.transaction.updateMany({
        where: { userId, status: { in: ["AUTO", "CONFIRMED"] } },
        data: { isSyncedToSheet: false, syncedToSheetAt: null },
      });
    }

    // 4. Sync pending AUTO/CONFIRMED transactions — awaited so the backfill
    // actually completes instead of being killed with the response.
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: { in: ["AUTO", "CONFIRMED"] },
        isSyncedToSheet: false,
      },
      select: { id: true },
    });

    let backfillResult: unknown = null;
    if (pendingTransactions.length > 0) {
      try {
        backfillResult = await appendTransactionsToSheet(
          userId,
          pendingTransactions.map((t) => t.id)
        );
      } catch (err: any) {
        backfillResult = { error: err.message || "Backfill failed" };
        console.error("Backfill sync to sheets error:", err);
      }
    }

    return NextResponse.json({ success: true, data: { connection, backfill: backfillResult } });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: { code: "SHEETS_CONNECT_ERROR", message: err.message || "Failed to connect spreadsheet" },
    }, { status: 500 });
  }
}
