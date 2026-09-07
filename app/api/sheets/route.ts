import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { listUserSpreadsheets } from "@/services/sheets/syncer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const spreadsheets = await listUserSpreadsheets(userId);
    const activeConnection = await prisma.spreadsheetConnection.findFirst({
      where: { userId, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        spreadsheets,
        activeConnection,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: { code: "SHEETS_API_ERROR", message: err.message || "Failed to list spreadsheets" },
    }, { status: 500 });
  }
}
