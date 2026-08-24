# Sprint Plan Lanjutan Setelah MVP Administrasi Guru

Dokumen ini melanjutkan pengembangan setelah Sprint 1-10 selesai. Fokus tahap ini bukan lagi membuat fitur dasar, tetapi memastikan aplikasi benar-benar layak dipakai guru untuk menyusun, mengecek, mengarsipkan, dan mengumpulkan dokumen Modul Ajar.

## Kondisi Saat Ini

Flow utama MVP sudah tersedia:

- Guru mengelola Topik Pembelajaran.
- Guru mengisi Detail Topik sebagai Bank Pembelajaran.
- Guru menyusun Modul Ajar lewat Penyusun Administrasi.
- Aplikasi menghasilkan file Word.
- Draft tersimpan di Arsip Administrasi.
- Arsip bisa preview, download ulang, dan hapus draft.

Tahap berikutnya perlu fokus pada kualitas dokumen, validasi data, efisiensi input guru, dan kesiapan data jangka panjang.

## Sprint 11 - Validasi Dengan Dokumen Guru

Tujuan: memastikan output Word benar-benar sesuai dokumen asli guru, bukan hanya lengkap secara field.

Perubahan/aktivitas:

- Bandingkan export Word dengan `PERANGKAT_PEMBELAJARAN.pdf`.
- Audit urutan section dokumen.
- Audit judul section dan istilah.
- Audit tabel, lampiran, tanda tangan, dan placeholder data kosong.
- Catat field yang masih belum ada di aplikasi.
- Pisahkan gap menjadi:
  - Wajib untuk dokumen dikumpulkan.
  - Penting untuk kualitas dokumen.
  - Opsional untuk versi berikutnya.

Output:

- File audit gap dalam format Markdown.
- Daftar revisi prioritas untuk export Word.
- Daftar revisi prioritas untuk field input.

Acceptance:

- Ada checklist kesesuaian terhadap PDF asli.
- Gap dokumen jelas dan bisa dikerjakan per prioritas.
- Tidak ada asumsi format dokumen tanpa membandingkan PDF.

## Sprint 12 - Preview dan Template Dokumen Lebih Serius

Tujuan: membuat preview dan hasil Word terasa seperti dokumen final, bukan sekadar HTML yang diunduh.

Perubahan UI/output:

- Tambahkan preview dokumen di Penyusun Administrasi sebelum simpan.
- Preview memakai tampilan halaman A4.
- Rapikan spacing dokumen.
- Rapikan heading dan subheading.
- Rapikan page break.
- Rapikan tabel rubrik dan tabel identitas.
- Placeholder data kosong dibuat lebih formal.

Acceptance:

- Guru bisa mengecek tampilan dokumen sebelum download.
- Preview Arsip dan Preview Builder konsisten.
- File Word tetap bisa dibuka.
- Dokumen tetap terbaca walaupun beberapa data kosong.

## Sprint 13 - Validasi Input dan Kelengkapan Modul Ajar

Tujuan: guru tahu bagian mana yang wajib diisi sebelum export.

Perubahan UI:

- Tambahkan required field per tab Detail Topik.
- Tambahkan indikator field kosong di setiap tab.
- Tambahkan checklist kelengkapan Modul Ajar di Detail Topik.
- Tambahkan status lengkap per Topik Pembelajaran.
- Tambahkan warning sebelum export jika bagian wajib kosong.

Acceptance:

- Guru bisa melihat bagian kosong tanpa membuka semua tab satu per satu.
- Penyusun Administrasi memberi peringatan sebelum download jika dokumen belum lengkap.
- Status lengkap tidak hanya berdasarkan jumlah data, tapi berdasarkan field penting.

## Sprint 14 - Template Cepat PJOK

Tujuan: mengurangi input manual berulang untuk guru PJOK SD.

Perubahan UI/data:

- Tambahkan template cepat untuk aktivitas PJOK:
  - Pendahuluan.
  - Pemanasan.
  - Teori singkat.
  - Praktik lapangan.
  - Permainan sederhana.
  - Pendinginan.
  - Refleksi.
