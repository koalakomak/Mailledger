# MailLedger

> **Automated Financial Ledger from Gmail to Google Sheets**

MailLedger adalah aplikasi web SaaS yang secara otomatis membaca email notifikasi transaksi perbankan dan e-wallet di Indonesia (BCA, GoPay, OVO, Shopee, Tokopedia), mengekstrak informasi transaksi menggunakan intelligent parsing & confidence scoring, lalu merekapnya secara otomatis dan rapi ke Google Sheets tanpa input manual.

---

## 🌟 Fitur Utama

- **Google OAuth 2.0 Integration**: Login aman dengan akun Google sekaligus meminta scope `gmail.readonly` dan `spreadsheets`.
- **Intelligent Transaction Parsing**: Ekstraksi nominal, tanggal transaksi, merchant/penerima, tipe (Income/Expense), dan kategori.
- **Confidence Scoring & Status Gate**:
  - Score $\ge 80\%$ $\rightarrow$ `AUTO` (langsung sinkron ke Google Sheets).
  - Score $< 80\%$ $\rightarrow$ `REVIEW` (antrean tinjauan manual oleh pengguna).
- **Deduplikasi Cerdas**: Mencegah duplikasi data di level database `(userId, emailMessageId)` dan sheet row check.
- **Background Worker & Auto-Sync**: Sinkronisasi periodik (setiap 10–15 menit) menggunakan BullMQ + Redis worker dengan fallback.
- **Initial Backfill**: Mengambil histori transaksi 7 hari terakhir saat pertama kali menghubungkan sumber transaksi.
- **Interactive Modern Dashboard**: Ringkasan arus kas (Income vs Expense), tabel riwayat transaksi, edit modal, dan log error.
- **Security & Data Isolation**: Multi-tenant data isolation, enkripsi token OAuth at-rest dengan algoritma **AES-256-GCM**.

---

## 🏗️ Arsitektur Sistem

```
Gmail Email
    │
    ▼
Source Detection & Query Filter
    │
    ▼
Parser Registry (BCA, GoPay, OVO, Shopee, Tokopedia)
    │
    ▼
Normalized Transaction (Amount, Date, Merchant, Type, Currency)
    │
    ▼
Confidence Scoring (0 - 100)
    │
    ├── Deduplication Check (userId + emailMessageId)
    │
    ▼
Database (PostgreSQL + Prisma)
    │
    ├── Score ≥ 80% (AUTO)  ──► Google Sheets API (Append Rows)
    │
    └── Score < 80% (REVIEW) ──► Manual Review Queue (Dashboard) ──► Confirm ──► Sheets
```

---

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Next.js Route Handlers, NextAuth.js (Google Provider), googleapis
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Queue & Worker**: BullMQ, Redis (Upstash compatible), tsx runner
- **Testing**: Vitest, React Testing Library
- **Security**: AES-256-GCM Token Encryption, Zod Validation

---

## 📁 Struktur Direktori

