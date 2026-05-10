# 🎨 Design System: Sistem Administrasi & Keuangan Mahasiswa UT Salatiga

Panduan desain visual ini dirancang dengan filosofi **"Minimalist & Premium"**, memberikan pengalaman UI yang profesional, bersih, mudah dibaca, dan berkelas bagi staf akademik.

---

## 🎨 Color Palette
Palet warna dihindarkan dari pemilihan default browser dan disetel untuk memberikan kontras yang mewah (Quiet Luxury).

| Fungsi | Warna | Kode HEX | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Background App** | Gallery White | `#F9F9F9` | Latar belakang utama. Memberikan kesan bersih tanpa terlalu tajam menyilaukan mata (off-white). |
| **Teks Utama & Sidebar** | Deep Navy | `#0F172A` | Pengganti hitam. Digunakan untuk Sidebar background dan teks heading. Memberikan ilusi lebih berkelas. |
| **Teks Sekunder** | Slate Gray | `#64748B` | Teks pendukung, deskripsi form, placeholder, dan border pemisah yang sangat halus. |
| **Aksen LUNAS** | Emerald Green | `#10B981` | Warna sukses utama, digunakan pada badge, indikator chart, dan tombol verifikasi. |
| **Aksen PENDING** | Deep Gold / Amber | `#F59E0B` | Digunakan untuk badge "Pending" dan antrean. Bernuansa emas tua, bukan kuning terang yang mencolok. |
| **Aksen BELUM LUNAS** | Crimson / Rose | `#E11D48` | Peringatan urgensi untuk tagihan yang menunggak. Tegas, profesional, namun elegan. |
| **Primary Brand** | Royal Blue | `#2563EB` | Aksen warna brand untuk fokus input, tautan aktif, atau CTA primer. |

---

## 🔤 Typography
Menciptakan kontras visual yang kuat antara UI sistem aplikasi dengan output/reporting resmi kampus.

1. **User Interface & Form (Sans-serif):**
   - **Font:** `Inter` (Atau default geist-sans Next.js).
   - **Karakteristik:** Sangat terbaca, spasi huruf geometris.
   - **Aplikasi:** Sidebar, Data Table, label input form, tombol, dan teks deskripsi reguler.

2. **Heading Formal & Rekapitulasi (Serif):**
   - **Font:** `Instrument Serif` atau `Merriweather`.
   - **Karakteristik:** Elegan, institusional, memberikan "bobot" kepercayaan.
   - **Aplikasi:** Judul Halaman Utama (H1), Angka metrik di Card Statistik (misal "Rp 45.000.000"), dan Title kop surat pada ekspor/laporan UI.

---

## 🧩 Component Guide
Panduan detail spesifikasi merakit komponen dengan Tailwind CSS & `shadcn/ui`.

### 1. Card Statistik (Overview Dashboard)
- **Desain:** Mengusung *halus* Glassmorphism.
  - Background putih solid dengan sedikit transparansi (`bg-white/90`), border ekstra tipis (`border border-slate-100`).
  - Drop shadow sangat lembut dan tersebar luas (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
- **Interaksi:** Hover state mengangkat kartu perlahan (`transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`).
- **Typography:** Value angka menggunakan Serif ukuran besar (`text-4xl font-serif text-slate-900`). Label teks menggunakan Inter tebal dan uppercase (`text-xs font-semibold tracking-wider text-slate-500 uppercase`).

### 2. Data Table
- **Tampilan:** Tabel melebar penuh dengan `rounded-xl`, dibalut outline border yang samar. Header tabel memakai background `bg-slate-50/80` yang diredam.
- **Interaksi Baris:** Warna baris berganti sangat halus saat didekati kursor (`hover:bg-slate-50/50 transition-colors`).
- **Skeleton Loading:** Gantikan data teks dengan elemen pulsa kotak. Hindari spinner biasa; gunakan bilah horizontal abu-abu (`bg-slate-200 animate-pulse rounded`) berukuran acak seakan merepresentasikan panjang teks.
- **Pagination:** Tampil bersih (Next/Prev dan nomor singkat). Tidak ada border kasar antar tombol pagination.

### 3. Badge Status
Wajib memberikan kesan *Badge Pill* modern. Jangan gunakan background block solid terang.
- **LUNAS:** Kombinasi latar pastel dengan teks tegas.
  `className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"`
- **PENDING:** 
  `className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"`
- **BELUM LUNAS:**
  `className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"`

### 4. Modal Konfirmasi Verifikasi (Verification Engine)
- **Overlay (Backdrop):** Hitam dengan opasitas medium-tinggi disertai efek blur di latar (`bg-slate-900/40 backdrop-blur-sm`).
- **Panel Modal:** Container dengan background `bg-white rounded-2xl shadow-2xl p-6`.
- **Layout Konten:** Menggunakan grid 2-kolom (Side-by-side):
  - *Kiri:* Image preview bukti transfer dari Supabase Storage. Border radius tumpul (`rounded-lg bg-slate-100 object-contain h-full`). Tersedia tombol click-to-zoom jika gambar terlalu kecil.
  - *Kanan:* Rincian identitas mahasiswa, nominal konfirmasi, tanggal transfer.
- **Tombol Action:** 
  - *Approve:* Tombol solid dengan efek percaya diri (`bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm`).
  - *Reject/Tutup:* Tombol outline atau ghost minimalis (`text-slate-600 hover:bg-slate-100`).
```
