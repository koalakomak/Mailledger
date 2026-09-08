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
  const rules = await prisma.userCategoryRule.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, keyword: true, category: true },
  });
  return NextResponse.json({ success: true, data: rules });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json().catch(() => ({}));
  const keyword = String(body.keyword || "").trim();
  const category = String(body.category || "").trim();

  if (!keyword || keyword.length > 60) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Kata kunci wajib diisi (maks. 60 karakter)" } }, { status: 400 });
  }
  if (!category || category.length > 40) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Kategori wajib diisi (maks. 40 karakter)" } }, { status: 400 });
  }

  const rule = await prisma.userCategoryRule.create({ data: { userId, keyword, category } });

  // Terapkan ke transaksi lama yang cocok agar laporan langsung rapi.
  await prisma.transaction.updateMany({
    where: {
      userId,
      OR: [
        { merchant: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ],
    },
    data: { category },
  });

  return NextResponse.json({ success: true, data: rule }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "ID wajib diisi" } }, { status: 400 });
  }
  await prisma.userCategoryRule.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
