# 📚 MANUAL BOOK: SISTEM ADMINISTRASI KEUANGAN UT SALATIGA
**Panduan Pengoperasian & Dokumentasi Sistem Digitalisasi Keuangan**

---

## 🏢 1. GAMBARAN UMUM SISTEM (SYSTEM OVERVIEW)

Sistem Administrasi Keuangan Universitas Terbuka (UT) Salatiga adalah platform digital berbasis web yang dirancang khusus untuk mengelola, memantau, dan mengotomatisasi seluruh siklus administrasi keuangan mahasiswa. Sistem ini mengintegrasikan manajemen data mahasiswa, pencatatan tagihan, pemrosesan pembayaran (tunai, transfer, dan deposit), verifikasi bukti bayar, hingga pelaporan keuangan terpadu.

### 🎯 Fungsi Utama Aplikasi
1. **Dashboard Eksekutif (`/`)**: Menyajikan metrik finansial utama dan grafik tren penerimaan secara *real-time*.
2. **Manajemen Mahasiswa (`/mahasiswa`)**: Pengelolaan basis data biodata mahasiswa, pencarian kilat, serta fasilitas impor massal dari file Excel.
3. **Manajemen Tagihan & Deposit (`/tagihan`)**: Pencatatan kewajiban pembayaran, pelacakan riwayat cicilan, serta titik awal (*entry point*) untuk memproses pembayaran baru.
4. **Riwayat Pembayaran (`/pembayaran`)**: Buku besar rekam jejak seluruh transaksi keuangan harian yang dilengkapi penyaringan instan.
5. **Verifikasi Pembayaran (`/verifikasi`)**: Panel audit bagi pengelola keuangan untuk memvalidasi keabsahan bukti transfer bank sebelum tagihan dinyatakan lunas.
6. **Rekapitulasi & Pelaporan (`/laporan`)**: Pusat pembuatan laporan keuangan historis, ekspor data otomatis ke format Excel, serta pencetakan ulang kwitansi resmi.

---

### 🔐 Struktur Peran Pengguna (Role-Based Access Control)

Sistem menerapkan prinsip keamanan berlapis berbasis peran (*Role-Based Access Control / RBAC*) guna menjaga integritas data dan mencegah risiko kesalahan operasional atau manipulasi data yang tidak sah.

```
+-----------------------------------------------------------------------+
|                        SISTEM KEUANGAN UT SALATIGA                    |
+-----------------------------------------------------------------------+
                                    |
         +--------------------------+--------------------------+
         |                                                     |
         v                                                     v
+---------------------------------+   +---------------------------------+
|          SUPER ADMIN            |   |          STAFF ADMIN            |
+---------------------------------+   +---------------------------------+
| • Akses Penuh Tanpa Batas       |   | • Akses Operasional Harian      |
| • Manajemen Akun & Hak Akses    |   | • Input & Verifikasi Pembayaran |
| • Menu "Pengaturan Sistem"      |   | • Cetak Kwitansi & Laporan      |
| • Menghapus Data Mahasiswa      |   | • [TERKUNCI] Pengaturan Sistem  |
| • Reset Database (Ketik RESET)  |   | • [TERKUNCI] Hapus Mahasiswa    |
+---------------------------------+   +---------------------------------+
```

#### 👑 1. Super Admin
Peran dengan hak akses tertinggi (*root/administrator*). Memiliki wewenang mutlak terhadap seluruh modul di dalam sistem.
- **Hak Akses Khusus**: Mengakses menu **"Pengaturan Sistem"** (`/settings`) dan **"Manajemen Admin"** (`/admins`), serta memiliki kewenangan penuh untuk menghapus data master mahasiswa.
- **Kewenangan**: Menambahkan atau menghapus akun staf, mengubah konfigurasi sistem, dan melakukan pembersihan database secara menyeluruh.

