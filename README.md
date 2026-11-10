# Catat

Manajemen tugas dengan tampilan yang mengacu pada Ruang. Backend memakai Express, Prisma ORM, dan Neon PostgreSQL. Frontend memakai HTML, CSS, dan JavaScript tanpa framework.

## Menjalankan proyek

Gunakan Node.js 22.18+, 24.11+, atau 26+. Buat proyek Neon, lalu buka **Connect** untuk menyalin connection string. Gunakan database demo terpisah.

1. Salin `.env.example` ke `.env`.
2. Isi `DATABASE_URL` dengan URL pooled dan `DIRECT_URL` dengan URL direct. Simpan kedua URL hanya di `.env` lokal.
3. Jalankan:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm start
```

Buka `http://localhost:3000`. Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd` untuk perintah di atas. `npm ci` menjalankan `prisma generate`; tidak diperlukan build frontend. Seed menambahkan enam tugas contoh bila tabel masih kosong. Ubah `PORT` di `.env` jika 3000 sedang dipakai.

## Endpoint

| Method | URL | Aksi di web | Operasi Prisma | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/tugas` | Memuat seluruh tugas | `findMany` | 200 |
| POST | `/api/tugas` | Form Tambah tugas | `create` | 201 |
| PUT | `/api/tugas/:id` | Form Edit, atau centang selesai | `update` | 200 |
| DELETE | `/api/tugas/:id` | Tombol Hapus dan konfirmasi | `delete` | 200 |

POST dan PUT menerima JSON seperti ini:

```json
{
  "judul": "Selesaikan laporan praktikum",
  "kategori": "Kuliah",
  "tenggat": "2026-11-12",
  "prioritas": "Tinggi",
  "status": "Dikerjakan",
  "catatan": "Simpan screenshot hasil uji."
}
```

`tenggat` menerima tanggal `YYYY-MM-DD` atau string kosong. Prioritas: `Rendah`, `Sedang`, `Tinggi`. Status: `Belum mulai`, `Dikerjakan`, `Selesai`. Input tidak valid mengembalikan 400 dan ID yang tidak ditemukan mengembalikan 404.

## Demo dan bukti

1. Buka halaman Tugas dan perlihatkan data hasil GET.
2. Tambahkan tugas baru, lalu perlihatkan record yang muncul di Neon.
3. Edit judul, status, atau tenggat. Tunjukkan ID tetap sama dan kolom berubah.
4. Hapus record demo dan ulangi query dengan ID yang sama. Hasilnya 0 record.

Folder [`evidence/`](evidence) memuat [laporan PDF](evidence/Laporan-Evidence-Catat.pdf), screenshot UI, enam screenshot hasil query SQL langsung ke Neon, dan `hasil.json` yang memuat hasil HTTP serta record sebelum dan sesudah. Screenshot database menampilkan hasil query yang diambil untuk laporan.

```sql
SELECT id, judul, kategori, tenggat, prioritas, status
FROM public.tugas
WHERE id = 8; -- ganti dengan ID dari respons POST
```

`npm test` menjalankan satu skenario integrasi CRUD dengan PostgreSQL. Tes membuat record unik, membaca hasil dari koneksi Prisma lain, memverifikasi validasi, lalu membersihkan record uji. Jalankan setelah migrasi dan gunakan database demo.

## Struktur

- `public/`: tampilan, sistem desain, dan `fetch` ke Express.
- `src/`: validasi, route, pemetaan data, dan Prisma Client dengan adapter PostgreSQL.
- `prisma/schema.prisma`: model, tipe kolom, dan enum PostgreSQL.
- `prisma/migrations/`: migrasi SQL yang di-commit.
- `prisma/seed.js`: tugas contoh untuk demo.
- `test/`: uji integrasi.

ZIP pengumpulan mengecualikan `.env`, `node_modules`, `generated`, dan `dist`. Kredensial tidak disertakan di GitHub.
