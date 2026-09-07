import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, Zap, Database } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-emerald-500/20">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">MailLedger</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Login with Google
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5" /> Automated Financial Ledger for Gmail & Sheets
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Otomatiskan Rekap Transaksi dari <span className="text-emerald-400">Gmail</span> Langsung ke <span className="text-emerald-400">Google Sheets</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          MailLedger membaca email notifikasi transaksi dari bank dan e-wallet (BCA, GoPay, OVO, Shopee, Tokopedia), mengekstrak data nominal, merchant, dan tanggal secara cerdas, lalu mencatatnya rapi ke Google Sheets tanpa input manual.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition"
          >
            Mulai Sekarang dengan Google <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-900">
        <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 text-center mb-3">Fitur Utama</h2>
        <h3 className="text-2xl font-bold text-white text-center mb-12">Dirancang Sederhana, Akurat, dan Terpercaya</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white mb-2">Integrasi Plug-and-Play</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Login dengan akun Google, pilih sumber email yang ingin dibaca dan spreadsheet tujuan. Tidak perlu setup webhook atau coding.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white mb-2">Parsing Cerdas & Deduplikasi</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algoritma parser khusus per sumber dengan scoring confidence. Transaksi ganda otomatis dicegah menggunakan Gmail message ID.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-white mb-2">Review Manual & Keamanan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transaksi dengan confidence rendah ditandai untuk review manual. Data Anda diisolasi dan token dienkripsi aman.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Sources */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-900 text-center">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-6">Sumber Transaksi yang Didukung di Indonesia</h4>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-300">
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">Bank Central Asia (BCA)</span>
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">Livin&apos; by Mandiri</span>
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">GoPay / Gojek</span>
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">OVO</span>
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">ShopeePay / Shopee</span>
          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">Tokopedia</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 MailLedger. All rights reserved. Built for automated financial tracking.</p>
      </footer>
    </div>
  );
}
