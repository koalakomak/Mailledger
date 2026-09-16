# PRD: MailLedger

## Ringkasan Produk

MailLedger adalah SaaS web yang secara otomatis membaca email transaksi dari berbagai sumber (bank, e-wallet, marketplace) dan merekapnya ke Google Sheets dengan rapi. Produk ditujukan bagi individu, pelaku bisnis kecil, dan freelancer yang ingin mencatat keuangan tanpa input manual. Nilai utama MailLedger adalah:

1. **Integrasi plug-and-play** – pengguna cukup login, pilih sumber email, dan tentukan spreadsheet tujuan; sistem langsung berjalan tanpa perlu coding.
2. **Parsing transaksi cerdas** – ekstraksi otomatis tanggal, nominal, merchant, tipe transaksi (masuk/keluar), dan kategori dengan confidence score.
3. **Dashboard monitoring** – menampilkan riwayat transaksi, error parsing, dan status sinkronisasi ke Google Sheets.

MVP akan fokus pada sumber transaksi populer di Indonesia (BCA, GoPay, OVO, Shopee, Tokopedia) dan mendukung banyak pengguna dengan akun Google masing-masing. Produk tidak menyediakan fitur payment/subscription pada tahap ini.

MailLedger tersedia sebagai web app responsive, dengan halaman publik untuk marketing dan dashboard pribadi setelah login. Pengguna mengelola koneksi sumber, spreadsheet tujuan, dan melihat log transaksi.

## Pernyataan Masalah

Pencatatan keuangan pribadi atau bisnis kecil sering dilakukan manual di spreadsheet atau aplikasi note. Masalah yang muncul:

- Notifikasi transaksi bertebaran di email dan sulit dilacak.
- Memindahkan data dari email ke spreadsheet memakan waktu dan rawan kesalahan input.
- Tidak ada ringkasan otomatis tentang uang masuk/keluar per merchant/kategori.
- Pengguna harus menguasai formula spreadsheet atau aplikasi akuntansi rumit.

Kompetitor seperti aplikasi expense tracker sering mengharuskan input manual atau koneksi bank terbatas. MailLedger memanfaatkan email yang sudah menjadi sumber kebenaran transaksi, lalu mengotomatiskannya ke Google Sheets yang sudah familiar bagi banyak orang.

## Tujuan & Objektif

### Tujuan Produk

Membantu pengguna menghemat waktu pencatatan keuangan dan mendapatkan visibilitas transaksi tanpa meninggalkan Google Sheets.

### Objektif MVP Terukur

| Objektif | Target 90 hari setelah beta publik | Cara ukur |
|---|---:|---|
| Aktivasi pengguna | ≥ 50% pengguna baru berhasil menghubungkan minimal satu sumber email dalam 1 jam | Event `source_connected` |
| Keberhasilan parsing | Akurasi parsing ≥ 90% dari email transaksi yang diproses | Perbandingan hasil parsing vs review manual |
| Retensi mingguan | ≥ 30% pengguna aktif membuka dashboard minimal sekali per minggu | Event `dashboard_viewed` |
| Integrasi Sheets | ≥ 70% pengguna yang connect sumber juga connect Google Sheets | Event `sheets_connected` |
| Tingkat error | Error parsing < 5% dari total email yang diproses | Monitoring log error |
| Kepuasan pengguna | CSAT ≥ 4 dari 5 setelah penggunaan 2 minggu | Survey in-app |

### Prinsip Keputusan

- Fokus pada otomatisasi yang dapat diandalkan, bukan fitur akuntansi lengkap.
- Dukung sumber transaksi populer secara bertahap, mulai dari 3–5 sumber.
- Jangan menambah kompleksitas sebelum akurasi parsing terbukti.

## Target Pengguna

### Individu yang Ingin Tracking Pengeluaran Pribadi

- Menerima banyak email transaksi dari bank/e-wallet/marketplace.
- Ingin rekap otomatis di Google Sheets tanpa input manual.
- Menggunakan spreadsheet untuk budgeting sederhana.

### Freelancer & Pemilik Bisnis Kecil

- Perlu memisahkan transaksi bisnis dan pribadi.
- Menginginkan laporan arus kas sederhana dari email transaksi.
- Tidak punya waktu untuk mengelola software akuntansi.

### Tim Operasional / Admin

- Mengelola pengeluaran operasional perusahaan kecil.
- Membutuhkan data transaksi terkumpul di spreadsheet untuk dibagikan ke tim.

### Karakteristik Bersama

- Familiar dengan Google Sheets dan Gmail.
- Tidak ingin ribet dengan integrasi bank API.
- Menghargai transparansi data dan kontrol penuh atas spreadsheet.

## Fitur Inti