#### 👥 2. Staff Admin
Peran yang diperuntukkan bagi staf operasional harian atau kasir keuangan.
- **Hak Akses Operasional**: Memiliki akses penuh untuk memproses input pembayaran baru, melakukan verifikasi bukti transfer, mencari riwayat transaksi, dan mencetak laporan bulanan.
- **Proteksi Keamanan UI**: Menu sensitif **"Pengaturan Sistem"** dan **"Manajemen Admin"** **disembunyikan secara ketat** dari antarmuka dropdown profil pengguna. Selain itu, tombol penghapusan data mahasiswa dinonaktifkan guna mencegah hilangnya data penting secara tidak sengaja.

---

## 🚀 2. KOMPONEN UTAMA & ALUR PENGGUNAAN (STEP-BY-STEP GUIDE)

---

### 🖥️ A. Memahami Dashboard (`/`)

Halaman utama (Dashboard) berfungsi sebagai pusat informasi eksekutif yang memberikan gambaran cepat mengenai kesehatan finansial institusi. Begitu masuk ke dalam aplikasi, staf dan pimpinan dapat memantau indikator kinerja utama (*Key Performance Indicators / KPI*) melalui kartu metrik berikut:

```
+------------------------+  +------------------------+  +------------------------+
|    TOTAL PEMASUKAN     |  |    TOTAL TUNGGAKAN     |  |   ANTREAN VERIFIKASI   |
|     Rp 145.500.000     |  |     Rp 32.400.000      |  |      12 Transaksi      |
+------------------------+  +------------------------+  +------------------------+
```

1. **Total Pemasukan**: Menampilkan akumulasi seluruh dana yang telah sah diterima dan berstatus `LUNAS` atau `VERIFIED`. Angka ini mencerminkan uang kas nyata yang telah masuk ke rekening institusi.
2. **Total Tunggakan**: Menunjukkan total nilai tagihan aktif yang belum dibayar atau masih berstatus `MENCICIL` / `BELUM_LUNAS` dari seluruh mahasiswa. Metrik ini penting untuk memproyeksikan piutang institusi.
3. **Antrean Verifikasi**: Menampilkan jumlah pengajuan pembayaran metode Transfer yang berstatus `PENDING` dan sedang menunggu tindakan persetujuan di halaman Verifikasi.

---

### 👥 B. Manajemen Data Mahasiswa (`/mahasiswa`)

Modul ini digunakan untuk mengelola data induk (master data) biodata mahasiswa aktif di UT Salatiga.

#### 📝 Langkah-Langkah Penggunaan
1. **Menambah Mahasiswa Baru**: Klik tombol **(+) Tambah Mahasiswa** di bagian atas tabel. Isi formulir yang mencakup Nama Lengkap, NIM, Program Studi, dan informasi kontak, lalu klik Simpan.
2. **Mencari & Mengedit Biodata**: Gunakan kolom pencarian cepat untuk menemukan mahasiswa berdasarkan Nama atau NIM. Untuk mengedit data, klik tombol aksi (ikon pensil/edit) pada baris mahasiswa terkait, sesuaikan informasi yang perlu diubah, dan simpan pembaruan.
3. **Impor Massal dari Excel (.xlsx)**:
   - Untuk memasukkan data puluhan atau ratusan mahasiswa sekaligus, gunakan fitur **Import Excel**.
   - Klik tombol **Import Excel**, unduh *template* standar yang disediakan jika diperlukan, pastikan kolom pada file Excel Anda sesuai (Nama, NIM, Prodi), lalu unggah file tersebut. Sistem akan memproses dan memasukkan seluruh baris data ke database dalam satu waktu.

> [!CAUTION]
> **Proteksi Penghapusan Data Mahasiswa**
> Hak untuk menghapus data mahasiswa dibatasi secara ketat. Tombol hapus (ikon tempat sampah) **HANYA muncul pada akun Super Admin**. Bagi akun Staff Admin, tombol ini dinonaktifkan/disembunyikan guna mencegah terhapusnya riwayat tagihan dan pembayaran yang terikat pada mahasiswa tersebut.

---

### 💰 C. Manajemen Tagihan & Riwayat (`/tagihan`)

Halaman ini merupakan pusat pengelolaan kewajiban finansial mahasiswa sekaligus **titik awal (*entry point*) utama untuk melakukan proses pembayaran baru**.

