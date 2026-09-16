# MASTER PROMPT — BUILD MAILLEDGER END-TO-END

Kamu bertindak sebagai **Principal Software Engineer, Full-Stack Engineer, Software Architect, QA Engineer, Security Engineer, dan DevOps Engineer**.

Tugasmu adalah membangun aplikasi SaaS bernama **MailLedger** secara end-to-end berdasarkan Product Requirements Document (PRD) yang diberikan di bawah ini.

Jangan hanya membuat prototype atau UI mockup.

Target akhirnya adalah aplikasi MVP yang **benar-benar runnable**, terhubung ke Google OAuth, Gmail API, Google Sheets API, database PostgreSQL, background worker, parser transaksi, deduplication, dashboard, review manual, logging, dan automated synchronization.

---

# 1. PRODUCT

Nama:
**MailLedger**

Deskripsi:

MailLedger adalah SaaS web yang membaca email transaksi dari berbagai sumber seperti bank, e-wallet, dan marketplace, kemudian secara otomatis mengekstrak informasi transaksi dan memasukkannya ke Google Sheets.

Nilai utama:

1. Plug-and-play integration.
2. Intelligent transaction parsing.
3. Automatic Google Sheets synchronization.
4. Transaction monitoring dashboard.
5. Manual review untuk parsing dengan confidence rendah.
6. Error logging dan monitoring.

Target pengguna:

- Individu
- Freelancer
- Pemilik bisnis kecil
- Tim operasional/admin

---

# 2. MVP SCOPE

Fokus MVP:

### P0 — WAJIB

- Google OAuth authentication
- Gmail connection
- Transaction source selection
- Google Sheets connection
- Automatic synchronization
- Transaction parsing
- Deduplication
- Transaction dashboard
- Manual review
- Error logs
- Spreadsheet template

### P1 — IMPLEMENTASIKAN JIKA ARSITEKTUR SUDAH STABIL

- Custom column mapping
- Automatic transaction category
- Error notification
- Multi Google account

### P2

Tidak perlu diprioritaskan dalam initial MVP:

- CSV/PDF export
- Multi-currency
- Rule engine
- Spreadsheet collaboration

Jangan menambahkan payment/subscription system karena fitur tersebut TIDAK termasuk MVP.

---

# 3. SUPPORTED TRANSACTION SOURCES

MVP harus mempunyai abstraction layer untuk parser sehingga parser baru dapat ditambahkan tanpa mengubah transaction engine.

Supported sources:

1. BCA
2. GoPay
3. OVO
4. Shopee
5. Tokopedia

Namun jangan membuat parser kelima sumber secara asal.

Bangun architecture:

```text
Email
 ↓
Source Detection
 ↓
Parser Registry
 ↓
Source-specific Parser
 ↓
Normalized Transaction
 ↓
Confidence Scoring
 ↓
Deduplication
 ↓
Database
 ↓
Google Sheets
```

Parser harus menggunakan interface yang konsisten.

Contoh konsep:

```typescript
interface TransactionParser {
  canParse(email: GmailEmail): boolean;

  parse(email: GmailEmail): ParsedTransaction;

  getSource(): TransactionSource;
}
```

Jangan menganggap format email semua sumber sama.

Parser harus dipisahkan berdasarkan sumber.

---

# 4. NORMALIZED TRANSACTION

Gunakan struktur transaction yang konsisten:

```typescript
type TransactionType = "INCOME" | "EXPENSE";

interface ParsedTransaction {
  transactionDate: Date;
  description: string;
  merchant: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category?: string;
  confidence: number;
}
```

Confidence:

```text
0–59   → REVIEW
60–79  → REVIEW / configurable
80–100 → AUTO
```

Threshold harus dibuat configurable.

Jangan hardcode logic confidence di banyak tempat.

---

# 5. TECHNOLOGY STACK

Gunakan stack berikut kecuali ada alasan teknis kuat untuk melakukan perubahan:

## Frontend

- Next.js
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack Query
- React Hook Form
- Zod
- Recharts jika diperlukan

## Backend

