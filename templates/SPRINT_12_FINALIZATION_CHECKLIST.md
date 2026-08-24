# Sprint 12 Finalization - Preview dan Template Dokumen

Sprint ini menutup rangkaian Sprint 12A-12D dengan fokus pada kesiapan preview dan export Word.

## Yang Difinalkan

- Tombol `Preview A4` tersedia global di Penyusun Administrasi.
- Tombol `Preview Dokumen A4` ditambahkan langsung di step `Review Dokumen`.
- Preview Builder dan Preview Arsip memakai modal yang sama.
- Styling dokumen diperkuat untuk A4:
  - ukuran dokumen `210mm`;
  - `@page` A4;
  - heading lebih formal;
  - tabel memakai fixed layout;
  - teks panjang memakai `overflow-wrap`;
  - header tabel berulang saat print jika didukung;
  - page break tetap dipakai untuk cover dan lampiran.

## Checklist Manual

Gunakan data demo lalu cek alur:

1. Buka Penyusun Administrasi.
2. Pilih topik demo.
3. Masuk ke step `Review Dokumen`.
4. Klik `Preview Dokumen A4`.
5. Pastikan cover tampil sebagai halaman pertama.
6. Pastikan tabel identitas tidak melebar keluar halaman.
7. Pastikan tabel asesmen tetap terbaca.
8. Pastikan Lampiran LKPD terpisah dari isi utama.
9. Klik `Download Word`.
10. Buka file `.doc` dan cek urutan section.

## Catatan Risiko

- Export masih berbasis HTML `.doc`, bukan generator DOCX native. Word dapat membuka file, tetapi rendering bisa sedikit berbeda antar versi Microsoft Word, LibreOffice, atau Google Docs.
- Tabel penilaian dengan banyak aspek dan banyak siswa tetap berisiko padat. Untuk dokumen final yang sangat formal, sprint berikutnya bisa mempertimbangkan layout landscape khusus untuk tabel penilaian.

## Status

Selesai untuk kebutuhan MVP demo dan validasi guru.
