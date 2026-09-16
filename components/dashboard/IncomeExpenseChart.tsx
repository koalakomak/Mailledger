"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface Props {
  income: number;
  expense: number;
}

export function IncomeExpenseChart({ income, expense }: Props) {
  const data = [
    {
      name: "Total Saat Ini",
      Pemasukan: income,
      Pengeluaran: expense,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-white mb-1">Ringkasan Arus Keuangan</h3>
      <p className="text-xs text-slate-400 mb-4">
        Pemasukan {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(income)} ·
        Pengeluaran {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(expense)}
      </p>
      <div className="h-64 w-full" role="img" aria-label={"Grafik batang pemasukan dan pengeluaran. Pemasukan " + income + " rupiah, pengeluaran " + expense + " rupiah."}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
            />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
