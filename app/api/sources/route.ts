import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { parserRegistry } from "@/parsers/registry";
import { SourceToggleSchema } from "@/lib/validation/schemas";
import { syncUserSource } from "@/services/transactions/pipeline";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Ensure default sources exist in DB
  const defaultSources = parserRegistry.getAllSources();
  for (const src of defaultSources) {
    await prisma.source.upsert({
      where: { slug: src.slug },
      update: { name: src.name, filterQuery: src.filterQuery, parserType: src.slug },
      create: { name: src.name, slug: src.slug, filterQuery: src.filterQuery, parserType: src.slug },
    });
  }

  const sources = await prisma.source.findMany({
    where: { isActive: true },
    include: {
      userSources: {
        where: { userId },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = sources.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    filterQuery: s.filterQuery,
    isConnected: s.userSources.length > 0 && s.userSources[0].isActive,
    lastSyncedAt: s.userSources[0]?.lastSyncedAt || null,
  }));

  return NextResponse.json({ success: true, data: formatted });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = SourceToggleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: parsed.error.format() } }, { status: 400 });
  }

  const { sourceId, isActive } = parsed.data;

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
  });

  if (!source) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Source not found" } }, { status: 404 });
  }

  const userSource = await prisma.userSource.upsert({
    where: {
      userId_sourceId: {
        userId,
        sourceId,
      },
    },
    update: {
      isActive,
    },
    create: {
      userId,
      sourceId,
      isActive,
    },
  });

  // If newly activated, trigger an initial backfill sync (last 7 days).
  // This is awaited (not fire-and-forget) so serverless functions do not kill
  // the promise right after the response is returned.
  let backfill: unknown = null;
  if (isActive) {
    try {
      backfill = await syncUserSource(userId, source.slug, 7);
    } catch (err: any) {
      backfill = { error: err.message || "Initial backfill failed" };
      console.error(`Initial backfill error for ${source.slug}:`, err);
    }
  }

  return NextResponse.json({ success: true, data: { userSource, backfill } });
}
