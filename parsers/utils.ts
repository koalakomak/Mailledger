/**
 * Shared utility for parsing Indonesian Rupiah amounts and transaction dates
 * from bank/e-wallet notification emails.
 *
 * Amount formats handled:
 *   - "Rp 50.000"        -> 50000
 *   - "Rp50.000,00"      -> 50000
 *   - "Rp 1.500.000,50"  -> 1500000.5
 *   - "IDR 100"          -> 100
 *   - "Rp. 100,00"       -> 100
 *   - "Rp100"            -> 100
 *   - "50,000.00"        -> 50000  (EN format)
 *
 * Indonesian format uses DOT as thousands separator and COMMA as decimal
 * separator - the opposite of EN format.
 */
export function normalizeAmount(rawNum: string): number {
  if (!rawNum || rawNum.trim().length === 0) return 0;

  let cleaned = rawNum.trim().replace(/[^\d.,]/g, "");
  if (cleaned.length === 0) return 0;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    const lastDotIdx = cleaned.lastIndexOf(".");
    const lastCommaIdx = cleaned.lastIndexOf(",");
    if (lastCommaIdx > lastDotIdx) {
      // ID format: 1.500.000,50 -> 1500000.50
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // EN format: 1,500,000.50 -> 1500000.50
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasDot) {
    const parts = cleaned.split(".");
    if (parts.length >= 3) {
      cleaned = cleaned.replace(/\./g, "");
    } else if (parts.length === 2 && parts[1].length === 3) {
      // "50.000" -> thousands separator
      cleaned = cleaned.replace(/\./g, "");
    }
    // else keep decimal point ("100.50")
  } else if (hasComma) {
    const parts = cleaned.split(",");
    if (parts.length >= 3) {
      cleaned = cleaned.replace(/,/g, "");
    } else if (parts.length === 2 && parts[1].length === 3) {
      // "50,000" -> thousands separator (EN)
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // "100,50" -> decimal comma (ID) -> dot
      cleaned = cleaned.replace(",", ".");
    }
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Extract the best amount match from email content.
 */
export function extractAmount(
  content: string,
  extraPatterns: RegExp[] = []
): number {
  const patterns: RegExp[] = [
    ...extraPatterns,
    /(?:IDR|Rp\.?)\s*([\d.,]+)/i,
    /nominal(?:\s*transaksi)?\s*[:=]\s*(?:IDR|Rp\.?)?\s*([\d.,]+)/i,
    /jumlah\s*[:=]\s*(?:IDR|Rp\.?)?\s*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const rawNum = (match[1] || match[2] || "").trim();
      if (rawNum) {
        const amount = normalizeAmount(rawNum);
        if (amount > 0) return amount;
      }
    }
  }

  return 0;
}

/**
 * Parse an Indonesian transaction date/time from email text and convert it
 * to a UTC Date. Handles:
 *   - "Tanggal 5 Sep 2026 Jam 01:10:59 WIB"
 *   - "05 September 2026" / "5 Sep 2026"
 *   - "Tanggal: 01/09/2026" / "01-09-2026" (dd/mm/yyyy)
 * Returns null when no date-like string is found.
 */
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  mei: 4, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  agu: 7, agst: 7, agustus: 7, aug: 7, august: 7, sep: 8, september: 8,
  okt: 9, oct: 9, october: 9, nov: 10, november: 10, des: 11, dec: 11, december: 11,
};

const TZ_OFFSET_HOURS: Record<string, number> = { WIB: 7, WITA: 8, WIT: 9 };

export function parseTransactionDate(content: string): Date | null {
  if (!content) return null;

  // "5 Sep 2026 Jam 01:10:59 WIB" (optional leading "Tanggal")
  const monthRe =
    /(?:tanggal\s*[:=]?\s*)?(\d{1,2})\s+(january|jan|february|feb|march|mar|april|apr|mei|may|june|jun|july|jul|agustus|agst|august|aug|agu|september|sep|october|oct|okt|november|nov|december|dec|des)\b\.?\s+(\d{2,4})(?:[^0-9]{0,60}?jam\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?(?:[^0-9]{0,10}(WIB|WITA|WIT))?/i;

  let m = content.match(monthRe);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month !== undefined) {
      const d = buildDate(parseInt(m[1], 10), month, parseInt(m[3], 10), m[4], m[5], m[6], m[7]);
      if (d) return d;
    }
  }

  // "Tanggal: 01/09/2026" / "01-09-2026" (dd/mm/yyyy)
  const slashRe =
    /tanggal\s*[:=]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[^0-9]{0,40}?jam\s*(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?(?:[^0-9]{0,10}(WIB|WITA|WIT))?/i;
  m = content.match(slashRe);
  if (m) {
    const d = buildDate(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), m[4], m[5], m[6], m[7]);
    if (d) return d;
  }

  return null;
}

function buildDate(
  day: number,
  month: number,
  year: number,
  hourStr?: string,
  minStr?: string,
  secStr?: string,
  tz?: string
): Date | null {
  if (year < 100) year += 2000;
  const hour = hourStr ? parseInt(hourStr, 10) : 0;
  const minute = minStr ? parseInt(minStr, 10) : 0;
  const second = secStr ? parseInt(secStr, 10) : 0;
  const tzOffset = tz ? (TZ_OFFSET_HOURS[tz.toUpperCase()] ?? 7) : 7;
  const d = new Date(Date.UTC(year, month, day, hour - tzOffset, minute, second));
  return isNaN(d.getTime()) ? null : d;
}
