import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sourceSlug = searchParams.get("source");
  const query = searchParams.get("q");
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "25", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 100) : 25;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (sourceSlug && sourceSlug !== "ALL") {
    where.source = { slug: sourceSlug };
  }

  if (query) {
    where.OR = [
      { merchant: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
    ];
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        source: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { transactionDate: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
