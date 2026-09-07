/**
 * Shared utility for parsing Indonesian Rupiah amounts from email text.
 *
 * Handles various formats found in bank/e-wallet notification emails:
 *   - "Rp 50.000"        → 50000
 *   - "Rp50.000,00"      → 50000
 *   - "Rp 1.500.000,50"  → 1500000.5
 *   - "IDR 100"           → 100
 *   - "Rp. 100,00"       → 100
 *   - "Rp100"            → 100
 *   - "50,000.00"        → 50000  (EN format)
 *
 * The key insight: Indonesian format uses DOT as thousands separator
 * and COMMA as decimal separator. This is the opposite of EN format.
 *
 * Strategy:
 *   1. If both . and , exist → determine which is the decimal separator
 *      by checking which one appears LAST and has ≤2 digits after it.
 *   2. If only . exists → check the part after the last dot:
 *      - If it's exactly 3 digits (e.g., "50.000") → thousands separator, remove it
 *      - If it's 1-2 digits (e.g., "100.50") → decimal point, keep it
 *      - If multiple dots with 3-digit groups (e.g., "1.500.000") → thousands, remove all
 *   3. If only , exists → same logic as dots but for commas
 *   4. Plain digits → parse directly
 */
export function normalizeAmount(rawNum: string): number {
  if (!rawNum || rawNum.trim().length === 0) return 0;

  // Remove any whitespace and currency symbols that might have leaked through
  let cleaned = rawNum.trim().replace(/[^\d.,]/g, "");

  if (cleaned.length === 0) return 0;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    // Both separators present — determine which is decimal
    const lastDotIdx = cleaned.lastIndexOf(".");
    const lastCommaIdx = cleaned.lastIndexOf(",");

    if (lastCommaIdx > lastDotIdx) {
      // Comma appears after dot → ID format: 1.500.000,50
      // Dots are thousands, comma is decimal
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Dot appears after comma → EN format: 1,500,000.50
      // Commas are thousands, dot is decimal
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasDot) {
    // Only dots — figure out if thousands or decimal
    const parts = cleaned.split(".");

    if (parts.length >= 3) {
      // Multiple dots like "1.500.000" → all are thousands separators
      cleaned = cleaned.replace(/\./g, "");
    } else if (parts.length === 2) {
      const afterDot = parts[1];
      if (afterDot.length === 3) {
        // "50.000" → thousands separator (ID format)
        cleaned = cleaned.replace(/\./g, "");
      } else {
        // "100.50" or "100.5" → decimal point, keep as-is
        // No transformation needed
      }
    }
  } else if (hasComma) {
    // Only commas — figure out if thousands or decimal
    const parts = cleaned.split(",");

    if (parts.length >= 3) {
      // Multiple commas like "1,500,000" → all are thousands separators
      cleaned = cleaned.replace(/,/g, "");
    } else if (parts.length === 2) {
      const afterComma = parts[1];
      if (afterComma.length === 3) {
        // "50,000" → thousands separator (EN format)
        cleaned = cleaned.replace(/,/g, "");
      } else {
        // "100,50" → decimal comma (ID format), convert to dot
        cleaned = cleaned.replace(",", ".");
      }
    }
  }
  // else: plain digits, parse directly

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Extract the best amount match from email content.
 * Tries multiple regex patterns in priority order and returns the first valid match.
 *
 * @param content - Combined email text (subject + plainText + html)
 * @param extraPatterns - Additional patterns to try before the generic fallback
 * @returns The parsed amount, or 0 if no amount found
 */
export function extractAmount(
  content: string,
  extraPatterns: RegExp[] = []
): number {
  // Priority-ordered patterns. More specific patterns first.
  const patterns: RegExp[] = [
    ...extraPatterns,
    // "Rp 50.000" / "Rp. 100.000,00" / "IDR 100" — standard currency prefix
    /(?:IDR|Rp\.?)\s*([\d.,]+)/i,
    // "nominal transaksi: 50000" / "jumlah: Rp 50.000"
    /nominal(?:\s*transaksi)?\s*[:=]\s*(?:IDR|Rp\.?)?\s*([\d.,]+)/i,
    /jumlah\s*[:=]\s*(?:IDR|Rp\.?)?\s*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      // The captured group could be in group 1 or 2 depending on the pattern
      const rawNum = (match[1] || match[2] || "").trim();
      if (rawNum) {
        const amount = normalizeAmount(rawNum);
        if (amount > 0) {
          return amount;
        }
      }
    }
  }

  return 0;
}
