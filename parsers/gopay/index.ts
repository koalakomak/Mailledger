import { GmailEmail, ParsedTransaction, TransactionParser } from "../types";
import { extractAmount } from "../utils";

export class GoPayParser implements TransactionParser {
  sourceSlug = "gopay";

  getSource() {
    return {
      name: "GoPay / Gojek",
      slug: "gopay",
      filterQuery: "from:(gojek.com OR gopay.co.id) (receipt OR pesanan OR transaksi OR bayar OR top up)",
    };
  }

  canParse(email: GmailEmail): boolean {
    const sender = email.sender.toLowerCase();
    const subject = email.subject.toLowerCase();
    return sender.includes("gojek") || sender.includes("gopay") || subject.includes("gopay") || subject.includes("gojek");
  }

  parse(email: GmailEmail): ParsedTransaction {
    const content = `${email.subject}\n${email.plainText || ""}\n${email.html || ""}`;
    let confidence = 45;

    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    if (content.match(/top up berhasil|menerima saldo|transfer masuk/i)) {
      type = "INCOME";
    }

    const amount = extractAmount(content, [
      /Total\s*(?:Pembayaran|Bayar|Biaya|Amount)?\s*[:=]?\s*(?:Rp\.?|IDR)?\s*([\d.,]+)/i,
    ]);
    if (amount > 0) {
      confidence += 30;
    }

    let merchant = "GoPay Transaction";
    let category = "Transportation / Food";

    if (content.match(/gofood/i)) {
      category = "Food & Beverage";
      merchant = "GoFood Order";
    } else if (content.match(/goride|gocar/i)) {
      category = "Transportation";
      merchant = "GoRide / GoCar Trip";
    } else if (content.match(/gomart|gomed/i)) {
      category = "Groceries";
      merchant = "GoMart Shopping";
    }

    const restaurantMatch = content.match(/Restoran\s*[:=]\s*([^\n\r<]+)/i) || content.match(/Mitra\s*[:=]\s*([^\n\r<]+)/i);
    if (restaurantMatch) {
      merchant = restaurantMatch[1].trim();
      confidence += 15;
    }

    let transactionDate = email.receivedAt || new Date();
    if (email.sender.toLowerCase().includes("gojek.com")) {
      confidence += 10;
    }

    confidence = Math.min(100, Math.max(0, confidence));
    if (amount <= 0) confidence = Math.min(confidence, 30);

    return {
      transactionDate,
      description: email.subject || "GoPay Transaction",
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