```text
mailledger/
├── app/
│   ├── (auth)/login/          # Halaman Login OAuth
│   ├── dashboard/             # Dashboard Layout & Pages
│   │   ├── overview/          # Metrik & Grafik Arus Kas
│   │   ├── transactions/      # Tabel Semua Transaksi
│   │   ├── review/            # Antrean Manual Review
│   │   ├── sources/           # Kelola Sumber Transaksi (BCA, GoPay, dll)
│   │   ├── spreadsheet/       # Koneksi Google Sheet
│   │   ├── errors/            # Log Error & Diagnostik
│   │   └── settings/          # Pengaturan Akun & OAuth
│   ├── api/                   # REST API BFF (Auth, Gmail, Sheets, Transactions, Sources)
│   └── page.tsx               # Public Marketing Landing Page
│
├── components/                # Komponen UI Dashboard & Tabel
├── lib/
│   ├── auth/                  # NextAuth Configuration
│   ├── db/                    # Prisma Client Singleton
│   ├── encryption/            # Enkripsi Token AES-256-GCM
│   ├── google/                # Google API Auth Client (Gmail & Sheets)
│   └── validation/            # Zod Schemas
│
├── parsers/                   # Parser Registry & Implementasi
│   ├── types.ts               # Interface Transaksi & Parser
│   ├── registry.ts            # Parser Registry Engine
│   ├── bca/                   # Parser BCA (QRIS, Transfer, Debit)
│   ├── mandiri/               # Parser Livin' by Mandiri (QRIS, Transfer, Debit)
│   ├── gopay/                 # Parser GoPay (GoFood, GoRide, Top Up)
│   ├── ovo/                   # Parser OVO Payment & Cashback
│   ├── shopee/                # Parser Shopee Order
│   └── tokopedia/             # Parser Tokopedia Order
│
├── services/                  # Business Logic Layer
│   ├── gmail/                 # Fetcher & Decoder Gmail Messages
│   ├── sheets/                # Google Sheets Writer & Formatter
│   └── transactions/          # Orchestrasi Pipeline
│
├── worker/                    # Background Worker & Scheduler
│   ├── queues/                # BullMQ Queues
│   ├── processors/            # Worker Processors
│   └── scheduler/             # Periodic Sync Scheduler Loop
│
├── prisma/
│   ├── schema.prisma          # Skema Database PostgreSQL
│   └── seed.ts                # Database Seeder untuk Sources
│
├── tests/                     # Unit & Integration Test Suites
├── docker-compose.yml         # Local PostgreSQL & Redis
├── .env.example               # Environment Variables Template
└── package.json
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js v18+ (disarankan Node.js 20+)
- Docker & Docker Compose (untuk PostgreSQL & Redis lokal)
- Akun Google Cloud Platform (untuk OAuth 2.0 Credentials)

### 2. Setup Environment
Salin file `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilainya:
- `DATABASE_URL`: URL PostgreSQL (misal `postgresql://postgres:postgrespassword@localhost:5432/mailledger`)
- `NEXTAUTH_SECRET`: Secret key acak
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Dari Google Cloud Console
- `GOOGLE_ENCRYPTION_KEY`: 32-character key untuk enkripsi refresh token
- `REDIS_URL`: URL Redis (misal `redis://localhost:6379`)

### 3. Jalankan Database & Redis (Docker)
```bash
docker compose up -d
```

### 4. Setup Database Schema & Seed
```bash
npm install
npx prisma db push
npm run db:seed
```

### 5. Jalankan Web App & Background Worker
Buka 2 tab terminal:

**Terminal 1 (Web Application):**
```bash
npm run dev
```
Akses di [http://localhost:3000](http://localhost:3000).

**Terminal 2 (Background Worker & Scheduler):**
```bash
npm run worker
```

---

## 🧪 Menjalankan Pengujian

```bash
# Menjalankan seluruh test suite (Unit & Integration)
npm run test

# Menjalankan pemeriksaan type TypeScript
npm run typecheck

# Menjalankan pemeriksaan ESLint
npm run lint

# Menjalankan Production Build
npm run build
```

---

## 🔒 Konfigurasi Google Cloud Console (OAuth)

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat Project baru bernama `MailLedger`.
3. Aktifkan API berikut di **Enabled APIs & Services**:
   - **Gmail API**
   - **Google Sheets API**
   - **Google Drive API**
4. Konfigurasikan **OAuth Consent Screen**:
   - User Type: External
   - Scopes yang ditambahkan:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.readonly`
5. Buat **OAuth Client ID**:
   - Application Type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Salin Client ID dan Client Secret ke `.env.local`.

---

## 📄 Format Tabel Google Sheets
Saat pertama kali spreadsheet dihubungkan, MailLedger akan otomatis membuat struktur kolom:

| Tanggal | Deskripsi | Merchant | Tipe | Jumlah | Mata Uang | Kategori | Sumber | ID Email |
|---|---|---|---|---|---|---|---|---|
| 2026-09-04 14:30:00 | Transaksi QRIS BCA | Kopi Kenangan | EXPENSE | 75000 | IDR | Shopping | Bank Central Asia (BCA) | 18f... |

> Format tanggal yang ditulis ke Sheets adalah `YYYY-MM-DD HH:mm:ss` (locale-independent) agar tidak ambigu antar-locale spreadsheet.

---

## 🛡️ Keamanan & Isolasi Data
- MailLedger menerapkan isolasi ketat antar-user (`WHERE userId = session.user.id`).
- Refresh token Google disimpan dalam bentuk terenkripsi menggunakan **AES-256-GCM**.
- Konten email sensitif dan kredensial tidak pernah diekspos ke client-side atau log server.

---

## 📜 Lisensi
MailLedger dirilis di bawah lisensi MIT.
