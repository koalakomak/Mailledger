import { z } from "zod";

export const SourceToggleSchema = z.object({
  sourceId: z.string().uuid("Invalid source ID"),
  isActive: z.boolean(),
});

export const SpreadsheetConnectSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().default("Transactions"),
  columnMapping: z.record(z.string()).optional(),
});

export const TransactionUpdateSchema = z.object({
  transactionDate: z.string().or(z.date()),
  description: z.string().min(1, "Description is required"),
  merchant: z.string().min(1, "Merchant is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().optional().default("IDR"),
  category: z.string().optional().nullable(),
});

export const SyncTriggerSchema = z.object({
  sourceId: z.string().uuid().optional(),
  daysBack: z.number().min(1).max(30).default(7),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      })
      .optional(),
  });
