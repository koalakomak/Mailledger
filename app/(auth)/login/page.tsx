"use client";

import { signIn } from "next-auth/react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/dashboard/overview" });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 text-white">
          <Mail className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Login ke MailLedger</h1>
        <p className="text-xs text-slate-400 mt-2">
          Hubungkan akun Google Anda untuk memulai membaca notifikasi email transaksi dan mencatatnya ke Google Sheets.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            {isLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 text-left space-y-1">
          <p>✓ Izin Gmail (hanya baca untuk filter transaksi)</p>
          <p>✓ Izin Google Sheets (menulis baris spreadsheet)</p>
          <p>✓ Izin Google Drive read-only (memilih spreadsheet tujuan)</p>
          <p>✓ Token refresh tersimpan terenkripsi aman</p>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