```
[ Cari Mahasiswa di /tagihan ] ➔ [ Lihat Daftar Tagihan ] ➔ [ Klik Tombol "Bayar" ] ➔ [ Muncul Modal Pembayaran ]
```

#### 📝 Langkah-Langkah Penggunaan & Pelacakan
1. **Melihat Daftar Tagihan Aktif**: Halaman ini menampilkan tabel seluruh tagihan mahasiswa yang belum lunas atau sedang dicicil. Anda dapat menggunakan filter pencarian untuk menemukan tagihan milik mahasiswa tertentu.
2. **Membuat Tagihan Baru Manual**: Klik tombol **"Tambah Tagihan"** di sudut atas. Pilih nama mahasiswa, tentukan jenis tagihan (contoh: SPP, Ujian Mandiri), masukkan nominal total, dan tetapkan tanggal jatuh tempo, lalu simpan.
3. **Melacak Kronologi Cicilan (Tombol Riwayat)**:
   - Pada setiap baris tagihan, terdapat tombol aksi **"Riwayat"**.
   - *Fungsi*: Jika diklik, sistem akan membuka panel/modal yang menampilkan rincian histori seluruh pembayaran atau cicilan yang pernah dibayarkan untuk tagihan tersebut sebelumnya, lengkap dengan tanggal dan nominalnya.

---

### 💳 D. Alur Pemrosesan Pembayaran Baru (via Modal Pembayaran)

> [!IMPORTANT]
> **Koreksi Alur Sistem Operasional**
> Tidak ada halaman mandiri `/pembayaran/baru`. Seluruh alur penerimaan pembayaran dari loket kasir **SELALU diinisiasi dari halaman Tagihan & Deposit (`/tagihan`)**.

Ketika Admin mengklik tombol **"Bayar"** pada salah satu baris tagihan di menu `/tagihan`, sistem akan memunculkan **Form / Modal Pembayaran** interaktif di layar dengan alur sebagai berikut:

1. **Pemeriksaan Rincian**: Modal akan menampilkan rangkuman tagihan yang dipilih beserta sisa tunggakan yang harus dibayar.
2. **Pemilihan Metode**: Pilih metode pembayaran melalui tab **TUNAI** atau **TRANSFER**.

---

#### 🧠 Logika Cerdas Saldo Deposit (Single Source of Truth)
Di dalam Modal Pembayaran, sistem menyediakan fasilitas otomatis untuk memanfaatkan saldo deposit mahasiswa sebagai pengurang tagihan.

> [!IMPORTANT]
> **Skenario 1: Pembayaran Penuh via Deposit (Full Deposit)**
> Jika mahasiswa memiliki saldo deposit yang cukup untuk menutup seluruh tagihan, Admin cukup mengaktifkan *toggle* **"Opsi Saldo Deposit"**. Sistem akan secara otomatis mengisi nominal potongan deposit, dan kolom input Cash/Transfer dapat dibiarkan bernilai `Rp 0`. 
> 
> *Fitur Cerdas*: Sistem mengenali bahwa total kontribusi (Deposit + Cash `0`) telah memenuhi kewajiban bayar, sehingga tombol konfirmasi tetap **AKTIF** dan transaksi dapat langsung diselesaikan tanpa kendala.

> [!NOTE]
> **Skenario 2: Pembayaran Cicilan / Parsial (Kotak Informasi Kuning)**
> Apabila dana yang dibayarkan (baik gabungan uang tunai maupun potongan deposit) bernilai lebih kecil dari total tagihan, sistem akan memunculkan **Kotak Peringatan Kuning** secara dinamis di dalam modal. Kotak ini menginformasikan secara transparan bahwa pembayaran berstatus cicilan dan menampilkan proyeksi sisa tagihan akhir secara akurat.

---

#### 🔄 Fitur Cerdas: Manajemen Kembalian Otomatis (Auto-Deposit)

