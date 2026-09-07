import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount, parseTransactionDate } from "../utils";

export class OVOParser implements TransactionParser {
  sourceSlug = "ovo";

  getSource() {
    return {
      name: "OVO",
      slug: "ovo",
      filterQuery: "from:(ovo.id) (transaksi OR struk OR pembayaran OR transfer OR receipt)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return sender.includes("ovo.id") || subject.includes("ovo");
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 45;

    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (content.match(/top up berhasil|transfer masuk|cashback/i)) {
      type = "INCOME";
    }

    const amount = extractAmount(content, [
      /Total\s*(?:Transaksi|Bayar)?\s*[:=]?\s*(?:Rp\.?|IDR)?\s*([\d.,]+)/i,
    ]);
    if (amount > 0) {
      confidence += 30;
    }

    let merchant = "OVO Payment";
    const merchantMatch = content.match(/Merchant\s*[:=]\s*([^\n\r<]+)/i) || content.match(/Penerima\s*[:=]\s*([^\n\r<]+)/i);
    if (merchantMatch) {
      merchant = merchantMatch[1].trim();
      confidence += 15;
    }

    let transactionDate = email.receivedAt || new Date();
    const parsedDate = parseTransactionDate(content);
    if (parsedDate) transactionDate = parsedDate;
    if (email.sender.toLowerCase().includes("ovo.id")) {
      confidence += 10;
    }

    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) confidence = Math.min(confidence, 30);

    return {
      transactionDate,
      description: email.subject || "OVO Payment",
      merchant: merchant.slice(0, 100),
      type,
      amount,
      currency: "IDR",
      category: "Digital Wallet",
      confidence,
      rawDetails: {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
      },
    };
  }
}
