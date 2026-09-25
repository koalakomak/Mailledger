export type SummaryPeriod = "daily" | "weekly" | "monthly";

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function wibParts(date: Date) {
  const w = new Date(date.getTime() + TZ_OFFSET_MS);
  return { y: w.getUTCFullYear(), m: w.getUTCMonth(), d: w.getUTCDate(), dow: w.getUTCDay() };
}

/**
 * Rentang periode dalam WIB (start inklusif, end eksklusif).
 * - daily   : HARI KEMARIN penuh (00.00-24.00 WIB) -> selalu lengkap, tidak ada yang terlewat
 * - weekly  : 7 hari terakhir termasuk hari ini
 * - monthly : bulan kalender sebelumnya
 */
export function periodRangeWib(
  period: SummaryPeriod,
  now: Date = new Date()
): { start: Date; endExclusive: Date } {
  const { y, m, d } = wibParts(now);

  if (period === "daily") {
    return {
      start: new Date(Date.UTC(y, m, d - 1, -7, 0, 0)),
      endExclusive: new Date(Date.UTC(y, m, d, -7, 0, 0)),
    };
  }

  if (period === "weekly") {
    return {
      start: new Date(Date.UTC(y, m, d - 6, -7, 0, 0)),
      endExclusive: new Date(Date.UTC(y, m, d + 1, -7, 0, 0)),
    };
  }

  const py = m === 0 ? y - 1 : y;
  const pm = m === 0 ? 11 : m - 1;
  return {
    start: new Date(Date.UTC(py, pm, 1, -7, 0, 0)),
    endExclusive: new Date(Date.UTC(y, m, 1, -7, 0, 0)),
  };
}

export function periodLabel(
  period: SummaryPeriod,
  range: { start: Date; endExclusive: Date }
): string {
  const fmt = (dt: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...opts }).format(dt);

  if (period === "daily") {
    const p = wibParts(range.start);
    return DAY_ID[p.dow] + ", " + fmt(range.start, { day: "numeric", month: "long", year: "numeric" });
  }
  if (period === "weekly") {
    const end = new Date(range.endExclusive.getTime() - 24 * 60 * 60 * 1000);
    return (
      fmt(range.start, { day: "numeric", month: "short" }) +
      " - " +
      fmt(end, { day: "numeric", month: "short", year: "numeric" })
    );
  }
  return fmt(new Date(range.start.getTime() + 3 * 24 * 60 * 60 * 1000), { month: "long", year: "numeric" });
}
