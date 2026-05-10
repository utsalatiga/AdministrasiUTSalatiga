# 📋 Implementation Plan: Sistem Administrasi & Keuangan Mahasiswa UT Salatiga

Dokumen ini adalah cetak biru teknis untuk pengembangan Sistem Administrasi & Keuangan Mahasiswa UT Salatiga. Dibagi menjadi 5 fase pengerjaan terstruktur, dengan menggunakan arsitektur Next.js 14 (App Router) dan Supabase.

---

## 🚀 Fase 1: Core & Auth (Setup & Foundation)
Fokus pada inisiasi proyek, konfigurasi infrastruktur dasar, dan sistem autentikasi.

### Tindakan:
1. **Inisialisasi Proyek:**
   - Setup Next.js 14 App Router dengan TypeScript & Tailwind CSS.
   - Konfigurasi path aliases (`@/*`).
   - Instalasi `lucide-react` dan inisialisasi `shadcn/ui` komponen dasar (Button, Input, dll).
2. **Setup Supabase:**
   - Buat helper utility untuk Supabase Client: `@/lib/supabase/client.ts` (Browser) dan `@/lib/supabase/server.ts` (Server Actions).
   - Validasi skema database (Tabel: `mahasiswa`, `tagihan`, `pembayaran`).
3. **Layouting & Navigasi:**
   - Buat `ProtectedLayout` untuk membatasi akses tanpa autentikasi (menggunakan middleware Supabase).
   - Kembangkan `Sidebar` komponen yang responsif dengan item menu (Dashboard, Mahasiswa, Tagihan, Pembayaran, Laporan).
   - Setup Global State (Zustand/React Context) jika diperlukan untuk UI state (seperti toggle sidebar).

---

## 👥 Fase 2: Master Data (Manajemen Mahasiswa)
Fokus pada pengelolaan data mahasiswa sebagai entitas utama.

### Tindakan:
1. **Daftar Mahasiswa (Data Table):**
   - Buat halaman `/mahasiswa`.
   - Implementasi komponen tabel yang interaktif untuk menampilkan list mahasiswa (NIM, Nama, Prodi, Angkatan).
   - Tambahkan fitur pencarian (search by NIM/Nama) dan pagination berbasis Server Components atau hooks.
2. **CRUD Mahasiswa:**
   - Form Tambah & Edit Mahasiswa menggunakan `react-hook-form` + `zod` untuk validasi tipe data dan kewajiban kolom.
   - Action Delete dengan modal konfirmasi.
3. **Fitur Import Excel:**
   - Instalasi library `xlsx` (`npm install xlsx`).
   - Buat komponen drag-and-drop file upload khusus file `.xlsx`.
   - Logic parsing worksheet menjadi array of objects. Mapping kolom Excel ke dalam model tabel `mahasiswa`.
   - Proses batch insert data ke Supabase (gunakan `supabase.from('mahasiswa').insert(data)`).

---

## 💳 Fase 3: Billing System (Sistem Tagihan)
Fokus pada pembuatan, pelacakan, dan UI pembayaran tagihan.

### Tindakan:
1. **Manajemen Tagihan:**
   - Halaman `/tagihan` dengan data table dan filter berdasarkan `status` (LUNAS, PENDING, BELUM LUNAS).
   - Form pembuatan tagihan baru: Pilih mahasiswa via dropdown (bisa di-search), input kode tagihan, jenis tagihan, jumlah (format Rupiah), dan jatuh tempo.
2. **Logika Otomasi (Batch Creation):**
   - Fungsi helper untuk membuat tagihan secara bulk (misalnya untuk semua mahasiswa di angkatan tertentu).
3. **Integrasi UI Pembayaran Mahasiswa:**
   - Buat antarmuka public atau semi-protected untuk mahasiswa mengecek tagihan dengan input NIM.
   - Sediakan tombol "Bayar Sekarang".
   - Integrasi halaman ke QRIS Midtrans (Snap.js atau API Core Midtrans untuk memunculkan QR Code / Virtual Account).

---

## 🛡️ Fase 4: Verification Engine (Verifikasi Pembayaran Manual)
Sistem back-office untuk memverifikasi pembayaran transfer bank/manual bagi mahasiswa yang tidak memakai payment gateway.

### Tindakan:
1. **Supabase Storage:**
   - Buat bucket `bukti_pembayaran` di Supabase.
   - Konfigurasi RLS (Row Level Security) agar proses upload dari sisi public bisa diakses, namun modifikasi data tetap secure.
2. **Halaman Verifikasi (`/pembayaran/verifikasi`):**
   - Menampilkan antrean pembayaran dengan status "PENDING".
   - Tampilkan informasi ringkas: Nama Mahasiswa, Jumlah Bayar, Tanggal Transfer.
3. **Engine Konfirmasi:**
   - Klik baris memunculkan Modal konfirmasi verifikasi.
   - Modal memuat gambar resi bukti_url (ambil dari Storage) dengan layout side-by-side terhadap rincian tagihan.
   - Eksekusi Transaksi Beruntun (RPC/Supabase Logic): Update `pembayaran` -> status "LUNAS" DAN update `tagihan` -> status "LUNAS".

---

## 📈 Fase 5: Analytics & Export
Fokus pada dashboard eksekutif dan pembuatan laporan manajerial.

### Tindakan:
1. **Dashboard Analytics (`/dashboard`):**
   - Card Statistik Utama: Total Pendapatan Bulan Ini, Tagihan Belum Lunas (Rp), Jumlah Mahasiswa Aktif.
   - Chart/Grafik: Tren Pembayaran per bulan. Gunakan `recharts` atau komponen chart native shadcn/ui.
2. **Laporan & Export Excel:**
   - Re-utilize library `xlsx` untuk modul Laporan.
   - Halaman `/laporan` dengan Date Picker untuk rentang waktu.
   - Fungsionalitas konversi JSON dari database Supabase menjadi downloadable `.xlsx` worksheet.

---

## 🪝 Daftar Custom Hooks yang Dibutuhkan
Untuk menjaga arsitektur komponen tetap bersih dan `Separation of Concerns`:

1. **`useStudents(filters)`**
   - Digunakan untuk fetching data list mahasiswa dengan parameter pencarian dan paginasi.
2. **`useStudentMutations()`**
   - Digunakan membungkus logic add, update, delete (termasuk validasi dan import batch) mahasiswa.
3. **`useBills(filters)`**
   - Digunakan untuk query tabel `tagihan`, me-resolve join ke tabel `mahasiswa` untuk nama/NIM.
4. **`usePayments(status)`**
   - Digunakan memuat antrean pembayaran, misalnya `usePayments('PENDING')` khusus untuk verification engine.
5. **`useUploadReceipt()`**
   - Hook khusus menangani file stream, upload ke Supabase Storage, men-handle loading progress bar, dan me-return URL `bukti_url`.
6. **`useDashboardStats()`**
   - Hook agregasi data (Total Income, Outstanding, dll) dengan optimal caching untuk mengisi tampilan dashboard.
