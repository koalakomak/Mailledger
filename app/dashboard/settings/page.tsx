"use client";

import { useSession } from "next-auth/react";
import { Shield, Mail } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Account & Security Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review your connected Google profile, security permissions, and synchronization preferences.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-emerald-400" /> Connected Google Account
          </h3>
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-medium">{session?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-medium">{session?.user?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auth Method:</span>
              <span className="text-emerald-400 font-medium">Google OAuth2</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-400" /> OAuth Scopes & Data Isolation
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Gmail Read-Only (`gmail.readonly`)</span>
              <span className="text-emerald-400 font-semibold">Authorized</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Google Sheets Read/Write (`spreadsheets`)</span>
              <span className="text-emerald-400 font-semibold">Authorized</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Refresh Token Encryption</span>
              <span className="text-emerald-400 font-semibold">AES-256-GCM Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
