import type { ActivityBlock, AppState, LearningActivityPhase, LearningTopic } from "../../core/types";
import { getModuleActivities, mergeLegacyDifferentiationIntoCore } from "../../core/moduleActivities";
import { getModuleAssessments } from "../../core/moduleAssessments";
import { getModuleAppendices } from "../../core/moduleAppendices";
import { getModuleWorksheets } from "../../core/moduleWorksheets";

export type BuilderSelection = {
  objectiveIds: string[];
  materialIds: string[];
  activityIds: string[];
  assessmentIds: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listItems(items: string[]) {
  if (items.length === 0) {
    return "<p><em>Belum ada data.</em></p>";
  }

  return `<ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
}

function valueOrPlaceholder(value?: string | number) {
  if (value === 0) return "0";
  if (!value) return "<em>Belum ada data.</em>";

  return escapeHtml(String(value));
}

function textBlock(value?: string) {
  if (!value) return "<p><em>Belum ada data.</em></p>";

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function richTextBlock(value?: string) {
  if (!value) return '<p><em>Belum ada data.</em></p>'
  if (!/<[a-z][\s\S]*>/i.test(value)) return textBlock(value)

  return value
    .replace(/<\/?(script|style)[^>]*>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function activityPhaseBlock(phase: LearningActivityPhase, fallbackTitle: string) {
  if (!phase.blocks?.length) {
    return `<h3 class="activity-phase-title">${escapeHtml(phase.title || fallbackTitle)} (${phase.durationMinutes} menit)</h3><div class="sheet-content">${richTextBlock(phase.steps)}</div>`
  }

  const blocks = phase.blocks

  return `
    <h3 class="activity-phase-title">${escapeHtml(phase.title || fallbackTitle)} (${phase.durationMinutes} menit)</h3>
    ${blocks
      .map((block) => activityBlockHtml(block))
      .join('')}
  `
}

function activityBlockHtml(block: ActivityBlock) {
  if (block.type === 'heading') return `<h3>${escapeHtml(block.content)}</h3>`
  if (block.type === 'callout') return `<div class="activity-callout"><strong>Sintaks Diferensiasi:</strong> ${textBlock(block.content)}</div>`
  if (block.type === 'image') {
    if (!block.imageUrl) return block.content ? `<p><strong>Gambar:</strong> ${escapeHtml(block.content)}</p>` : ''
    return `<figure><img alt="${escapeHtml(block.content || block.imageName || 'Gambar kegiatan pembelajaran')}" src="${escapeHtml(block.imageUrl)}" />${block.content ? `<figcaption>${escapeHtml(block.content)}</figcaption>` : ''}</figure>`
  }
  if (block.type === 'video') {
    const label = escapeHtml(block.content || 'Video pembelajaran')
    const url = block.videoUrl ? escapeHtml(block.videoUrl) : ''
    return url ? `<p><strong>${label}:</strong> <a href="${url}">${url}</a></p>` : `<p><strong>${label}</strong></p>`
  }

  const lines = block.content.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.length ? `<ul class="activity-list">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''
}

function infoRow(label: string, value?: string | number) {
  return `<tr><th>${escapeHtml(label)}</th><td>${valueOrPlaceholder(value)}</td></tr>`;
}

function infoRowHtml(label: string, html: string) {
  return `<tr><th>${escapeHtml(label)}</th><td>${html}</td></tr>`;
}

function rubricTable(
  rows: Array<{
    aspect: string;
    excellent: string;
    good: string;
    fair: string;
    needsImprovement: string;
  }>,
) {
  if (rows.length === 0) return "<p><em>Belum ada rubrik.</em></p>";

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
        .join("")}
    </table>
  `;
}

function scoreTable(rows: Array<{ aspect: string; maxScore: number }>) {
  if (rows.length === 0) return "<p><em>Belum ada format nilai.</em></p>";

  return `
    <table>
      <tr>
        <th>Aspek</th>
        <th>Skor Maksimum</th>
      </tr>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.aspect)}</td><td>${row.maxScore}</td></tr>`).join("")}
    </table>
  `;
}