| Prioritas | Fitur | User story | Kriteria penerimaan utama |
|---|---|---|---|
| P0 | Autentikasi Google OAuth | Sebagai pengguna, saya ingin login dengan akun Google agar tidak perlu membuat password baru. | Pengguna klik "Login dengan Google", memberikan izin, dan diarahkan ke dashboard. Token OAuth disimpan aman. |
| P0 | Koneksi sumber email | Sebagai pengguna, saya ingin memilih sumber transaksi (misal BCA) agar sistem tahu email mana yang harus diproses. | Pengguna memilih dari daftar sumber yang didukung, sistem menyimpan filter Gmail yang sesuai. |
| P0 | Koneksi Google Sheets | Sebagai pengguna, saya ingin memilih spreadsheet tujuan agar transaksi tercatat di sana. | Pengguna memilih file Google Sheets, sistem menyimpan ID spreadsheet dan nama sheet. |
| P0 | Sinkronisasi otomatis | Sebagai pengguna, saya ingin transaksi baru otomatis masuk ke spreadsheet tanpa saya buka aplikasi. | Sistem menjalankan pengecekan email setiap 10–15 menit (dapat dikonfigurasi) dan menulis transaksi baru. |
| P0 | Parsing transaksi | Sebagai pengguna, saya ingin sistem membaca email dan mengekstrak tanggal, nominal, merchant, dan tipe transaksi. | Setiap email yang cocok diparsing menggunakan parser khusus per sumber. Hasil parsing ditampilkan di dashboard. |
| P0 | Deduplikasi | Sebagai pengguna, saya tidak ingin transaksi yang sama tercatat dua kali. | Sistem menyimpan `message_id` Gmail dan mengecek sebelum insert. |
| P0 | Dashboard transaksi | Sebagai pengguna, saya ingin melihat daftar transaksi yang sudah diproses beserta statusnya. | Tabel berisi tanggal, deskripsi, merchant, tipe, jumlah, status (auto/review), dan link ke email. |
| P0 | Review manual | Sebagai pengguna, saya ingin menandai transaksi yang parsingnya diragukan agar bisa saya koreksi. | Transaksi dengan confidence rendah otomatis masuk status "review". Pengguna bisa edit dan konfirmasi. |
| P0 | Log error | Sebagai pengguna, saya ingin tahu jika ada email yang gagal diproses. | Dashboard menampilkan daftar error parsing dengan alasan singkat. |
| P0 | Template spreadsheet | Sebagai pengguna, saya ingin format kolom di Google Sheets sudah standar. | Saat pertama connect, sistem otomatis membuat header: Tanggal, Deskripsi, Merchant, Tipe, Jumlah, Sumber, ID Email. |
| P1 | Kustomisasi mapping kolom | Sebagai pengguna, saya ingin menyesuaikan urutan/nama kolom di spreadsheet. | UI memungkinkan pengguna memilih header mana yang dipetakan ke field hasil parsing. |
| P1 | Kategori otomatis | Sebagai pengguna, saya ingin transaksi dikategorikan (makanan, transport, dll) berdasarkan merchant. | Sistem menyediakan mapping default merchant → kategori, dapat diedit pengguna. |
| P1 | Notifikasi error | Sebagai pengguna, saya ingin diberi tahu via email jika terjadi kegagalan sinkronisasi. | Email notifikasi terkirim jika terjadi error beruntun atau OAuth token expired. |
| P1 | Multi-account per user | Sebagai pengguna, saya ingin menghubungkan lebih dari satu akun Google (misal pribadi dan kantor). | Pengguna dapat menambah beberapa akun Google dan memilih sumber/spreadsheet untuk masing-masing. |
| P2 | Export CSV/PDF | Sebagai pengguna, saya ingin mengunduh data transaksi untuk keperluan lain. | Tombol export menghasilkan file CSV dari data transaksi. |
| P2 | Dukungan multi-currency | Sebagai pengguna yang kadang bertransaksi dalam USD, saya ingin nominal dikonversi atau setidaknya ditandai. | Parser mengenali simbol mata uang dan menyimpan nilai asli serta mata uang. |
| P2 | Rule engine sederhana | Sebagai pengguna, saya ingin membuat aturan khusus (misal jika merchant mengandung "Gojek" kategorikan sebagai transport). | UI untuk menambah aturan berbasis kondisi sederhana (if field contains X then set Y). |
| P2 | Kolaborasi spreadsheet | Sebagai pengguna, saya ingin beberapa orang bisa mengakses spreadsheet hasil rekap. | Tidak diimplementasikan di MVP, tetapi dokumentasi cara share spreadsheet dari Google. |

## Alur Pengguna

### Alur Onboarding & Aktivasi

1. Pengguna membuka MailLedger dan klik "Login dengan Google".
2. Setelah OAuth berhasil, pengguna diarahkan ke halaman setup.
3. Pengguna memilih sumber transaksi pertama (misal: BCA).
4. Sistem meminta akses Gmail (scope read-only) dan Google Sheets (read/write).
5. Pengguna memilih atau membuat spreadsheet tujuan.
6. Sistem menjalankan sinkronisasi awal (backfill email 7 hari terakhir).
7. Pengguna melihat transaksi pertama muncul di dashboard dan spreadsheet.
8. Pengguna dapat menambah sumber lain atau menyelesaikan setup.

