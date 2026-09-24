import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibDayKey(date: Date): string {
  const w = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return w.getUTCFullYear() + "-" + p(w.getUTCMonth() + 1) + "-" + p(w.getUTCDate());
}

/**
 * GET /api/calendar?month=YYYY-MM
 * Mengembalikan total pemasukan/pengeluaran per hari (zona WIB) untuk bulan tersebut.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month") || "";
  const match = monthParam.match(/^(\d{4})-(\d{2})$/);

  const nowWib = new Date(Date.now() + JAKARTA_OFFSET_MS);
  const year = match ? parseInt(match[1], 10) : nowWib.getUTCFullYear();
  const monthIndex = match ? parseInt(match[2], 10) - 1 : nowWib.getUTCMonth();

  // Batas bulan dalam WIB -> dikonversi ke UTC
  const start = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(year, monthIndex + 1, 1, -7, 0, 0, 0));

  const transactions = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: start, lt: endExclusive } },
    select: { id: true, amount: true, type: true, transactionDate: true },
    orderBy: { transactionDate: "asc" },
    take: 5000,
  });

  const days: Record<string, { income: number; expense: number; count: number }> = {};
  let totalIncome = 0;
  let totalExpense = 0;
  let totalCount = 0;

  for (const tx of transactions) {
    const key = wibDayKey(new Date(tx.transactionDate));
    if (!days[key]) days[key] = { income: 0, expense: 0, count: 0 };
    const amount = Number(tx.amount);
    if (tx.type === "INCOME") {
      days[key].income += amount;
      totalIncome += amount;
    } else {
      days[key].expense += amount;
      totalExpense += amount;
    }
    days[key].count += 1;
    totalCount += 1;
  }

  return NextResponse.json({
    success: true,
    data: {
      month: year + "-" + String(monthIndex + 1).padStart(2, "0"),
      days,
      totals: { income: totalIncome, expense: totalExpense, count: totalCount },
    },
  });
}