> [!TIP]
> **Konversi Kembalian Menjadi Saldo Deposit**
> Sistem dilengkapi dengan fitur penanganan kelebihan bayar yang sangat canggih dan otomatis.
> 
> *Skenario*: Apabila sisa tagihan mahasiswa adalah `Rp 500.000`, namun staf menginput nominal bayar (cash/transfer) sebesar `Rp 700.000`, sistem tidak akan menolak transaksi tersebut. Sistem secara otomatis akan melunasi tagihan (`sisa_tagihan` menjadi `0`) dan **memasukkan seluruh sisa uang kembaliannya (`Rp 200.000`) ke dalam saldo Deposit mahasiswa** secara *real-time*. Saldo ini nantinya dapat digunakan untuk memotong tagihan di semester berikutnya.

---

#### ⚡ Efek ke Database (RPC Bypass & Atomic Transaction)
- **Transaksi Regular**: Pembayaran Tunai langsung berstatus `LUNAS`. Pembayaran Transfer (tanpa verifikasi instan) berstatus `PENDING` dan masuk ke antrean verifikasi.
- **Bypass Antrean (Full Deposit)**: Apabila tagihan dibayar 100% menggunakan saldo deposit, sistem akan mengeksekusi pemotongan saldo deposit di tabel `mahasiswa`, memperbarui `sisa_tagihan` menjadi `0` di tabel `tagihan`, dan mencatat riwayat transaksi di tabel `pembayaran` dengan status `LUNAS`. Seluruh proses ini berjalan seketika (*real-time*) tanpa perlu melalui antrean verifikasi manual.
- **Otomatisasi Status Tagihan**: Staf tidak perlu mengubah status tagihan secara manual. Begitu tombol konfirmasi ditekan, sistem secara cerdas akan langsung mengubah status tagihan menjadi `LUNAS` (jika sisa akhir Rp 0) atau `MENCICIL` (jika masih ada sisa tunggakan).

---

### 🛡️ E. Fitur Verifikasi Pembayaran (`/verifikasi`)

Halaman Verifikasi berfungsi sebagai pos penjagaan (*gatekeeper*) untuk meninjau, memvalidasi, atau menolak bukti transfer bank yang disubmit oleh mahasiswa secara mandiri atau diinput oleh admin dengan status `PENDING`.

```
[ Buka Antrean PENDING ] ➔ [ Klik Review ] ➔ [ Periksa Bukti & Rincian ] ➔ [ Klik Setujui / Tolak ]
```

#### 📝 Langkah-Langkah Penggunaan
1. **Buka Antrean**: Akses menu Verifikasi. Tabel akan menampilkan daftar mahasiswa yang menunggu validasi beserta waktu unggah dan nominal bayar.
2. **Review Bukti Transfer**: Klik tombol **"Review"** (ikon mata) pada baris transaksi yang dipilih.
3. **Pemeriksaan Visual**: Jendela modal besar akan terbuka, menampilkan gambar bukti transfer di sisi kiri dan rincian data pencocokan di sisi kanan. Admin dapat memperbesar gambar (*fullscreen*) bg-white atau mengganti bukti jika diperlukan.
4. **Keputusan Final**:
   - Klik **"Tolak"** jika bukti tidak valid (sistem akan meminta alasan penolakan dan mengubah status menjadi `GAGAL`).
   - Klik **"Setujui"** jika dana telah valid masuk ke rekening giro UT.

---

#### ✨ Fitur Baru: Auto-Receipt Pop-up (Kwitansi Instan)

> [!TIP]
> **Alur Kerja Baru yang Lebih Efisien**
> Sebelumnya, setelah menekan tombol **"Setujui"**, Admin harus menavigasi secara manual ke menu Laporan, mencari nama mahasiswa tersebut, dan mengklik tombol cetak.
> 
> **Kini**: Begitu tombol **"Setujui"** ditekan dan validasi backend sukses, sistem akan **LANGSUNG memunculkan Pop-up Kwitansi Resmi (Official Receipt)** di tengah layar. Admin dapat langsung mengklik tombol **"Cetak Sekarang"** atau menyimpannya sebagai PDF. Hal ini memangkas waktu kerja operasional hingga 60%.

---

### 🔍 F. Fitur Riwayat Pembayaran & Pencarian (`/pembayaran`)

