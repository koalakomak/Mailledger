"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { RefreshCw, User as UserIcon, Menu } from "lucide-react";
import { useState } from "react";
import { useToast } from "../Toast";

interface HeaderProps {
  onSyncTriggered?: () => void;
  onMenuClick?: () => void;
}

export function Header({ onSyncTriggered, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack: 7 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const results = Array.isArray(data.data) ? data.data : [];
        const totalNew = results.reduce((a: number, r: any) => a + (r.newTransactions || 0), 0);
        toast("success", totalNew > 0 ? totalNew + " transaksi baru disinkronkan." : "Sinkronisasi selesai. Tidak ada transaksi baru.");
        if (onSyncTriggered) onSyncTriggered();
      } else {
        toast("error", data.error?.message || "Sinkronisasi gagal.");
      }
    } catch (err) {
      console.error("Sync failed:", err);
      toast("error", "Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 sm:px-8 flex items-center justify-between gap-3 text-slate-200">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xs sm:text-sm font-medium text-slate-400 truncate">
          {session?.user?.email || "Pengguna"}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={"w-3.5 h-3.5 " + (isSyncing ? "animate-spin" : "")} />
          {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
        </button>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-4">
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
            {session?.user?.name || "Anggota"}
          </span>
        </div>
      </div>
    </header>
  );
}
