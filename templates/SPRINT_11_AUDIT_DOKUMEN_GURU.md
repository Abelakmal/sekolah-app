# Sprint 11 - Audit Kesesuaian Dokumen Guru

Audit ini membandingkan dokumen asli `PERANGKAT_PEMBELAJARAN.pdf` dengan export Word aplikasi saat ini di `src/features/builder/documentExport.ts`.

Tujuan audit: memastikan aplikasi tidak hanya punya field yang lengkap, tetapi menghasilkan Modul Ajar yang layak dibandingkan dokumen guru asli.

## Ringkasan Keputusan

Status saat ini: **cukup untuk MVP demo, belum cukup untuk dokumen final yang siap dikumpulkan**.

Alasan:

- Urutan besar dokumen sudah mendekati PDF asli.
- Bagian utama Modul Ajar sudah ada: cover, informasi umum, identitas modul, kompetensi inti, kegiatan pembelajaran, asesmen, lampiran, tanda tangan.
- Namun beberapa bagian penting PDF masih terlalu disederhanakan, terutama sarana-prasarana, model pembelajaran, sintaks diferensiasi, pengayaan-remedial, format penilaian siswa, dan lampiran detail.

## Struktur PDF Asli

Urutan dokumen asli:

1. Cover Modul Ajar.
2. Informasi Umum.
3. Identitas Modul.
4. Komponen Awal.
5. Profil Pelajar Pancasila.
6. Sarana dan Prasarana.
7. Target Peserta Didik.
8. Jumlah Peserta Didik.
9. Model Pembelajaran.
10. Kompetensi Inti.
11. Capaian Pembelajaran.
12. Tujuan Pembelajaran.
13. Pemahaman Bermakna.
14. Pertanyaan Pemantik.
15. Asesmen Diagnostik Non-Kognitif.
16. Persiapan Pembelajaran.
17. Urutan Kegiatan Pembelajaran.
18. Refleksi Guru.
19. Refleksi Peserta Didik.
20. Asesmen/Penilaian.
21. Kegiatan Pengayaan dan Remedial.
22. Lampiran.
23. Tanda tangan kepala sekolah dan guru.

Lampiran PDF asli:

1. Bahan bacaan guru dan peserta didik.
2. Media pembelajaran.
3. LKPD berkelompok dan individu.
4. Instrumen penilaian.
5. Glosarium.

## Checklist Kesesuaian Export Saat Ini