- Next.js Route Handlers
- Node.js
- Prisma ORM
- Auth.js / NextAuth
- Google APIs / googleapis
- BullMQ
- Redis

## Database

- PostgreSQL 16

## Infrastructure

- Vercel untuk web application
- Railway / Cloud Run untuk worker
- Upstash Redis
- GitHub Actions
- Sentry

Gunakan dependency version yang stabil dan compatible satu sama lain.

Jika ada package yang sudah deprecated, pilih replacement modern yang kompatibel dengan architecture tetapi dokumentasikan keputusan tersebut.

---

# 6. DATABASE

Gunakan Prisma.

Implementasikan schema yang mengikuti PRD:

```text
USER
ACCOUNT
SOURCE
USER_SOURCE
SPREADSHEET_CONNECTION
TRANSACTION
TRANSACTION_LOG
```

Relationship utama:

```text
USER
 ├── ACCOUNT
 ├── USER_SOURCE
 ├── SPREADSHEET_CONNECTION
 └── TRANSACTION

SOURCE
 ├── USER_SOURCE
 └── TRANSACTION

TRANSACTION
 └── TRANSACTION_LOG
```

Pastikan:

- foreign key benar
- indexes benar
- unique constraints benar
- timestamps
- cascade behavior
- transaction ownership
- multi-user isolation

Tambahkan unique constraint yang mencegah duplicate Gmail message untuk user/source yang sama.

Pertimbangkan:

```text
(user_id, email_message_id)
```

sebagai unique key untuk deduplication.

---

# 7. GOOGLE AUTHENTICATION

Implementasikan Google OAuth menggunakan Auth.js.

Flow:

```text
Landing Page
 ↓
Login with Google
 ↓
Google OAuth
 ↓
Callback
 ↓
Create / update user
 ↓
Dashboard
```

OAuth harus mendukung scope yang diperlukan:

```text
openid
email
profile
gmail.readonly
spreadsheets
```

Jangan meminta scope yang tidak diperlukan.

Pastikan token:

- refresh token
- access token
- expiry

ditangani dengan aman.

Jangan expose token ke frontend.

Jangan menyimpan secret/token secara plaintext jika dapat dihindari.

Buat utility encryption/decryption untuk credential sensitif menggunakan server-side environment secret.

---

# 8. GMAIL INTEGRATION

Implementasikan Gmail service abstraction.

Contoh:

```text
lib/google/gmail/
├── client.ts
├── messages.ts
├── search.ts
└── parser.ts
```

Sistem harus mampu:

1. Search email menggunakan Gmail query.
2. Retrieve message.
3. Retrieve message ID.
4. Retrieve thread ID.
5. Retrieve subject.
6. Retrieve received timestamp.
7. Retrieve plain text.
8. Fallback ke HTML jika plain text tidak tersedia.

Jangan mengambil seluruh inbox.

Gunakan Gmail query spesifik berdasarkan source.

Contoh konsep:

```text
from:(...)
subject:(...)
after:YYYY/MM/DD
```

Tetapi jangan invent format sender/filter.

Source filter harus disimpan di database dan configurable.

---

# 9. SOURCE CONNECTION

Dashboard harus mempunyai halaman:

```text
Settings
 └── Transaction Sources
```

User dapat melihat:

```text
BCA       Connected / Not Connected
GoPay     Connected / Not Connected
OVO       Connected / Not Connected
Shopee    Connected / Not Connected
Tokopedia Connected / Not Connected
```

Saat memilih source:

1. Pastikan Google account terhubung.
2. Simpan USER_SOURCE.
3. Simpan account_id.
4. Simpan source_id.
5. Simpan status active.
6. Simpan last_synced_at.

Jangan membuat duplicate USER_SOURCE untuk source/account yang sama.

---

# 10. GOOGLE SHEETS

User harus dapat:

1. Melihat daftar spreadsheet yang dapat diakses.
2. Memilih spreadsheet.
3. Memilih worksheet.
4. Connect spreadsheet.

Setelah connection dibuat:

Jika sheet kosong, buat header:

```text
Tanggal
Deskripsi
Merchant
Tipe
Jumlah
Sumber
ID Email
```

Simpan:

