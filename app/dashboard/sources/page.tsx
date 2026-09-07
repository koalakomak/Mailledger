"use client";

import { useEffect, useState } from "react";
import { SourcesGrid } from "@/components/sources/SourcesGrid";
import { RefreshCw, Info } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      const json = await res.json();
      if (json.success) {
        setSources(json.data);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggle = async (sourceId: string, newState: boolean) => {
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, isActive: newState }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSources();
      }
    } catch (err) {
      console.error("Failed to toggle source:", err);
    }
  };

  const handleSyncSource = async (sourceId: string) => {
    try {
      await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, daysBack: 7 }),
      });
      fetchSources();
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Transaction Sources</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enable or disable transaction source parsers. When connected, an initial backfill of the last 7 days is automatically triggered.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>
          MailLedger only reads emails matching specific bank/e-wallet filters and never stores irrelevant emails.
        </span>
      </div>

      <SourcesGrid
        sources={sources}
        onToggle={handleToggle}
        onSyncSource={handleSyncSource}
      />
    </div>
  );
}
