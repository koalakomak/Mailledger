# Design Brief - MailLedger

> Dokumen ini adalah **brief produk untuk keperluan desain (Figma)**. Isinya menjelaskan **tujuan, struktur, konten, perilaku, dan state** aplikasi. **Keputusan visual (warna, tipografi, layout, ilustrasi) sepenuhnya kebebasan desainer.**

---

## 1. Ringkasan Produk

| Item | Keterangan |
|---|---|
| Nama | MailLedger |
| Kategori | Aplikasi keuangan pribadi (personal finance) berbasis web |
| Satu kalimat | Mengubah email notifikasi transaksi dari bank dan e-wallet menjadi catatan keuangan otomatis di Google Sheets. |
| Status | Sudah berjalan (production) dan dipakai pemilik proyek |
| Bahasa | Indonesia |
| Platform | Web responsif (diprioritaskan nyaman di ponsel, tetap nyaman di desktop) |
| Jenis pengguna | Satu tipe pengguna: pemilik akun (tidak ada peran admin) |

---

## 2. Masalah yang Diselesaikan

Mencatat pengeluaran harian dan bulanan itu membosankan, terlebih ketika uang tersebar di banyak dompet digital dan rekening. Pengguna harus membuka-tutup banyak aplikasi hanya untuk merekap arus kas.

Padahal hampir semua bank dan e-wallet **selalu mengirim invoice/notifikasi transaksi lewat email**.

Solusi: MailLedger membaca email transaksi tersebut secara otomatis, mengekstrak datanya, lalu mencatatnya ke spreadsheet pribadi pengguna.

## 3. Tujuan Produk

1. Tanpa input manual - pengguna tidak perlu mengetik ulang transaksi.
2. Satu tempat untuk seluruh arus kas - semua sumber (bank + e-wallet) terkumpul di satu catatan.
3. Evaluasi bulanan lebih praktis - pengguna cukup membuka aplikasi saat akhir bulan, atau saat ingin tahu "tadi saya habis berapa?".

## 4. Nilai bagi Pengguna

- Hemat waktu: tidak ada pencatatan manual.
- Tidak ada transaksi terlewat, karena semua diambil dari email.
- Rekap otomatis tersimpan di Google Sheets milik pengguna sendiri (data tetap milik pengguna).

---

## 5. Cara Kerja Aplikasi (ringkas)

1. Pengguna login dengan akun Google.
2. Pengguna menghubungkan sumber transaksi (mis. BCA, Livin by Mandiri, GoPay, OVO, Shopee, Tokopedia).
3. Pengguna memilih Google Spreadsheet tujuan.
4. Sistem membaca email yang cocok dengan filter sumber, lalu mengekstrak: tanggal, merchant, deskripsi, nominal, tipe (masuk/keluar), dan kategori.
5. Setiap transaksi diberi skor keyakinan (confidence 0-100%):
   - 80% atau lebih - status Otomatis, langsung ditulis ke Google Sheets.
   - Di bawah 80% - status Perlu Tinjauan, masuk antrean review manual.
   - Di bawah 60% - dianggap bukan transaksi valid, dilewati dan dicatat di Log Error.
6. Sinkronisasi berjalan otomatis setiap 10 menit; pengguna juga bisa memicu sinkronisasi manual.
7. Setiap awal bulan, pengguna menerima ringkasan keuangan bulan lalu melalui email.

## 6. Istilah Penting (dipakai di seluruh aplikasi)

| Istilah | Arti |
|---|---|
| Sumber | Asal transaksi (bank/e-wallet) beserta filter email-nya |
| Otomatis | Transaksi keyakinan tinggi, boleh ditulis ke Sheets tanpa persetujuan pengguna |
| Perlu Tinjauan | Transaksi keyakinan rendah, menunggu verifikasi pengguna |
| Dikonfirmasi | Transaksi yang disetujui manual oleh pengguna |
| Keyakinan | Skor 0-100% hasil ekstraksi email |
| Sinkronisasi | Proses membaca email lalu mencatat transaksi |
| Tertulis ke Sheets | Penanda bahwa baris transaksi sudah ada di Google Spreadsheet |

---

## 7. Peta Halaman (Information Architecture)

Halaman publik:

- / - Landing page (penjelasan produk + ajakan login)
- /login - Login dengan Google

Area dashboard (butuh login):

- /dashboard/overview - Ringkasan
- /dashboard/transactions - Semua Transaksi
- /dashboard/review - Tinjauan Manual
- /dashboard/sources - Sumber Transaksi
- /dashboard/spreadsheet - Koneksi Google Spreadsheet
- /dashboard/errors - Log Error & Diagnostik
- /dashboard/settings - Pengaturan Akun & Keamanan

Kerangka dashboard terdiri dari: navigasi samping (sidebar), header atas, dan area konten.

---

## 8. Detail per Halaman

### 8.1 Landing Page (publik)

Tujuan: menjelaskan produk dan mendorong pengguna login.

