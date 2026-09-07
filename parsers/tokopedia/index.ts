import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount, parseTransactionDate } from "../utils";

export class TokopediaParser implements TransactionParser {
  sourceSlug = "tokopedia";

  getSource() {
    return {
      name: "Tokopedia",
      slug: "tokopedia",
      filterQuery: "from:(tokopedia.com OR notification.tokopedia.com) (pembayaran OR pesanan OR transaksi OR invoice)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return sender.includes("tokopedia") || subject.includes("tokopedia");
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 45;

    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (content.match(/dana diteruskan|pengembalian dana|refund berhasil/i)) {
      type = "INCOME";
    }

    const amount = extractAmount(content, [
      /Total\s*(?:Tagihan|Pembayaran|Belanja)?\s*[:=]?\s*(?:Rp\.?|IDR)?\s*([\d.,]+)/i,
    ]);
    if (amount > 0) {
      confidence += 30;
    }

    let merchant = "Tokopedia";
    const shopMatch = content.match(/Nama Toko\s*[:=]\s*([^\n\r<]+)/i) || content.match(/Penjual\s*[:=]\s*([^\n\r<]+)/i);
    if (shopMatch) {
      merchant = `Tokopedia - ${shopMatch[1].trim()}`;
      confidence += 15;
    }

    let transactionDate = email.receivedAt || new Date();
    const parsedDate = parseTransactionDate(content);
    if (parsedDate) transactionDate = parsedDate;
    if (email.sender.toLowerCase().includes("tokopedia.com")) {
      confidence += 10;
    }

    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) confidence = Math.min(confidence, 30);

    return {
      transactionDate,
      description: email.subject || "Tokopedia Order",
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
