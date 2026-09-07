"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Power } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  slug: string;
  filterQuery: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
}

interface Props {
  sources: Source[];
  onToggle: (sourceId: string, newState: boolean) => Promise<void>;
  onSyncSource: (sourceId: string) => Promise<void>;
}

export function SourcesGrid({ sources, onToggle, onSyncSource }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (sourceId: string, currentStatus: boolean) => {
    setLoadingId(sourceId);
    try {
      await onToggle(sourceId, !currentStatus);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSync = async (sourceId: string) => {
    setLoadingId(sourceId);
    try {
      await onSyncSource(sourceId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sources.map((src) => (
        <div
          key={src.id}
          className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition ${
            src.isConnected ? "border-emerald-500/30" : "border-slate-800 opacity-80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-base text-white">{src.name}</span>
              {src.isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  <XCircle className="w-3.5 h-3.5" /> Not Connected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2 rounded-md border border-slate-800/80 line-clamp-2">
              Filter: {src.filterQuery}
            </p>

            <div className="mt-3 text-xs text-slate-400">
              {src.lastSyncedAt ? (
                <span>Last sync: {formatDate(src.lastSyncedAt)}</span>
              ) : (
                <span>Never synced</span>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => handleToggle(src.id, src.isConnected)}
              disabled={loadingId === src.id}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                src.isConnected
                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              } disabled:opacity-50`}
            >
              <Power className="w-3.5 h-3.5" />
              {src.isConnected ? "Disconnect" : "Connect Source"}
            </button>

            {src.isConnected && (
              <button
                onClick={() => handleSync(src.id)}
                disabled={loadingId === src.id}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition disabled:opacity-50"
                title="Sync this source now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingId === src.id ? "animate-spin" : ""}`} />
                Sync
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
