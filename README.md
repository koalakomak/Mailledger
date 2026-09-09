# MailLedger

[![CI](https://github.com/koalakomak/Mailledger/actions/workflows/ci.yml/badge.svg)](https://github.com/koalakomak/Mailledger/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

Otomatisasi pencatatan keuangan pribadi dari email notifikasi transaksi (bank dan e-wallet Indonesia) ke Google Sheets, tanpa input manual.

MailLedger membaca email transaksi dari Gmail, mengekstrak nominal, tanggal, merchant, dan tipe transaksi menggunakan parser khusus per sumber, menilai tingkat keyakinan hasil ekstraksi, lalu mencatatnya ke Google Sheets. Transaksi dengan keyakinan rendah menunggu tinjauan manual melalui dashboard.

##Tampilan
<img width="1470" height="838" alt="Screenshot 2026-09-08 at 10 22 57" src="https://github.com/user-attachments/assets/c9d1bf0c-8dbe-4af8-b450-3c6fc643e64f" />
<img width="1470" height="836" alt="Screenshot 2026-09-08 at 10 22 43" src="https://github.com/user-attachments/assets/8fe2b51e-3dc8-414a-8503-facd2c3b5350" />
<img width="1470" height="837" alt="Screenshot 2026-09-08 at 10 21 54" src="https://github.com/user-attachments/assets/29ec2620-7ecd-4e53-8a63-48d8d0513ee7" />
<img width="1470" height="834" alt="Screenshot 2026-09-08 at 10 16 54" src="https://github.com/user-attachments/assets/3435524d-fe50-443d-b788-eccd3fabbf54" />
<img width="1470" height="837" alt="Screenshot 2026-09-08 at 10 16 31" src="https://github.com/user-attachments/assets/42f3da21-90bb-49a8-846a-e4c81afa39b3" />


## Fitur

- Masuk dengan akun Google (OAuth 2.0) dengan scope Gmail read-only, Google Sheets, dan Drive read-only.
- Parser bawaan untuk Bank BCA, Livin' by Mandiri, GoPay/Gojek, OVO, Shopee, dan Tokopedia.
- Normalisasi nominal Rupiah (termasuk format kecil seperti Rp 10,00 dan Rp 1.000,00) dan konversi tanggal/waktu WIB ke UTC.
- Penilaian keyakinan (confidence) per transaksi:
  - 80% atau lebih: status otomatis (AUTO), langsung ditulis ke Google Sheets.
  - Di bawah 80%: masuk antrean tinjauan manual (REVIEW) pada dashboard.
- Pencegahan duplikasi pada level database dan level lembar kerja Google Sheets.
- Sinkronisasi berkala otomatis setiap 10 menit melalui GitHub Actions (tanpa bergantung pada cron berbayar).
- Dashboard responsif untuk perangkat mobile dan desktop.
- Kategori otomatis dari merchant dengan aturan yang dapat disesuaikan pengguna.
- Ringkasan keuangan bulanan (pemasukan, pengeluaran, kategori terbesar) dikirim otomatis melalui email setiap awal bulan.
- Isolasi data per pengguna dan enkripsi token OAuth (AES-256-GCM) saat disimpan.

## Alur Kerja

1. Pengguna menghubungkan sumber transaksi (misalnya BCA atau Mandiri) di halaman Sumber.
2. Sistem membaca email yang cocok dengan filter sumber dalam 7 hari terakhir.
3. Parser mengekstrak transaksi dan menghitung skor keyakinan.
4. Transaksi disimpan ke PostgreSQL (Prisma).
5. Transaksi berkeyakinan tinggi langsung ditambahkan ke Google Sheets; sisanya menunggu konfirmasi manual.

## Arsitektur

- Aplikasi web: Next.js 14 (App Router) dengan TypeScript dan Tailwind CSS.
- API: Next.js Route Handlers dengan autentikasi NextAuth.js.
- Database: PostgreSQL dengan Prisma ORM.
- Sinkronisasi: endpoint /api/cron/sync dipanggil GitHub Actions setiap 10 menit.
- Pemrosesan berat (opsional): worker BullMQ untuk pengembangan lokal.
- Pengujian: Vitest.

## Struktur Direktori

- app - halaman dashboard, rute API, dan tata letak aplikasi.
- components - komponen UI dashboard.
- lib - konfigurasi autentikasi, enkripsi, klien Google, dan validasi.
- parsers - parser email transaksi per sumber dan utilitas bersama.
- services - logika bisnis: pengambilan email, sinkronisasi Sheets, dan pipeline transaksi.
- prisma - skema database dan seeder.
- worker - worker dan scheduler lokal (opsional).
- tests - pengujian unit dan integrasi.

## Prasyarat

- Node.js 20 atau lebih baru.
- Docker dan Docker Compose (untuk PostgreSQL dan Redis lokal).
- Project Google Cloud dengan Gmail API, Google Sheets API, dan Google Drive API aktif.
- Akun Vercel (gratis) untuk deployment dan akun Neon (PostgreSQL) untuk database.

## Menjalankan Secara Lokal

1. Salin file environment dan sesuaikan nilainya.

   cp .env.example .env.local

2. Jalankan PostgreSQL dan Redis.

   docker compose up -d

3. Siapkan skema dan seeder.

   npm install
   npx prisma db push
   npm run db:seed

4. Jalankan aplikasi web dan worker (dua terminal terpisah).

   Terminal 1: npm run dev
   Terminal 2: npm run worker

Akses aplikasi di http://localhost:3000.

## Variabel Environtment

Daftar lengkap tersedia di .env.example. Variabel penting:

- DATABASE_URL dan DIRECT_URL: koneksi PostgreSQL.
- NEXTAUTH_URL dan NEXT_PUBLIC_APP_URL: URL publik aplikasi.
- NEXTAUTH_SECRET: kunci sesi NextAuth.
- GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET: kredensial OAuth Google.
- GOOGLE_ENCRYPTION_KEY: kunci enkripsi token OAuth (AES-256-GCM).
- CRON_SECRET: opsional, melindungi endpoint /api/cron/sync.

Jangan pernah menyimpan file .env atau .env.local ke repositori; keduanya telah dikecualikan oleh .gitignore.

## Deployment di Vercel

1. Unggah repositori ke GitHub, lalu impor ke Vercel.
2. Isi seluruh variabel Environtment pada pengaturan project Vercel.
3. Tambahkan redirect URI pada OAuth Client di Google Cloud Console:
   - https://<nama-project>.vercel.app/api/auth/callback/google
4. Deploy. Sinkronisasi berkala dijalankan oleh GitHub Actions melalui .github/workflows/sync.yml.

## Pengujian

  npm run test
  npm run typecheck
  npm run lint
  npm run build

## Keamanan

- Token refresh Google disimpan terenkripsi dengan AES-256-GCM.
- Seluruh kueri data dibatasi oleh identitas pengguna yang sedang masuk.
- Header keamanan (CSP, X-Frame-Options, Referrer-Policy, dan lainnya) diterapkan pada setiap respons.
- Endpoint sinkronisasi berkala dilindungi CRON_SECRET.
- Jangan menaruh kredensial di kode; gunakan variabel Environtment dan rahasia deployment.

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
