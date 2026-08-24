import type { AppState, LearningTopic } from '../../core/types'
import { getModuleActivities } from '../../core/moduleActivities'
import { getModuleAssessments } from '../../core/moduleAssessments'
import { getModuleAppendices } from '../../core/moduleAppendices'
import { getModuleWorksheets } from '../../core/moduleWorksheets'

export type BuilderSelection = {
  objectiveIds: string[]
  materialIds: string[]
  activityIds: string[]
  assessmentIds: string[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function listItems(items: string[]) {
  if (items.length === 0) {
    return '<p><em>Belum ada data.</em></p>'
  }

  return `<ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
}

function valueOrPlaceholder(value?: string | number) {
  if (value === 0) return '0'
  if (!value) return '<em>Belum ada data.</em>'

  return escapeHtml(String(value))
}

function textBlock(value?: string) {
  if (!value) return '<p><em>Belum ada data.</em></p>'

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

function infoRow(label: string, value?: string | number) {
  return `<tr><th>${escapeHtml(label)}</th><td>${valueOrPlaceholder(value)}</td></tr>`
}

function infoRowHtml(label: string, html: string) {
  return `<tr><th>${escapeHtml(label)}</th><td>${html}</td></tr>`
}

function rubricTable(rows: Array<{ aspect: string; excellent: string; good: string; fair: string; needsImprovement: string }>) {
  if (rows.length === 0) return '<p><em>Belum ada rubrik.</em></p>'

  return `
    <table>
      <tr>
        <th>Aspek Penilaian</th>
        <th>Baik Sekali</th>
        <th>Baik</th>
        <th>Cukup</th>
        <th>Perlu Perbaikan</th>
      </tr>
      ${rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.aspect)}</td>
              <td>${escapeHtml(row.excellent)}</td>
              <td>${escapeHtml(row.good)}</td>
              <td>${escapeHtml(row.fair)}</td>
              <td>${escapeHtml(row.needsImprovement)}</td>
            </tr>
          `,
        )
        .join('')}
    </table>
  `
}

function scoreTable(rows: Array<{ aspect: string; maxScore: number }>) {
  if (rows.length === 0) return '<p><em>Belum ada format nilai.</em></p>'

  return `
    <table>
      <tr>
        <th>Aspek</th>
        <th>Skor Maksimum</th>
      </tr>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.aspect)}</td><td>${row.maxScore}</td></tr>`).join('')}
    </table>
  `
}

function attitudeAssessmentTable(students: Array<{ name: string; orderNumber: number }>, aspects: Array<{ aspect: string }>) {
  if (students.length === 0 || aspects.length === 0) return '<p><em>Belum ada data peserta didik atau aspek sikap.</em></p>'

  return `
    <table>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Nama Siswa</th>
        ${aspects.map((item) => `<th colspan="4">${escapeHtml(item.aspect)}</th>`).join('')}
        <th rowspan="2">Nilai</th>
        <th rowspan="2">Catatan Perilaku</th>
      </tr>
      <tr>
        ${aspects.map(() => '<th>1</th><th>2</th><th>3</th><th>4</th>').join('')}
      </tr>
      ${students
        .map(
          (student) => `
            <tr>
              <td>${student.orderNumber}</td>
              <td>${escapeHtml(student.name)}</td>
              ${aspects.map(() => '<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>').join('')}
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join('')}
    </table>
  `
}

function knowledgeAssessmentTable(students: Array<{ name: string; orderNumber: number }>, aspects: Array<{ aspect: string }>) {
  if (students.length === 0 || aspects.length === 0) return '<p><em>Belum ada data peserta didik atau butir pengetahuan.</em></p>'

  return `
    <table>
      <tr>
        <th>No</th>
        <th>Nama</th>
        ${aspects.map((_, index) => `<th>No ${index + 1}</th>`).join('')}
        <th>Nilai</th>
      </tr>
      ${students
        .map(
          (student) => `
            <tr>
              <td>${student.orderNumber}</td>
              <td>${escapeHtml(student.name)}</td>
              ${aspects.map(() => '<td>&nbsp;</td>').join('')}
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join('')}
    </table>
    <p><strong>Rumus:</strong> Nilai Pengetahuan = Jumlah skor yang diperoleh / Jumlah skor maksimal x 100</p>
  `
}

function practiceAssessmentTable(aspects: Array<{ aspect: string }>) {
  if (aspects.length === 0) return '<p><em>Belum ada aspek praktik.</em></p>'

  return `
    <table>
      <tr>
        <th>No</th>
        <th>Aspek yang Dinilai</th>
        <th>4</th>
        <th>3</th>
        <th>2</th>
        <th>1</th>
      </tr>
      ${aspects
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.aspect)}</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join('')}
    </table>
  `
}

function answerLines(count = 6) {
  return Array.from({ length: count }, () => '<p class="answer-line">&nbsp;</p>').join('')
}

function worksheetBlocks(rows: Array<{ type: string; title: string; instructions: string; questions: string; answerArea: string; answerKey: string }>, topic: LearningTopic) {
  if (rows.length === 0) return '<p><em>Belum ada LKPD.</em></p>'

  return rows
    .map(
      (row) => `
        <div class="page-break"></div>
        <h3 class="center">Lembar Kerja Peserta Didik (LKPD) ${escapeHtml(row.type)}</h3>
        <p class="center"><strong>Topik:</strong> ${escapeHtml(topic.title)}</p>
        ${
          row.type === 'Berkelompok'
            ? `<p><strong>Nama Kelompok:</strong> ....................................................</p>
               <p><strong>Anggota:</strong></p>
               <ol>
                 <li>....................................................</li>
                 <li>....................................................</li>
                 <li>....................................................</li>
                 <li>....................................................</li>
                 <li>....................................................</li>
               </ol>`
            : `<p><strong>Nama Peserta Didik:</strong> ....................................................</p>
               <p><strong>Kelas:</strong> ....................................................</p>`
        }
        <h3>${escapeHtml(row.title)}</h3>
        <table>
          <tr><th>Petunjuk</th><td>${textBlock(row.instructions)}</td></tr>
          <tr><th>Soal</th><td>${textBlock(row.questions)}</td></tr>
        </table>
        <h3>Jawaban</h3>
        ${textBlock(row.answerArea)}
        ${answerLines(row.type === 'Berkelompok' ? 8 : 5)}
        <div class="page-break"></div>
        <h3>Lembar Jawaban - ${escapeHtml(row.title)}</h3>
        ${textBlock(row.answerKey)}
      `,
    )
    .join('')
}

function readingMaterialBlock(rows: Array<{ title: string; content: string }>, fallback: string) {
  if (rows.length === 0) return textBlock(fallback)

  return rows
    .map(
      (row, index) => `
        <h3>${String.fromCharCode(65 + index)}. ${escapeHtml(row.title)}</h3>
        ${textBlock(row.content)}
      `,
    )
    .join('')
}

function glossaryTable(rows: Array<{ term: string; definition: string }>) {
  if (rows.length === 0) return '<p><em>Belum ada glosarium.</em></p>'

  return `
    <table>
      <tr>
        <th>Istilah</th>
        <th>Definisi</th>
      </tr>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.term)}</td><td>${escapeHtml(row.definition)}</td></tr>`).join('')}
    </table>
  `
}