| Bagian PDF Asli | Status | Catatan |
| --- | --- | --- |
| Cover Modul Ajar | Sebagian sesuai | Cover sudah ada, tetapi belum memuat format PPG seperti universitas, NIM, dan blok penyusun seperti PDF. |
| Informasi Umum | Sebagian sesuai | Data utama ada, tetapi PDF menempatkan informasi umum sebagai wrapper dan identitas modul sebagai subbagian. |
| Identitas Modul | Sebagian sesuai | Materi, bab, alokasi waktu, target, jumlah, model sudah ada. Format masih lebih generik. |
| Komponen Awal | Sesuai dasar | Sudah ada field dan export. |
| Profil Pelajar Pancasila | Sesuai dasar | Sudah list, tetapi belum menjaga bullet style seperti PDF. |
| Sarana dan Prasarana | Kurang sesuai | Saat ini mengambil `learningMedia` sebagai satu teks. PDF memisahkan media, alat/bahan, sumber belajar, lapangan, bola, net, peluit. |
| Target Peserta Didik | Sesuai dasar | Sudah ada. |
| Jumlah Peserta Didik | Sesuai dasar | Sudah ada. |
| Model Pembelajaran | Kurang sesuai | Aplikasi memakai mode `Teori/Praktek/Teori dan Praktek`; PDF butuh model seperti Problem Based Learning, metode, dan diferensiasi. |
| Capaian Pembelajaran | Sesuai dasar | Sudah ada. |
| Tujuan Pembelajaran | Sesuai dasar | Sudah dipilih dari bank tujuan. |
| Pemahaman Bermakna | Sesuai dasar | Sudah ada. |
| Pertanyaan Pemantik | Sesuai dasar | Sudah ada. |
| Asesmen Diagnostik Non-Kognitif | Sesuai dasar | Ada di kompetensi, tetapi juga ada asesmen diagnostik di tab asesmen. Perlu konsolidasi istilah. |
| Persiapan Pembelajaran | Sesuai dasar | Afektif, kognitif, psikomotor sudah ada. |
| Urutan Kegiatan Pembelajaran | Sebagian sesuai | Pendahuluan, inti, penutup sudah ada. Belum ada field khusus catatan sintaks per bagian. |
| Sintaks Pembelajaran Berdiferensiasi | Kurang sesuai | PDF punya sintaks di pendahuluan, inti, dan penutup. Aplikasi hanya punya diferensiasi konten/proses/lingkungan global. |
| Refleksi Guru | Sesuai dasar | Sudah ada. |
| Refleksi Peserta Didik | Sesuai dasar | Sudah ada. |
| Asesmen/Penilaian | Sebagian sesuai | Rubrik dan skor ada, tetapi format penilaian siswa belum setara PDF. |
| Rubrik Penilaian Kelompok | Sesuai dasar | Tabel empat level sudah ada. |
| Rubrik Penilaian Tugas Individu | Sebagian sesuai | Rubrik individu ada, tetapi PDF juga punya tujuan, waktu pelaksanaan, dan skala nilai 100/80/60/40/20. |
| Penilaian Praktik Sumatif | Sebagian sesuai | Tabel skor maksimum ada, tetapi belum ada total skor, kriteria penilaian, dan skala 4/3/2/1 seperti PDF. |
| Format Penilaian Sikap | Kurang sesuai | PDF punya tabel per nama siswa dan aspek. Aplikasi baru menyimpan aspek dan skor maksimum. |
| Format Penilaian Pengetahuan | Kurang sesuai | PDF punya tabel nama siswa, butir soal, nilai, dan rumus nilai. Aplikasi belum punya format ini. |
| Format Penilaian Praktik | Kurang sesuai | PDF punya format identitas, tugas, nama peserta didik, skala 4/3/2/1, dan keterangan. Aplikasi belum punya format lengkap. |
| Pengayaan dan Remedial | Kurang sesuai | Export memakai teks default hardcoded, belum editable dari UI. |
| Lampiran Bahan Bacaan | Sebagian sesuai | Field ada, tapi belum mendukung struktur subbagian panjang seperti sejarah, pengertian, gerak lokomotor/non-lokomotor/manipulatif, ukuran lapangan. |
| Lampiran Media Pembelajaran | Sebagian sesuai | Field ada, tetapi belum mendukung gambar/media preview di Word. |
| LKPD | Sebagian sesuai | LKPD kelompok/individu ada, tetapi belum punya format nama kelompok, daftar anggota, lembar jawaban terpisah, dan tampilan garis jawaban. |
| Instrumen Penilaian | Sebagian sesuai | Ada text field dan rubrik, tetapi belum digabung menjadi lampiran instrumen lengkap seperti PDF. |
| Glosarium | Sesuai dasar | Sudah ada tabel istilah dan definisi. |
| Tanda tangan | Sebagian sesuai | Kepala sekolah/guru ada, tetapi belum ada lokasi/tanggal dan identitas guru PDF menggunakan NIM di contoh. |

## Gap Wajib Untuk Dokumen Dikumpulkan

Item berikut sebaiknya dikerjakan sebelum aplikasi dipakai untuk menghasilkan dokumen final:

1. **Sarana dan Prasarana harus dipisah menjadi field terstruktur.**
   - Media.
   - Alat dan bahan.
   - Sumber belajar.
   - Lapangan.
   - Bola/peralatan olahraga.
   - Catatan kebutuhan khusus.

2. **Model Pembelajaran harus dipisah dari mode pembelajaran.**
   - Model pembelajaran, contoh: Problem Based Learning.
   - Metode pembelajaran, contoh: ceramah, diskusi, tanya jawab, penugasan.
   - Strategi berdiferensiasi.

3. **Kegiatan pembelajaran perlu field sintaks.**
   - Sintaks pendahuluan.
   - Sintaks inti.
   - Sintaks penutup.
   - Diferensiasi per aktivitas, bukan hanya global.

4. **Pengayaan dan Remedial harus editable.**
   - Saat ini export masih memakai teks default.
   - Perlu field per topik agar sesuai kebutuhan guru.

5. **Format penilaian perlu lebih lengkap.**
   - Tabel penilaian sikap per peserta didik.
   - Tabel penilaian pengetahuan per peserta didik.
   - Tabel penilaian praktik dengan skala 4/3/2/1.
   - Total skor dan kriteria penilaian.

6. **Tanda tangan perlu lokasi dan tanggal.**
   - Contoh PDF memakai lokasi dan tanggal: `Sangau, 30 Oktober 2024`.
   - Perlu field tempat dan tanggal pengesahan.

## Gap Penting Untuk Kualitas Dokumen

1. **Cover perlu template lebih mirip PDF.**
   - Tambahkan blok `Disusun Oleh`.
   - Tambahkan `No UKG`.
   - Tambahkan `NIM`.
   - Tambahkan program/universitas opsional jika konteks PPG.

2. **Lampiran bahan bacaan perlu struktur subbagian.**
   - Judul subbagian.
   - Isi subbagian.
   - Bisa lebih dari satu bagian.

