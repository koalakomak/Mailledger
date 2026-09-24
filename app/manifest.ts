import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MailLedger — Rekap Keuangan Otomatis",
    short_name: "MailLedger",
    description:
      "Rekap otomatis transaksi dari email bank dan e-wallet Indonesia ke Google Sheets.",
    lang: "id",
    dir: "ltr",
    start_url: "/dashboard/overview",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Transaksi", url: "/dashboard/transactions" },
      { name: "Kalender", url: "/dashboard/calendar" },
    ],
  };
}
