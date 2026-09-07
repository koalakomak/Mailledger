import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { appendTransactionsToSheet } from "@/services/sheets/syncer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
  });

  if (!transaction) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transaction not found" } }, { status: 404 });
  }

  // Update status to CONFIRMED
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      status: "CONFIRMED",
    },
  });

  // Log confirmation
  await prisma.transactionLog.create({
    data: {
      userId,
      transactionId: transaction.id,
      status: "MANUAL_CONFIRMED",
      message: "Transaction manually confirmed by user",
    },
  });

  // Write to sheets if not yet synced
  let sheetsResult = null;
  try {
    sheetsResult = await appendTransactionsToSheet(userId, [transaction.id]);
  } catch (err: any) {
    console.warn("Could not sync confirmed transaction to Sheets:", err.message);
  }

  return NextResponse.json({
    success: true,
    data: {
      transaction: updated,
      sheetsSync: sheetsResult,
    },
  });
}