function attitudeAssessmentTable(
  students: Array<{ name: string; orderNumber: number }>,
  aspects: Array<{ aspect: string }>,
) {
  if (students.length === 0 || aspects.length === 0)
    return "<p><em>Belum ada data peserta didik atau aspek sikap.</em></p>";

  return `
    <table>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Nama Siswa</th>
        ${aspects.map((item) => `<th colspan="4">${escapeHtml(item.aspect)}</th>`).join("")}
        <th rowspan="2">Nilai</th>
        <th rowspan="2">Catatan Perilaku</th>
      </tr>
      <tr>
        ${aspects.map(() => "<th>1</th><th>2</th><th>3</th><th>4</th>").join("")}
      </tr>
      ${students
        .map(
          (student) => `
            <tr>
              <td>${student.orderNumber}</td>
              <td>${escapeHtml(student.name)}</td>
              ${aspects.map(() => "<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>").join("")}
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function knowledgeAssessmentTable(
  students: Array<{ name: string; orderNumber: number }>,
  aspects: Array<{ aspect: string }>,
) {
  if (students.length === 0 || aspects.length === 0)
    return "<p><em>Belum ada data peserta didik atau butir pengetahuan.</em></p>";

  return `
    <table>
      <tr>
        <th>No</th>
        <th>Nama</th>
        ${aspects.map((_, index) => `<th>No ${index + 1}</th>`).join("")}
        <th>Nilai</th>
      </tr>
      ${students
        .map(
          (student) => `
            <tr>
              <td>${student.orderNumber}</td>
              <td>${escapeHtml(student.name)}</td>
              ${aspects.map(() => "<td>&nbsp;</td>").join("")}
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join("")}
    </table>
    <p><strong>Rumus:</strong> Nilai Pengetahuan = Jumlah skor yang diperoleh / Jumlah skor maksimal x 100</p>
  `;
}

function practiceAssessmentTable(aspects: Array<{ aspect: string }>) {
  if (aspects.length === 0) return "<p><em>Belum ada aspek praktik.</em></p>";

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
        .join("")}
    </table>
  `;
}

function answerLines(count = 6) {
  return Array.from(
    { length: count },
    () => '<p class="answer-line">&nbsp;</p>',
  ).join("");
}

function worksheetBlocks(
  rows: Array<{
    type: string;
    title: string;
    instructions: string;
    questions: string;
    answerArea: string;
    answerKey: string;
  }>,
  topic: LearningTopic,
) {
  if (rows.length === 0) return "<p><em>Belum ada LKPD.</em></p>";

  return rows
    .map(
      (row) => `
        <div class="page-break"></div>
        <h3 class="center">Lembar Kerja Peserta Didik (LKPD) ${escapeHtml(row.type)}</h3>
        <p class="center"><strong>Topik:</strong> ${escapeHtml(topic.title)}</p>
        ${
          row.type === "Berkelompok"
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
        ${answerLines(row.type === "Berkelompok" ? 8 : 5)}
        <div class="page-break"></div>
        <h3>Lembar Jawaban - ${escapeHtml(row.title)}</h3>
        ${textBlock(row.answerKey)}
      `,
    )
    .join("");
}

function readingMaterialBlock(
  rows: Array<{ title: string; content: string }>,
  fallback: string,
) {
  if (rows.length === 0) return textBlock(fallback);

  return rows
    .map(
      (row, index) => `
        <h3>${String.fromCharCode(65 + index)}. ${escapeHtml(row.title)}</h3>
        ${textBlock(row.content)}
      `,
    )
    .join("");
}