Halaman Riwayat Pembayaran menyajikan buku besar pencatatan harian yang memuat seluruh rekam jejak transaksi keuangan tanpa memandang status (Lunas, Pending, atau Gagal).

#### 📝 Langkah-Langkah Penggunaan & Fitur Baru (Pencarian Kilat)
Untuk mengatasi kendala pencarian data di antara ratusan baris transaksi, halaman ini telah dilengkapi dengan fitur **Client-Side Real-Time Filtering**.

1. **Letak Kolom Pencarian**: Perhatikan kotak pencarian berikon kaca pembesar (`Search`) di bagian atas tabel riwayat.
2. **Cara Kerja Real-Time**: Ketikkan kata kunci berupa **Nama Mahasiswa** (contoh: "Budi") atau **NIM Mahasiswa** (contoh: "04321").
3. **Penyaringan Instan**: Tanpa perlu menekan tombol Enter atau memuat ulang halaman, tabel akan menyaring baris data secara otomatis dalam hitungan milidetik (*instant filtering*). Hal ini sangat memudahkan staf saat melayani keluhan atau pertanyaan mahasiswa di loket.

---

### 📊 G. Fitur Laporan & Cetak Ulang (`/laporan`)

Modul Laporan adalah pusat kendali untuk melakukan rekapitulasi, penyaringan lanjutan, audit bukti bayar, serta ekspor pembukuan untuk kebutuhan pelaporan ke UT Pusat.

#### 📝 Langkah-Langkah Penggunaan & Fitur Baru (Direct Print)
1. **Penyaringan Multi-Filter**: Admin dapat menyaring laporan berdasarkan rentang tanggal (*Date Range*), metode pembayaran (Tunai/Transfer), status transaksi (Lunas/Pending/Gagal), hingga filter khusus "Hanya yang ada bukti".
2. **Ekspor Excel**: Klik tombol hijau **"Export ke Excel"** di sudut kanan atas untuk mengunduh seluruh data tabel aktif ke dalam format `.xlsx` yang diformat rapi secara otomatis.
3. **Audit Bukti**: Klik pada gambar *thumbnail* di kolom Bukti Bayar untuk membuka *lightbox* pratinjau resolusi tinggi.

> [!TIP]
> **Fitur Baru: Tombol Print Langsung (Cetak Ulang Kwitansi)**
> Pada kolom paling kanan di setiap baris tabel laporan, kini terdapat tombol aksi baru berupa **Ikon Printer**. 
> 
> *Fungsi*: Memungkinkan Admin untuk melakukan **cetak ulang kwitansi resmi (Official Receipt)** kapan saja untuk transaksi masa lalu hanya dengan satu klik, tanpa perlu menginput ulang data mahasiswa.

---

## 👑 3. MODUL KHUSUS SUPER ADMIN

Bagian ini menguraikan dua modul manajemen tingkat lanjut yang secara eksklusif hanya dapat diakses oleh akun dengan level **Super Admin**.

### 👥 A. Manajemen Staf Admin (`/admins`)
Modul ini digunakan untuk mengontrol siklus hidup akun staf operasional di dalam sistem.
1. **Menambah Akun Staf Baru**: Klik tombol **Tambah Admin** di sudut atas. Masukkan Nama Lengkap, Alamat Email aktif, Password awal, serta tentukan Role (`admin` untuk staf biasa, `super_admin` untuk pengelola utama). Klik Simpan. Akun baru langsung dapat digunakan untuk login.
2. **Mencabut / Menghapus Hak Akses**: Untuk menonaktifkan atau menghapus akun staf yang sudah tidak bertugas, klik tombol hapus (ikon tempat sampah) pada baris staf terkait dan konfirmasi tindakan tersebut.

---

### ⚙️ B. Pengaturan Sistem & Reset Data (`/settings`)
Modul ini berisi parameter konfigurasi tingkat tinggi serta utilitas pemeliharaan database.

