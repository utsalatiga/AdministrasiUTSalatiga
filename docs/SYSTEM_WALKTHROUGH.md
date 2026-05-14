# Blueprint & Arsitektur Sistem Keuangan UT Salatiga

Dokumen ini menyajikan panduan teknis komprehensif mengenai blueprint, arsitektur, dan mekanisme kerja Sistem Administrasi & Keuangan Mahasiswa UT Salatiga.

---

## 1. Visi & Blueprint Sistem

Sistem ini dirancang untuk menggantikan pengelolaan keuangan manual menjadi otomatis, transparan, dan terintegrasi. Blueprint utama sistem adalah **"Single Source of Truth"**, di mana setiap transaksi keuangan (Tagihan, Pembayaran, Deposit) tercatat dalam satu database terpusat yang saling terkait secara atomik.

### Pilar Utama Blueprint:
1.  **Integritas Data**: Menggunakan transaksi PostgreSQL di sisi database (RPC) untuk mencegah ketidaksinkronan data sisa tagihan.
2.  **Fleksibilitas Pembayaran**: Mendukung cicilan, pelunasan total, dan penggunaan saldo deposit.
3.  **Efisiensi Administrasi**: Otomatisasi pembuatan kwitansi dan laporan pemasukan real-time.
4.  **Skalabilitas**: Mampu menangani ribuan data mahasiswa dengan optimasi query dan pagination.

---

## 2. Arsitektur Teknis

Sistem ini menggunakan stack **Next.js 14 (App Router)** sebagai core framework, yang dikombinasikan dengan **Supabase** sebagai Backend-as-a-Service.

### Layer Arsitektur:

#### A. Frontend Layer (UI/UX)
-   **Framework**: Next.js 14 (React) dengan App Router.
-   **Styling**: Tailwind CSS untuk antarmuka yang responsif dan modern.
-   **State Management**: **TanStack Query (React Query) v5** untuk sinkronisasi data server ke client secara efisien (caching & auto-refetch).
-   **Icons**: Lucide React.

#### B. Logic Layer (Server)
-   **Server Actions**: Digunakan untuk mutasi data (create, update, delete) untuk keamanan maksimal (data tidak terekspos di sisi client).
-   **Middleware**: Proteksi rute di sisi server. Menjaga agar hanya pengguna yang login yang bisa masuk ke area dashboard.
-   **Zod**: Validasi skema data pada setiap input form untuk mencegah data sampah masuk ke database.

#### C. Database & Storage Layer (Supabase)
-   **PostgreSQL**: Database relasional utama.
-   **Supabase Auth**: Manajemen autentikasi dan sesi pengguna.
-   **Supabase Storage**: Tempat penyimpanan bukti transfer mahasiswa.
-   **RPC (Remote Procedure Call)**: Logika bisnis berat (seperti kalkulasi sisa tagihan & deposit) dijalankan langsung di dalam database menggunakan PL/pgSQL untuk kecepatan dan keamanan transaksi.

---

## 3. Skema Database Terperinci

Berikut adalah blueprint tabel utama dan hubungannya:

### Tabel `mahasiswa`
-   **id** (UUID, PK)
-   **nim** (String, Unique): Identitas utama mahasiswa.
-   **nama**, **prodi**, **angkatan**, **no_hp** (String).
-   **deposit** (BigInt, Default 0): **Saldo Mengendap**. Ini adalah inti dari sistem deposit.

### Tabel `tagihan`
-   **id** (UUID, PK)
-   **mahasiswa_id** (FK -> mahasiswa.id)
-   **kode** (String): Nomor invoice (misal: INV-1001).
-   **jenis** (String): Jenis biaya (SPP, Jas Almamater, dll).
-   **jumlah** (BigInt): Total nominal tagihan awal.
-   **sisa_tagihan** (BigInt): Nominal yang masih harus dibayar.
-   **status** (Enum): `BELUM_LUNAS`, `MENCICIL`, `LUNAS`.

### Tabel `pembayaran`
-   **id** (UUID, PK)
-   **tagihan_id** (FK -> tagihan.id)
-   **jumlah_bayar** (BigInt): Nominal uang tunai/transfer yang diterima.
-   **nominal_deposit** (BigInt): Nominal saldo deposit yang digunakan untuk membayar tagihan ini.
-   **metode** (String): `TUNAI`, `TRANSFER_MANUAL`, `QRIS`.
-   **status** (String): `VERIFIED`, `PENDING`, `REJECTED`.