function appendixFileList(rows: Array<{ title: string; description: string; attachment?: { name: string; size: number; type: string } }>) {
  if (rows.length === 0) return '<p><em>Belum ada file pendukung.</em></p>'

  return `
    <ol>
      ${rows
        .map(
          (row) => `
            <li>
              <strong>${escapeHtml(row.title)}</strong><br>
              ${escapeHtml(row.description)}<br>
              ${row.attachment ? `File: ${escapeHtml(row.attachment.name)} (${Math.round(row.attachment.size / 1024)} KB)` : 'File: belum dilampirkan'}
            </li>
          `,
        )
        .join('')}
    </ol>
  `
}

function materialsBlock(rows: Array<{ title: string; description: string; attachment?: { name: string }; videoUrl?: string }>) {
  if (rows.length === 0) return '<p><em>Belum ada materi dipilih.</em></p>'

  return rows
    .map(
      (item) => `
        <h3>${escapeHtml(item.title)}</h3>
        ${textBlock(item.description)}
        ${item.videoUrl ? `<p><strong>Video:</strong> ${escapeHtml(item.videoUrl)}</p>` : ''}
        ${item.attachment ? `<p><strong>Lampiran:</strong> ${escapeHtml(item.attachment.name)}</p>` : ''}
      `,
    )
    .join('')
}