> [!CAUTION]
> **Fitur Pembersihan Database (Reset Seluruh Data)**
> Di bagian bawah halaman Pengaturan Sistem, terdapat tombol kritis berwarna merah bertuliskan **"Reset Seluruh Data"**. Fitur ini berfungsi untuk mengosongkan seluruh tabel riwayat pembayaran dan tagihan (biasanya digunakan saat pergantian tahun ajaran baru atau migrasi sistem).
> 
> **Pengamanan Ketat (Safety Lock)**: Untuk mencegah eksekusi yang tidak disengaja, sistem menerapkan pengamanan ganda. Saat tombol diklik, sebuah jendela konfirmasi akan muncul dan **Super Admin WAJIB mengetik kata `RESET` (huruf kapital)** di dalam kolom input sebelum tombol eksekusi akhir aktif.

---

## 💡 4. PENANGANAN KENDALA UMUM (TROUBLESHOOTING)

Bagian ini memuat solusi cepat atas beberapa kendala operasional yang mungkin ditemui staf saat menjalankan sistem sehari-hari.

- **Masalah:** Muncul pesan error *"Saldo deposit mahasiswa tidak mencukupi"* saat klik konfirmasi.
  - *Solusi:* Periksa kembali nominal pada input deposit. Pastikan angka yang dimasukkan tidak melebihi total saldo deposit yang dimiliki oleh mahasiswa tersebut saat ini.

- **Masalah:** Transaksi Metode Transfer tidak langsung memotong sisa tagihan mahasiswa.
  - *Solusi:* Hal ini normal. Pembayaran via Transfer komersial akan masuk ke status 'PENDING' terlebih dahulu. Mintalah bagian keuangan untuk membuka menu `/verifikasi` guna menyetujui transaksi tersebut berdasarkan bukti transfer yang sah.

---

## 📑 5. RANGKUMAN FITUR & MATRIKS HAK AKSES

Tabel berikut merangkum peta kapabilitas sistem berdasarkan wewenang tiap peran pengguna:

| Modul / Fitur Sistem | Deskripsi Fungsionalitas | Super Admin | Staff Admin |
| :--- | :--- | :---: | :---: |
| **Input Tunai & Transfer** | Mencatat pembayaran baru dari modal di `/tagihan` | ✅ | ✅ |
| **Opsi Saldo Deposit** | Menggunakan deposit mahasiswa untuk memotong tagihan | ✅ | ✅ |
| **Bypass Deposit Penuh** | Pembayaran 100% deposit langsung lunas tanpa verifikasi | ✅ | ✅ |
| **Kembalian Otomatis** | Kelebihan bayar otomatis masuk ke saldo Deposit | ✅ | ✅ |
| **Verifikasi Pembayaran** | Meninjau dan menyetujui/menolak bukti transfer bank | ✅ | ✅ |
| **Auto-Receipt Pop-up** | Kwitansi otomatis muncul pasca verifikasi sukses | ✅ | ✅ |
| **Pencarian Riwayat** | Client-side filtering real-time berdasarkan Nama/NIM | ✅ | ✅ |
| **Laporan & Ekspor Excel**| Mengunduh rekapitulasi data keuangan ke format `.xlsx` | ✅ | ✅ |
| **Cetak Ulang Kwitansi** | Tombol *direct print* kwitansi di halaman laporan | ✅ | ✅ |
| **Tambah/Edit Mahasiswa**| Menambah dan mengubah biodata serta Impor Excel | ✅ | ✅ |
| **Hapus Data Mahasiswa** | Menghapus data master mahasiswa dari database | ✅ | ❌ *(Tersembunyi)* |
| **Pengaturan Sistem** | Konfigurasi parameter kritis dan variabel lingkungan | ✅ | ❌ *(Tersembunyi)* |
| **Manajemen Admin** | Menambah, mengedit, atau menghapus akun staf admin | ✅ | ❌ *(Tersembunyi)* |
| **Reset Database** | Mengosongkan data sistem (Wajib ketik `RESET`) | ✅ | ❌ *(Tersembunyi)* |

---
*Dokumen ini merupakan panduan resmi operasional Sistem Administrasi Keuangan UT Salatiga. Diperbarui secara berkala sesuai dengan peningkatan versi aplikasi.*
