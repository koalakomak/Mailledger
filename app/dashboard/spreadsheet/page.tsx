"use client";

import { useEffect, useState } from "react";
import { SheetConnectCard } from "@/components/sheets/SheetConnectCard";
import { RefreshCw } from "lucide-react";

export default function SpreadsheetPage() {
  const [data, setData] = useState<{ spreadsheets: any[]; activeConnection: any }>({
    spreadsheets: [],
    activeConnection: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sheets");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load sheets data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async (spreadsheetId: string, sheetName: string) => {
    const res = await fetch("/api/sheets/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId, sheetName }),
    });
    const json = await res.json();
    if (json.success) {
      fetchData();
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Google Sheets Connection</h2>
        <p className="text-xs text-slate-400 mt-1">
          Select or change the target Google Spreadsheet where your parsed transactions will be recorded.
        </p>
      </div>

      <SheetConnectCard
        spreadsheets={data.spreadsheets}
        connection={data.activeConnection}
        onConnect={handleConnect}
      />
    </div>
  );
}
