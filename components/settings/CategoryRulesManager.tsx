"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { useToast } from "../Toast";
import { CATEGORIES } from "@/lib/categorize";

interface Rule {
  id: string;
  keyword: string;
  category: string;
}

export function CategoryRulesManager() {
  const toast = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/category-rules");
      const json = await res.json();
      if (json.success) setRules(json.data);
    } catch (err) {
      console.error("gagal ambil aturan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/category-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), category }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast("success", "Aturan disimpan dan diterapkan ke transaksi yang cocok.");
        setKeyword("");
        await fetchRules();
      } else {
        toast("error", json.error?.message || "Gagal menyimpan aturan.");
      }
    } catch (err) {
      toast("error", "Terjadi kesalahan saat menyimpan aturan.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch("/api/category-rules?id=" + encodeURIComponent(id), { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast("info", "Aturan dihapus.");
        setRules((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast("error", "Gagal menghapus aturan.");
      }
    } catch (err) {
      toast("error", "Terjadi kesalahan saat menghapus aturan.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
        <Tag className="w-4 h-4 text-emerald-400" /> Aturan Kategori Otomatis
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Transaksi baru akan otomatis dikategorikan. Aturan Anda lebih diutamakan daripada kategori bawaan. Saat aturan disimpan, transaksi lama yang cocok ikut diperbarui.
      </p>

      <form onSubmit={addRule} className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Kata kunci merchant/deskripsi, mis. kopi"
          required
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !keyword.trim()}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-slate-500">Memuat aturan...</p>
      ) : rules.length === 0 ? (
        <p className="text-xs text-slate-500 bg-slate-950/50 border border-slate-800 rounded-lg p-4">
          Belum ada aturan. Tambahkan kata kunci agar transaksi otomatis masuk kategori yang Anda inginkan.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 border border-slate-800 rounded-lg">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm text-slate-200 truncate">{'"'}{r.keyword}{'"'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {r.category}
                </span>
              </div>
              <button
                onClick={() => deleteRule(r.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                aria-label="Hapus aturan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