Isi: nama produk dan tagline; penjelasan singkat masalah dan solusi; daftar fitur utama; daftar sumber transaksi yang didukung (BCA, Livin by Mandiri, GoPay, OVO, Shopee, Tokopedia); tombol menuju login; footer.

### 8.2 Login

Tujuan: masuk dengan akun Google.

Isi: judul halaman; penjelasan singkat; tombol "Lanjutkan dengan Google"; daftar izin yang diminta (Gmail baca, Google Sheets tulis, Google Drive baca); tautan kembali ke beranda.

State: proses menghubungkan (loading), kegagalan izin, penjelasan mengapa izin dibutuhkan.

### 8.3 Kerangka Dashboard - Navigasi Samping (sidebar)

Menu: Ringkasan, Transaksi, Tinjauan Manual, Sumber, Spreadsheet, Log Error, Pengaturan, dan tombol Keluar.

Perlu rancangan untuk: menu aktif, menu non-aktif, kondisi menu tersembunyi pada layar kecil (dibuka lewat tombol menu), dan penanda jumlah item yang menunggu tinjauan (opsional).

### 8.4 Header Dashboard

Isi: identitas pengguna (email dan foto profil), tombol "Sinkronkan Sekarang", dan tombol menu untuk layar kecil.

State: menunggu sinkronisasi, hasil sinkronisasi (mis. "N transaksi baru"), gagal sinkronisasi.

### 8.5 Ringkasan (Overview)

Tujuan: gambaran cepat kondisi keuangan dan status sistem.

Konten:

- Kartu metrik: Total Pemasukan, Total Pengeluaran, Menunggu Tinjauan (jumlah), Status Sinkronisasi (terhubung/belum dan waktu sinkron terakhir).
- Grafik perbandingan pemasukan vs pengeluaran.
- Transaksi Terbaru (beberapa transaksi terakhir) dengan tautan ke halaman Transaksi.

State: memuat, belum ada data sama sekali, Sheets belum terhubung, dan kondisi setelah data tersedia.

### 8.6 Semua Transaksi

Tujuan: menelusuri, mencari, menyaring, dan mengelola seluruh catatan transaksi.

Konten:

- Pencarian teks (merchant, deskripsi, kategori).
- Penyaring Status (Semua Status, Otomatis, Dikonfirmasi, Perlu Tinjauan) dan Sumber (Semua Sumber, BCA, Livin by Mandiri, GoPay, OVO, Shopee, Tokopedia).
- Tombol muat ulang.
- Daftar transaksi berisi: Tanggal, Merchant/Deskripsi, Sumber, Tipe (Masuk/Keluar), Jumlah, Keyakinan, Status, Aksi (ubah data).
- Untuk layar kecil, daftar transaksi perlu versi ringkas yang menampilkan informasi inti per transaksi.

State: memuat, hasil kosong (belum ada transaksi atau filter tidak menemukan hasil), ada data, dan pagination bila data banyak.

### 8.7 Tinjauan Manual

Tujuan: memverifikasi transaksi berkeyakinan rendah sebelum masuk ke spreadsheet.

Konten: penjelasan singkat ambang keyakinan; daftar transaksi berstatus Perlu Tinjauan; aksi Ubah dan Konfirmasi (menulis ke Sheets).

State: kosong ("tidak ada yang perlu ditinjau"), sedang memproses konfirmasi, konfirmasi berhasil/gagal.

### 8.8 Sumber Transaksi

Tujuan: mengelola sumber email transaksi.

Konten per sumber: nama sumber; filter email yang dipakai (informasi teknis, boleh ditampilkan ringkas); status terhubung/belum; waktu sinkron terakhir; aksi Hubungkan / Putuskan; aksi Sinkronkan untuk sumber yang aktif.

Catatan perilaku: saat pertama kali dihubungkan, sistem mengambil transaksi 7 hari terakhir (backfill).

State: memuat, terhubung, belum terhubung, proses menghubungkan (backfill berjalan), gagal menghubungkan.

### 8.9 Koneksi Google Spreadsheet

Tujuan: memilih spreadsheet tujuan penyimpanan.

Konten: status koneksi saat ini (nama sheet, waktu sinkron terakhir, tautan membuka spreadsheet); pemilihan spreadsheet dari Google Drive pengguna; pengisian nama tab/worksheet; tombol Hubungkan / Perbarui koneksi; penjelasan bahwa tab dan header akan dibuat otomatis.

Struktur kolom spreadsheet: Tanggal, Deskripsi, Merchant, Tipe, Jumlah, Mata Uang, Kategori, Sumber, ID Email.

State: belum terhubung, sudah terhubung, daftar spreadsheet kosong, gagal memuat daftar, proses menyimpan.

### 8.10 Log Error & Diagnostik

Tujuan: melihat masalah parsing/sinkronisasi untuk perbaikan.

Konten: tabel log berisi Waktu, Status, Pesan Error, Detail; tombol muat ulang.