- Tambahkan template rubrik umum PJOK.
- Tambahkan template LKPD berkelompok dan individu.
- Tambahkan aksi duplikasi Modul Ajar dari topik lain.

Acceptance:

- Guru bisa membuat Modul Ajar baru lebih cepat dari template.
- Template bisa diedit setelah diterapkan.
- Duplikasi tidak mengubah data sumber.

## Sprint 15 - Manajemen Data dan Backup

Tujuan: data guru tidak mudah hilang karena aplikasi masih berbasis penyimpanan lokal.

Perubahan UI/data:

- Export semua data aplikasi ke JSON.
- Import data dari JSON.
- Validasi struktur file import.
- Tambahkan backup lokal manual.
- Tambahkan informasi waktu backup terakhir.
- Perbaiki reset data agar lebih aman dan jelas dampaknya.

Acceptance:

- Guru bisa memindahkan data ke perangkat lain lewat file JSON.
- Import data tidak merusak state jika file tidak valid.
- Reset data memberi peringatan yang jelas.

## Sprint 16 - Multi Guru dan Admin Lebih Nyata

Tujuan: menaikkan aplikasi dari single-user demo menuju penggunaan sekolah.

Perubahan UI/data:

- Admin punya daftar guru.
- Admin bisa tambah, edit, hapus guru.
- Admin menentukan kelas yang diajar setiap guru.
- Guru yang aktif punya data sendiri.
- Login/mock auth mulai dipisah antara admin dan guru.
- Arsip dan Bank Pembelajaran mengikuti guru aktif.

Acceptance:

- Data antar guru tidak bercampur.
- Admin bisa mengatur kelas guru.
- Guru hanya melihat kelas dan data miliknya.

## Sprint 17 - Kualitas Arsip dan Riwayat Dokumen

Tujuan: arsip bukan hanya draft, tapi riwayat dokumen yang bisa dilacak.

Perubahan UI/data:

- Tambahkan status dokumen:
  - Draft.
  - Siap review.
  - Final.
- Tambahkan versi dokumen.
- Tambahkan catatan perubahan.
- Tambahkan tanggal download terakhir.
- Tambahkan aksi duplikasi draft.

Acceptance:

- Guru bisa membedakan draft dan dokumen final.
- Draft lama bisa diduplikasi untuk semester/topik berikutnya.
- Riwayat perubahan dasar terlihat di Arsip Administrasi.

## Sprint 18 - Polish Demo dan Uji Alur Utama

Tujuan: membuat aplikasi siap didemokan end-to-end.

Checklist:

- Dashboard ke Topik Pembelajaran.
- Detail Topik mengisi semua tab.
- Penyusun Administrasi memilih data dan melihat preview.
- Simpan Draft.
- Download Word.
- Buka Arsip Administrasi.
- Preview dokumen dari Arsip.
- Download ulang Word.
- Hapus draft.
- Reset demo data.

Acceptance:

- Alur utama bisa dicoba tanpa error.
- Tidak ada layout pecah di desktop dan tablet.
- Tidak ada istilah UI yang tidak konsisten.
- Tidak ada tombol utama yang membingungkan.

## Prioritas Rekomendasi

Urutan paling masuk akal:

1. Sprint 11 - Validasi Dengan Dokumen Guru.
2. Sprint 12 - Preview dan Template Dokumen Lebih Serius.
3. Sprint 13 - Validasi Input dan Kelengkapan Modul Ajar.
4. Sprint 14 - Template Cepat PJOK.
5. Sprint 15 - Manajemen Data dan Backup.
6. Sprint 16 - Multi Guru dan Admin Lebih Nyata.
7. Sprint 17 - Kualitas Arsip dan Riwayat Dokumen.
8. Sprint 18 - Polish Demo dan Uji Alur Utama.

Catatan: Sprint 11 sebaiknya dikerjakan lebih dulu sebelum fitur baru lain, karena kualitas dokumen akhir adalah nilai utama aplikasi ini.
