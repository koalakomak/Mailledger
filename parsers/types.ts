export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionStatus = "AUTO" | "REVIEW" | "CONFIRMED" | "REJECTED";

export interface GmailEmail {
  id: string;
  threadId?: string;
  subject: string;
  sender: string;
  receivedAt: Date;
  snippet?: string;
  plainText?: string;
  html?: string;
}

export interface ParsedTransaction {
  transactionDate: Date;
  description: string;
  merchant: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category?: string;
  confidence: number; // 0 - 100
  rawDetails?: Record<string, any>;
}

export interface TransactionParser {
  sourceSlug: string;
  canParse(email: GmailEmail): boolean;
  parse(email: GmailEmail): Promise<ParsedTransaction> | ParsedTransaction;
  getSource(): {
    name: string;
    slug: string;
    filterQuery: string;
  };
}

export const CONFIDENCE_THRESHOLDS = {
  AUTO_MIN: 80,
  REVIEW_MIN: 60,
};

export function determineStatus(confidence: number): "AUTO" | "REVIEW" {
  return confidence >= CONFIDENCE_THRESHOLDS.AUTO_MIN ? "AUTO" : "REVIEW";
}
