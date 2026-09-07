import { getSheetsClient } from "@/lib/google/client";
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_SHEET_HEADERS = [
  "Tanggal",
  "Deskripsi",
  "Merchant",
  "Tipe",
  "Jumlah",
  "Mata Uang",
  "Kategori",
  "Sumber",
  "ID Email",
];

/**
 * Format a date in an unambiguous, locale-independent order (YYYY-MM-DD HH:mm:ss)
 * so Google Sheets parses it identically regardless of the spreadsheet locale.
 * The previous id-ID format ("dd/mm/yyyy hh.mm") was ambiguous under USER_ENTERED
 * (e.g. 04/09/2026 became April 9th in an en-US spreadsheet).
 */
function formatSheetDate(date: Date): string {
  // Tulis jam dalam zona WIB (UTC+7) secara konsisten, apa pun zona server.
  const w = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())} ${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}:${pad(w.getUTCSeconds())}`;
}

function buildTransactionRow(tx: {
  transactionDate: Date;
  description: string;
  merchant: string;
  type: string;
  amount: { toString(): string } | number | string;
  currency: string;
  category: string | null;
  emailMessageId: string;
  source: { name: string };
}): (string | number)[] {
  return [
    formatSheetDate(tx.transactionDate),
    tx.description,
    tx.merchant,
    tx.type,
    Number(tx.amount),
    tx.currency,
    tx.category || "General",
    tx.source.name,
    tx.emailMessageId,
  ];
}

export async function listUserSpreadsheets(userId: string) {
  const { drive } = await getSheetsClient(userId);

  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 30,
  });

  return res.data.files || [];
}

export async function ensureSheetStructure(
  userId: string,
  spreadsheetId: string,
  sheetName: string = "Transactions"
) {
  const { sheets } = await getSheetsClient(userId);

  // 1. Get spreadsheet metadata to check if worksheet exists
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const existingSheet = meta.data.sheets?.find(
    (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
  );

  if (!existingSheet) {
    // Create new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  // 2. Check if headers exist in row 1
  const headerCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:I1`,
  });

  if (!headerCheck.data.values || headerCheck.data.values.length === 0 || headerCheck.data.values[0].length === 0) {
    // Write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:I1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [DEFAULT_SHEET_HEADERS],
      },
    });
  }
}

export async function getExistingEmailIdsInSheet(
  userId: string,
  spreadsheetId: string,
  sheetName: string = "Transactions"
): Promise<Set<string>> {
  const { sheets } = await getSheetsClient(userId);

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!I2:I`, // Column I contains "ID Email"
    });

    const ids = new Set<string>();
    if (res.data.values) {
      for (const row of res.data.values) {
        if (row[0]) ids.add(String(row[0]).trim());
      }
    }
    return ids;
  } catch (err) {
    console.warn("Could not read existing email IDs in sheet:", err);
    return new Set<string>();
  }
}

export async function appendTransactionsToSheet(
  userId: string,
  transactionIds: string[]
): Promise<{ writtenCount: number; skippedCount: number }> {
  if (transactionIds.length === 0) return { writtenCount: 0, skippedCount: 0 };

  const connection = await prisma.spreadsheetConnection.findFirst({
    where: { userId, isActive: true },
  });

  if (!connection) {
    throw new Error("No active Google Sheets connection configured for user.");
  }

  const { sheets } = await getSheetsClient(userId);
  const { spreadsheetId, sheetName } = connection;

  // Ensure header and structure
  await ensureSheetStructure(userId, spreadsheetId, sheetName);

  // Fetch transactions from DB
  const transactions = await prisma.transaction.findMany({
    where: {
      id: { in: transactionIds },
      userId,
    },
    include: {
      source: true,
    },
  });

  // Get existing Email IDs in Sheet for sheet-level idempotency
  const existingEmailIds = await getExistingEmailIdsInSheet(userId, spreadsheetId, sheetName);

  const rowsToWrite: any[][] = [];
  const writtenTxIds: string[] = [];
  let skippedCount = 0;

  for (const tx of transactions) {
    if (existingEmailIds.has(tx.emailMessageId)) {
      skippedCount++;
      // Mark as synced if not yet marked
      if (!tx.isSyncedToSheet) {
        writtenTxIds.push(tx.id);
      }
      continue;
    }

    rowsToWrite.push(buildTransactionRow(tx));

    writtenTxIds.push(tx.id);
  }

  if (rowsToWrite.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: rowsToWrite,
      },
    });
  }

  // Update DB records
  if (writtenTxIds.length > 0) {
    await prisma.transaction.updateMany({
      where: { id: { in: writtenTxIds } },
      data: {
        isSyncedToSheet: true,
        syncedToSheetAt: new Date(),
      },
    });

    await prisma.spreadsheetConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  return {
    writtenCount: rowsToWrite.length,
    skippedCount,
  };
}

/**
 * Update an already-synced transaction row in the connected spreadsheet
 * (matched by email message id in column I), keeping Sheets in sync after edits.
 * Returns null when no active spreadsheet connection exists.
 */
export async function updateTransactionInSheet(
  userId: string,
  transactionId: string
): Promise<{ updated: boolean; appended: boolean } | null> {
  const connection = await prisma.spreadsheetConnection.findFirst({
    where: { userId, isActive: true },
  });

  if (!connection) return null;

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { source: true },
  });
  if (!tx) throw new Error("Transaction not found.");

  const { sheets } = await getSheetsClient(userId);
  const { spreadsheetId, sheetName } = connection;

  // Locate the row by email message id in column I.
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!I2:I`,
  });

  let rowNumber: number | null = null;
  (res.data.values || []).some((row, index) => {
    if (row[0] && String(row[0]).trim() === tx.emailMessageId) {
      rowNumber = index + 2; // +1 for the header row, +1 for the 0-based index
      return true;
    }
    return false;
  });

  if (!rowNumber) {
    // Row was deleted or never existed — append instead.
    await appendTransactionsToSheet(userId, [tx.id]);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { isSyncedToSheet: true, syncedToSheetAt: new Date() },
    });
    return { updated: false, appended: true };
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowNumber}:I${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [buildTransactionRow(tx)],
    },
  });

  await prisma.transaction.update({
    where: { id: tx.id },
    data: { isSyncedToSheet: true, syncedToSheetAt: new Date() },
  });

  return { updated: true, appended: false };
}
