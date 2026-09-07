import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { TransactionUpdateSchema } from "@/lib/validation/schemas";
import { updateTransactionInSheet } from "@/services/sheets/syncer";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
    include: {
      source: true,
      transactionLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: transaction });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" } }, { status: 400 });
  }

  const parsed = TransactionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: parsed.error.format() } }, { status: 400 });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } }, { status: 404 });
  }

  try {
    // Build update data, only include fields that are provided
    const updateData: any = {
      transactionDate: new Date(parsed.data.transactionDate),
      description: parsed.data.description,
      merchant: parsed.data.merchant,
      type: parsed.data.type,
      amount: parsed.data.amount,
      currency: parsed.data.currency || existing.currency,
    };

    // Only update category if provided, otherwise keep existing
    if (parsed.data.category !== undefined) {
      updateData.category = parsed.data.category || null;
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: updateData,
      include: {
        source: {
          select: { name: true, slug: true },
        },
      },
    });

    // Log the edit so we have an audit trail
    await prisma.transactionLog.create({
      data: {
        userId,
        transactionId: updated.id,
        status: "MANUAL_EDIT",
        message: `Transaction manually edited by user`,
        payload: {
          previousAmount: existing.amount.toString(),
          newAmount: parsed.data.amount.toString(),
          previousMerchant: existing.merchant,
          newMerchant: parsed.data.merchant,
        },
      },
    });

    // If the transaction was already written to Google Sheets, keep the
    // spreadsheet row in sync with the edited values instead of leaving a stale row.
    let sheetsSync = null;
    if (existing.isSyncedToSheet) {
      try {
        sheetsSync = await updateTransactionInSheet(userId, updated.id);
        if (sheetsSync === null) {
          // No active connection right now — flag it so the next spreadsheet
          // connection backfill writes the corrected values.
          await prisma.transaction.update({
            where: { id: updated.id },
            data: { isSyncedToSheet: false, syncedToSheetAt: null },
          });
        }
      } catch (err) {
        console.warn("Failed to update edited transaction row in Google Sheets:", err);
        await prisma.transaction
          .update({
            where: { id: updated.id },
            data: { isSyncedToSheet: false, syncedToSheetAt: null },
          })
          .catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true, data: { ...updated, sheetsSync } });
  } catch (err: any) {
    console.error("Failed to update transaction:", err);
    return NextResponse.json({
      success: false,
      error: { code: "UPDATE_ERROR", message: err.message || "Failed to update transaction" },
    }, { status: 500 });
  }
}
