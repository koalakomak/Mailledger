import { prisma } from "@/lib/db/prisma";
import { parserRegistry } from "@/parsers/registry";
import { CONFIDENCE_THRESHOLDS, determineStatus, GmailEmail, ParsedTransaction } from "@/parsers/types";
import { fetchEmailsForQuery } from "@/services/gmail/fetcher";
import { appendTransactionsToSheet } from "@/services/sheets/syncer";
import { categorizeTransaction } from "@/lib/categorize";

export interface SyncResult {
  sourceSlug: string;
  totalFetched: number;
  newTransactions: number;
  autoSynced: number;
  reviewRequired: number;
  errors: number;
}

export async function processSingleEmail(
  userId: string,
  sourceId: string,
  sourceSlug: string,
  email: GmailEmail
): Promise<{ transactionId?: string; status: "AUTO" | "REVIEW" | "SKIPPED" | "ERROR"; error?: string }> {
  try {
    // 1. Deduplication check in Database
    const existing = await prisma.transaction.findUnique({
      where: {
        userId_emailMessageId: {
          userId,
          emailMessageId: email.id,
        },
      },
    });

    if (existing) {
      return { transactionId: existing.id, status: "SKIPPED" };
    }

    // 2. Parser resolution
    const parser = parserRegistry.getParser(sourceSlug) || parserRegistry.findParserForEmail(email);
    if (!parser) {
      await prisma.transactionLog.create({
        data: {
          userId,
          status: "PARSER_NOT_FOUND",
          message: `No parser found for email subject: ${email.subject}`,
          payload: { emailId: email.id, sender: email.sender, subject: email.subject },
        },
      });
      return { status: "ERROR", error: "No matching parser found" };
    }

    // 3. Parse Email
    const parsed: ParsedTransaction = await parser.parse(email);

    // 4. Determine status based on confidence
    const status = determineStatus(parsed.confidence);

    // 4b. Reject parses below REVIEW_MIN (e.g. no amount extracted): these are
    // likely not real transactions and would only pollute the review queue.
    if (parsed.confidence < CONFIDENCE_THRESHOLDS.REVIEW_MIN) {
      await prisma.transactionLog.create({
        data: {
          userId,
          status: "LOW_CONFIDENCE",
          message: `Parsed confidence ${parsed.confidence}% is below the ${CONFIDENCE_THRESHOLDS.REVIEW_MIN}% minimum — transaction skipped`,
          payload: {
            emailId: email.id,
            sender: email.sender,
            subject: email.subject,
            confidence: parsed.confidence,
          },
        },
      });
      return { status: "SKIPPED", error: "Below minimum confidence threshold" };
    }

    // 5. Save Transaction to DB (kategori otomatis dari aturan user + default)
    const category = await categorizeTransaction(
      userId,
      parsed.merchant,
      parsed.description,
      parsed.category
    );
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        sourceId,
        emailMessageId: email.id,
        emailThreadId: email.threadId,
        emailSubject: email.subject,
        emailReceivedAt: email.receivedAt,
        transactionDate: parsed.transactionDate,
        description: parsed.description,
        merchant: parsed.merchant,
        type: parsed.type,
        amount: parsed.amount,
        currency: parsed.currency || "IDR",
        category,
        confidence: parsed.confidence,
        status,
        rawData: parsed.rawDetails || {},
      },
    });

    // 6. Log transaction event
    await prisma.transactionLog.create({
      data: {
        userId,
        transactionId: transaction.id,
        status: status === "AUTO" ? "PARSED_AUTO" : "PARSED_REVIEW",
        message: `Transaction parsed with confidence score ${parsed.confidence}% (${status})`,
        payload: {
          amount: parsed.amount,
          merchant: parsed.merchant,
          type: parsed.type,
        },
      },
    });

    return { transactionId: transaction.id, status };
  } catch (err: any) {
    console.error(`Error processing email ${email.id}:`, err);
    await prisma.transactionLog.create({
      data: {
        userId,
        status: "PROCESSING_ERROR",
        message: err.message || "Unknown error during transaction processing",
        payload: { emailId: email.id, stack: err.stack },
      },
    });
    return { status: "ERROR", error: err.message };
  }
}

export async function syncUserSource(
  userId: string,
  sourceSlug: string,
  daysBack: number = 7
): Promise<SyncResult> {
  const source = await prisma.source.findUnique({
    where: { slug: sourceSlug },
  });

  if (!source) {
    throw new Error(`Source '${sourceSlug}' not found in database.`);
  }

  const userSource = await prisma.userSource.findUnique({
    where: {
      userId_sourceId: {
        userId,
        sourceId: source.id,
      },
    },
  });

  if (!userSource || !userSource.isActive) {
    throw new Error(`Source '${source.name}' is not connected or active for this user.`);
  }

  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - daysBack);

  // Fetch emails from Gmail
  const emails = await fetchEmailsForQuery(userId, source.filterQuery, {
    maxResults: 100,
    afterDate,
  });

  let newTransactions = 0;
  let autoSynced = 0;
  let reviewRequired = 0;
  let errors = 0;
  const autoTxIds: string[] = [];

  for (const email of emails) {
    const result = await processSingleEmail(userId, source.id, sourceSlug, email);

    if (result.status === "AUTO" && result.transactionId) {
      newTransactions++;
      autoSynced++;
      autoTxIds.push(result.transactionId);
    } else if (result.status === "REVIEW") {
      newTransactions++;
      reviewRequired++;
    } else if (result.status === "ERROR") {
      errors++;
    }
  }

  // Auto-sync high confidence transactions to Google Sheets if connected
  if (autoTxIds.length > 0) {
    try {
      await appendTransactionsToSheet(userId, autoTxIds);
    } catch (sheetErr) {
      console.warn("Could not auto-write transactions to Google Sheets:", sheetErr);
    }
  }

  // Update last synced at
  await prisma.userSource.update({
    where: { id: userSource.id },
    data: { lastSyncedAt: new Date() },
  });

  return {
    sourceSlug,
    totalFetched: emails.length,
    newTransactions,
    autoSynced,
    reviewRequired,
    errors,
  };
}

export async function syncAllActiveSourcesForUser(userId: string, daysBack: number = 7): Promise<SyncResult[]> {
  const activeSources = await prisma.userSource.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      source: true,
    },
  });

  const results: SyncResult[] = [];
  for (const us of activeSources) {
    try {
      const res = await syncUserSource(userId, us.source.slug, daysBack);
      results.push(res);
    } catch (err: any) {
      console.error(`Failed to sync source ${us.source.slug} for user ${userId}:`, err);
      results.push({
        sourceSlug: us.source.slug,
        totalFetched: 0,
        newTransactions: 0,
        autoSynced: 0,
        reviewRequired: 0,
        errors: 1,
      });
    }
  }

  return results;
}
