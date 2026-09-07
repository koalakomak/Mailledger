"use client";

import { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useToast } from "../Toast";
import { toWibDateTimeLocal, fromWibDateTimeLocal } from "@/lib/utils";

interface Props {
  transaction: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({ transaction, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [merchant, setMerchant] = useState(transaction.merchant || "");
  const [description, setDescription] = useState(transaction.description || "");
  // Handle Prisma Decimal: amount may come as string, number, or Decimal object
  const [amount, setAmount] = useState<string>(
    String(typeof transaction.amount === "object" ? transaction.amount.toString() : transaction.amount || 0)
  );
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type || "EXPENSE");
  const [category, setCategory] = useState(transaction.category || "");
  const [date, setDate] = useState(() => {
    try {
      return toWibDateTimeLocal(transaction.transactionDate);
    } catch {
      return toWibDateTimeLocal(new Date());
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate amount before sending
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount harus lebih dari 0");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        merchant: merchant.trim(),
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category.trim() || undefined,
        currency: transaction.currency || "IDR",
        transactionDate: fromWibDateTimeLocal(date),
      };

      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error?.message || data.error?.details || "Gagal update transaksi";
        setError(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
        return;
      }

      toast("success", "Perubahan transaksi berhasil disimpan.");
      onSuccess();
    } catch (err: any) {
      console.error("Failed to update transaction:", err);
      setError(err.message || "Network error, coba lagi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">Edit Detail Transaksi</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah (IDR)</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // Allow only digits, dots, and commas
                  const val = e.target.value.replace(/[^\d.,]/g, "");
                  setAmount(val);
                }}
                required
                placeholder="e.g. 100"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="EXPENSE">Expense (Keluar)</option>
                <option value="INCOME">Income (Masuk)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="cth. Makanan, Transportasi"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal & Waktu</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