```text
spreadsheet_id
sheet_name
account_id
user_id
column_mapping
```

Gunakan Google Sheets API.

Jangan mengandalkan nama spreadsheet sebagai identifier.

Gunakan spreadsheet ID.

---

# 11. TRANSACTION PIPELINE

Implementasikan pipeline:

```text
FETCH
 ↓
VALIDATE
 ↓
PARSE
 ↓
CONFIDENCE SCORE
 ↓
DEDUPLICATE
 ↓
SAVE DATABASE
 ↓
AUTO → GOOGLE SHEETS
REVIEW → WAIT USER
ERROR → LOG
```

Pisahkan setiap stage.

Jangan membuat satu function raksasa.

Contoh architecture:

```text
services/
├── sync/
├── parsing/
├── transactions/
├── sheets/
├── gmail/
└── notifications/
```

---

# 12. DEDUPLICATION

Gunakan Gmail:

```text
message_id
```

sebagai primary deduplication identifier.

Flow:

```text
Receive Gmail message
 ↓
Check DB
 ↓
Already exists?
 ├── YES → skip
 └── NO → process
```

Deduplication harus tetap aman walaupun dua worker memproses message yang sama secara bersamaan.

Gunakan database constraint sebagai final protection.

---

# 13. BACKGROUND JOB

Gunakan:

```text
BullMQ
+
Redis
```

Queue:

```text
mail-sync
transaction-parse
sheets-write
notification
```

Job utama:

```text
sync-user
 ↓
fetch Gmail
 ↓
enqueue parse jobs
 ↓
parse
 ↓
save transaction
 ↓
enqueue sheets job
```

Jangan melakukan seluruh pipeline dalam satu HTTP request.

---

# 14. AUTOMATIC SYNC

Background worker harus melakukan sync sekitar setiap 10–15 menit.

Architecture:

```text
Scheduler
 ↓
Find active users
 ↓
Create sync jobs
 ↓
Worker
 ↓
Gmail
 ↓
Parser
 ↓
Database
 ↓
Google Sheets
```

Pastikan job idempotent.

Jika job gagal:

- retry
- exponential backoff
- log error
- jangan duplicate transaction

---

# 15. INITIAL BACKFILL

Saat user pertama kali menghubungkan source:

```text
Backfill last 7 days
```

Flow:

```text
Connect source
 ↓
Create initial sync job
 ↓
Gmail query after 7 days
 ↓
Process emails
 ↓
Save transactions
 ↓
Write AUTO transactions to Sheets
```

Jangan melakukan backfill tanpa batas.

---

# 16. MANUAL REVIEW

Transaction dengan confidence rendah harus:

```text
status = REVIEW
```

Dashboard:

```text
Transactions

Date | Merchant | Type | Amount | Source | Confidence | Status
```

User dapat klik transaction.

Detail page/modal:

```text
Original Email
Parsed Data
Confidence
```

User dapat mengedit:

- tanggal
- deskripsi
- merchant
- type
- amount
- currency
- category

Kemudian:

```text
Confirm
 ↓
status = AUTO / CONFIRMED
 ↓
write to Google Sheets
```

Pastikan transaksi tidak ditulis dua kali ke spreadsheet.

---

# 17. ERROR LOG

Jika parsing gagal:

```text
TRANSACTION_LOG
```

atau processing log harus menyimpan:

```text
status
message
payload
created_at
```

Dashboard harus menampilkan:

```text
Parsing Errors
```

Contoh:

```text
BCA
Failed to parse amount
2 minutes ago
```

Jangan menampilkan raw OAuth tokens atau credential sensitif dalam logs.

---

# 18. DASHBOARD

Buat dashboard modern, clean, minimal, dan professional.

Gunakan shadcn/ui.

Layout:

```text
Sidebar
├── Overview
├── Transactions
├── Review
├── Sources
├── Spreadsheet
├── Error Logs
└── Settings
```

Overview menampilkan:

```text
Total Transactions
Income
Expense
Pending Review
Sync Status
Last Sync
```

Optional chart:

```text
Income vs Expense
```

Gunakan Recharts jika bermanfaat.

---

# 19. LANDING PAGE

