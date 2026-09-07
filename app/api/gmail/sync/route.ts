import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { SyncTriggerSchema } from "@/lib/validation/schemas";
import { syncAllActiveSourcesForUser, syncUserSource } from "@/services/transactions/pipeline";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));
  const parsed = SyncTriggerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload" } }, { status: 400 });
  }

  const { sourceId, daysBack } = parsed.data;

  try {
    if (sourceId) {
      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) {
        return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Source not found" } }, { status: 404 });
      }
      const result = await syncUserSource(userId, source.slug, daysBack);
      return NextResponse.json({ success: true, data: [result] });
    } else {
      const results = await syncAllActiveSourcesForUser(userId, daysBack);
      return NextResponse.json({ success: true, data: results });
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: { code: "SYNC_ERROR", message: err.message || "Failed to execute synchronization" },
    }, { status: 500 });
  }
}
