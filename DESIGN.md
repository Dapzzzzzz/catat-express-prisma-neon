# Sistem desain Catat

Acuan: halaman Tugas pada source Ruang yang diberikan pengguna. Catat mengikuti sidebar terang, panel putih, ikon garis, label kategori, dan tombol hijau Ruang. Fokus halaman ini adalah daftar tugas dan operasi CRUD.

| Elemen | Terang | Tujuan |
| --- | --- | --- |
| Latar | `#f7f9f7` | Membedakan area kerja dari panel |
| Sidebar | `#fbfcfb` | Filter status dan progres |
| Panel | `#ffffff` | Daftar, dialog, dan formulir |
| Teks | `#202923` | Judul dan isi |
| Hijau | `#3d704d` | Aksi utama dan kontrol yang dipilih |
| Hijau muda | `#edf5ee` | Kategori, filter aktif, dan hasil operasi |

Font sistem dipakai agar aplikasi dapat berjalan tanpa mengunduh font. Target sentuh minimal 44 px; fokus keyboard terlihat. Filter status berpindah ke atas daftar pada layar sempit. Tema gelap memakai struktur yang sama. Status, prioritas, dan tindakan ditulis dengan teks agar tetap terbaca tanpa mengandalkan warna.

`public/tokens.css` menyimpan warna dan ukuran bersama. `public/components.css` berisi tombol, input, dan dialog. `public/app.css` berisi layout tugas. Saat server berjalan, lihat `/design-system.html` untuk contoh komponen.