### Tabel `profiles` (Admin)
-   **id** (UUID, PK -> auth.users.id)
-   **email**, **nama**, **role** (`super_admin`, `admin`).

---

## 4. Mekanisme Kerja Sistem (Workflow)

### A. Alur Input Data Mahasiswa
Admin dapat menambah mahasiswa secara tunggal atau massal via Excel. Saat mahasiswa didaftarkan, sistem dapat langsung membuat satu atau lebih tagihan (multi-billing) secara otomatis.

### B. Alur Pembayaran & Logika Deposit
Ini adalah bagian paling krusial dari sistem:

1.  **Input Nominal**: Admin memasukkan jumlah uang yang dibayar mahasiswa.
2.  **Opsi Deposit**: Jika mahasiswa punya saldo deposit, admin bisa memilih untuk memotong saldo tersebut.
3.  **Eksekusi RPC (`process_manual_payment`)**:
    -   Sistem menghitung: `Total Pembayaran = Uang Cash + Potongan Deposit`.
    -   **Skenario 1 (Lunas)**: Jika `Total Pembayaran >= Sisa Tagihan`, status tagihan jadi `LUNAS`.
    -   **Skenario 2 (Kelebihan)**: Jika ada uang sisa (setelah tagihan lunas), sisa tersebut **otomatis masuk ke tabel `mahasiswa.deposit`**.
    -   **Skenario 3 (Cicilan)**: Jika `Total Pembayaran < Sisa Tagihan`, status menjadi `MENCICIL` dan `sisa_tagihan` dikurangi nominal bayar.

### C. Alur Verifikasi
-   Pembayaran via **Transfer** masuk ke status `PENDING`.
-   Admin memeriksa bukti transfer di menu **Verifikasi**.
-   Jika disetujui, RPC yang sama (`process_manual_payment`) dijalankan untuk memperbarui sisa tagihan.

---

## 5. Blueprint Keamanan & Performa

### Keamanan (Security)
-   **Role-Based Access Control (RBAC)**: 
    -   `super_admin`: Bisa mengelola admin lain dan melakukan semua operasi.
    -   `admin`: Bisa mengelola mahasiswa dan transaksi, tapi tidak bisa menambah admin baru.
-   **Row Level Security (RLS)**: Mencegah akses database langsung dari client tanpa melewati layer autentikasi.

### Performa (Optimization)
-   **Server-Side Pagination**: Tabel mahasiswa dan tagihan tidak memuat semua data sekaligus (misal hanya 10-15 data per halaman) untuk menghemat RAM browser dan bandwidth.
-   **Optimized Queries**: Penggunaan `.select('*, mahasiswa!inner(*)')` memastikan join tabel dilakukan secara efisien di sisi server database.
-   **Real-time UI Update**: Menggunakan React Query untuk memastikan UI selalu sinkron dengan state database tanpa perlu reload halaman secara manual.

---

## 6. Sistem Pelaporan & Output

### Kwitansi Resmi
Setiap pembayaran sukses menghasilkan kwitansi otomatis yang mencantumkan:
-   Nomor Kwitansi unik.
-   Breakdown Pembayaran (Berapa dari Tunai, berapa dari Potongan Deposit).
-   Terbilang otomatis (mengonversi angka ke kata-kata).
-   Tanda tangan digital admin penerima.

### Dashboard Stats
Visualisasi data real-time untuk:
-   **Total Revenue**: Akumulasi uang masuk yang sudah diverifikasi.
-   **Outstanding Bills**: Total piutang yang belum tertagih.
-   **Deposit Pool**: Total dana mahasiswa yang mengendap di sistem.

---

## 7. Struktur Folder Proyek

```text
src/
├── app/                  # Rute Halaman (Dashboard, Login, dll)
├── components/           # Komponen UI Terfragmentasi
│   ├── payments/         # Modal Bayar, Template Kwitansi
│   ├── students/         # Tabel Mahasiswa, Modal Tambah
│   └── dashboard/        # Widget Statistik
├── lib/                  # Logika Inti & Integrasi
│   ├── actions/          # Server Actions (Jembatan Frontend ke DB)
│   ├── supabase/         # Inisialisasi Supabase Client/Server
│   └── utils/            # Helper (Format Rupiah, Terbilang)
├── docs/                 # Dokumentasi & Migrasi SQL
```

---
*Dokumentasi ini disusun sebagai cetak biru resmi Sistem Keuangan UT Salatiga untuk memastikan keberlanjutan pengembangan dan operasional yang transparan.*
