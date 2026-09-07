import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount } from "../utils";

export class MandiriParser implements TransactionParser {
  sourceSlug = "mandiri";

  getSource() {
    return {
      name: "Livin' by Mandiri",
      slug: "mandiri",
      filterQuery: "from:(bankmandiri.co.id OR livin.bankmandiri.co.id) (transaksi OR transfer OR debit OR qris OR pembayaran OR resi)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return (
      sender.includes("bankmandiri.co.id") ||
      sender.includes("mandiri") ||
      subject.includes("livin") ||
      subject.includes("mandiri")
    );
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 40;

    // 1. Detect Transaction Type
    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (
      content.match(/dana masuk|transfer masuk|cr|kredit|penerimaan|diterima/i) &&
      !content.match(/transfer ke|pembayaran|debet|db|keluar|beli/i)
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

    // 3. Extract Merchant / Recipient / Description
    let merchant = "Livin' Mandiri Transaction";
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
        content.match(/(?:ke rekening|tujuan|penerima|transfer ke|pembayaran ke)\s*[:=]?\s*([^\n\r<]+)/i);

      if (merchantMatch) {
        merchant = merchantMatch[1].trim().replace(/\s+/g, " ");
        confidence += 15;
      } else if (content.match(/qris/i)) {
        merchant = "QRIS Livin' Mandiri";
        category = "Shopping";
        confidence += 10;
      }
    }

    // 4. Extract Date
    let transactionDate = email.receivedAt || new Date();
    const dateMatch =
      content.match(/tanggal\s*[:=]\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) ||
      content.match(/(\d{2}\s+(?:Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)[a-z]*\s+\d{4})/i);

    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        transactionDate = parsedDate;
        confidence += 15;
      }
    }

    // Sender bonus
    if (email.sender.toLowerCase().includes("bankmandiri.co.id")) {
      confidence += 10;
    }

    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) confidence = Math.min(confidence, 30);

    return {
      transactionDate,
      description: email.subject || "Livin' Mandiri Transaction",
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
