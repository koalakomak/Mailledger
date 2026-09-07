"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Layers,
  FileSpreadsheet,
  AlertOctagon,
  Settings,
  Mail,
  LogOut,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Ringkasan", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Transaksi", href: "/dashboard/transactions", icon: Receipt },
  { name: "Tinjauan Manual", href: "/dashboard/review", icon: CheckSquare },
  { name: "Sumber", href: "/dashboard/sources", icon: Layers },
  { name: "Spreadsheet", href: "/dashboard/spreadsheet", icon: FileSpreadsheet },
  { name: "Log Error", href: "/dashboard/errors", icon: AlertOctagon },
  { name: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={"fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 transform transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto " + (open ? "translate-x-0" : "-translate-x-full")}
      aria-label="Navigasi utama"
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-lg tracking-tight text-white block truncate">MailLedger</span>
          <span className="block text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Auto Sync</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/overview" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={"flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all " + (isActive ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/50" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60")}
            >
              <Icon className={isActive ? "w-4 h-4 text-white" : "w-4 h-4 text-slate-400"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
