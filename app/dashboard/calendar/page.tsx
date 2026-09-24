"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface DayStat {
  income: number;
  expense: number;
  count: number;
}

interface Txn {
  id: string;
  transactionDate: string;
  merchant: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string | null;
  currency: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function currentWibMonth(): { year: number; monthIndex: number } {
  const w = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return { year: w.getUTCFullYear(), monthIndex: w.getUTCMonth() };
}

function todayWibKey(): string {
  const w = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return w.getUTCFullYear() + "-" + pad(w.getUTCMonth() + 1) + "-" + pad(w.getUTCDate());
}

export default function CalendarPage() {
  const initial = currentWibMonth();
  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.monthIndex);
  const [days, setDays] = useState<Record<string, DayStat>>({});
  const [totals, setTotals] = useState({ income: 0, expense: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [dayTxns, setDayTxns] = useState<Txn[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const monthKey = year + "-" + pad(monthIndex + 1);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar?month=" + monthKey);
      const json = await res.json();
      if (json.success) {
        setDays(json.data.days || {});
        setTotals(json.data.totals || { income: 0, expense: 0, count: 0 });
      }
    } catch (err) {
      console.error("Gagal memuat kalender:", err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const openDay = async (dayKey: string) => {
    setSelected(dayKey);
    setDayLoading(true);
    setDayTxns([]);
    try {
      const parts = dayKey.split("-");
      const startUtc = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], -7, 0, 0));
      const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
      const url =
        "/api/transactions?from=" + startUtc.toISOString() +
        "&to=" + endUtc.toISOString() +
        "&limit=100";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setDayTxns(json.data.transactions || []);
    } catch (err) {
      console.error("Gagal memuat transaksi harian:", err);
    } finally {
      setDayLoading(false);
    }
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, monthIndex + delta, 1));
    setYear(d.getUTCFullYear());
    setMonthIndex(d.getUTCMonth());
    setSelected(null);
    setDayTxns([]);
  };

  const goToday = () => {
    const now = currentWibMonth();
    setYear(now.year);
    setMonthIndex(now.monthIndex);
    setSelected(null);
    setDayTxns([]);
  };

  const firstWeekday = (() => {
    const dow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    return (dow + 6) % 7;
  })();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const todayKey = todayWibKey();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedStat = selected ? days[selected] : undefined;
  const selectedLabel = selected
    ? selected.split("-")[2] + " " + MONTHS[+selected.split("-")[1] - 1] + " " + selected.split("-")[0]
    : "";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Kalender Pengeluaran</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pilih tanggal untuk melihat rincian transaksi pada hari tersebut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-semibold text-white">
            {MONTHS[monthIndex]} {year}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-2.5 min-h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Pemasukan bulan ini</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Pengeluaran bulan ini</p>
          <p className="text-lg font-bold text-rose-400 mt-1">{formatCurrency(totals.expense)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Jumlah transaksi</p>
          <p className="text-lg font-bold text-white mt-1">{totals.count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {DOW.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="skeleton h-16 sm:h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((day, i) => {
                if (day === null) return <div key={"empty-" + i} className="h-16 sm:h-20" />;
                const key = monthKey + "-" + pad(day);
                const stat = days[key];
                const isToday = key === todayKey;
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => openDay(key)}
                    className={
                      "h-16 sm:h-20 rounded-lg border p-1.5 sm:p-2 text-left transition " +
                      (isSelected
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950/40 hover:bg-slate-800/60")
                    }
                    aria-label={"Lihat transaksi tanggal " + day + " " + MONTHS[monthIndex] + " " + year}
                  >
                    <span
                      className={
                        "text-xs font-semibold " +
                        (isToday ? "text-emerald-400" : "text-slate-300")
                      }
                    >
                      {day}
                    </span>
                    {stat && stat.expense > 0 && (
                      <span className="block text-[10px] sm:text-[11px] text-rose-400 mt-0.5 truncate">
                        -{formatCurrency(stat.expense)}
                      </span>
                    )}
                    {stat && stat.income > 0 && (
                      <span className="block text-[10px] sm:text-[11px] text-emerald-400 truncate">
                        +{formatCurrency(stat.income)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            {selected ? selectedLabel : "Rincian Tanggal"}
          </h3>

          {!selected && (
            <p className="text-xs text-slate-400 mt-3">
              Klik salah satu tanggal pada kalender untuk melihat transaksi hari itu.
            </p>
          )}

          {selected && selectedStat && (
            <p className="text-xs text-slate-400 mt-2">
              {selectedStat.count} transaksi · pengeluaran {formatCurrency(selectedStat.expense)}
            </p>
          )}

          {selected && dayLoading && (
            <div className="space-y-2 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          )}

          {selected && !dayLoading && dayTxns.length === 0 && (
            <p className="text-xs text-slate-400 mt-4 bg-slate-950/50 border border-slate-800 rounded-lg p-4">
              Tidak ada transaksi pada tanggal ini.
            </p>
          )}

          {selected && !dayLoading && dayTxns.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-800 border border-slate-800 rounded-lg">
              {dayTxns.map((tx) => (
                <li key={tx.id} className="px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{tx.merchant}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {tx.category || "Tanpa kategori"}
                      </p>
                    </div>
                    <span
                      className={
                        "text-sm font-semibold whitespace-nowrap " +
                        (tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400")
                      }
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                    {tx.type === "INCOME" ? (
                      <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-rose-400" />
                    )}
                    {tx.type === "INCOME" ? "Masuk" : "Keluar"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