function glossaryTable(rows: Array<{ term: string; definition: string }>) {
  if (rows.length === 0) return "<p><em>Belum ada glosarium.</em></p>";

  return `
    <table>
      <tr>
        <th>Istilah</th>
        <th>Definisi</th>
      </tr>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.term)}</td><td>${escapeHtml(row.definition)}</td></tr>`).join("")}
    </table>
  `;
}

function appendixFileList(
  rows: Array<{
    title: string;
    description: string;
    attachment?: { name: string; size: number; type: string };
  }>,
) {
  if (rows.length === 0) return "<p><em>Belum ada file pendukung.</em></p>";

  return `
    <ol>
      ${rows
        .map(
          (row) => `
            <li>
              <strong>${escapeHtml(row.title)}</strong><br>
              ${escapeHtml(row.description)}<br>
              ${row.attachment ? `File: ${escapeHtml(row.attachment.name)} (${Math.round(row.attachment.size / 1024)} KB)` : "File: belum dilampirkan"}
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

export function buildAdministrationDocumentHtml({
  selected,
  state,
  topic,
}: {
  selected: BuilderSelection;
  state: AppState;
  topic: LearningTopic;
}) {
  const objectives = state.objectives.filter((item) =>
    selected.objectiveIds.includes(item.id),
  );
  const moduleInfo = state.moduleInfo[topic.id];
  const competency = state.moduleCompetencies[topic.id];
  const savedActivities = getModuleActivities(state, topic);
  const moduleActivities = {
    ...savedActivities,
    core: { ...savedActivities.core, steps: mergeLegacyDifferentiationIntoCore(savedActivities) },
  };
  const moduleAssessments = getModuleAssessments(state, topic);
  const moduleWorksheets = getModuleWorksheets(state, topic);
  const moduleAppendices = getModuleAppendices(state, topic);
  const students = state.students
    .filter(
      (student) =>
        student.teacherId === topic.teacherId &&
        student.classGrade === topic.classGrade,
    )
    .sort((a, b) => a.orderNumber - b.orderNumber);
  const teacherIdentity = state.teacher.identityNumber
    ? `${state.teacher.identityType}. ${state.teacher.identityNumber}`
    : state.teacher.identityType;
  const subject =
    moduleInfo?.subject ?? "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
  const phaseClass = `${moduleInfo?.phase ?? ""} / Kelas ${topic.classGrade}`;
  const mainMaterial = moduleInfo?.mainMaterial ?? topic.title;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Administrasi ${escapeHtml(topic.title)}</title>
    <style>
      @page { size: A4; margin: 15mm 14mm; }
      html { background: #e2e8f0; }
      body {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 15mm 14mm;
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        box-sizing: border-box;
        font-family: "Times New Roman", Times, serif;
        color: #000000;
        line-height: 1.28;
        font-size: 11pt;
      }
      * { box-sizing: border-box; }
      h1 { font-size: 16pt; margin: 0 0 14px; text-align: center; text-transform: uppercase; letter-spacing: 0; }
      h2 {
        break-after: avoid;
        page-break-after: avoid;
        font-size: 12pt;
        margin: 16px 0 5px;
        border-bottom: 1px solid #000000;
        padding-bottom: 3px;
        text-transform: uppercase;
      }
      h3 { break-after: avoid; page-break-after: avoid; font-size: 11pt; margin: 10px 0 4px; }
      p { margin: 4px 0; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 8px 0 12px; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      td, th { border: 1px solid #000000; padding: 4px 7px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; font-size: 10.5pt; }
      th { background: #f3f4f6; font-weight: bold; }
      ol, ul { margin-top: 5px; padding-left: 24px; }
      li { margin-bottom: 3px; }
      .answer-line { border-bottom: 1px dotted #6b7280; min-height: 20px; }
      .muted { color: #4b5563; }
      .center { text-align: center; }
      .cover { min-height: 250mm; padding-top: 45mm; text-align: center; page-break-after: always; }
      .cover-title { font-size: 26pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; }
      .cover-subtitle { font-size: 15pt; margin-top: 16px; }
      .cover-box { border: 2px solid #111827; display: inline-block; margin: 32px auto; padding: 16px 24px; min-width: 118mm; }
      .page-break { page-break-before: always; }
      .signature td { height: 90px; }
      .module-sheet { border: 1px solid #000000; margin: 0 0 14px; page-break-inside: auto; }
      .sheet-title { background: #DFEBEB; color: #000000; font-size: 10.5pt; font-weight: bold; line-height: 1.1; padding: 4px 8px; text-transform: uppercase; }
      .sheet-title.competency { background: #B1E3D4; }
      .sheet-subtitle { background: #001F5F; border-top: 1px solid #000000; border-bottom: 1px solid #000000; color: #ffffff; font-size: 10.5pt; font-weight: bold; line-height: 1.1; padding: 4px 12px; text-transform: uppercase; }
      .sheet-content { padding: 5px 10px; }
      .sheet-content p { margin: 0 0 5px; }
      .sheet-content p:last-child { margin-bottom: 0; }
      .sheet-list { margin: 0; padding: 4px 18px 5px 31px; }
      .sheet-list li { margin-bottom: 3px; }
      .identity-table { margin: 0; }
      .identity-table td, .identity-table th { border: 0; padding: 1px 9px; font-size: 10.5pt; }
      .identity-table th { width: 51%; border-right: 1px solid #000000; background: #ffffff; font-weight: normal; }
      .module-sheet h3 { border: 0; font-size: 10.5pt; margin: 8px 10px 3px; padding: 0; text-transform: none; }
      .activity-phase-title { background: #ffffff !important; border: 0 !important; font-size: 11pt !important; padding: 7px 10px 3px !important; text-align: left; text-transform: none !important; }
      .activity-list { margin: 0; padding: 2px 18px 6px 30px; }
      .activity-list li { margin-bottom: 3px; }
      .activity-callout { border-left: 3px solid #001F5F; background: #edf5f4; margin: 5px 10px; padding: 6px 9px; }
      figure { margin: 7px auto; max-width: 150mm; text-align: center; }
      figure img { display: block; height: auto; margin: 0 auto; max-height: 105mm; max-width: 100%; }
      figcaption { font-size: 9.5pt; font-style: italic; margin-top: 3px; }
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
      <p>${escapeHtml(moduleInfo?.academicYear ?? "Tahun ajaran belum diisi")}</p>
    </section>

    <h1>MODUL AJAR</h1>

    <section class="module-sheet">
      <div class="sheet-title">Informasi Umum</div>
      <div class="sheet-subtitle">A. Identitas Modul</div>
      <table class="identity-table">
        ${infoRow("Nama Penyusun", state.teacher.name)}
        ${infoRow("Instansi", state.school.name)}
        ${infoRow("Tahun Ajaran", moduleInfo?.academicYear)}
        ${infoRow("Mata Pelajaran", subject)}
        ${infoRow("Fase/Kelas", phaseClass)}
        ${infoRow("Materi", mainMaterial)}
        ${infoRow("Bab/Pertemuan", moduleInfo?.chapterMeeting)}
        ${infoRowHtml("Alokasi Waktu", `${valueOrPlaceholder(moduleInfo?.timeAllocation)}<br>${valueOrPlaceholder(moduleInfo?.learningMode)}`)}
      </table>
      <div class="sheet-subtitle">B. Komponen Awal</div>
      <div class="sheet-content">${textBlock(competency?.initialCompetency)}</div>
      <div class="sheet-subtitle">C. Profil Pelajar Pancasila</div>
      <ul class="sheet-list">${(competency?.pancasilaProfiles ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li><em>Belum ada data.</em></li>"}</ul>
      <div class="sheet-subtitle">D. Sarana dan Prasarana</div>
      <div class="sheet-content">
        <p><strong>Media:</strong> ${valueOrPlaceholder(moduleInfo?.media)}</p>
        <ul class="sheet-list">
          <li><strong>Alat dan Bahan:</strong> ${valueOrPlaceholder(moduleInfo?.toolsAndMaterials)}</li>
          <li><strong>Sumber belajar:</strong> ${valueOrPlaceholder(moduleInfo?.learningResources)}</li>
          <li><strong>Lapangan:</strong> ${valueOrPlaceholder(moduleInfo?.practiceArea)}</li>
          <li><strong>Peralatan PJOK:</strong> ${valueOrPlaceholder(moduleInfo?.sportEquipment)}</li>
        </ul>
      </div>
      <div class="sheet-subtitle">E. Target Peserta Didik</div>
      <div class="sheet-content"><ul class="sheet-list"><li>${valueOrPlaceholder(moduleInfo?.targetStudents)}</li></ul></div>
      <div class="sheet-subtitle">F. Jumlah Peserta Didik</div>
      <div class="sheet-content"><p>${valueOrPlaceholder(moduleInfo?.studentCount)}</p></div>
      <div class="sheet-subtitle">G. Model Pembelajaran</div>
      <div class="sheet-content">
        <p><strong>Model Pembelajaran:</strong> ${valueOrPlaceholder(moduleInfo?.learningModel)}</p>
        <p><strong>Metode pembelajaran:</strong> ${valueOrPlaceholder(moduleInfo?.learningMethods)}</p>
        <p><strong>Berdiferensiasi:</strong></p>
        <ul class="sheet-list"><li>${valueOrPlaceholder(moduleInfo?.differentiationStrategy)}</li></ul>
      </div>
    </section>

    <section class="module-sheet">
      <div class="sheet-title competency">Kompetensi Inti</div>
      <div class="sheet-subtitle">A. Capaian Pembelajaran</div>
      <ul class="sheet-list"><li>${valueOrPlaceholder(competency?.learningAchievements)}</li></ul>
      <div class="sheet-subtitle">B. Tujuan Pembelajaran</div>
      <ul class="sheet-list">${objectives.map((item) => `<li>${escapeHtml(item.description)}</li>`).join("") || "<li><em>Belum ada data.</em></li>"}</ul>
      <div class="sheet-subtitle">C. Pemahaman Bermakna</div>
      <ul class="sheet-list"><li>${valueOrPlaceholder(competency?.meaningfulUnderstanding)}</li></ul>
      <div class="sheet-subtitle">D. Pertanyaan Pemantik</div>
      <ul class="sheet-list">${(competency?.triggerQuestions ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li><em>Belum ada data.</em></li>"}</ul>
      <div class="sheet-subtitle">E. Asesmen Diagnostik Non-Kognitif</div>
      <div class="sheet-content"><p>Pertanyaan yang diajukan kepada peserta didik meliputi:</p>${listItems(competency?.diagnosticQuestions ?? [])}</div>
      <div class="sheet-subtitle">F. Persiapan Pembelajaran</div>
      <div class="sheet-content">
        <p><strong>Afektif:</strong> ${valueOrPlaceholder(competency?.affectivePreparation)}</p>
        <p><strong>Kognitif:</strong> ${valueOrPlaceholder(competency?.cognitivePreparation)}</p>
        <p><strong>Psikomotor:</strong> ${valueOrPlaceholder(competency?.psychomotorPreparation)}</p>
      </div>
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">G. Urutan Kegiatan Pembelajaran</div>
      ${activityPhaseBlock(moduleActivities.opening, 'Kegiatan Pendahuluan')}
      ${activityPhaseBlock(moduleActivities.core, 'Kegiatan Inti')}
      ${activityPhaseBlock(moduleActivities.closing, 'Kegiatan Penutup')}
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">H. Refleksi Guru</div>
      <div class="sheet-content">${textBlock(moduleActivities.teacherReflection)}</div>
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">I. Refleksi Peserta Didik</div>
      <div class="sheet-content">${textBlock(moduleActivities.studentReflection)}</div>
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">J. Asesmen/Penilaian</div>
    <h3>Asesmen Pembelajaran</h3>
    <h3>Asesmen Diagnostik</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.diagnosticAssessment)}</div>
    <h3>Asesmen Formatif</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.formativeAssessment)}</div>
    <h3>Asesmen Sumatif</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.summativeAssessment)}</div>

    <h3>Rubrik Penilaian Kelompok</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.groupRubricContext)}</div>
    ${rubricTable(moduleAssessments.groupRubric)}
    <h3>Catatan Guru</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.teacherNotes)}</div>

    <h3>Rubrik Penilaian Individu</h3>
    <p><strong>Tujuan:</strong></p>
    <div class="sheet-content">${richTextBlock(moduleAssessments.individualRubricObjective)}</div>
    <p><strong>Waktu Pelaksanaan:</strong></p>
    <div class="sheet-content">${richTextBlock(moduleAssessments.individualRubricTiming)}</div>
    ${rubricTable(moduleAssessments.individualRubric)}
    <h3>Skala Nilai Rubrik Individu</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.individualScoreScale)}</div>

    <h3>Penilaian Praktik</h3>
    <p><strong>Tujuan:</strong></p>
    <div class="sheet-content">${richTextBlock(moduleAssessments.practiceObjective)}</div>
    <p><strong>Waktu Pelaksanaan:</strong></p>
    <div class="sheet-content">${richTextBlock(moduleAssessments.practiceTiming)}</div>
    <p><strong>Instrumen/Tugas:</strong></p>
    <div class="sheet-content">${richTextBlock(moduleAssessments.practiceTask)}</div>
    <p><strong>Total Skor:</strong> ${moduleAssessments.practiceTotalScore || "-"}</p>
    ${scoreTable(moduleAssessments.practiceScores)}
    ${practiceAssessmentTable(moduleAssessments.practiceScores)}
    <h3>Kriteria Penilaian Praktik</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.practiceCriteria)}</div>

    <h3>Refleksi Diri Siswa (Sumatif)</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.studentSelfReflection)}</div>
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">K. Pengayaan dan Remedial</div>
      <table>
      ${infoRow("Pengayaan", moduleInfo?.enrichment)}
      ${infoRow("Remedial", moduleInfo?.remedial)}
      </table>
    </section>

    <section class="module-sheet page-break">
      <div class="sheet-subtitle">L. Lampiran</div>
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
      ${infoRow("Satuan Pendidikan", state.school.name)}
      ${infoRow("Mata Pelajaran", subject)}
      ${infoRow("Kelas/Semester", `Kelas ${topic.classGrade}/${moduleInfo?.semester ?? ""}`)}
      ${infoRow("Tahun Pelajaran", moduleInfo?.academicYear)}
      ${infoRow("Tugas", moduleAssessments.practiceTask)}
    </table>
    ${practiceAssessmentTable(moduleAssessments.practiceScores)}
    <h3>Kriteria Penilaian Praktik</h3>
    ${textBlock(moduleAssessments.practiceCriteria)}

    <h3>Lampiran 5 - Glosarium</h3>
    ${glossaryTable(moduleAppendices.glossary)}

    <h3>Lampiran 6 - File Pendukung</h3>
    ${appendixFileList(moduleAppendices.files)}
    </section>

    <section class="module-sheet">
      <div class="sheet-subtitle">M. Mengetahui / Mengesahkan</div>
    <p class="center">${escapeHtml(moduleInfo?.approvalPlace ?? "Tempat belum diisi")}, ${escapeHtml(moduleInfo?.approvalDate ?? "Tanggal belum diisi")}</p>
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
    </section>
  </body>
</html>`;
}

export function downloadAdministrationDocument({
  selected,
  state,
  topic,
}: {
  selected: BuilderSelection;
  state: AppState;
  topic: LearningTopic;
}) {
  const html = buildAdministrationDocumentHtml({ selected, state, topic });
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${slugify(`administrasi-${topic.title}-kelas-${topic.classGrade}`)}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
