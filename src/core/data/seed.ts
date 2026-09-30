import type {
  AppState,
  ClassGrade,
  LearningTopic,
  ModuleAppendices,
  ModuleAssessments,
  ModuleCompetency,
  ModuleInfo,
  ModuleLearningActivities,
  Student,
  Worksheet,
} from '../types'

const topicColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500']

const classTopics: Record<ClassGrade, string[]> = {
  1: [
    'Gerak Dasar Berjalan',
    'Gerak Dasar Berlari',
    'Gerak Dasar Melompat',
    'Permainan Sederhana',
    'Kebugaran Jasmani',
    'Aktivitas Ritmik',
  ],
  2: ['Gerak Lokomotor', 'Gerak Nonlokomotor', 'Gerak Manipulatif', 'Permainan Bola Kecil'],
  3: ['Kombinasi Gerak Dasar', 'Permainan Bola Besar', 'Senam Lantai Dasar', 'Kebugaran Tubuh'],
  4: ['Variasi Gerak Lokomotor', 'Atletik Dasar', 'Permainan Tradisional', 'Aktivitas Air Dasar'],
  5: ['Kombinasi Permainan', 'Latihan Kebugaran', 'Senam Irama', 'Keselamatan Gerak'],
  6: ['Strategi Permainan', 'Pengukuran Kebugaran', 'Senam Lantai Lanjutan', 'Pola Hidup Sehat'],
}

const topics: LearningTopic[] = Object.entries(classTopics).flatMap(([grade, titles]) =>
  titles.map((title, index) => ({
    id: `topic-${grade}-${index + 1}`,
    teacherId: 'teacher-1',
    classGrade: Number(grade) as ClassGrade,
    title,
    description: `Kelola komponen pembelajaran untuk ${title}.`,
    color: topicColors[index % topicColors.length],
  })),
)

const defaultModuleInfo: ModuleInfo = {
  academicYear: '2024/2025',
  semester: 'Ganjil',
  phase: 'C',
  subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  mainMaterial: 'Teknik Dasar Passing Bawah dalam Permainan Bola Voli',
  subMaterial: 'Passing Bawah',
  chapterMeeting: '2',
  timeAllocation: '1 Pertemuan (2 JP = 2 x 35 Menit)',
  learningMode: 'Teori dan Praktek',
  learningModel: 'Problem Based Learning',
  learningMethods: 'Ceramah, diskusi, tanya jawab, praktik, dan penugasan.',
  differentiationStrategy:
    'Pembelajaran berbasis kemampuan peserta didik dengan modifikasi tugas sesuai tingkat keterampilan individu serta penerapan visual, auditori, dan kinestetik.',
  media: 'Video pembelajaran dan PowerPoint teknik dasar passing bawah.',
  toolsAndMaterials: 'Laptop, proyektor, jaringan internet, speaker aktif, LKPD, dan alat tulis.',
  learningResources: 'YouTube, internet, buku guru, dan buku siswa.',
  practiceArea: 'Lapangan bola voli sekolah atau lapangan sejenisnya.',
  sportEquipment: 'Bola voli, net bola voli, cone pembatas, dan peluit.',
  enrichment:
    'Peserta didik membantu teman yang belum tuntas melalui tutor sebaya dan mempelajari materi dari berbagai sumber untuk disajikan dalam laporan singkat.',
  remedial:
    'Peserta didik yang belum tuntas mengulang materi pokok di luar jam tatap muka dan mendapat penugasan latihan terarah.',
  approvalPlace: 'Sangau',
  approvalDate: '30 Oktober 2024',
  studentCount: 17,
  targetStudents:
    'Peserta didik dengan kemampuan bervariasi, mulai dari yang belum pernah mempelajari materi hingga yang sudah memiliki dasar.',
}

