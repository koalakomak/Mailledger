"use client";

import { useEffect, useState } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ReviewPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions?status=REVIEW");
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.transactions);
      }
    } catch (err) {
      console.error("Failed to load review transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Antrean Tinjauan Manual</h2>
          <p className="text-xs text-slate-400 mt-1">
            Transaksi dengan skor keyakinan di bawah 80% memerlukan verifikasi Anda sebelum disinkronkan ke Google Sheets.
          </p>
        </div>

        <button
          onClick={fetchPendingReviews}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Muat Ulang
        </button>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>
          Klik ikon edit untuk menyesuaikan hasil ekstraksi, atau klik <strong>Confirm</strong> untuk menyetujui dan otomatis menuliskannya ke Google Sheet yang terhubung.
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          onRefresh={fetchPendingReviews}
          showReviewActionsOnly={true}
        />
      )}
    </div>
  );
}
