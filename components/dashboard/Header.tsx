"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { RefreshCw, User as UserIcon } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onSyncTriggered?: () => void;
}

export function Header({ onSyncTriggered }: HeaderProps) {
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack: 7 }),
      });
      const data = await res.json();
      if (data.success) {
        if (onSyncTriggered) onSyncTriggered();
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 flex items-center justify-between text-slate-200">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium text-slate-400">
          Logged in as: <span className="text-slate-100 font-semibold">{session?.user?.email || "User"}</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Gmail Now"}
        </button>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-medium text-slate-300 hidden md:inline">
            {session?.user?.name || "Member"}
          </span>
        </div>
      </div>
    </header>
  );
}