3. **LKPD perlu layout khusus.**
   - Nama kelompok.
   - Daftar anggota.
   - Soal.
   - Area jawaban dengan garis/titik.
   - Lembar jawaban/kunci jawaban terpisah.

4. **Instrumen penilaian harus bisa muncul sebagai lampiran utuh.**
   - Saat ini penilaian muncul di bagian utama dan lampiran hanya text field.
   - Perlu export ulang agar lampiran instrumen berisi rubrik dan format nilai lengkap.

5. **Data peserta didik belum ada.**
   - PDF memuat daftar 17 nama siswa.
   - Aplikasi belum punya modul/field daftar peserta didik.
   - Ini dibutuhkan jika ingin format nilai otomatis berisi nama siswa.

## Gap Opsional Untuk Versi Berikutnya

1. Upload gambar ke bahan bacaan/media.
2. Preview gambar di export Word.
3. Nomor halaman.
4. Header/footer sekolah.
5. Logo sekolah atau logo instansi.
6. Template dokumen per kurikulum atau per sekolah.
7. Multi format export selain Word, misalnya PDF.

## Rekomendasi Revisi Field Input

### Informasi Modul

Tambahkan:

- Tempat pengesahan.
- Tanggal pengesahan.
- Program/konteks dokumen opsional, misalnya PPG.
- NIM atau identitas tambahan penyusun opsional.

### Sarana dan Prasarana

Buat tab/section terstruktur:

- Media pembelajaran.
- Alat dan bahan.
- Sumber belajar.
- Lapangan/tempat praktik.
- Peralatan PJOK.

### Model Pembelajaran

Pisahkan:

- Model pembelajaran.
- Metode pembelajaran.
- Strategi pembelajaran berdiferensiasi.

### Aktivitas Pembelajaran

Tambahkan pada setiap fase:

- Sintaks pembelajaran.
- Diferensiasi konten.
- Diferensiasi proses.
- Diferensiasi lingkungan belajar.
- Catatan media/link/video per fase.

### Asesmen

Tambahkan:

- Tujuan rubrik individu.
- Waktu pelaksanaan rubrik individu.
- Skala nilai rubrik individu.
- Total skor praktik.
- Kriteria penilaian praktik.
- Format penilaian sikap per siswa.
- Format penilaian pengetahuan per siswa.
- Format penilaian praktik per siswa.

### Peserta Didik

Tambahkan data:

- Nama peserta didik.
- Kelas.
- Nomor urut.

Ini bisa menjadi section di Admin Guru atau Informasi Modul.

### Pengayaan dan Remedial

Tambahkan field:

- Pengayaan.
- Remedial.

## Rekomendasi Revisi Export Word

Prioritas export:

1. Ubah `Sarana dan Prasarana` menjadi tabel/list terstruktur.
2. Ubah `Model Pembelajaran` menjadi:
   - Model pembelajaran.
   - Metode pembelajaran.
   - Berdiferensiasi.
3. Masukkan sintaks pembelajaran di setiap kegiatan.
4. Ubah `Pengayaan dan Remedial` agar mengambil data dari state, bukan hardcoded.
5. Tambahkan lokasi/tanggal tanda tangan.
6. Pisahkan lampiran instrumen penilaian sebagai lampiran penuh.
7. Rapikan LKPD agar mirip format PDF.

## Prioritas Sprint Setelah Audit

Rekomendasi setelah Sprint 11:

1. **Sprint 12A - Field Kritis Dokumen Final**
   - Sarana-prasarana terstruktur.
   - Model/metode pembelajaran.
   - Pengayaan-remedial editable.
   - Lokasi/tanggal pengesahan.

2. **Sprint 12B - Penilaian dan Peserta Didik**
   - Data peserta didik.
   - Format penilaian sikap.
   - Format penilaian pengetahuan.
   - Format penilaian praktik.

3. **Sprint 12C - LKPD dan Lampiran Sesuai PDF**
   - Layout LKPD kelompok.
   - Layout LKPD individu.
   - Lampiran bahan bacaan bersubbagian.
   - Lampiran instrumen penilaian lengkap.

4. **Sprint 12D - Preview A4 dan Styling Word**
   - Preview halaman A4.
   - Styling heading/tabel lebih formal.
   - Page break lebih stabil.
   - Cover lebih mirip PDF.

## Acceptance Sprint 11

- Checklist kesesuaian terhadap PDF asli tersedia.
- Gap dokumen dipisah menjadi wajib, penting, dan opsional.
- Revisi prioritas untuk field input tersedia.
- Revisi prioritas untuk export Word tersedia.
- Audit dibuat berdasarkan isi PDF yang dibaca dengan Poppler, bukan asumsi.

Status: **Selesai**.