Buat public marketing page.

Sections:

```text
Hero
How It Works
Features
Supported Sources
Example Dashboard
CTA
Footer
```

Hero message harus jelas:

> Otomatiskan pencatatan transaksi dari Gmail langsung ke Google Sheets.

CTA:

```text
Login with Google
```

Jangan membuat klaim marketing yang tidak didukung PRD.

---

# 20. ONBOARDING

Setelah login pertama:

```text
Welcome
 ↓
Connect transaction source
 ↓
Connect Google Sheets
 ↓
Initial sync
 ↓
First transaction
 ↓
Dashboard
```

Tampilkan progress:

```text
✓ Google Account
✓ Transaction Source
✓ Spreadsheet
⏳ Initial Sync
```

User harus mengetahui apa yang sedang dilakukan sistem.

---

# 21. UX REQUIREMENTS

UI harus:

- responsive
- mobile friendly
- desktop friendly
- accessible
- loading states
- empty states
- error states
- success feedback
- skeleton loading
- toast notification

Jangan membuat halaman yang terlihat selesai tetapi sebenarnya tidak memiliki backend functionality.

Semua tombol utama harus benar-benar bekerja.

---

# 22. SECURITY

Prioritaskan security.

Implementasikan:

- server-side authorization
- user data isolation
- encrypted OAuth credentials
- secure cookies
- CSRF protection melalui Auth.js flow
- validation dengan Zod
- rate limiting jika diperlukan
- no sensitive information in logs
- environment variables untuk secrets
- database constraints
- input sanitization

Setiap API harus memastikan:

```text
currentUser.id === resource.user_id
```

User A tidak boleh membaca data User B.

---

# 23. API DESIGN

Buat API yang terstruktur.

Contoh:

```text
/api/auth/*
/api/sources
/api/sources/[id]
/api/gmail/connect
/api/gmail/sync
/api/sheets
/api/sheets/connect
/api/transactions
/api/transactions/[id]
/api/transactions/[id]/confirm
/api/errors
/api/sync/status
```

Gunakan Zod untuk request validation.

Return response yang konsisten.

Contoh:

```typescript
{
  success: true,
  data: ...
}
```

dan:

```typescript
{
  success: false,
  error: {
    code: "...",
    message: "..."
  }
}
```

---

# 24. PROJECT STRUCTURE

Buat struktur yang scalable.

Contoh target:

```text
mailledger/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── transactions/
│   ├── sources/
│   └── sheets/
│
├── lib/
│   ├── auth/
│   ├── google/
│   ├── db/
│   ├── encryption/
│   ├── validation/
│   └── utils/
│
├── services/
│   ├── gmail/
│   ├── parsing/
│   ├── transactions/
│   ├── sheets/
│   ├── sync/
│   └── notifications/
│
├── parsers/
│   ├── types.ts
│   ├── registry.ts
│   ├── bca/
│   ├── gopay/
│   ├── ovo/
│   ├── shopee/
│   └── tokopedia/
│
├── worker/
│   ├── queues/
│   ├── processors/
│   └── scheduler/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
│
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

Kamu boleh mengubah struktur jika ada alasan arsitektur yang lebih baik, tetapi tetap pisahkan concern dengan jelas.

---

# 25. ENVIRONMENT VARIABLES

Buat:

```text
.env.example
```

minimal:

```text
DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GOOGLE_ENCRYPTION_KEY=

REDIS_URL=

SENTRY_DSN=
```

Jangan pernah commit `.env`.

Buat `.gitignore` yang benar.

---

# 26. LOCAL DEVELOPMENT

Sediakan cara menjalankan project secara lokal.

Idealnya:

```text
docker compose up
```

untuk:

```text
PostgreSQL
Redis
```

Kemudian:

```text
npm install
npx prisma migrate dev
npm run dev
npm run worker
```

Buat scripts yang jelas di package.json.

Contoh:

```text
dev
build
start
lint
typecheck
test
test:e2e
db:migrate
db:generate
worker
```

---

# 27. TESTING

Jangan berhenti setelah application dapat dijalankan.

Implementasikan:

## Unit tests

Test:

- parser
- confidence scoring
- deduplication
- mapping
- validation

## Integration tests

Test:

```text
Gmail → Parser → Database
Database → Sheets
```

## E2E

Test:

```text
Login
 ↓
