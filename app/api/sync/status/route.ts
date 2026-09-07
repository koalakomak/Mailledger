import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const [
    totalTransactions,
    incomeAggregate,
    expenseAggregate,
    pendingReviewCount,
    activeSourcesCount,
    spreadsheetConnection,
    recentTransactions,
  ] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { userId, status: "REVIEW" },
    }),
    prisma.userSource.count({
      where: { userId, isActive: true },
    }),
    prisma.spreadsheetConnection.findFirst({
      where: { userId, isActive: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { source: { select: { name: true, slug: true } } },
      orderBy: { transactionDate: "desc" },
      take: 7,
    }),
  ]);

  const lastSyncedSource = await prisma.userSource.findFirst({
    where: { userId, isActive: true, lastSyncedAt: { not: null } },
    orderBy: { lastSyncedAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        totalTransactions,
        totalIncome: Number(incomeAggregate._sum.amount || 0),
        totalExpense: Number(expenseAggregate._sum.amount || 0),
        pendingReviewCount,
        activeSourcesCount,
        isSheetsConnected: !!spreadsheetConnection,
        lastSyncedAt: lastSyncedSource?.lastSyncedAt || spreadsheetConnection?.lastSyncedAt || null,
      },
      recentTransactions,
    },
  });
}
