"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Menu, User as UserIcon, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../Toast";

interface HeaderProps {
  onSyncTriggered?: () => void;
  onMenuClick?: () => void;
  navOpen?: boolean;
}

export function Header({ onSyncTriggered, onMenuClick, navOpen = false }: HeaderProps) {
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const toast = useToast();

  useEffect(() => {
    const current = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* abaikan bila penyimpanan tidak tersedia */
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
  };

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
    <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur text-slate-200">
      <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 -ml-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition shrink-0"
            aria-label="Buka menu navigasi"
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xs sm:text-sm font-medium text-slate-400 truncate">
            {session?.user?.email || "Pengguna"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            aria-busy={isSyncing}
            className="flex items-center gap-2 px-3 py-2.5 sm:px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-70 whitespace-nowrap"
          >
            {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
          </button>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Foto profil"
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
      </div>

      {/* Progres tipis menggantikan spinner berputar */}
      {isSyncing && (
        <div className="absolute bottom-0 left-0 right-0 text-emerald-500">
          <div className="progress-bar" />
        </div>
      )}
    </header>
  );
}