Connect source
 ↓
Connect sheet
 ↓
Sync
 ↓
Transaction appears
```

Mock Google API dalam automated tests.

Jangan membuat automated test bergantung pada Gmail account nyata.

---

# 28. PARSER TESTING

Untuk setiap parser, buat fixture email.

Contoh:

```text
tests/fixtures/
├── bca/
├── gopay/
├── ovo/
├── shopee/
└── tokopedia/
```

Setiap fixture harus menguji:

- amount
- date
- merchant
- transaction type
- currency
- confidence

Jangan menganggap parser benar hanya karena satu contoh email berhasil.

Buat beberapa variasi format jika memungkinkan.

---

# 29. OBSERVABILITY

Implementasikan:

- structured logging
- Sentry
- sync status
- processing duration
- parsing failure count
- last successful sync

Jangan log:

```text
access token
refresh token
OAuth secret
password
private credentials
```

---

# 30. ERROR HANDLING

Gunakan error classification.

Contoh:

```text
AUTH_ERROR
GMAIL_API_ERROR
SHEETS_API_ERROR
PARSER_ERROR
VALIDATION_ERROR
DATABASE_ERROR
QUEUE_ERROR
UNKNOWN_ERROR
```

Error harus:

- user-friendly di UI
- detail di server logs
- retryable jika memungkinkan

---

# 31. IDEMPOTENCY

Semua proses penting harus idempotent.

Contoh:

Jika worker menjalankan:

```text
transaction abc
```

dua kali, hasil akhir tetap hanya:

```text
1 database transaction
1 spreadsheet row
```

Buat strategi idempotency untuk database dan Sheets.

---

# 32. GOOGLE SHEETS DUPLICATION

Jangan hanya mencegah duplicate di database.

Pertimbangkan kondisi:

```text
DB transaction berhasil
Sheets write berhasil
Worker crash sebelum status tercatat
Job retry
```

Sistem harus memiliki mekanisme untuk mencegah duplicate row.

Gunakan transaction ID atau email message ID sebagai idempotency key.

Jika perlu, tambahkan internal transaction ID ke metadata atau hidden/helper column tanpa merusak format utama spreadsheet.

---

# 33. DATA FLOW

Implementasikan flow berikut secara nyata:

```text
USER
 ↓
Google OAuth
 ↓
USER + ACCOUNT
 ↓
Connect BCA
 ↓
USER_SOURCE
 ↓
Connect Spreadsheet
 ↓
SPREADSHEET_CONNECTION
 ↓
Initial Sync
 ↓
Gmail API
 ↓
BCA Parser
 ↓
Confidence
 ↓
Deduplication
 ↓
TRANSACTION
 ↓
AUTO?
 ├── YES → Google Sheets
 └── NO → REVIEW
```

---

# 34. MVP SUCCESS CRITERIA

Aplikasi dianggap berhasil jika scenario berikut benar-benar dapat dilakukan:

### Scenario 1

User login dengan Google.

### Scenario 2

User menghubungkan Gmail.

### Scenario 3

User memilih BCA.

### Scenario 4

User memilih Google Spreadsheet.

### Scenario 5

System mengambil email transaksi BCA 7 hari terakhir.

### Scenario 6

System berhasil melakukan parsing.

### Scenario 7

Transaction masuk database.

### Scenario 8

Transaction confidence tinggi → masuk Google Sheets.

### Scenario 9

Transaction confidence rendah → muncul Review.

### Scenario 10

User mengedit transaction → Confirm → masuk Sheets.

### Scenario 11

Email yang sama diproses lagi → tidak menghasilkan duplicate.

### Scenario 12

Worker berjalan otomatis → transaksi baru diproses.

### Scenario 13

Parsing gagal → Error Log muncul.

---

# 35. DEVELOPMENT METHOD

Jangan mencoba membuat seluruh aplikasi sekaligus dalam satu langkah tanpa melakukan verification.

Gunakan pendekatan:

```text
PLAN
 ↓
