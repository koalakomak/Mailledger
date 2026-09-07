"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/errors");
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Log Error & Diagnostik</h2>
          <p className="text-xs text-slate-400 mt-1">
            Periksa masalah parsing email dan kegagalan sinkronisasi untuk perbaikan.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Muat Ulang
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <p className="text-sm font-semibold text-emerald-400">Belum ada log error.</p>
          <span className="text-xs text-slate-500 block mt-1">
            Semua proses parsing email terbaru berhasil.
          </span>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Pesan Error</th>
                  <th className="px-6 py-3.5">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-sans">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-sans">{log.message}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.payload || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
