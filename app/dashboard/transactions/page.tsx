"use client";

import { useEffect, useState, useCallback } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Search, RefreshCw } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.append("status", status);
      if (source !== "ALL") params.append("source", source);
      if (search) params.append("q", search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.transactions);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [status, source, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">All Transactions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and manage all parsed financial records.
          </p>
        </div>

        <button
          onClick={() => fetchTransactions()}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search merchant, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Status</option>
            <option value="AUTO">Auto Approved</option>
            <option value="CONFIRMED">Manually Confirmed</option>
            <option value="REVIEW">Needs Review</option>
          </select>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Sources</option>
            <option value="bca">BCA</option>
            <option value="mandiri">Livin&apos; by Mandiri</option>
            <option value="gopay">GoPay</option>
            <option value="ovo">OVO</option>
            <option value="shopee">Shopee</option>
            <option value="tokopedia">Tokopedia</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <TransactionTable transactions={transactions} onRefresh={fetchTransactions} />
      )}
    </div>
  );
}
