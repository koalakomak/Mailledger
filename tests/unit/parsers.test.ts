import { describe, it, expect } from "vitest";
import { BCAParser } from "@/parsers/bca";
import { GoPayParser } from "@/parsers/gopay";
import { OVOParser } from "@/parsers/ovo";
import { ShopeeParser } from "@/parsers/shopee";
import { TokopediaParser } from "@/parsers/tokopedia";
import { parserRegistry } from "@/parsers/registry";
import * as parserUtils from "@/parsers/utils";
import { GmailEmail } from "@/parsers/types";

describe("Transaction Parsers Suite", () => {
  describe("BCA Parser", () => {
    const parser = new BCAParser();

    it("should parse BCA QRIS payment successfully", () => {
      const email: GmailEmail = {
        id: "bca-msg-001",
        subject: "Transaksi QRIS BCA Berhasil",
        sender: "informasi@klikbca.com",
        receivedAt: new Date("2026-09-01T10:00:00Z"),
        plainText: `
          Pembayaran QRIS BCA Anda telah berhasil.
          Nominal: IDR 75.000,00
          Merchant: Kopi Kenangan Mall
          Tanggal: 01/09/2026
        `,
      };

      expect(parser.canParse(email)).toBe(true);
      const result = parser.parse(email);
      expect(result.amount).toBe(75000);
      expect(result.type).toBe("EXPENSE");
      expect(result.merchant).toContain("Kopi Kenangan");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it("should parse BCA Transfer Masuk (Income)", () => {
      const email: GmailEmail = {
        id: "bca-msg-002",
        subject: "Notifikasi Dana Masuk Rekening BCA",
        sender: "informasi@klikbca.com",
        receivedAt: new Date("2026-09-02T14:30:00Z"),
        plainText: `
          Transfer Masuk ke Rekening Anda
          Jumlah: Rp 2.500.000,00
          Dari Rekening: PT MAJU BERSAMA
          Tanggal: 02/09/2026
        `,
      };

      const result = parser.parse(email);
      expect(result.amount).toBe(2500000);
      expect(result.type).toBe("INCOME");
      expect(result.merchant).toContain("PT MAJU BERSAMA");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe("GoPay Parser", () => {
    const parser = new GoPayParser();

    it("should parse GoFood receipt", () => {
      const email: GmailEmail = {
        id: "gopay-msg-001",
        subject: "Struk Pembelian GoFood Anda",
        sender: "no-reply@gojek.com",
        receivedAt: new Date("2026-09-03T12:00:00Z"),
        plainText: `
          Terima kasih telah memesan GoFood!
          Restoran: Nasi Goreng Kambing Kebon Sirih
          Total Pembayaran: Rp 64.000
        `,
      };

      expect(parser.canParse(email)).toBe(true);
      const result = parser.parse(email);
      expect(result.amount).toBe(64000);
      expect(result.type).toBe("EXPENSE");
      expect(result.merchant).toBe("Nasi Goreng Kambing Kebon Sirih");
      expect(result.category).toBe("Food & Beverage");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe("OVO Parser", () => {
    const parser = new OVOParser();

    it("should parse OVO Merchant Payment", () => {
      const email: GmailEmail = {
        id: "ovo-msg-001",
        subject: "Bukti Transaksi OVO",
        sender: "notification@ovo.id",
        receivedAt: new Date("2026-09-03T15:00:00Z"),
        plainText: `
          Transaksi OVO Berhasil
          Merchant: Gramedia Bookstore
          Total Transaksi: Rp 120.000
        `,
      };

      expect(parser.canParse(email)).toBe(true);
      const result = parser.parse(email);
      expect(result.amount).toBe(120000);
      expect(result.type).toBe("EXPENSE");
      expect(result.merchant).toBe("Gramedia Bookstore");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Shopee Parser", () => {
    const parser = new ShopeeParser();

    it("should parse Shopee Order Confirmation", () => {
      const email: GmailEmail = {
        id: "shopee-msg-001",
        subject: "Pembayaran Pesanan Shopee Berhasil",
        sender: "info@order.shopee.co.id",
        receivedAt: new Date("2026-09-04T09:00:00Z"),
        plainText: `
          Pesanan Anda telah dibayar.
          Nama Toko: Official Gadget Store
          Total Pembayaran: Rp 350.000
        `,
      };

      expect(parser.canParse(email)).toBe(true);
      const result = parser.parse(email);
      expect(result.amount).toBe(350000);
      expect(result.type).toBe("EXPENSE");
      expect(result.merchant).toContain("Official Gadget Store");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Tokopedia Parser", () => {
    const parser = new TokopediaParser();

    it("should parse Tokopedia Order Confirmation", () => {
      const email: GmailEmail = {
        id: "tokopedia-msg-001",
        subject: "Pembayaran Terverifikasi untuk Pesanan Tokopedia",
        sender: "notification@tokopedia.com",
        receivedAt: new Date("2026-09-04T11:00:00Z"),
        plainText: `
          Pembayaran Anda telah kami terima.
          Nama Toko: Toko Buku Cemerlang
          Total Tagihan: Rp 89.000
        `,
      };

      expect(parser.canParse(email)).toBe(true);
      const result = parser.parse(email);
      expect(result.amount).toBe(89000);
      expect(result.type).toBe("EXPENSE");
      expect(result.merchant).toContain("Toko Buku Cemerlang");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Parser Registry", () => {
    it("should find appropriate parser based on sender/content", () => {
      const bcaEmail: GmailEmail = {
        id: "bca-msg-99",
        subject: "Notifikasi BCA",
        sender: "ebanking@bca.co.id",
        receivedAt: new Date(),
      };

      const parser = parserRegistry.findParserForEmail(bcaEmail);
      expect(parser).toBeDefined();
      expect(parser?.sourceSlug).toBe("bca");
    });
  });

  describe("Amount & Date utilities", () => {
    it("should parse small IDR amounts correctly", () => {
      expect(parserUtils.normalizeAmount("10,00")).toBe(10);
      expect(parserUtils.normalizeAmount("100,00")).toBe(100);
      expect(parserUtils.normalizeAmount("2,00")).toBe(2);
      expect(parserUtils.normalizeAmount("1.000,00")).toBe(1000);
      expect(parserUtils.normalizeAmount("10.000,00")).toBe(10000);
      expect(parserUtils.normalizeAmount("75.000,00")).toBe(75000);
    });

    it("should parse Indonesian date/time to UTC", () => {
      const d = parserUtils.parseTransactionDate("Tanggal 5 Sep 2026 Jam 01:10:59 WIB");
      expect(d).not.toBeNull();
      // 01:10:59 WIB == 18:10:59 UTC on the previous day
      expect(d!.toISOString()).toBe("2026-09-04T18:10:59.000Z");

      const d2 = parserUtils.parseTransactionDate("Tanggal: 01/09/2026");
      expect(d2!.toISOString()).toBe("2026-08-31T17:00:00.000Z"); // 01 Sep 00:00 WIB -> 31 Aug 17:00 UTC

      expect(parserUtils.parseTransactionDate("tidak ada tanggal")).toBeNull();
    });
  });
});
