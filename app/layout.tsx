import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailLedger — Otomasi Email Transaksi ke Google Sheets",
  description: "SaaS otomatis membaca email transaksi perbankan dan e-wallet di Indonesia dan merekapnya rapi ke Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
