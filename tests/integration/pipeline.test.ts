import { describe, it, expect, vi } from "vitest";
import { processSingleEmail } from "@/services/transactions/pipeline";
import { prisma } from "@/lib/db/prisma";
import { GmailEmail } from "@/parsers/types";

// Mock prisma for integration test
vi.mock("@/lib/db/prisma", () => {
  const store = new Map<string, any>();
  return {
    prisma: {
      transaction: {
        findUnique: vi.fn(async ({ where }: any) => {
          const key = `${where.userId_emailMessageId?.userId}_${where.userId_emailMessageId?.emailMessageId}`;
          return store.get(key) || null;
        }),
        create: vi.fn(async ({ data }: any) => {
          const created = { id: `tx-${Date.now()}`, ...data };
          const key = `${data.userId}_${data.emailMessageId}`;
          store.set(key, created);
          return created;
        }),
      },
      transactionLog: {
        create: vi.fn(async ({ data }: any) => ({ id: `log-${Date.now()}`, ...data })),
      },
      source: {
        findUnique: vi.fn(async () => ({ id: "src-bca-id", slug: "bca", name: "BCA" })),
      },
      userCategoryRule: {
        findMany: vi.fn(async () => []),
      },
    },
  };
});

describe("Transaction Processing Pipeline Integration", () => {
  it("should process high confidence email and set status to AUTO", async () => {
    const email: GmailEmail = {
      id: "integration-msg-001",
      subject: "Transaksi QRIS BCA Berhasil",
      sender: "informasi@klikbca.com",
      receivedAt: new Date(),
      plainText: "Pembayaran QRIS BCA Nominal: IDR 50.000,00 Merchant: Starbucks Tanggal: 04/09/2026",
    };

    const result = await processSingleEmail("user-123", "src-bca-id", "bca", email);
    expect(result.status).toBe("AUTO");
    expect(result.transactionId).toBeDefined();
  });

  it("should deduplicate already processed message ID", async () => {
    const email: GmailEmail = {
      id: "integration-msg-001", // duplicate id
      subject: "Transaksi QRIS BCA Berhasil",
      sender: "informasi@klikbca.com",
      receivedAt: new Date(),
      plainText: "Pembayaran QRIS BCA Nominal: IDR 50.000,00 Merchant: Starbucks Tanggal: 04/09/2026",
    };

    const result = await processSingleEmail("user-123", "src-bca-id", "bca", email);
    expect(result.status).toBe("SKIPPED");
  });
});