### Alur Sinkronisasi Harian

1. Background job berjalan setiap 10 menit.
2. Untuk setiap user aktif, job menarik email baru dari Gmail menggunakan query spesifik per sumber.
3. Email diambil, diambil `message_id` dan isi plain text/HTML.
4. Parser yang sesuai memproses isi email dan mengekstrak field.
5. Sistem mengecek duplikasi berdasarkan `message_id` di database.
6. Jika baru, transaksi disimpan dengan status `auto` atau `review`.
7. Jika status `auto`, data langsung ditulis ke Google Sheets via API.
8. Jika gagal, dicatat di log error dan pengguna diberi notifikasi (jika diaktifkan).

### Alur Review Manual

1. Pengguna membuka dashboard dan melihat daftar transaksi dengan status "review".
2. Pengguna klik transaksi untuk melihat detail email asli dan hasil parsing.
3. Pengguna mengedit field yang salah (misal nominal atau merchant).
4. Pengguna klik "Konfirmasi".
5. Sistem menyimpan perubahan dan menulis ke Google Sheets.

### Momen Value Tercapai

Value pertama tercapai saat pengguna melihat transaksi otomatis masuk ke spreadsheet tanpa input manual. Value utama tercapai saat pengguna dapat menggunakan data tersebut untuk analisis keuangan sederhana (misal total pengeluaran bulan ini per kategori).

## Teknologi (Tech Stack)

### Frontend

- **Next.js 14 (App Router) dengan TypeScript** – framework utama web app.
- **Tailwind CSS** – styling responsive.
- **shadcn/ui + Radix UI** – komponen dashboard yang aksesibel.
- **TanStack Query** – data fetching dan caching.
- **React Hook Form + Zod** – form validation untuk UI mapping.
- **Recharts** – visualisasi sederhana (opsional, grafik ringkasan).

### Backend & API

- **Next.js Route Handlers** sebagai BFF untuk API internal.
- **Node.js runtime** untuk background job dan integrasi.
- **Prisma ORM** untuk akses database.
- **BullMQ + Redis** untuk job queue (sinkronisasi, parsing).
- **NextAuth.js (Auth.js)** dengan Google Provider untuk OAuth.
- **Gaxios/googleapis** untuk Google API (Gmail, Sheets).

### Database & Infrastruktur

- **PostgreSQL 16** – database utama.
- **Redis** (Upstash) – queue, cache, dan rate limiting.
- **Vercel** – hosting Next.js dan serverless functions.
- **Cloud Run / Railway** – untuk background worker (jika tidak pakai Vercel Cron).
- **GitHub Actions** – CI/CD.
- **Sentry** – error tracking.

### Integrasi Eksternal

- **Gmail API** – membaca email (`gmail.readonly`).
- **Google Sheets API** – menulis data (`spreadsheets`).
- **Google OAuth2** – autentikasi dan otorisasi pengguna.

## Skema Database

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string name
        datetime created_at
        datetime last_login_at
    }

    ACCOUNT {
        uuid id PK
        uuid user_id FK
        string provider
        string provider_account_id
        string encrypted_refresh_token
        datetime token_expires_at
        datetime created_at
    }

    SOURCE {
        uuid id PK
        string name
        string slug
        string parser_type
        string filter_query
        boolean is_active
        datetime created_at
    }

    USER_SOURCE {
        uuid id PK
        uuid user_id FK
        uuid source_id FK
        uuid account_id FK
        boolean is_active
        datetime last_synced_at
        datetime created_at
    }

    SPREADSHEET_CONNECTION {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        string spreadsheet_id
        string sheet_name
        string column_mapping
        boolean is_active
        datetime last_synced_at
        datetime created_at
    }

    TRANSACTION {
        uuid id PK
        uuid user_id FK
        uuid source_id FK
        string email_message_id
        string email_thread_id
        string email_subject
        datetime email_received_at
        datetime transaction_date
        string description
        string merchant
        string type
        decimal amount
        string currency
        string category
        string status
        integer confidence
        jsonb raw_data
        datetime created_at
        datetime updated_at
    }

    TRANSACTION_LOG {
        uuid id PK
        uuid transaction_id FK
        uuid user_id FK
        string status
        string message
        jsonb payload
        datetime created_at
    }

    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ USER_SOURCE : "subscribes"
    SOURCE ||--o{ USER_SOURCE : "available"
    USER ||--o{ SPREADSHEET_CONNECTION : "connects"
    USER ||--o{ TRANSACTION : "owns"
    SOURCE ||--o{ TRANSACTION : "produces"
    TRANSACTION ||--o{ TRANSACTION_LOG : "has_logs"