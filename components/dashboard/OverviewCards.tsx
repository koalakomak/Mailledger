import { ArrowDownLeft, ArrowUpRight, Clock, FileSpreadsheet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Metrics {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  pendingReviewCount: number;
  activeSourcesCount: number;
  isSheetsConnected: boolean;
  lastSyncedAt: string | null;
}

export function OverviewCards({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Income */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Pemasukan</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.totalIncome)}
          </div>
          <span className="text-xs text-emerald-400 font-medium">Otomatis dari email</span>
        </div>
      </div>

      {/* Total Expense */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Pengeluaran</span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.totalExpense)}
          </div>
          <span className="text-xs text-rose-400 font-medium">{metrics.totalTransactions} transaksi tercatat</span>
        </div>
      </div>

      {/* Pending Review */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Menunggu Tinjauan</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.pendingReviewCount}
          </div>
          <span className="text-xs text-amber-400 font-medium">Perlu tinjauan manual (&lt;80% confidence)</span>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Status Sinkronisasi</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-base font-semibold text-white flex items-center gap-2">
            {metrics.isSheetsConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Terhubung ke Spreadsheet
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Spreadsheet Belum Terhubung
              </>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium block mt-1">
            {metrics.lastSyncedAt ? `Sinkron terakhir: ${formatDate(metrics.lastSyncedAt)}` : "Belum ada sinkronisasi"}
          </span>
        </div>
      </div>
    </div>
  );
}
