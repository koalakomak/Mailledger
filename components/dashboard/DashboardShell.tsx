"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastProvider } from "../Toast";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setNavOpen(true)} navOpen={navOpen} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            {/* key = pathname -> animasi halus setiap pindah tab */}
            <div key={pathname} className="page-enter">
              {children}
            </div>
          </main>
        </div>

        {navOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </ToastProvider>
  );
}
