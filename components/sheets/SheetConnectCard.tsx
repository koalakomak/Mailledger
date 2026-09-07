"use client";

import { useState } from "react";
import { FileSpreadsheet, Check, ExternalLink, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SpreadsheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface Connection {
  spreadsheetId: string;
  sheetName: string;
  isActive: boolean;
  lastSyncedAt: string | null;
}

interface Props {
  spreadsheets: SpreadsheetItem[];
  connection: Connection | null;
  onConnect: (spreadsheetId: string, sheetName: string) => Promise<void>;
}

export function SheetConnectCard({ spreadsheets, connection, onConnect }: Props) {
  const [selectedId, setSelectedId] = useState(connection?.spreadsheetId || (spreadsheets[0]?.id ?? ""));
  const [sheetName, setSheetName] = useState(connection?.sheetName || "Transactions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      await onConnect(selectedId, sheetName);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-white">Google Sheets Integration</h3>
          <p className="text-xs text-slate-400">
            Automatically export and append parsed transactions to your Google Sheet.
          </p>
        </div>
      </div>

      {connection?.isActive && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold">✓ Currently connected to Google Sheet</span>
            <a
              href={`https://docs.google.com/spreadsheets/d/${connection.spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
            >
              Open Sheet <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="mt-2 text-slate-400">
            Sheet name: <span className="text-slate-200 font-mono">{connection.sheetName}</span> | Last synced:{" "}
            <span className="text-slate-200">{connection.lastSyncedAt ? formatDate(connection.lastSyncedAt) : "Never"}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Select Spreadsheet from your Google Drive
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="" disabled>-- Select a Spreadsheet --</option>
            {spreadsheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name} {sheet.modifiedTime ? `(Edited ${new Date(sheet.modifiedTime).toLocaleDateString()})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Worksheet (Tab) Name
          </label>
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="Transactions"
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
          />
          <span className="text-[11px] text-slate-500 block mt-1">
            If the tab does not exist, MailLedger will create it and initialize standard headers.
          </span>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !selectedId}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isSubmitting ? "Connecting..." : connection?.isActive ? "Update Sheet Connection" : "Connect Spreadsheet"}
          </button>
        </div>
      </form>
    </div>
  );
}
