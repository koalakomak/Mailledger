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

  const logs = await prisma.transactionLog.findMany({
    where: {
      userId,
      status: { in: ["PROCESSING_ERROR", "PARSER_NOT_FOUND", "ERROR", "LOW_CONFIDENCE"] },
    },
    include: {
      transaction: {
        include: { source: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ success: true, data: logs });
}
