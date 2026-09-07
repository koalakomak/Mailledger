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
  return (
    <html lang="id" className="dark">
      <body className={geistSans.variable + " bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-black"}>
        {children}
      </body>
    </html>
  );
}
