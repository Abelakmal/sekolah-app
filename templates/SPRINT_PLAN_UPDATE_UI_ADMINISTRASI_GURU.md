# Sprint Plan Update UI Administrasi Guru

Dokumen ini membagi pengembangan aplikasi menjadi beberapa sprint kecil agar perubahan dari MVP bank pembelajaran menuju builder Modul Ajar lengkap bisa dikerjakan bertahap, mudah dites, dan tidak membuat UI terlalu kompleks.

## Prinsip UI

- Sidebar tetap sederhana: Dashboard, Topik Pembelajaran, Penyusun Administrasi, Arsip Administrasi, Admin Guru.
- Kelas tetap menjadi filter, bukan menu utama.
- Detail Topik menjadi pusat pengelolaan bank pembelajaran.
- Builder menjadi pusat penyusunan dokumen Modul Ajar.
- Setiap sprint harus menghasilkan UI yang bisa dicoba, bukan hanya perubahan data.
- Jangan menambah fitur baru ke sidebar kecuali benar-benar menjadi workflow utama.

## Sprint 1 - Rapikan Struktur Detail Topik

Tujuan: membuat halaman Detail Topik menjadi tempat utama mengisi data Modul Ajar.

Perubahan UI:
- Ubah tab Detail Topik dari 4 tab menjadi tab yang lebih sesuai dokumen guru:
  - Informasi Modul
  - Kompetensi & Tujuan
  - Materi & Media
  - Aktivitas Pembelajaran
  - Asesmen & Rubrik
  - LKPD
  - Lampiran
- Tambahkan ringkasan kecil di header detail topik:
  - Kelas
  - Materi pokok
  - Alokasi waktu
  - Jumlah komponen terisi
- Tambahkan indikator kelengkapan per tab.

Acceptance:
- Guru bisa klik topik lalu masuk halaman detail penuh.
- Semua tab tampil jelas dan tidak terasa seperti form panjang satu halaman.
- Tab lama tidak hilang fungsinya, tapi dipindah ke struktur baru.

## Sprint 2 - Tambah Data Informasi Modul

Tujuan: membuat data identitas dokumen sesuai PDF asli.

Perubahan UI:
- Di tab Informasi Modul, buat form:
  - Nama penyusun
  - Instansi
  - Tahun ajaran
  - Semester
  - Mata pelajaran
  - Fase/Kelas
  - Materi pokok
  - Bab/Pertemuan
  - Alokasi waktu
  - Mode pembelajaran
  - Jumlah peserta didik
  - Target peserta didik
- Di Admin Guru, tambahkan data sekolah:
  - Nama sekolah
  - Nama kepala sekolah
  - NIP kepala sekolah
  - Identitas guru tambahan seperti NIP/NUPTK/No UKG/NIM

Acceptance:
- Informasi Modul bisa disimpan per topik.
- Data sekolah/guru bisa otomatis dipakai saat menyusun administrasi.
- Refresh browser tidak menghilangkan data.

## Sprint 3 - Kompetensi dan Tujuan Modul Ajar

Tujuan: melengkapi bagian awal Modul Ajar yang belum ada di aplikasi.

Perubahan UI:
- Tab Kompetensi & Tujuan berisi section:
  - Komponen awal
  - Profil Pelajar Pancasila
  - Capaian pembelajaran
  - Tujuan pembelajaran
  - Pemahaman bermakna
  - Pertanyaan pemantik
  - Asesmen diagnostik non-kognitif
  - Persiapan pembelajaran
- Gunakan pattern list + form panel untuk item yang bisa lebih dari satu, seperti tujuan pembelajaran dan pertanyaan pemantik.
- Gunakan textarea terstruktur untuk bagian naratif panjang.

Acceptance:
- Guru bisa mengisi semua bagian kompetensi inti sesuai dokumen PDF.
- Tujuan pembelajaran lama tetap bisa dipakai.
- Builder bisa membaca data ini dari topik yang dipilih.

## Sprint 4 - Aktivitas Pembelajaran Terstruktur

Tujuan: aktivitas tidak lagi hanya satu textarea, tapi mengikuti urutan kegiatan di dokumen guru.

Perubahan UI:
- Tab Aktivitas Pembelajaran dibagi menjadi:
  - Kegiatan Pendahuluan
  - Kegiatan Inti
  - Kegiatan Penutup
  - Diferensiasi Konten
  - Diferensiasi Proses
  - Diferensiasi Lingkungan Belajar
- Setiap kegiatan punya:
  - Judul
  - Durasi menit
  - Langkah kegiatan
  - Catatan sintaks pembelajaran
- Tambahkan template cepat untuk PJOK:
  - Orientasi dan motivasi
  - Teori di kelas
  - Praktik di lapangan
  - Refleksi dan umpan balik

Acceptance:
- Guru bisa menyusun kegiatan pendahuluan, inti, dan penutup.
- Total durasi bisa terlihat.
- Data aktivitas tampil rapi di builder dan export Word.

## Sprint 5 - Asesmen, Rubrik, dan Format Nilai

Tujuan: asesmen mengikuti kebutuhan dokumen asli, bukan hanya jenis dan deskripsi.

Perubahan UI:
- Tab Asesmen & Rubrik dibagi menjadi:
  - Asesmen diagnostik
  - Asesmen formatif
  - Asesmen sumatif
  - Rubrik kelompok
  - Rubrik individu
  - Penilaian sikap
  - Penilaian pengetahuan
  - Penilaian praktik