const defaultModuleCompetency: ModuleCompetency = {
  initialCompetency:
    'Peserta didik dapat menjelaskan teknik dasar passing bawah dalam permainan bola voli.',
  pancasilaProfiles: [
    'Mandiri: peserta didik dapat menerapkan sikap tanggung jawab untuk berlatih teknik passing bawah dengan benar.',
    'Gotong Royong: peserta didik dapat melatih kerja sama dalam tim saat melakukan passing bawah.',
  ],
  learningAchievements:
    'Peserta didik dapat mempraktikkan dan menunjukkan kemampuan teknik passing bawah di dalam permainan bola voli dengan benar.',
  meaningfulUnderstanding:
    'Melalui penguasaan passing bawah, peserta didik dapat mengaplikasikan keterampilan ini untuk berkontribusi dalam permainan bola voli tim.',
  triggerQuestions: [
    'Apakah peserta didik sudah sarapan?',
    'Bagaimana cara melakukan passing bawah dalam permainan bola voli?',
    'Apakah ada kesulitan saat melakukan passing bawah dalam permainan bola voli?',
  ],
  diagnosticQuestions: [
    'Bagaimana kabar peserta didik hari ini?',
    'Apakah sebelum berangkat ke sekolah semua peserta didik sudah sarapan?',
  ],
  affectivePreparation:
    'Peserta didik dapat menunjukkan sikap tanggung jawab, kerja sama, dan sportifitas selama kegiatan belajar mengajar.',
  cognitivePreparation:
    'Peserta didik dapat memahami dan menjelaskan teknik dasar passing bawah dalam permainan bola voli.',
  psychomotorPreparation:
    'Peserta didik mampu melakukan dan mempraktikkan gerakan passing bawah dengan teknik yang benar secara individu maupun kelompok.',
}

const defaultModuleActivities: ModuleLearningActivities = {
  opening: {
    title: 'Pendahuluan',
    durationMinutes: 10,
    steps:
      'Guru memberi salam, memimpin doa, mengecek kehadiran, menanyakan kondisi peserta didik, menyampaikan tujuan pembelajaran, dan mengaitkan materi dengan pengalaman bermain bola voli.',
  },
  core: {
    title: 'Inti',
    durationMinutes: 50,
    steps:
      'Peserta didik mengamati contoh gerakan passing bawah, mendiskusikan posisi tubuh dan ayunan lengan, berlatih gerakan tanpa bola, berlatih berpasangan menggunakan bola, lalu melakukan permainan sederhana untuk menerapkan teknik passing bawah.',
  },
  closing: {
    title: 'Penutup',
    durationMinutes: 10,
    steps:
      'Guru memandu pendinginan, mengajak peserta didik menyampaikan kesulitan latihan, memberi umpan balik, menyimpulkan materi, dan menyampaikan tindak lanjut latihan mandiri.',
  },
  contentDifferentiation:
    'Peserta didik yang membutuhkan bantuan mendapat contoh gerakan bertahap, sedangkan peserta didik yang sudah mampu diberi variasi arah dan jarak passing.',
  processDifferentiation:
    'Latihan dilakukan secara individu, berpasangan, dan kelompok kecil agar peserta didik dapat belajar sesuai kesiapan motoriknya.',
  environmentDifferentiation:
    'Area latihan dibagi menjadi beberapa pos dengan jarak aman, menggunakan lapangan sekolah dan alat sederhana yang tersedia.',
  teacherReflection:
    'Apakah instruksi, demonstrasi, dan pembagian kelompok sudah membantu seluruh peserta didik memahami teknik passing bawah?',
  studentReflection:
    'Bagian gerakan mana yang paling mudah dilakukan dan bagian mana yang masih perlu dilatih kembali?',
}