function additionalActivitiesBlock(rows: Array<{ name: string; durationMinutes: number; steps: string }>) {
  if (rows.length === 0) return '<p><em>Belum ada aktivitas tambahan dipilih.</em></p>'

  return rows
    .map(
      (item) => `
        <h3>${escapeHtml(item.name)} (${item.durationMinutes} menit)</h3>
        ${textBlock(item.steps)}
      `,
    )
    .join('')
}

function facilityList(moduleInfo?: { media?: string; toolsAndMaterials?: string; learningResources?: string; practiceArea?: string; sportEquipment?: string }) {
  return `
    <table>
      ${infoRow('Media', moduleInfo?.media)}
      ${infoRow('Alat dan Bahan', moduleInfo?.toolsAndMaterials)}
      ${infoRow('Sumber Belajar', moduleInfo?.learningResources)}
      ${infoRow('Lapangan/Tempat Praktik', moduleInfo?.practiceArea)}
      ${infoRow('Peralatan PJOK', moduleInfo?.sportEquipment)}
    </table>
  `
}

export function buildAdministrationDocumentHtml({
  selected,
  state,
  topic,
}: {
  selected: BuilderSelection
  state: AppState
  topic: LearningTopic
}) {
  const objectives = state.objectives.filter((item) => selected.objectiveIds.includes(item.id))
  const materials = state.materials.filter((item) => selected.materialIds.includes(item.id))
  const activities = state.activities.filter((item) => selected.activityIds.includes(item.id))
  const assessments = state.assessments.filter((item) => selected.assessmentIds.includes(item.id))
  const moduleInfo = state.moduleInfo[topic.id]
  const competency = state.moduleCompetencies[topic.id]
  const moduleActivities = getModuleActivities(state, topic)
  const moduleAssessments = getModuleAssessments(state, topic)
  const moduleWorksheets = getModuleWorksheets(state, topic)
  const moduleAppendices = getModuleAppendices(state, topic)
  const students = state.students
    .filter((student) => student.teacherId === topic.teacherId && student.classGrade === topic.classGrade)
    .sort((a, b) => a.orderNumber - b.orderNumber)
  const teacherIdentity = state.teacher.identityNumber
    ? `${state.teacher.identityType}. ${state.teacher.identityNumber}`
    : state.teacher.identityType
  const subject = moduleInfo?.subject ?? 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'
  const phaseClass = `${moduleInfo?.phase ?? ''} / Kelas ${topic.classGrade}`
  const mainMaterial = moduleInfo?.mainMaterial ?? topic.title

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Administrasi ${escapeHtml(topic.title)}</title>
    <style>
      @page { size: A4; margin: 16mm 15mm; }
      html { background: #e2e8f0; }
      body {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 16mm 15mm;
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        color: #111827;
        line-height: 1.45;
        font-size: 11pt;
      }
      * { box-sizing: border-box; }
      h1 { font-size: 22pt; margin: 0 0 12px; text-align: center; text-transform: uppercase; letter-spacing: 0; }
      h2 {
        break-after: avoid;
        page-break-after: avoid;
        font-size: 13pt;
        margin: 22px 0 8px;
        border-bottom: 1px solid #9ca3af;
        padding-bottom: 5px;
        text-transform: uppercase;
      }
      h3 { break-after: avoid; page-break-after: avoid; font-size: 11.5pt; margin: 14px 0 6px; }
      p { margin: 5px 0; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 8px 0 12px; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      td, th { border: 1px solid #9ca3af; padding: 6px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; font-size: 10pt; }
      th { background: #f3f4f6; font-weight: bold; }
      ol, ul { margin-top: 7px; padding-left: 20px; }
      li { margin-bottom: 5px; }
      .answer-line { border-bottom: 1px dotted #6b7280; min-height: 20px; }
      .muted { color: #4b5563; }
      .center { text-align: center; }
      .cover { min-height: 250mm; padding-top: 45mm; text-align: center; page-break-after: always; }
      .cover-title { font-size: 26pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
      .cover-subtitle { font-size: 15pt; margin-top: 16px; }
      .cover-box { border: 2px solid #111827; display: inline-block; margin: 32px auto; padding: 16px 24px; min-width: 118mm; }
      .page-break { page-break-before: always; }
      .signature td { height: 90px; }
      @media screen and (max-width: 900px) {
        body {
          width: 100%;
          min-height: auto;
          padding: 18px;
          box-shadow: none;
        }
        .cover { min-height: 80vh; padding-top: 80px; }
        .cover-box { min-width: 0; width: 100%; }
      }
      @media print {
        html { background: #ffffff; }
        body {
          width: auto;
          min-height: auto;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <section class="cover">
      <p class="cover-title">MODUL AJAR</p>
      <p class="cover-subtitle">${escapeHtml(subject)}</p>
      <div class="cover-box">
        <p><strong>Kelas ${topic.classGrade} SD</strong></p>
        <p><strong>Materi Pokok:</strong> ${escapeHtml(mainMaterial)}</p>
        <p><strong>Topik:</strong> ${escapeHtml(topic.title)}</p>
      </div>
      <p>${escapeHtml(state.school.name)}</p>
      <p>${escapeHtml(moduleInfo?.academicYear ?? 'Tahun ajaran belum diisi')}</p>
    </section>

    <h1>MODUL AJAR</h1>

    <h2>A. Informasi Umum</h2>
    <table>
      ${infoRow('Nama Penyusun', state.teacher.name)}
      ${infoRow('Identitas Guru', teacherIdentity)}
      ${infoRow('Instansi', state.school.name)}
      ${infoRow('Tahun Ajaran', moduleInfo?.academicYear)}
      ${infoRow('Semester', moduleInfo?.semester)}
      ${infoRow('Mata Pelajaran', subject)}
      ${infoRow('Fase/Kelas', phaseClass)}
    </table>

    <h2>B. Identitas Modul</h2>
    <table>
      ${infoRow('Materi Pokok', mainMaterial)}
      ${infoRow('Sub Materi', moduleInfo?.subMaterial)}
      ${infoRow('Bab/Pertemuan', moduleInfo?.chapterMeeting)}
      ${infoRow('Alokasi Waktu', moduleInfo?.timeAllocation)}
      ${infoRow('Target Peserta Didik', moduleInfo?.targetStudents)}
      ${infoRow('Jumlah Peserta Didik', moduleInfo?.studentCount)}
    </table>

    <h2>C. Sarana dan Prasarana</h2>
    ${facilityList(moduleInfo)}

    <h2>D. Model Pembelajaran</h2>
    <table>
      ${infoRow('Model Pembelajaran', moduleInfo?.learningModel)}
      ${infoRow('Mode Pembelajaran', moduleInfo?.learningMode)}
      ${infoRow('Metode Pembelajaran', moduleInfo?.learningMethods)}
      ${infoRow('Berdiferensiasi', moduleInfo?.differentiationStrategy)}
    </table>

    <h2>E. Komponen Awal</h2>
    ${textBlock(competency?.initialCompetency)}

    <h2>F. Profil Pelajar Pancasila</h2>
    ${listItems(competency?.pancasilaProfiles ?? [])}

    <h2>G. Kompetensi Inti</h2>
    <h3>Capaian Pembelajaran</h3>
    ${textBlock(competency?.learningAchievements)}

    <h3>Tujuan Pembelajaran</h3>
    ${listItems(objectives.map((item) => `${item.title}: ${item.description}`))}

    <h3>Pemahaman Bermakna</h3>
    ${textBlock(competency?.meaningfulUnderstanding)}

    <h3>Pertanyaan Pemantik</h3>
    ${listItems(competency?.triggerQuestions ?? [])}

    <h3>Asesmen Diagnostik Non-Kognitif</h3>
    ${listItems(competency?.diagnosticQuestions ?? [])}

    <h3>Persiapan Pembelajaran</h3>
    <table>
      <tr><th>Afektif</th><td>${escapeHtml(competency?.affectivePreparation ?? '')}</td></tr>
      <tr><th>Kognitif</th><td>${escapeHtml(competency?.cognitivePreparation ?? '')}</td></tr>
      <tr><th>Psikomotor</th><td>${escapeHtml(competency?.psychomotorPreparation ?? '')}</td></tr>
    </table>

    <h2>H. Materi Pembelajaran</h2>
    ${materialsBlock(materials)}

    <h2>I. Urutan Kegiatan Pembelajaran</h2>
    <table>
      <tr>
        <th>Kegiatan</th>
        <th>Langkah Pembelajaran</th>
        <th>Durasi</th>
      </tr>
      <tr>
        <td>${escapeHtml(moduleActivities.opening.title || 'Pendahuluan')}</td>
        <td>${textBlock(moduleActivities.opening.steps)}</td>
        <td>${moduleActivities.opening.durationMinutes} menit</td>
      </tr>
      <tr>
        <td>${escapeHtml(moduleActivities.core.title || 'Inti')}</td>
        <td>${textBlock(moduleActivities.core.steps)}</td>
        <td>${moduleActivities.core.durationMinutes} menit</td>
      </tr>
      <tr>
        <td>${escapeHtml(moduleActivities.closing.title || 'Penutup')}</td>
        <td>${textBlock(moduleActivities.closing.steps)}</td>
        <td>${moduleActivities.closing.durationMinutes} menit</td>
      </tr>
    </table>

    <h2>J. Diferensiasi Pembelajaran</h2>
    <table>
      ${infoRowHtml('Konten', textBlock(moduleActivities.contentDifferentiation))}
      ${infoRowHtml('Proses', textBlock(moduleActivities.processDifferentiation))}
      ${infoRowHtml('Lingkungan', textBlock(moduleActivities.environmentDifferentiation))}
    </table>

    <h2>K. Aktivitas Tambahan</h2>
    ${additionalActivitiesBlock(activities)}

    <h2>L. Refleksi Guru</h2>
    ${textBlock(moduleActivities.teacherReflection)}

    <h2>M. Refleksi Peserta Didik</h2>
    ${textBlock(moduleActivities.studentReflection)}

    <h2>N. Asesmen/Penilaian</h2>
    <h3>Asesmen Pembelajaran</h3>
    <table>
      ${infoRowHtml('Diagnostik', textBlock(moduleAssessments.diagnosticAssessment))}
      ${infoRowHtml('Formatif', textBlock(moduleAssessments.formativeAssessment))}
      ${infoRowHtml('Sumatif', textBlock(moduleAssessments.summativeAssessment))}
    </table>

    <h3>Rubrik Penilaian Kelompok</h3>
    ${rubricTable(moduleAssessments.groupRubric)}

    <h3>Rubrik Penilaian Individu</h3>
    <p><strong>Tujuan:</strong> ${valueOrPlaceholder(moduleAssessments.individualRubricObjective)}</p>
    <p><strong>Waktu Pelaksanaan:</strong> ${valueOrPlaceholder(moduleAssessments.individualRubricTiming)}</p>
    ${rubricTable(moduleAssessments.individualRubric)}
    <h3>Skala Nilai Rubrik Individu</h3>
    ${textBlock(moduleAssessments.individualScoreScale)}

    <h3>Penilaian Sikap</h3>
    ${scoreTable(moduleAssessments.attitudeScores)}
    ${attitudeAssessmentTable(students, moduleAssessments.attitudeScores)}

    <h3>Penilaian Pengetahuan</h3>
    ${scoreTable(moduleAssessments.knowledgeScores)}
    ${knowledgeAssessmentTable(students, moduleAssessments.knowledgeScores)}

    <h3>Penilaian Praktik</h3>
    <table>
      ${infoRow('Tugas', moduleAssessments.practiceTask)}
      ${infoRow('Total Skor', moduleAssessments.practiceTotalScore)}
    </table>
    ${scoreTable(moduleAssessments.practiceScores)}
    ${practiceAssessmentTable(moduleAssessments.practiceScores)}
    <h3>Kriteria Penilaian Praktik</h3>
    ${textBlock(moduleAssessments.practiceCriteria)}

    <h3>Asesmen Umum Terpilih</h3>
    ${listItems(assessments.map((item) => `${item.type}: ${item.description}`))}

    <h2>O. Pengayaan dan Remedial</h2>
    <table>
      ${infoRow('Pengayaan', moduleInfo?.enrichment)}
      ${infoRow('Remedial', moduleInfo?.remedial)}
    </table>

    <h2 class="page-break">P. Lampiran</h2>
    <h3>Lampiran 1 - Bahan Bacaan Guru dan Peserta Didik</h3>
    ${readingMaterialBlock(moduleAppendices.readingSections, moduleAppendices.readingMaterials)}

    <h3>Lampiran 2 - Media Pembelajaran</h3>
    ${textBlock(moduleAppendices.learningMedia)}

    <h3>Lampiran 3 - LKPD</h3>
    ${worksheetBlocks(moduleWorksheets, topic)}

    <h3 class="page-break">Lampiran 4 - Instrumen Penilaian</h3>
    ${textBlock(moduleAppendices.assessmentInstruments)}
    <h3>Rubrik Penilaian Kelompok</h3>
    ${rubricTable(moduleAssessments.groupRubric)}
    <h3>Rubrik Penilaian Tugas Individu</h3>
    <p><strong>Tujuan:</strong> ${valueOrPlaceholder(moduleAssessments.individualRubricObjective)}</p>
    <p><strong>Waktu Pelaksanaan:</strong> ${valueOrPlaceholder(moduleAssessments.individualRubricTiming)}</p>
    ${rubricTable(moduleAssessments.individualRubric)}
    <h3>Format Penilaian Sikap</h3>
    ${attitudeAssessmentTable(students, moduleAssessments.attitudeScores)}
    <h3>Format Penilaian Pengetahuan</h3>
    ${knowledgeAssessmentTable(students, moduleAssessments.knowledgeScores)}
    <h3>Format Penilaian Praktik</h3>
    <table>
      ${infoRow('Satuan Pendidikan', state.school.name)}
      ${infoRow('Mata Pelajaran', subject)}
      ${infoRow('Kelas/Semester', `Kelas ${topic.classGrade}/${moduleInfo?.semester ?? ''}`)}
      ${infoRow('Tahun Pelajaran', moduleInfo?.academicYear)}
      ${infoRow('Tugas', moduleAssessments.practiceTask)}
    </table>
    ${practiceAssessmentTable(moduleAssessments.practiceScores)}
    <h3>Kriteria Penilaian Praktik</h3>
    ${textBlock(moduleAssessments.practiceCriteria)}

    <h3>Lampiran 5 - Glosarium</h3>
    ${glossaryTable(moduleAppendices.glossary)}

    <h3>Lampiran 6 - File Pendukung</h3>
    ${appendixFileList(moduleAppendices.files)}

    <h2>Q. Mengetahui / Mengesahkan</h2>
    <p class="center">${escapeHtml(moduleInfo?.approvalPlace ?? 'Tempat belum diisi')}, ${escapeHtml(moduleInfo?.approvalDate ?? 'Tanggal belum diisi')}</p>
    <table class="signature">
      <tr>
        <th>Kepala Sekolah</th>
        <th>Guru Bidang Studi</th>
      </tr>
      <tr>
        <td style="height: 90px;">&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>${escapeHtml(state.school.principalName)}<br>NIP. ${escapeHtml(state.school.principalNip)}</td>
        <td>${escapeHtml(state.teacher.name)}<br>${escapeHtml(teacherIdentity)}</td>
      </tr>
    </table>
  </body>
</html>`
}

export function downloadAdministrationDocument({
  selected,
  state,
  topic,
}: {
  selected: BuilderSelection
  state: AppState
  topic: LearningTopic
}) {
  const html = buildAdministrationDocumentHtml({ selected, state, topic })
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${slugify(`administrasi-${topic.title}-kelas-${topic.classGrade}`)}.doc`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
