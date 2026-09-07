"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Edit3, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";
import { EditTransactionModal } from "./EditTransactionModal";

interface Transaction {
  id: string;
  transactionDate: string;
  description: string;
  merchant: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  currency: string;
  category?: string;
  confidence: number;
  status: "AUTO" | "REVIEW" | "CONFIRMED" | "REJECTED";
  isSyncedToSheet: boolean;
  source?: { name: string; slug: string };
  emailSubject?: string;
}

interface Props {
  transactions: Transaction[];
  onRefresh?: () => void;
  showReviewActionsOnly?: boolean;
}

export function TransactionTable({ transactions, onRefresh, showReviewActionsOnly = false }: Props) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Confirmation error:", err);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <p className="text-sm font-medium">No transactions found.</p>
        <span className="text-xs text-slate-500 block mt-1">
          Sync your Gmail or adjust filters to view recorded data.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Merchant / Description</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Confidence</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                    {formatDate(tx.transactionDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100">{tx.merchant}</div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">{tx.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                      {tx.source?.name || "Email"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                    {tx.type === "INCOME" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Expense
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-100">
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tx.confidence >= 80
                              ? "bg-emerald-500"
                              : tx.confidence >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${tx.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">{tx.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {tx.status === "AUTO" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Auto
                      </span>
                    )}
                    {tx.status === "CONFIRMED" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        Confirmed
                      </span>
                    )}
                    {tx.status === "REVIEW" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Review Needed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {tx.status === "REVIEW" && showReviewActionsOnly && (
                        <button
                          onClick={() => handleConfirm(tx.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <EditTransactionModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onSuccess={() => {
            setSelectedTx(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
