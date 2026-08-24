import { getModuleActivities, isModuleActivitiesComplete } from './moduleActivities'
import { getModuleAppendices, isModuleAppendicesComplete } from './moduleAppendices'
import { getModuleAssessments } from './moduleAssessments'
import { getModuleWorksheets, isModuleWorksheetsComplete } from './moduleWorksheets'
import type { AdministrationDraft, AppState, LearningTopic } from './types'

export type ModuleCompletionSection = {
  complete: boolean
  label: string
  missing: string[]
}

export function getModuleCompletion(state: AppState, topic: LearningTopic, draft?: Pick<AdministrationDraft, 'objectiveIds' | 'materialIds'>) {
  const info = state.moduleInfo[topic.id]
  const competency = state.moduleCompetencies[topic.id]
  const activities = getModuleActivities(state, topic)
  const assessments = getModuleAssessments(state, topic)
  const worksheets = getModuleWorksheets(state, topic)
  const appendices = getModuleAppendices(state, topic)
  const objectiveCount = draft?.objectiveIds.length ?? state.objectives.filter((item) => item.topicId === topic.id).length
  const materialCount = draft?.materialIds.length ?? state.materials.filter((item) => item.topicId === topic.id).length
  const students = state.students.filter((student) => student.teacherId === topic.teacherId && student.classGrade === topic.classGrade)

  const sections: ModuleCompletionSection[] = [
    {
      label: 'Identitas Modul',
      missing: missing([
        ['Tahun ajaran', info?.academicYear],
        ['Semester', info?.semester],
        ['Fase', info?.phase],
        ['Mata pelajaran', info?.subject],
        ['Materi pokok', info?.mainMaterial],
        ['Bab/pertemuan', info?.chapterMeeting],
        ['Alokasi waktu', info?.timeAllocation],
        ['Model pembelajaran', info?.learningModel],
        ['Metode pembelajaran', info?.learningMethods],
        ['Strategi berdiferensiasi', info?.differentiationStrategy],
        ['Media', info?.media],
        ['Alat dan bahan', info?.toolsAndMaterials],
        ['Sumber belajar', info?.learningResources],
        ['Lapangan/tempat praktik', info?.practiceArea],
        ['Peralatan PJOK', info?.sportEquipment],
        ['Pengayaan', info?.enrichment],
        ['Remedial', info?.remedial],
        ['Tempat pengesahan', info?.approvalPlace],
        ['Tanggal pengesahan', info?.approvalDate],
        ['Jumlah peserta didik', info && info.studentCount > 0],
        ['Target peserta didik', info?.targetStudents],
      ]),
      complete: false,
    },
    {
      label: 'Kompetensi & Tujuan',
      missing: missing([
        ['Komponen awal', competency?.initialCompetency],
        ['Profil Pelajar Pancasila', competency && competency.pancasilaProfiles.length > 0],
        ['Capaian pembelajaran', competency?.learningAchievements],
        ['Tujuan pembelajaran', objectiveCount > 0],
        ['Pemahaman bermakna', competency?.meaningfulUnderstanding],
        ['Pertanyaan pemantik', competency && competency.triggerQuestions.length > 0],
        ['Asesmen diagnostik non-kognitif', competency && competency.diagnosticQuestions.length > 0],
        ['Persiapan afektif', competency?.affectivePreparation],
        ['Persiapan kognitif', competency?.cognitivePreparation],
        ['Persiapan psikomotor', competency?.psychomotorPreparation],
      ]),
      complete: false,
    },
    {
      label: 'Materi & Media',
      missing: missing([['Materi pembelajaran terpilih/tersedia', materialCount > 0]]),
      complete: false,
    },
    {
      label: 'Aktivitas Pembelajaran',
      missing: isModuleActivitiesComplete(activities) ? [] : ['Pendahuluan, inti, penutup, dan diferensiasi belum lengkap'],
      complete: false,
    },
    {
      label: 'Asesmen & Rubrik',
      missing: missing([
        ['Asesmen diagnostik', assessments.diagnosticAssessment],
        ['Asesmen formatif', assessments.formativeAssessment],
        ['Asesmen sumatif', assessments.summativeAssessment],
        ['Tujuan rubrik individu', assessments.individualRubricObjective],
        ['Waktu rubrik individu', assessments.individualRubricTiming],
        ['Skala nilai individu', assessments.individualScoreScale],
        ['Tugas praktik', assessments.practiceTask],
        ['Total skor praktik', assessments.practiceTotalScore > 0],
        ['Kriteria praktik', assessments.practiceCriteria],
        ['Rubrik kelompok', assessments.groupRubric.length > 0],
        ['Rubrik individu', assessments.individualRubric.length > 0],
        ['Penilaian sikap', assessments.attitudeScores.length > 0],
        ['Penilaian pengetahuan', assessments.knowledgeScores.length > 0],
        ['Penilaian praktik', assessments.practiceScores.length > 0],
        ['Data peserta didik', students.length > 0],
      ]),
      complete: false,
    },
    {
      label: 'LKPD',
      missing: isModuleWorksheetsComplete(worksheets) ? [] : ['Minimal satu LKPD berkelompok dan satu LKPD individu'],
      complete: false,
    },
    {
      label: 'Lampiran',
      missing: isModuleAppendicesComplete(appendices) ? [] : ['Bahan bacaan, media, instrumen penilaian, dan glosarium belum lengkap'],
      complete: false,
    },
  ]

  const normalized = sections.map((section) => ({ ...section, complete: section.missing.length === 0 }))
  const complete = normalized.filter((section) => section.complete).length

  return {
    complete,
    missing: normalized.filter((section) => !section.complete).flatMap((section) => section.missing.map((item) => `${section.label}: ${item}`)),
    progress: Math.round((complete / normalized.length) * 100),
    sections: normalized,
    total: normalized.length,
  }
}

function missing(items: Array<[string, unknown]>) {
  return items.filter(([, value]) => !value).map(([label]) => label)
}