IMPLEMENT
 ↓
RUN
 ↓
TEST
 ↓
FIX
 ↓
VERIFY
 ↓
NEXT PHASE
```

Sebelum mengubah architecture, jelaskan alasan perubahan.

Jika menemukan error:

1. reproduce
2. identify root cause
3. fix
4. run tests
5. verify regression

Jangan menutupi error dengan workaround sementara.

---

# 36. IMPORTANT: DO NOT FAKE FUNCTIONALITY

Jangan:

- membuat fake Gmail API
- membuat fake Sheets integration
- membuat dummy transaction sebagai pengganti backend
- membuat tombol yang tidak bekerja
- hardcode transaction untuk demo
- hardcode OAuth result
- mengklaim integration berhasil tanpa testing

Mock hanya boleh digunakan dalam automated tests.

Development UI boleh menggunakan seed data, tetapi production flow harus menggunakan database sebenarnya.

---

# 37. GOOGLE API LIMITATIONS

Jika Google API membutuhkan konfigurasi manual di Google Cloud Console, jangan berpura-pura dapat menyelesaikannya secara otomatis.

Sebaliknya:

1. Jelaskan apa yang perlu dilakukan.
2. Buat dokumentasi langkahnya.
3. Buat `.env.example`.
4. Buat callback URL yang benar.
5. Buat error message yang membantu jika konfigurasi belum benar.

---

# 38. README

Buat README lengkap berisi:

```text
Project overview
Features
Architecture
Tech stack
Prerequisites
Environment variables
Google Cloud setup
Database setup
Redis setup
Local development
Running worker
Running tests
Deployment
Troubleshooting
Security
```

Seorang developer baru harus dapat menjalankan project hanya dengan mengikuti README.

---

# 39. DEPLOYMENT

Siapkan production deployment architecture:

```text
Vercel
 └── Next.js

Railway / Cloud Run
 └── Worker

Supabase / PostgreSQL
 └── Database

Upstash
 └── Redis

Google Cloud
 ├── OAuth
 ├── Gmail API
 └── Sheets API

Sentry
 └── Monitoring
```

Buat deployment documentation.

Jangan melakukan deployment production menggunakan credential development.

---

# 40. CI/CD

GitHub Actions:

```text
Pull Request
 ↓
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit Test
 ↓
Build
```

Jika memungkinkan:

```text
main branch
 ↓
Production deployment
```

---

# 41. UI DESIGN DIRECTION

Gunakan visual style:

- modern SaaS
- clean
- professional
- minimal
- data-oriented
- trustworthy
- responsive

Hindari:

- excessive gradients
- unnecessary animations
- giant text everywhere
- confusing dashboards
- excessive cards

Prioritaskan usability.

---

# 42. IMPORTANT PRODUCT PRINCIPLE

MailLedger bukan accounting software lengkap.

Jangan menambahkan:

- payroll
- invoice
- tax accounting
- financial advice
- bank transfer
- payment processing

Fokus:

```text
Gmail
 ↓
Transaction extraction
 ↓
Google Sheets
```

---

# 43. IMPLEMENTATION ORDER

Kerjakan secara berurutan:

## PHASE 1
Project foundation

## PHASE 2
Database + Prisma

## PHASE 3
Google OAuth

## PHASE 4
Gmail integration

## PHASE 5
Google Sheets integration

## PHASE 6
Parser architecture

## PHASE 7
BCA parser

## PHASE 8
Transaction engine

## PHASE 9
Dashboard

## PHASE 10
Manual review

## PHASE 11
BullMQ + Redis

## PHASE 12
Automatic synchronization

## PHASE 13
Remaining parsers

## PHASE 14
Testing

## PHASE 15
Security hardening

## PHASE 16
Deployment

## PHASE 17
Final end-to-end verification

---

# 44. AGENT BEHAVIOR

Kamu memiliki izin untuk:

- membuat file
- mengubah file
- membuat folder
- install dependencies
- menjalankan command
- menjalankan migration
- menjalankan test
- memperbaiki error
- refactor code
- menjalankan build
- melakukan static analysis

Jika environment memungkinkan.

Namun jangan menghapus atau overwrite konfigurasi penting tanpa alasan.

Sebelum melakukan perubahan besar:

- inspect repository
- pahami existing code
- buat implementation plan

---

# 45. IF PROJECT IS EMPTY

Jika repository kosong:

Mulai dari:

```text
Create Next.js application
 ↓
