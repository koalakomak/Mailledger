import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount, parseTransactionDate } from "../utils";

export class BCAParser implements TransactionParser {
  sourceSlug = "bca";

  getSource() {
    return {
      name: "Bank Central Asia (BCA)",
      slug: "bca",
      filterQuery: "from:(klikbca.com OR bca.co.id) (transaksi OR transfer OR pembayaran OR QRIS OR debit)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return (
      sender.includes("klikbca") ||
      sender.includes("bca.co.id") ||
      subject.includes("bca") ||
      subject.includes("klikbca")
    );
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 40;

    // 1. Detect Transaction Type
    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (
      content.match(/dana masuk|transfer masuk|cr|kredit|penerimaan|diterima/i) &&
      !content.match(/transfer ke|pembayaran|debet|db|keluar/i)
    ) {
      type = "INCOME";
    }

    // 2. Extract Amount
    const amount = extractAmount(content);
    let confidence_amount = 0;
    if (amount > 0) {
      confidence_amount = 30;
    }
    confidence += confidence_amount;

    // 3. Extract Merchant / Beneficiary / Description
    let merchant = "BCA Transaction";
    let category = "Financial Services";

    if (type === "INCOME") {
      const senderMatch = content.match(/(?:dari rekening|pengirim|dari)\s*[:=]?\s*([^\n\r<]+)/i);
      if (senderMatch) {
        merchant = senderMatch[1].trim().replace(/\s+/g, " ");
        confidence += 15;
      }
    } else {
      const merchantMatch =
        content.match(/(?:merchant|merchant name|nama merchant)\s*[:=]\s*([^\n\r<]+)/i) ||
        content.match(/(?:ke rekening|tujuan|penerima|transfer ke)\s*[:=]?\s*([^\n\r<]+)/i);

      if (merchantMatch) {
        merchant = merchantMatch[1].trim().replace(/\s+/g, " ");
        confidence += 15;
      } else if (content.match(/qris/i)) {
        merchant = "QRIS BCA Payment";
        category = "Shopping";
        confidence += 10;
      }
    }

    // 4. Extract Date
    let transactionDate = email.receivedAt || new Date();
    const parsedDate = parseTransactionDate(content);
    if (parsedDate) {
      transactionDate = parsedDate;
      confidence += 15;
    }

    // Sender bonus
    if (email.sender.toLowerCase().includes("klikbca.com") || email.sender.toLowerCase().includes("bca.co.id")) {
      confidence += 10;
    }

    // Final Confidence clamping
    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) {
      confidence = Math.min(confidence, 30);
    }

    return {
      transactionDate,
      description: email.subject || "BCA Transaction",
      merchant: merchant.slice(0, 100),
      type,
      amount,
      currency: "IDR",
      category,
      confidence,
      rawDetails: {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
      },
    };
  }
}
