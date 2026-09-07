"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { TransactionTable } from "@/components/transactions/TransactionTable";

const IncomeExpenseChart = dynamic(
  () => import("@/components/dashboard/IncomeExpenseChart").then((m) => m.IncomeExpenseChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm h-64 animate-pulse" />
    ),
  }
);
import { RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sync/status");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    pendingReviewCount: 0,
    activeSourcesCount: 0,
    isSheetsConnected: false,
    lastSyncedAt: null,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ringkasan Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">
          Pantau hasil ekstraksi email transaksi otomatis dan status sinkronisasi Anda.
        </p>
      </div>

      <OverviewCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <IncomeExpenseChart income={metrics.totalIncome} expense={metrics.totalExpense} />
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Transaksi Terbaru</h3>
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <TransactionTable
              transactions={data?.recentTransactions || []}
              onRefresh={fetchStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
