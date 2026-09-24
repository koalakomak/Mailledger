import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MailLedger — Otomasi Email Transaksi ke Google Sheets",
  description:
    "SaaS otomatis membaca email transaksi perbankan dan e-wallet di Indonesia dan merekapnya rapi ke Google Sheets.",
  applicationName: "MailLedger",
  appleWebApp: {
    capable: true,
    title: "MailLedger",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#f3f6fb" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Skrip kecil dijalankan sebelum konten dirender agar tema tersimpan
  // langsung dipakai (tidak ada kedipan putih saat halaman dibuka).
  const themeInit = [
    "(function(){try{",
    "var t=localStorage.getItem('theme');",
    "if(t!=='light'&&t!=='dark'){t='dark';}",
    "document.documentElement.classList.remove('light','dark');",
    "document.documentElement.classList.add(t);",
    "}catch(e){document.documentElement.classList.add('dark');}})();",
  ].join("");

  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={geistSans.variable + " bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-black"}>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
