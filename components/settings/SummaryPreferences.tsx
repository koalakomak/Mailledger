"use client";

import { useCallback, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { useToast } from "../Toast";

interface Prefs {
  summaryDaily: boolean;
  summaryWeekly: boolean;
  summaryMonthly: boolean;
}

const OPTIONS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: "summaryDaily", title: "Harian", desc: "Rincian transaksi hari ini, dikirim setiap malam (± 20.00 WIB)." },
  { key: "summaryWeekly", title: "Mingguan", desc: "Ringkasan 7 hari terakhir, dikirim setiap Senin pagi." },
  { key: "summaryMonthly", title: "Bulanan", desc: "Ringkasan bulan lalu, dikirim setiap tanggal 1." },
];

export function SummaryPreferences() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs>({ summaryDaily: false, summaryWeekly: false, summaryMonthly: true });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/summaries");
      const json = await res.json();
      if (json.success) setPrefs(json.data);
    } catch (err) {
      console.error("Gagal memuat preferensi ringkasan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const toggle = async (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    try {
      const res = await fetch("/api/settings/summaries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast("success", "Preferensi ringkasan disimpan.");
      } else {
        setPrefs(prefs);
        toast("error", json.error?.message || "Gagal menyimpan preferensi.");
      }
    } catch (err) {
      setPrefs(prefs);
      toast("error", "Terjadi kesalahan saat menyimpan preferensi.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
        <MailCheck className="w-4 h-4 text-emerald-400" /> Ringkasan Otomatis via Email
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Pilih frekuensi ringkasan keuangan yang ingin dikirim ke email Anda. Bisa memilih lebih dari satu.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {OPTIONS.map((opt) => {
            const checked = prefs[opt.key];
            const saving = savingKey === opt.key;
            return (
              <li key={opt.key}>
                <label
                  className={
                    "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition " +
                    (checked ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-800 bg-slate-950/40 hover:bg-slate-800/40")
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.key)}
                    disabled={saving}
                    className="mt-0.5 w-4 h-4 accent-emerald-500"
                    aria-describedby={"desc-" + opt.key}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-100">
                      {opt.title}
                      {saving && <span className="text-[11px] text-slate-400"> · menyimpan...</span>}
                    </span>
                    <span id={"desc-" + opt.key} className="block text-xs text-slate-400 mt-0.5">
                      {opt.desc}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-slate-400 mt-4">
        Email dikirim dari akun Google Anda sendiri. Jika tombol sinkronisasi email belum diizinkan, buka
        pengaturan izin Google lalu login ulang.
      </p>
    </div>
  );
}
