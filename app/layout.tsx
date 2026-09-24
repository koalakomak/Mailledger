import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MailLedger — Otomasi Email Transaksi ke Google Sheets",
  description: "SaaS otomatis membaca email transaksi perbankan dan e-wallet di Indonesia dan merekapnya rapi ke Google Sheets.",
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
        {children}
      </body>
    </html>
  );
}