const defaultModuleAssessments: ModuleAssessments = {
  diagnosticAssessment:
    'Guru mengajukan pertanyaan non-kognitif tentang kondisi peserta didik dan pengalaman awal bermain bola voli sebelum pembelajaran dimulai.',
  formativeAssessment:
    'Guru mengamati proses latihan passing bawah saat peserta didik berlatih individu, berpasangan, dan kelompok kecil.',
  summativeAssessment:
    'Peserta didik mempraktikkan teknik passing bawah dalam permainan sederhana dan dinilai berdasarkan sikap, pengetahuan, serta keterampilan praktik.',
  groupRubricContext:
    'Diskusikan jawaban bersama kelompok. Jelaskan langkah teknik passing bawah dan alasan penggunaan posisi tubuh yang benar secara runtut.',
  teacherNotes:
    '<ul><li>Berikan umpan balik langsung pada aspek yang perlu diperbaiki.</li><li>Berikan pujian pada aspek yang sudah dilakukan dengan baik untuk memotivasi peserta didik.</li></ul>',
  individualRubricObjective:
    'Menilai kemampuan peserta didik memahami konsep dasar passing bawah setelah pembelajaran teori.',
  individualRubricTiming: 'Setelah penjelasan di kelas selama kegiatan inti.',
  individualScoreScale:
    '5 jawaban benar: Nilai 100 (Sangat Baik)\n4 jawaban benar: Nilai 80 (Baik)\n3 jawaban benar: Nilai 60 (Cukup)\n2 jawaban benar: Nilai 40 (Perlu Peningkatan)\n1 atau tidak ada jawaban benar: Nilai 20 (Perlu Bimbingan)',
  practiceObjective: 'Mengukur keterampilan peserta didik dalam melakukan passing bawah pada akhir pembelajaran.',
  practiceTiming: 'Dilaksanakan pada akhir sesi praktik sebagai bagian dari asesmen sumatif.',
  practiceTask: 'Mempraktikkan teknik passing bawah dalam permainan bola voli.',
  practiceTotalScore: 50,
  practiceCriteria:
    'Sangat Baik: 45-50\nBaik: 40-44\nCukup: 35-39\nPerlu Perbaikan: <35',
  studentSelfReflection:
    'Peserta didik menulis refleksi: kesulitan terbesar saat mempelajari passing bawah, cara mengatasinya, dan hal yang dipelajari dari proses latihan.',
  groupRubric: [
    {
      id: 'rubric-group-1',
      aspect: 'Kerja sama kelompok',
      excellent: 'Seluruh anggota aktif, saling membantu, dan menjaga komunikasi selama permainan.',
      good: 'Sebagian besar anggota aktif dan bekerja sama dengan baik.',
      fair: 'Kerja sama muncul sesekali tetapi belum konsisten.',
      needsImprovement: 'Kelompok belum menunjukkan kerja sama yang baik.',
    },
    {
      id: 'rubric-group-2',
      aspect: 'Sportivitas',
      excellent: 'Selalu menghargai teman, aturan, dan hasil permainan.',
      good: 'Umumnya menghargai teman dan mengikuti aturan.',
      fair: 'Masih perlu diingatkan untuk mengikuti aturan.',
      needsImprovement: 'Sering mengabaikan aturan dan arahan guru.',
    },
  ],
  individualRubric: [
    {
      id: 'rubric-individual-1',
      aspect: 'Posisi tubuh',
      excellent: 'Posisi kaki, lutut, dan badan sangat sesuai saat melakukan passing bawah.',
      good: 'Posisi tubuh cukup sesuai dengan sedikit koreksi.',
      fair: 'Posisi tubuh masih kurang stabil.',
      needsImprovement: 'Posisi tubuh belum sesuai teknik dasar.',
    },
    {
      id: 'rubric-individual-2',
      aspect: 'Kontak bola',
      excellent: 'Bola mengenai lengan bawah dengan arah pantulan terkontrol.',
      good: 'Kontak bola cukup baik dan arah pantulan cukup terkontrol.',
      fair: 'Kontak bola belum konsisten.',
      needsImprovement: 'Kontak bola belum tepat pada lengan bawah.',
    },
  ],
  attitudeScores: [
    { id: 'score-attitude-1', aspect: 'Disiplin mengikuti instruksi', maxScore: 4 },
    { id: 'score-attitude-2', aspect: 'Kerja sama dan sportivitas', maxScore: 4 },
  ],
  knowledgeScores: [
    { id: 'score-knowledge-1', aspect: 'Menjelaskan posisi awal passing bawah', maxScore: 4 },
    { id: 'score-knowledge-2', aspect: 'Menyebutkan kesalahan umum saat passing bawah', maxScore: 4 },
  ],
  practiceScores: [
    { id: 'score-practice-1', aspect: 'Sikap awal dan posisi badan', maxScore: 4 },
    { id: 'score-practice-2', aspect: 'Perkenaan bola pada lengan bawah', maxScore: 4 },
    { id: 'score-practice-3', aspect: 'Arah dan kontrol pantulan bola', maxScore: 4 },
  ],
}

