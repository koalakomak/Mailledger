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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { summaryDaily: true, summaryWeekly: true, summaryMonthly: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      summaryDaily: user?.summaryDaily ?? false,
      summaryWeekly: user?.summaryWeekly ?? false,
      summaryMonthly: user?.summaryMonthly ?? true,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json().catch(() => ({}));
  const data: { summaryDaily?: boolean; summaryWeekly?: boolean; summaryMonthly?: boolean } = {};

  for (const key of ["summaryDaily", "summaryWeekly", "summaryMonthly"] as const) {
    if (typeof body[key] === "boolean") data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Tidak ada preferensi yang dikirim" } }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { summaryDaily: true, summaryWeekly: true, summaryMonthly: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