Configure TypeScript
 ↓
Configure Tailwind
 ↓
Configure shadcn/ui
 ↓
Configure ESLint
 ↓
Configure Prisma
 ↓
Create database schema
```

Kemudian lanjut sesuai phase.

---

# 46. IF PROJECT ALREADY EXISTS

Jangan overwrite project.

Pertama:

1. inspect package.json
2. inspect directory structure
3. inspect existing configuration
4. inspect git status
5. inspect existing environment example
6. identify reusable code
7. identify conflicts
8. create migration plan

Kemudian implementasikan MailLedger di atas existing architecture jika memungkinkan.

---

# 47. DEFINITION OF DONE

Jangan menyatakan project "selesai" hanya karena build berhasil.

Project hanya boleh dinyatakan MVP complete jika:

- lint pass
- typecheck pass
- tests pass
- production build pass
- authentication bekerja
- Gmail integration bekerja
- Sheets integration bekerja
- database bekerja
- parser bekerja
- deduplication bekerja
- manual review bekerja
- worker bekerja
- automatic sync bekerja
- error logging bekerja
- user isolation diverifikasi
- README lengkap
- `.env.example` lengkap

Dan minimal satu complete E2E flow telah diverifikasi:

```text
Google Login
→ Gmail
→ Source
→ Google Sheet
→ Email
→ Parser
→ Database
→ Sheets
```

---

# 48. FINAL OUTPUT

Setelah implementasi selesai, berikan laporan:

## Architecture
Ringkas architecture final.

## Files Created
Daftar file/folder penting.

## Database
Jelaskan schema dan migration.

## APIs
Daftar endpoint.

## Google Integration
Jelaskan OAuth, Gmail, dan Sheets.

## Worker
Jelaskan queue dan scheduling.

## Parser
Jelaskan parser yang sudah tersedia.

## Testing
Tampilkan hasil:

```text
Lint: PASS/FAIL
Typecheck: PASS/FAIL
Unit tests: PASS/FAIL
Integration tests: PASS/FAIL
E2E: PASS/FAIL
Build: PASS/FAIL
```

## Configuration Required
Tampilkan hal yang masih perlu dikonfigurasi manual oleh developer.

## Known Limitations
Jelaskan limitation yang memang belum dapat diselesaikan.

## Next Steps
Berikan langkah berikutnya berdasarkan PRD.

---

# 49. CRITICAL RULE

**PRD adalah source of truth.**

Jangan menambahkan fitur besar yang tidak terdapat dalam PRD tanpa alasan.

Jika terdapat requirement yang ambigu atau tidak lengkap:

1. Identifikasi ambiguity.
2. Pilih default yang paling sederhana dan aman untuk MVP.
3. Dokumentasikan keputusan tersebut.
4. Jangan menghentikan seluruh development hanya karena detail minor belum ditentukan.

Namun jika keputusan tersebut menyangkut:

- security
- OAuth permissions
- financial data
- destructive database changes
- production deployment
- architecture yang sulit dibalik

maka STOP dan tanyakan kepada saya terlebih dahulu.

---

# START NOW

Mulai dengan:

### STEP 1
Inspect environment/repository.

### STEP 2
Buat implementation plan berdasarkan PRD.

### STEP 3
Tampilkan plan secara ringkas.

### STEP 4
Mulai implementasi Phase 1.

### STEP 5
Jalankan verification.

### STEP 6
Lanjutkan ke phase berikutnya.

Jangan hanya menjelaskan bagaimana cara membuat aplikasi.

**BUILD THE APPLICATION.**

Target akhir:

> A production-ready MVP MailLedger yang benar-benar dapat membaca email transaksi Gmail, melakukan parsing, menyimpan transaksi, melakukan deduplication, dan secara otomatis menulis transaksi ke Google Sheets.