const defaultWorksheets: Worksheet[] = [
  {
    id: 'worksheet-group-1',
    type: 'Berkelompok',
    title: 'LKPD Kelompok Passing Bawah',
    instructions:
      'Bekerjalah dalam kelompok kecil. Amati gerakan teman saat melakukan passing bawah, lalu diskusikan hasil pengamatan dengan santun.',
    questions:
      '1. Apa posisi kaki yang paling stabil saat melakukan passing bawah?\n2. Bagaimana cara menjaga arah pantulan bola tetap terkontrol?\n3. Apa bentuk kerja sama yang dibutuhkan dalam latihan kelompok?',
    answerArea:
      'Tuliskan hasil diskusi kelompok pada kolom jawaban, lalu pilih satu perwakilan untuk menyampaikan kesimpulan.',
    answerKey:
      'Posisi kaki dibuka selebar bahu, lutut ditekuk, lengan lurus rapat, pandangan mengikuti arah bola, dan komunikasi kelompok dilakukan secara jelas.',
  },
  {
    id: 'worksheet-individual-1',
    type: 'Individu',
    title: 'LKPD Individu Refleksi Passing Bawah',
    instructions:
      'Jawablah pertanyaan berikut berdasarkan pengalaman latihan pribadi setelah mempraktikkan passing bawah.',
    questions:
      '1. Bagian gerakan apa yang sudah dapat kamu lakukan dengan baik?\n2. Bagian gerakan apa yang masih perlu kamu latih?\n3. Apa rencana latihanmu agar passing bawah menjadi lebih baik?',
    answerArea:
      'Peserta didik menuliskan refleksi pribadi minimal tiga kalimat dan menyampaikan satu target perbaikan.',
    answerKey:
      'Jawaban menyesuaikan pengalaman peserta didik, tetapi harus memuat kekuatan, kesulitan, dan rencana perbaikan yang relevan.',
  },
]

const defaultModuleAppendices: ModuleAppendices = {
  readingMaterials:
    'Passing bawah adalah teknik dasar dalam permainan bola voli untuk menerima, mengoper, atau mengarahkan bola menggunakan kedua lengan bagian bawah.',
  readingSections: [
    {
      id: 'reading-1',
      title: 'Pengertian Passing Bawah',
      content:
        'Passing bawah adalah salah satu teknik dasar dalam permainan bola voli untuk menerima atau mengarahkan bola yang datang dari lawan. Teknik ini dilakukan menggunakan lengan bawah.',
    },
    {
      id: 'reading-2',
      title: 'Langkah-Langkah Passing Bawah',
      content:
        'Berdiri dengan kaki dibuka selebar bahu, lutut sedikit ditekuk, kedua tangan dirapatkan, pandangan fokus pada bola, lalu arahkan pantulan bola dengan kontrol lengan dan dorongan kaki.',
    },
    {
      id: 'reading-3',
      title: 'Gerak Dasar dalam Bola Voli',
      content:
        'Gerak lokomotor meliputi berlari dan melompat, gerak non-lokomotor meliputi membungkuk dan mengayun tangan, sedangkan gerak manipulatif meliputi mengontrol bola melalui servis, passing, dan smash.',
    },
  ],
  customSections: [],
  learningMedia:
    'Bola voli, peluit, cone pembatas, lapangan sekolah, gambar urutan gerak passing bawah, dan video demonstrasi teknik dasar.',
  assessmentInstruments:
    'Lembar observasi sikap, lembar penilaian pengetahuan, lembar penilaian praktik passing bawah, serta rubrik kerja kelompok.',
  glossary: [
    {
      id: 'glossary-1',
      term: 'Passing bawah',
      definition: 'Teknik mengoper bola dengan kedua lengan bagian bawah.',
    },
    {
      id: 'glossary-2',
      term: 'Sportivitas',
      definition: 'Sikap jujur, adil, dan menghargai aturan dalam kegiatan olahraga.',
    },
  ],
  files: [],
}

