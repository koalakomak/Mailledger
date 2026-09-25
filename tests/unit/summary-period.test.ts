import { describe, it, expect } from "vitest";
import { periodRangeWib, periodLabel } from "@/lib/summary-period";

// 2026-09-25T03:00:00Z = 25 September 2026, 10:00 WIB
const NOW = new Date("2026-09-25T03:00:00Z");

describe("Summary period (WIB)", () => {
  it("harian = hari kemarin penuh (00.00-24.00 WIB)", () => {
    const r = periodRangeWib("daily", NOW);
    expect(r.start.toISOString()).toBe("2026-09-23T17:00:00.000Z"); // 24 Sep 00:00 WIB
    expect(r.endExclusive.toISOString()).toBe("2026-09-24T17:00:00.000Z"); // 25 Sep 00:00 WIB
  });

  it("mingguan = 7 hari terakhir termasuk hari ini", () => {
    const r = periodRangeWib("weekly", NOW);
    expect(r.start.toISOString()).toBe("2026-09-18T17:00:00.000Z"); // 19 Sep 00:00 WIB
    expect(r.endExclusive.toISOString()).toBe("2026-09-25T17:00:00.000Z"); // 26 Sep 00:00 WIB
  });

  it("bulanan = bulan kalender sebelumnya", () => {
    const r = periodRangeWib("monthly", NOW);
    // Hari ini 25 Sep 2026 -> bulan lalu = Agustus 2026
    expect(r.start.toISOString()).toBe("2026-07-31T17:00:00.000Z"); // 1 Agu 00:00 WIB
    expect(r.endExclusive.toISOString()).toBe("2026-08-31T17:00:00.000Z"); // 1 Sep 00:00 WIB
  });

  it("label harian menunjuk tanggal kemarin", () => {
    const r = periodRangeWib("daily", NOW);
    expect(periodLabel("daily", r)).toContain("24 September 2026");
  });
});
