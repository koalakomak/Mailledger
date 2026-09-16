# Panduan Ubah UI/UX MailLedger

> Cakupan: hanya mengubah tampilan (warna, teks, jarak, susunan). **Tanpa menyentuh backend/API/bisnis-logic.**

## Folder & file yang AMAN diubah (UI/UX saja)

### Halaman

| Path | Isi |
|---|---|
| `app/page.tsx` | Landing page (hero, fitur, footer) |
| `app/(auth)/login/page.tsx` | Halaman login |
| `app/dashboard/overview/page.tsx` | Ringkasan |
| `app/dashboard/transactions/page.tsx` | Daftar transaksi + filter |
| `app/dashboard/review/page.tsx` | Antrean tinjauan manual |
| `app/dashboard/sources/page.tsx` | Kelola sumber |
| `app/dashboard/spreadsheet/page.tsx` | Koneksi Google Sheet |
| `app/dashboard/errors/page.tsx` | Log error |
| `app/dashboard/settings/page.tsx` | Pengaturan (termasuk aturan kategori) |
| `app/dashboard/layout.tsx` | Kerangka dashboard (jaga `SessionProvider` + `DashboardShell`) |
| `app/layout.tsx` | Shell root (font/meta; jaga `geistSans` & `metadata`) |

### Komponen UI

| Path | Isi |
|---|---|
| `components/dashboard/Sidebar.tsx` | Menu samping (drawer mobile) |
| `components/dashboard/Header.tsx` | Header + tombol sinkronisasi |
| `components/dashboard/DashboardShell.tsx` | Kerangka + toast provider |
| `components/dashboard/OverviewCards.tsx` | 4 kartu ringkasan |
| `components/dashboard/IncomeExpenseChart.tsx` | Grafik (recharts) |
| `components/transactions/TransactionTable.tsx` | Tabel + kartu mobile |
| `components/transactions/EditTransactionModal.tsx` | Modal edit transaksi |
| `components/sheets/SheetConnectCard.tsx` | Kartu koneksi spreadsheet |
| `components/sources/SourcesGrid.tsx` | Grid sumber |
| `components/settings/CategoryRulesManager.tsx` | Manajer aturan kategori |
| `components/Toast.tsx` | Notifikasi toast |

### Style & tema

| Path | Isi |
|---|---|
| `app/globals.css` | Variabel warna, font body, scrollbar |
| `tailwind.config.ts` | Tema/warna Tailwind |

## DILARANG disentuh (backend/keamanan/kontrak)

| Path | Alasan |
|---|---|
| `app/api/**` | Semua endpoint API - kontrak yang dipakai komponen. Ubah = aplikasi bisa rusak. |
| `services/**` | Gmail fetch, syncer Sheets, pipeline transaksi, rekap bulanan |
| `parsers/**` | Parser email & util nominal/tanggal |
| `lib/auth/**`, `lib/db/**`, `lib/google/**`, `lib/encryption/**`, `lib/validation/**` | Autentikasi, database, Google API, enkripsi, validasi |
| `lib/categorize.ts` | Logika kategori otomatis (dipakai backend) |
| `prisma/**` | Skema database |
| `worker/**` | Worker/scheduler lokal |
| `middleware.ts` | Proteksi route dashboard |
| `next.config.mjs` | Security headers & image config |
| `vercel.json` | Konfigurasi deploy |
| `.github/**` | CI, auto-sync, rekap bulanan |
| `tests/**` | Test (jangan ubah kecuali menambah UI test) |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `postcss.config.mjs`, `docker-compose.yml` | Konfigurasi build/dependency |
| `.env`, `.env.local`, `.env.example` | Kredensial/secret |

## Hal yang perlu diperhatikan

1. **React + Tailwind** - kebanyakan styling lewat `className` Tailwind (`bg-slate-900`, `text-emerald-400`, dll). Ubah warna/ukuran di situ, tidak perlu file CSS baru.
2. **Jaga kontrak komponen** - jangan ubah nama/tipe props yang dipakai file lain, kecuali Anda ikut mengubah pemanggilnya.
3. **Jangan hapus logika fetch/data** - misal `useState`, `fetch("/api/...")`, `useToast()`, `useSession()` di dalam halaman/komponen. Itu bagian yang menghubungkan ke backend.
4. **Teks/label boleh bebas diubah** (sudah bahasa Indonesia) - jangan ubah `key`/`value` di `<option>`, `dataKey` grafik, atau `href` link.
5. **Ikon** berasal dari `lucide-react` - tambah/ganti ikon cukup impor dari sana.
6. **Warna global** - untuk skema warna menyeluruh, sentuh `globals.css` (variabel) & `tailwind.config.ts`, bukan file per-komponen.
7. **Font** - diatur di `app/layout.tsx` + `globals.css` (variabel `--font-geist-sans`).
8. **Responsif** - pola yang dipakai: `sm:` / `lg:` di Tailwind; kartu di HP vs tabel desktop ada di `TransactionTable.tsx`.
9. **Jangan commit file `.env`** dan **jangan push file sementara** (misal `*.tmp`).
10. Setelah selesai mengubah, jalankan:

    npm run lint
    npm run build

    lalu minta deploy ulang (atau push via GitHub bila sudah terkoneksi auto-deploy).