const defaultStudents: Student[] = [
  'Adinda Rikardo',
  'Afaafa Walgina Yusra',
  'Dayu Ramadhan',
  'Detri Oriza',
  'Firman Alfaqih',
  'Hasbi Alfarizi',
  'Haura Nasifa',
  'Khoirul Hafidzh',
  'M. Haikal',
  'Ruby Noor Erika Putri',
  'Salsabila Assyfa',
  'Salwa Savaira',
  'Satria Anaqi',
  'Shanes Khairani',
  'Virgie Lorence S',
  'Yuda Iwansyah',
  'Zazan Revano Alyusran',
].map((name, index) => ({
  id: `student-1-${index + 1}`,
  teacherId: 'teacher-1',
  classGrade: 1,
  name,
  orderNumber: index + 1,
}))

export const initialState: AppState = {
  teacher: {
    id: 'teacher-1',
    name: 'Pak Budi',
    email: 'budi@sekolah.test',
    identityNumber: '201699401665',
    identityType: 'No UKG',
    subject: 'PJOK',
    classes: [1, 2, 3, 4, 5, 6],
    schoolName: 'SD Negeri 009 Sangau',
    principalName: 'Sri Yustina, S.Pd',
    principalNip: '19820206 200801 2 007',
    institutionName: 'Universitas Bengkulu',
    institutionLogoUrl: '',
  },
  teachers: [
    {
      id: 'teacher-1',
      name: 'Pak Budi',
      email: 'budi@sekolah.test',
      identityNumber: '201699401665',
      identityType: 'No UKG',
      subject: 'PJOK',
      classes: [1, 2, 3, 4, 5, 6],
      schoolName: 'SD Negeri 009 Sangau',
      principalName: 'Sri Yustina, S.Pd',
      principalNip: '19820206 200801 2 007',
      institutionName: 'Universitas Bengkulu',
      institutionLogoUrl: '',
    },
  ],
  activeTeacherId: 'teacher-1',
  school: {
    name: 'SD Negeri 009 Sangau',
    principalName: 'Sri Yustina, S.Pd',
    principalNip: '19820206 200801 2 007',
  },
  students: defaultStudents,
  moduleInfo: {
    'topic-1-1': defaultModuleInfo,
  },
  moduleCompetencies: {
    'topic-1-1': defaultModuleCompetency,
  },
  moduleActivities: {
    'topic-1-1': defaultModuleActivities,
  },
  moduleAssessments: {
    'topic-1-1': defaultModuleAssessments,
  },
  moduleWorksheets: {
    'topic-1-1': defaultWorksheets,
  },
  moduleAppendices: {
    'topic-1-1': defaultModuleAppendices,
  },
  topics,
  objectives: [
    {
      id: 'objective-1',
      topicId: 'topic-1-1',
      title: 'Koordinasi gerak berjalan',
      description: 'Siswa dapat melakukan gerak berjalan dengan koordinasi yang baik.',
    },
    {
      id: 'objective-2',
      topicId: 'topic-1-1',
      title: 'Keseimbangan saat berjalan',
      description: 'Siswa dapat menjaga keseimbangan saat berjalan.',
    },
    {
      id: 'objective-3',
      topicId: 'topic-1-1',
      title: 'Variasi arah dan kecepatan',
      description: 'Siswa dapat berjalan dengan variasi arah dan kecepatan.',
    },
  ],
  materials: [
    {
      id: 'material-1',
      topicId: 'topic-1-1',
      title: 'Teknik Berjalan yang Benar',
      description: 'Posisi tubuh tegak, pandangan ke depan, ayunan lengan alami, dan langkah teratur.',
      videoUrl: 'https://www.youtube.com/watch?v=contoh1234',
    },
  ],
  activities: [
    {
      id: 'activity-1',
      topicId: 'topic-1-1',
      name: 'Lintasan Jalan Berarah',
      steps: 'Pemanasan, berjalan mengikuti garis, variasi arah, pendinginan, refleksi singkat.',
      durationMinutes: 35,
    },
  ],
  assessments: [
    {
      id: 'assessment-1',
      topicId: 'topic-1-1',
      type: 'Formatif',
      description: 'Observasi koordinasi langkah, keseimbangan, dan kepatuhan pada instruksi.',
    },
  ],
  drafts: [],
}
