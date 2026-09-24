export const metadata = { title: "Mode Offline — MailLedger" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold text-white">Tidak ada koneksi</h1>
        <p className="text-sm text-slate-400 mt-2">
          MailLedger sedang offline. Sambungkan kembali internet lalu muat ulang halaman.
        </p>
      </div>
    </div>
  );
}