- Tambahkan tabel rubrik sederhana:
  - Aspek penilaian
  - Baik Sekali
  - Baik
  - Cukup
  - Perlu Perbaikan
- Tambahkan tabel skor praktik:
  - Aspek
  - Skor maksimum

Acceptance:
- Guru bisa membuat rubrik seperti PDF.
- Format penilaian bisa dimasukkan ke dokumen Word.
- Asesmen lama tetap bisa dimigrasikan sebagai asesmen umum.

## Sprint 6 - LKPD dan Lampiran

Tujuan: menambahkan bagian lampiran yang penting dalam dokumen perangkat pembelajaran.

Perubahan UI:
- Tab LKPD:
  - LKPD berkelompok
  - LKPD individu
  - Soal
  - Area jawaban
  - Kunci jawaban
- Tab Lampiran:
  - Bahan bacaan
  - Media pembelajaran
  - Instrumen penilaian
  - Glosarium
  - File pendukung
- Tambahkan preview sederhana per lampiran.

Acceptance:
- Guru bisa membuat minimal satu LKPD berkelompok dan satu LKPD individu.
- Guru bisa mengisi glosarium.
- Lampiran tampil dalam export Word.

## Sprint 7 - Redesign Builder Modul Ajar

Tujuan: builder tidak hanya memilih komponen, tapi menjadi wizard penyusunan Modul Ajar lengkap.

Perubahan UI:
- Step builder:
  - Pilih Kelas & Topik
  - Identitas Modul
  - Kompetensi & Tujuan
  - Materi & Media
  - Aktivitas Pembelajaran
  - Asesmen & Rubrik
  - LKPD & Lampiran
  - Review Dokumen
- Tambahkan progress kelengkapan.
- Tambahkan preview ringkas sebelum simpan.
- Modal simpan menampilkan:
  - Judul dokumen
  - Kelas/topik
  - Komponen yang lengkap
  - Komponen yang masih kosong
  - Tombol Simpan Draft
  - Tombol Simpan & Download Word

Acceptance:
- Builder terasa seperti proses penyusunan dokumen, bukan daftar checkbox.
- Guru bisa tahu bagian mana yang belum lengkap.
- Draft tersimpan ke Arsip.

## Sprint 8 - Template Word Sesuai PDF

Tujuan: export Word mengikuti urutan dokumen asli.

Perubahan output:
- Cover Modul Ajar.
- Informasi Umum.
- Identitas Modul.
- Komponen Awal.
- Profil Pelajar Pancasila.
- Sarana dan Prasarana.
- Target dan jumlah peserta didik.
- Model pembelajaran.
- Kompetensi Inti.
- Urutan Kegiatan Pembelajaran.
- Refleksi Guru.
- Refleksi Peserta Didik.
- Asesmen/Penilaian.
- Pengayaan dan Remedial.
- Lampiran.
- Tanda tangan kepala sekolah dan guru.

Acceptance:
- File Word bisa dibuka.
- Urutan dokumen mengikuti PDF asli.
- Data kosong tetap diberi placeholder yang layak, bukan membuat dokumen rusak.

## Sprint 9 - Arsip dan Preview Dokumen

Tujuan: guru bisa mengelola hasil administrasi yang sudah dibuat.

Perubahan UI:
- Arsip menampilkan:
  - Judul administrasi
  - Kelas
  - Topik
  - Tanggal dibuat
  - Status kelengkapan
- Tambahkan aksi:
  - Buka detail
  - Download ulang Word
  - Hapus
- Tambahkan preview dokumen berbasis HTML sebelum download.

Acceptance:
- Draft yang sudah disimpan bisa dilihat ulang.
- Download ulang memakai data draft yang sama.
- Hapus draft tidak menghapus bank pembelajaran.

## Sprint 10 - Polish UI dan Validasi

Tujuan: membuat aplikasi siap dipakai demo oleh guru.

Perubahan UI:
- Rapikan empty state.
- Tambahkan konfirmasi hapus.
- Tambahkan toast/notifikasi sederhana setelah simpan.
- Pastikan layout tablet tidak pecah.
- Pastikan teks panjang tidak overflow.
- Konsistenkan istilah:
  - Topik Pembelajaran
  - Detail Topik
  - Modul Ajar
  - Penyusun Administrasi
  - Arsip Administrasi

Acceptance:
- `bun run typecheck` lolos.
- `bun run lint` lolos.
- `bun run build` lolos.
- Alur utama bisa dicoba dari Dashboard sampai download Word.

## Urutan Prioritas

Prioritas paling penting:
1. Sprint 1
2. Sprint 2
3. Sprint 3
4. Sprint 4
5. Sprint 5
6. Sprint 7
7. Sprint 8

Sprint 6, 9, dan 10 bisa dikerjakan setelah struktur Modul Ajar utama stabil.

## Catatan Implementasi

- Jangan memindahkan kelas menjadi menu sidebar.
- Jangan membuat Bank Pembelajaran sebagai menu terpisah.
- Jangan membuat semua data dalam satu form panjang.
- Detail Topik harus menjadi tempat mengisi bank.
- Builder harus menjadi tempat memilih dan menyusun dokumen.
- Export Word harus mengikuti format dokumen guru, bukan sekadar ringkasan pilihan.
