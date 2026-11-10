import { createDatabase } from "../src/database.js";
import { toDatabase } from "../src/tasks.js";

const demo = [
  { judul: "Baca materi Prisma dan Postgres", kategori: "Kuliah", tenggat: "2026-11-10", prioritas: "Tinggi", status: "Dikerjakan", catatan: "Catat perbedaan schema, migration, dan Prisma Client." },
  { judul: "Susun outline presentasi", kategori: "Kuliah", tenggat: "2026-11-12", prioritas: "Tinggi", status: "Belum mulai", catatan: "Tentukan pokok bahasan dan siapkan dua contoh." },
  { judul: "Kirim notulen rapat", kategori: "Organisasi", tenggat: "2026-11-13", prioritas: "Sedang", status: "Dikerjakan", catatan: "Periksa keputusan dan pembagian tugas." },
  { judul: "Rapikan folder proyek", kategori: "Pribadi", tenggat: "", prioritas: "Rendah", status: "Belum mulai", catatan: "Pisahkan source, laporan, dan screenshot." },
  { judul: "Cadangkan berkas tugas", kategori: "Pribadi", tenggat: "2026-11-09", prioritas: "Rendah", status: "Selesai", catatan: "Salin versi terakhir ke folder arsip." },
  { judul: "Buat daftar referensi", kategori: "Kuliah", tenggat: "2026-11-09", prioritas: "Sedang", status: "Selesai", catatan: "Simpan tautan dokumentasi yang digunakan." },
];

const db = createDatabase();
try {
  if (await db.tugas.count()) {
    console.log("Seed dilewati: tabel tugas sudah berisi data.");
  } else {
    const { count } = await db.tugas.createMany({ data: demo.map(toDatabase) });
    console.log(`${count} tugas contoh ditambahkan.`);
  }
} finally {
  await db.$disconnect();
}
