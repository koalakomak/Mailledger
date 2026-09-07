import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount, parseTransactionDate } from "../utils";

export class ShopeeParser implements TransactionParser {
  sourceSlug = "shopee";

  getSource() {
    return {
      name: "Shopee / ShopeePay",
      slug: "shopee",
      filterQuery: "from:(shopee.co.id OR order.shopee.co.id) (pesanan OR pembayaran OR shopeepay OR transaksi)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return sender.includes("shopee") || subject.includes("shopee");
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 45;

    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (content.match(/dana dikembalikan|pengembalian dana|transfer masuk/i)) {
      type = "INCOME";
    }

    const amount = extractAmount(content, [
      /Total\s*(?:Pesanan|Pembayaran|Bayar)?\s*[:=]?\s*(?:Rp\.?|IDR)?\s*([\d.,]+)/i,
    ]);
    if (amount > 0) {
      confidence += 30;
    }

    let merchant = "Shopee";
    const shopMatch = content.match(/Nama Toko\s*[:=]\s*([^\n\r<]+)/i) || content.match(/Penjual\s*[:=]\s*([^\n\r<]+)/i);
    if (shopMatch) {
      merchant = `Shopee - ${shopMatch[1].trim()}`;
      confidence += 15;
    }

    let transactionDate = email.receivedAt || new Date();
    const parsedDate = parseTransactionDate(content);
    if (parsedDate) transactionDate = parsedDate;
    if (email.sender.toLowerCase().includes("shopee.co.id")) {
      confidence += 10;
    }

    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) confidence = Math.min(confidence, 30);

    return {
      transactionDate,
      description: email.subject || "Shopee Order",
      merchant: merchant.slice(0, 100),
      type,
      amount,
      currency: "IDR",
      category: "Online Shopping",
      confidence,
      rawDetails: {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
      },
    };
  }
}