Contoh jenis log: gagal memproses email, parser tidak ditemukan, transaksi dilewati karena keyakinan rendah.

State: kosong ("belum ada log error"), ada log, memuat.

### 8.11 Pengaturan

Tujuan: informasi akun, keamanan, dan aturan kategori.

Konten:

- Akun Google terhubung: email, nama, metode autentikasi.
- Izin (scope) dan isolasi data: daftar izin yang diberikan dan status enkripsi token.
- Aturan Kategori Otomatis: daftar aturan (kata kunci menjadi kategori); formulir menambah aturan; aksi menghapus aturan; penjelasan bahwa aturan berlaku untuk transaksi baru dan transaksi lama yang cocok.

State: daftar aturan kosong, memuat, menyimpan, berhasil/gagal.

---

## 9. Elemen Lintas Halaman

| Elemen | Fungsi | State yang perlu dirancang |
|---|---|---|
| Notifikasi (toast) | Umpan balik aksi | sukses, gagal, informasi |
| Kondisi kosong | Saat belum ada data | ajakan aksi (mis. hubungkan sumber atau sinkronkan) |
| Kondisi memuat | Saat mengambil data | indikator memuat |
| Dialog ubah transaksi | Mengubah data transaksi | field: Merchant, Deskripsi, Jumlah, Tipe, Kategori, Tanggal dan Waktu; validasi error |
| Konfirmasi aksi | Menyetujui transaksi | sedang memproses, berhasil, gagal |

---

## 10. Entitas Data (untuk memahami konten)

- Transaksi: tanggal dan waktu transaksi, deskripsi, merchant, tipe (Masuk/Keluar), jumlah, mata uang, kategori, keyakinan (0-100%), status (Otomatis/Perlu Tinjauan/Dikonfirmasi/Ditolak), sumber, penanda sudah tertulis ke Sheets, subjek email.
- Sumber (per pengguna): nama sumber, status aktif, waktu sinkron terakhir.
- Koneksi Spreadsheet: nama spreadsheet, nama tab, status aktif, waktu sinkron terakhir.
- Log: waktu, status, pesan, detail.
- Aturan Kategori: kata kunci, kategori.

---

## 11. Alur Pengguna Utama

1. Penyiapan pertama: login, hubungkan sumber, pilih spreadsheet, sinkronisasi awal, data mulai muncul.
2. Pemakaian harian: transaksi masuk otomatis lewat sinkronisasi berkala; pengguna tidak perlu melakukan apa pun.
3. Pengecekan cepat: buka Ringkasan untuk melihat total dan transaksi terbaru.
4. Akhir bulan: buka Transaksi/Ringkasan, atau baca email ringkasan bulanan yang dikirim otomatis.
5. Perbaikan data: item berkeyakinan rendah muncul di Tinjauan Manual, pengguna mengubah/mengonfirmasi; jika ada masalah teknis, cek Log Error.
6. Perapian kategori: pengguna menambahkan aturan kategori di Pengaturan.

---

## 12. Batasan dan Ketentuan

- Bahasa antarmuka: Indonesia.
- Semua waktu ditampilkan dalam WIB.
- Diprioritaskan nyaman digunakan dari ponsel; perlu dukungan layar kecil (375px), tablet (768px), dan desktop (1024px ke atas).
- Aksesibilitas: kontras teks memadai, target sentuh nyaman, fokus keyboard terlihat, dukungan pengurangan gerakan.
- Data bersifat privat per pengguna; aplikasi tidak menampilkan data pengguna lain.
- Kecepatan terasa penting: hindari tampilan yang melompat saat data dimuat.

---

## 13. Cakupan yang Diminta untuk Desain

Layar: Landing, Login, Kerangka Dashboard (navigasi dan header), Ringkasan, Semua Transaksi, Tinjauan Manual, Sumber, Spreadsheet, Log Error, Pengaturan, dan dialog Ubah Transaksi.

Untuk setiap layar, sertakan state: memuat, kosong, ada data, dan gagal. Sertakan juga tampilan layar kecil untuk halaman yang padat tabel.

## 14. Di Luar Cakupan Desain

Logika backend: parser email, penyimpanan database, enkripsi token, penjadwalan sinkronisasi, dan integrasi API Google. Bagian ini tidak perlu dirancang.

## 15. Catatan Kontekstual (bukan ketentuan)

Versi saat ini memakai tema gelap dan bahasa Indonesia. Ini bukan keharusan - desainer bebas mengusulkan arah visual, selama struktur, konten, dan perilaku pada dokumen ini tetap terpenuhi.

## 16. Pertanyaan Terbuka untuk Desainer

- Perlukah ringkasan total bersih (pemasukan dikurangi pengeluaran) pada halaman Ringkasan?
- Perlukah grafik tren per bulan, bukan hanya total keseluruhan?
- Bagaimana cara terbaik menampilkan penanda jumlah item yang menunggu tinjauan?
- Perlukah tampilan laporan bulanan di dalam aplikasi, selain email?
