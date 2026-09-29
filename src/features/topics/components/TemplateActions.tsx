import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { Copy, Wand2 } from 'lucide-react'
import type {
  AppState,
  Assessment,
  LearningActivity,
  LearningMaterial,
  LearningObjective,
  LearningTopic,
  ModuleAppendices,
  ModuleAssessments,
  ModuleCompetency,
  ModuleInfo,
  ModuleLearningActivities,
  Worksheet,
} from '../../../core/types'
import { createId } from '../../../core/utils'
import { confirmDelete } from '../../../shared/utils/confirmDelete'

export function TemplateActions({
  selectedTopic,
  setState,
  state,
}: {
  selectedTopic: LearningTopic
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [sourceTopicId, setSourceTopicId] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const sourceOptions = state.topics.filter((topic) => topic.teacherId === selectedTopic.teacherId && topic.id !== selectedTopic.id)

  function applyQuickTemplate() {
    setState((current) => applyPjokTemplate(current, selectedTopic))
  }

  function duplicateFromTopic() {
    const sourceTopic = state.topics.find((topic) => topic.id === sourceTopicId)
    if (!sourceTopic) return
    if (!confirmDelete(`Ganti data Modul Ajar "${selectedTopic.title}" dengan salinan dari "${sourceTopic.title}"?`)) return
    setState((current) => duplicateModuleData(current, sourceTopic.id, selectedTopic.id))
  }

  return (
    <section className="rounded-md border border-blue-100 bg-blue-50">
      <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-blue-800" onClick={() => setIsOpen((current) => !current)} type="button">
        <span className="flex items-center gap-2">
          <Wand2 size={14} />
          Template & Duplikasi
        </span>
        <span className="text-xs font-medium text-blue-600">{isOpen ? 'Tutup' : 'Buka'}</span>
      </button>
      {isOpen && (
        <div className="grid gap-3 border-t border-blue-100 p-3">
          <div>
            <p className="mb-1.5 text-[11px] text-slate-600">Isi bagian kosong tanpa menimpa data.</p>
            <button className="btn-primary h-9 w-full justify-center px-3 text-sm" onClick={applyQuickTemplate} type="button">
              <Wand2 size={14} />
              Terapkan Template
            </button>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500" htmlFor="duplicate-topic-source">
              Duplikasi dari topik lain
            </label>
            <div className="grid gap-2">
              <select className="input h-9 text-sm" id="duplicate-topic-source" onChange={(event) => setSourceTopicId(event.target.value)} value={sourceTopicId}>
                <option value="">Pilih sumber topik</option>
                {sourceOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    Kelas {topic.classGrade} - {topic.title}
                  </option>
                ))}
              </select>
              <button className="btn-secondary h-9 w-full justify-center px-3 text-sm" disabled={!sourceTopicId} onClick={duplicateFromTopic} title="Data tujuan akan diganti dengan salinan baru." type="button">
                <Copy size={14} />
                Duplikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function applyPjokTemplate(state: AppState, topic: LearningTopic): AppState {
  const info = state.moduleInfo[topic.id]
  const competency = state.moduleCompetencies[topic.id]
  const assessments = state.moduleAssessments[topic.id]
  const appendices = state.moduleAppendices[topic.id]

  return {
    ...state,
    moduleInfo: {
      ...state.moduleInfo,
      [topic.id]: mergeTextFields(info, getTemplateInfo(topic)),
    },
    moduleCompetencies: {
      ...state.moduleCompetencies,
      [topic.id]: {
        ...getTemplateCompetency(topic),
        ...competency,
        pancasilaProfiles: competency?.pancasilaProfiles.length ? competency.pancasilaProfiles : getTemplateCompetency(topic).pancasilaProfiles,
        triggerQuestions: competency?.triggerQuestions.length ? competency.triggerQuestions : getTemplateCompetency(topic).triggerQuestions,
        diagnosticQuestions: competency?.diagnosticQuestions.length ? competency.diagnosticQuestions : getTemplateCompetency(topic).diagnosticQuestions,
      },
    },
    moduleActivities: {
      ...state.moduleActivities,
      [topic.id]: state.moduleActivities[topic.id] ?? getTemplateActivities(topic),
    },
    moduleAssessments: {
      ...state.moduleAssessments,
      [topic.id]: {
        ...mergeTextFields(assessments, getTemplateAssessments()),
        groupRubric: assessments?.groupRubric.length ? assessments.groupRubric : getTemplateAssessments().groupRubric,
        individualRubric: assessments?.individualRubric.length ? assessments.individualRubric : getTemplateAssessments().individualRubric,
        attitudeScores: assessments?.attitudeScores.length ? assessments.attitudeScores : getTemplateAssessments().attitudeScores,
        knowledgeScores: assessments?.knowledgeScores.length ? assessments.knowledgeScores : getTemplateAssessments().knowledgeScores,
        practiceScores: assessments?.practiceScores.length ? assessments.practiceScores : getTemplateAssessments().practiceScores,
      },
    },
    moduleWorksheets: {
      ...state.moduleWorksheets,
      [topic.id]: state.moduleWorksheets[topic.id]?.length ? state.moduleWorksheets[topic.id] : getTemplateWorksheets(topic),
    },
    moduleAppendices: {
      ...state.moduleAppendices,
      [topic.id]: {
        ...mergeTextFields(appendices, getTemplateAppendices(topic)),
        readingSections: appendices?.readingSections.length ? appendices.readingSections : getTemplateAppendices(topic).readingSections,
        customSections: appendices?.customSections ?? [],
        glossary: appendices?.glossary.length ? appendices.glossary : getTemplateAppendices(topic).glossary,
        files: appendices?.files ?? [],
      },
    },
    objectives: state.objectives.some((item) => item.topicId === topic.id)
      ? state.objectives
      : [...getTemplateObjectives(topic), ...state.objectives],
    materials: state.materials.some((item) => item.topicId === topic.id)
      ? state.materials
      : [...getTemplateMaterials(topic), ...state.materials],
    activities: state.activities.some((item) => item.topicId === topic.id)
      ? state.activities
      : [...getTemplateAdditionalActivities(topic), ...state.activities],
    assessments: state.assessments.some((item) => item.topicId === topic.id)
      ? state.assessments
      : [...getTemplateLegacyAssessments(topic), ...state.assessments],
  }
}

function duplicateModuleData(state: AppState, sourceTopicId: string, targetTopicId: string): AppState {
  return {
    ...state,
    moduleInfo: cloneRecord(state.moduleInfo, sourceTopicId, targetTopicId),
    moduleCompetencies: cloneRecord(state.moduleCompetencies, sourceTopicId, targetTopicId),
    moduleActivities: cloneRecord(state.moduleActivities, sourceTopicId, targetTopicId),
    moduleAssessments: cloneRecord(state.moduleAssessments, sourceTopicId, targetTopicId),
    moduleAppendices: cloneRecord(state.moduleAppendices, sourceTopicId, targetTopicId),
    moduleWorksheets: {
      ...state.moduleWorksheets,
      [targetTopicId]: (state.moduleWorksheets[sourceTopicId] ?? []).map((item) => ({ ...item, id: createId('worksheet') })),
    },
    objectives: replaceTopicItems(state.objectives, sourceTopicId, targetTopicId, 'objective'),
    materials: replaceTopicItems(state.materials, sourceTopicId, targetTopicId, 'material'),
    activities: replaceTopicItems(state.activities, sourceTopicId, targetTopicId, 'activity'),
    assessments: replaceTopicItems(state.assessments, sourceTopicId, targetTopicId, 'assessment'),
    drafts: state.drafts.filter((draft) => draft.topicId !== targetTopicId),
  }
}

function cloneRecord<T>(record: Record<string, T>, sourceTopicId: string, targetTopicId: string): Record<string, T> {
  const sourceValue = record[sourceTopicId]
  if (!sourceValue) {
    const nextRecord = { ...record }
    delete nextRecord[targetTopicId]
    return nextRecord
  }

  return {
    ...record,
    [targetTopicId]: structuredClone(sourceValue),
  }
}

function replaceTopicItems<T extends { id: string; topicId: string }>(items: T[], sourceTopicId: string, targetTopicId: string, prefix: string): T[] {
  return [
    ...items.filter((item) => item.topicId !== targetTopicId),
    ...items.filter((item) => item.topicId === sourceTopicId).map((item) => ({ ...structuredClone(item), id: createId(prefix), topicId: targetTopicId })),
  ]
}

function mergeTextFields<T extends Record<string, unknown> | undefined>(current: T, template: NonNullable<T>) {
  return Object.fromEntries(
    Object.entries(template).map(([key, value]) => {
      const currentValue = current?.[key]
      return [key, Array.isArray(currentValue) ? currentValue : currentValue || value]
    }),
  ) as NonNullable<T>
}

function getTemplateInfo(topic: LearningTopic): ModuleInfo {
  return {
    academicYear: '2024/2025',
    semester: 'Ganjil',
    phase: topic.classGrade >= 5 ? 'C' : topic.classGrade >= 3 ? 'B' : 'A',
    subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    mainMaterial: topic.title,
    subMaterial: topic.title,
    chapterMeeting: '1',
    timeAllocation: '1 Pertemuan (2 JP = 2 x 35 Menit)',
    learningMode: 'Teori dan Praktek',
    learningModel: 'Problem Based Learning',
    learningMethods: 'Ceramah, diskusi, tanya jawab, praktik, permainan sederhana, dan penugasan.',
    differentiationStrategy: 'Tugas dimodifikasi sesuai kesiapan gerak peserta didik melalui dukungan visual, auditori, dan kinestetik.',
    media: 'Gambar gerak, video pembelajaran, dan contoh demonstrasi guru.',
    toolsAndMaterials: 'Peluit, cone pembatas, LKPD, alat tulis, dan perangkat presentasi jika diperlukan.',
    learningResources: 'Buku guru, buku siswa, video pembelajaran PJOK, dan pengalaman gerak peserta didik.',
    practiceArea: 'Lapangan sekolah atau area aman yang sesuai dengan aktivitas gerak.',
    sportEquipment: 'Bola, cone, peluit, dan perlengkapan PJOK yang relevan dengan topik.',
    enrichment: 'Peserta didik yang sudah tuntas diberi variasi tantangan gerak dan membantu teman melalui tutor sebaya.',
    remedial: 'Peserta didik yang belum tuntas mendapat demonstrasi ulang, latihan bertahap, dan umpan balik individual.',
    approvalPlace: 'Sangau',
    approvalDate: 'Tanggal pengesahan',
    studentCount: 17,
    targetStudents: `Peserta didik kelas ${topic.classGrade} dengan kemampuan gerak yang bervariasi.`,
  }
}

function getTemplateCompetency(topic: LearningTopic): ModuleCompetency {
  return {
    initialCompetency: `Peserta didik mengenal gerak dasar yang berkaitan dengan ${topic.title}.`,
    pancasilaProfiles: [
      'Mandiri: peserta didik bertanggung jawab mengikuti latihan sesuai kemampuan.',
      'Gotong Royong: peserta didik bekerja sama dan menghargai teman selama aktivitas PJOK.',
    ],
    learningAchievements: `Peserta didik dapat memahami dan mempraktikkan keterampilan gerak pada topik ${topic.title} dengan benar dan aman.`,
    meaningfulUnderstanding: `Keterampilan ${topic.title} membantu peserta didik bergerak lebih percaya diri, sehat, dan mampu bekerja sama dalam aktivitas jasmani.`,
    triggerQuestions: [`Apa pengalaman kalian saat melakukan ${topic.title}?`, 'Bagian gerakan apa yang menurut kalian paling sulit?', 'Bagaimana cara membantu teman saat latihan?'],
    diagnosticQuestions: ['Bagaimana kondisi tubuh kalian hari ini?', 'Apakah kalian siap mengikuti aktivitas gerak?', 'Apakah ada bagian tubuh yang terasa sakit?'],
    affectivePreparation: 'Peserta didik menunjukkan disiplin, percaya diri, kerja sama, dan sportivitas.',
    cognitivePreparation: `Peserta didik memahami tujuan, aturan, dan langkah dasar ${topic.title}.`,
    psychomotorPreparation: `Peserta didik mempraktikkan gerak ${topic.title} secara bertahap sesuai instruksi guru.`,
  }
}

function getTemplateActivities(topic: LearningTopic): ModuleLearningActivities {
  return {
    opening: {
      title: 'Pendahuluan',
      durationMinutes: 10,
      steps: 'Guru memberi salam, memimpin doa, mengecek kehadiran, melakukan apersepsi, menyampaikan tujuan pembelajaran, dan memotivasi peserta didik.',
    },
    core: {
      title: 'Inti',
      durationMinutes: 50,
      steps: `<h3>Eksplorasi konsep dan demonstrasi</h3>
<ul>
  <li>Guru menjelaskan konsep dasar ${topic.title}, tujuan latihan, aturan keselamatan, dan contoh penerapannya dalam aktivitas PJOK.</li>
  <li>Peserta didik mengamati demonstrasi gerak melalui contoh langsung, gambar, atau video pembelajaran.</li>
  <li>Guru mengajukan pertanyaan untuk menggali pemahaman awal peserta didik.</li>
</ul>
<h3>Diferensiasi Konten</h3>
<ul>
  <li>Materi disajikan melalui penjelasan lisan, contoh visual, dan demonstrasi gerak secara bertahap.</li>
  <li>Peserta didik dapat mengamati gambar atau video sebelum mencoba gerakan.</li>
</ul>
<h3>Latihan dan praktik</h3>
<ul>
  <li>Peserta didik berlatih secara individu untuk mengenali urutan gerak.</li>
  <li>Peserta didik berlatih berpasangan atau dalam kelompok kecil dengan pengawasan guru.</li>
  <li>Guru mengamati proses, memberi umpan balik langsung, dan mengingatkan teknik yang aman.</li>
</ul>
<h3>Diferensiasi Proses</h3>
<ul>
  <li>Peserta didik yang membutuhkan bantuan mendapat contoh ulang, tempo latihan lebih lambat, dan bimbingan tambahan.</li>
  <li>Peserta didik yang sudah siap mendapat variasi tantangan sesuai kemampuannya.</li>
</ul>
<h3>Penerapan dalam permainan sederhana</h3>
<ul>
  <li>Peserta didik menerapkan keterampilan ${topic.title} dalam permainan atau tantangan kelompok sederhana.</li>
  <li>Peserta didik menunjukkan kerja sama, disiplin, dan sportivitas selama kegiatan.</li>
</ul>
<h3>Diferensiasi Lingkungan Belajar</h3>
<ul>
  <li>Area latihan dibagi menjadi beberapa pos aman dengan jarak, alat, dan pasangan latihan yang disesuaikan.</li>
</ul>`,
    },
    closing: {
      title: 'Penutup',
      durationMinutes: 10,
      steps: 'Guru memandu pendinginan, refleksi, penguatan materi, penilaian singkat, dan menyampaikan tindak lanjut latihan.',
    },
    contentDifferentiation: '',
    processDifferentiation: '',
    environmentDifferentiation: '',
    teacherReflection: 'Apakah kegiatan, instruksi, dan diferensiasi sudah membantu peserta didik mencapai tujuan pembelajaran?',
    studentReflection: 'Apa gerakan yang sudah bisa dilakukan dan apa yang masih perlu dilatih?',
  }
}

function getTemplateAssessments(): ModuleAssessments {
  return {
    diagnosticAssessment: 'Pertanyaan awal tentang kondisi peserta didik, kesiapan belajar, dan pengalaman gerak sebelumnya.',
    formativeAssessment: 'Observasi proses latihan, kedisiplinan, kerja sama, dan kemampuan mengikuti instruksi.',
    summativeAssessment: 'Praktik keterampilan gerak sesuai topik dan refleksi hasil belajar peserta didik.',
    groupRubricContext: 'Kelompok mendiskusikan langkah gerak, alasan teknik yang tepat, dan cara menjaga keselamatan saat praktik.',
    teacherNotes: '<ul><li>Berikan umpan balik langsung pada bagian yang perlu diperbaiki.</li><li>Berikan pujian pada kemajuan dan kerja sama peserta didik.</li></ul>',
    individualRubricObjective: 'Menilai pemahaman dan keterampilan individu setelah pembelajaran.',
    individualRubricTiming: 'Dilaksanakan setelah penjelasan dan latihan inti.',
    individualScoreScale: 'Sangat mahir: 100\nMahir: 80\nSudah berkembang: 60\nBerkembang: 40\nPerlu bimbingan: 20',
    practiceObjective: 'Mengukur keterampilan peserta didik dalam mempraktikkan gerak sesuai topik pembelajaran.',
    practiceTiming: 'Dilaksanakan pada akhir kegiatan praktik.',
    practiceTask: 'Mempraktikkan gerak sesuai topik pembelajaran dengan teknik yang benar dan aman.',
    practiceTotalScore: 50,
    practiceCriteria: 'Sangat Baik: 45-50\nBaik: 40-44\nCukup: 35-39\nPerlu Perbaikan: <35',
    studentSelfReflection: 'Peserta didik menulis pengalaman belajar, kesulitan yang dihadapi, cara mengatasinya, dan rencana latihan berikutnya.',
    groupRubric: [
      { id: createId('rubric'), aspect: 'Kerja sama', excellent: 'Aktif membantu dan berkomunikasi jelas.', good: 'Bekerja sama dengan baik.', fair: 'Kerja sama belum konsisten.', needsImprovement: 'Perlu bimbingan dalam kerja sama.' },
      { id: createId('rubric'), aspect: 'Sportivitas', excellent: 'Selalu menghargai teman dan aturan.', good: 'Umumnya mengikuti aturan.', fair: 'Kadang perlu diingatkan.', needsImprovement: 'Sering mengabaikan aturan.' },
    ],
    individualRubric: [
      { id: createId('rubric'), aspect: 'Sikap awal', excellent: 'Posisi tubuh sangat siap dan stabil.', good: 'Posisi tubuh cukup siap.', fair: 'Posisi tubuh kurang stabil.', needsImprovement: 'Belum menunjukkan sikap awal yang tepat.' },
      { id: createId('rubric'), aspect: 'Koordinasi gerak', excellent: 'Koordinasi gerak sangat baik.', good: 'Koordinasi cukup baik.', fair: 'Koordinasi belum konsisten.', needsImprovement: 'Perlu latihan koordinasi dasar.' },
    ],
    attitudeScores: [
      { id: createId('score'), aspect: 'Disiplin mengikuti instruksi', maxScore: 4 },
      { id: createId('score'), aspect: 'Percaya diri dalam praktik', maxScore: 4 },
    ],
    knowledgeScores: [
      { id: createId('score'), aspect: 'Menjelaskan tujuan gerak', maxScore: 4 },
      { id: createId('score'), aspect: 'Menyebutkan langkah gerak', maxScore: 4 },
    ],
    practiceScores: [
      { id: createId('score'), aspect: 'Sikap awal dan posisi tubuh', maxScore: 10 },
      { id: createId('score'), aspect: 'Koordinasi gerakan', maxScore: 10 },
      { id: createId('score'), aspect: 'Kontrol dan konsistensi gerak', maxScore: 10 },
    ],
  }
}

function getTemplateWorksheets(topic: LearningTopic): Worksheet[] {
  return [
    {
      id: createId('worksheet'),
      type: 'Berkelompok',
      title: `LKPD Kelompok ${topic.title}`,
      instructions: 'Diskusikan bersama kelompok dan amati gerakan teman saat praktik.',
      questions: `1. Apa langkah utama dalam ${topic.title}?\n2. Kesalahan apa yang perlu dihindari?\n3. Bagaimana kelompok membantu teman yang kesulitan?`,
      answerArea: 'Tuliskan hasil diskusi kelompok pada bagian jawaban.',
      answerKey: 'Jawaban memuat langkah gerak, kesalahan umum, dan bentuk kerja sama kelompok.',
    },
    {
      id: createId('worksheet'),
      type: 'Individu',
      title: `LKPD Individu ${topic.title}`,
      instructions: 'Jawab berdasarkan pengalaman praktik pribadi.',
      questions: '1. Gerakan apa yang sudah kamu kuasai?\n2. Gerakan apa yang masih sulit?\n3. Apa rencana latihan berikutnya?',
      answerArea: 'Tuliskan refleksi pribadi minimal tiga kalimat.',
      answerKey: 'Jawaban memuat kekuatan, kesulitan, dan rencana perbaikan.',
    },
  ]
}

function getTemplateAppendices(topic: LearningTopic): ModuleAppendices {
  return {
    readingMaterials: `Bahan bacaan tentang ${topic.title}.`,
    readingSections: [
      { id: createId('reading'), title: `Pengertian ${topic.title}`, content: `${topic.title} adalah materi PJOK yang membantu peserta didik mengembangkan keterampilan gerak, kebugaran, dan sikap sportif.` },
      { id: createId('reading'), title: 'Langkah Pembelajaran Gerak', content: 'Gerak dilakukan secara bertahap mulai dari pemanasan, demonstrasi, latihan individu, latihan kelompok, permainan sederhana, pendinginan, dan refleksi.' },
    ],
    customSections: [],
    learningMedia: 'Gambar gerak, video pembelajaran, demonstrasi guru, dan alat PJOK yang relevan.',
    assessmentInstruments: 'Instrumen penilaian mencakup observasi sikap, pengetahuan, praktik, rubrik kelompok, dan rubrik individu.',
    glossary: [
      { id: createId('glossary'), term: 'Sportivitas', definition: 'Sikap jujur, adil, dan menghargai aturan dalam kegiatan olahraga.' },
      { id: createId('glossary'), term: 'Koordinasi', definition: 'Kerja sama antarbagian tubuh untuk menghasilkan gerakan yang teratur.' },
    ],
    files: [],
  }
}

function getTemplateObjectives(topic: LearningTopic): LearningObjective[] {
  return [
    { id: createId('objective'), topicId: topic.id, title: 'Pemahaman gerak', description: `Peserta didik dapat menjelaskan langkah dasar ${topic.title}.` },
    { id: createId('objective'), topicId: topic.id, title: 'Praktik gerak', description: `Peserta didik dapat mempraktikkan ${topic.title} dengan teknik yang benar dan aman.` },
    { id: createId('objective'), topicId: topic.id, title: 'Sikap belajar', description: 'Peserta didik menunjukkan disiplin, percaya diri, kerja sama, dan sportivitas.' },
  ]
}

function getTemplateMaterials(topic: LearningTopic): LearningMaterial[] {
  return [{ id: createId('material'), topicId: topic.id, title: `Materi ${topic.title}`, description: `Penjelasan konsep, langkah gerak, aturan keselamatan, dan contoh praktik ${topic.title}.` }]
}

function getTemplateAdditionalActivities(topic: LearningTopic): LearningActivity[] {
  return [{ id: createId('activity'), topicId: topic.id, name: `Permainan sederhana ${topic.title}`, steps: 'Pemanasan, demonstrasi, latihan berpasangan, permainan sederhana, pendinginan, dan refleksi.', durationMinutes: 35 }]
}

function getTemplateLegacyAssessments(topic: LearningTopic): Assessment[] {
  return [{ id: createId('assessment'), topicId: topic.id, type: 'Formatif', description: `Observasi proses latihan ${topic.title}, kerja sama, dan kemampuan mengikuti instruksi.` }]
}
