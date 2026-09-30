import type {
  ActivityBlock,
  AppState,
  LearningActivityPhase,
  LearningTopic,
} from "../../core/types";
import {
  getModuleActivities,
  mergeLegacyDifferentiationIntoCore,
} from "../../core/moduleActivities";
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
  if (!value) return "<p><em>Belum ada data.</em></p>";
  if (!/<[a-z][\s\S]*>/i.test(value)) return textBlock(value);

  return constrainRichImages(constrainRichTables(value))
    .replace(/<\/?(script|style)[^>]*>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function constrainRichImages(value: string) {
  return value.replace(/<img\b([^>]*)>/gi, (_match, attributes: string) => {
    const normalizedAttributes = attributes
      .replace(/\s(?:width|height)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(
        /\sstyle=("([^"]*)"|'([^']*)')/gi,
        (
          _styleMatch: string,
          _quotedStyle: string,
          doubleQuotedStyle: string | undefined,
          singleQuotedStyle: string | undefined,
        ) => {
          const style = doubleQuotedStyle ?? singleQuotedStyle ?? "";
          const constrainedStyle = style
            .replace(
              /(?:^|;)\s*(?:width|height|min-width|min-height|max-width|max-height|margin-left|margin-right|left|right)\s*:[^;]*/gi,
              "",
            )
            .replace(/^\s*;|;\s*$/g, "")
            .trim();
          return constrainedStyle ? ` style="${constrainedStyle}"` : "";
        },
      );

    return `<img data-rich-image="true"${normalizedAttributes}>`;
  });
}

function constrainRichTables(value: string) {
  return value.replace(
    /<(table|td|th|col)\b([^>]*)>/gi,
    (_match, tag: string, attributes: string) => {
      const normalizedAttributes = attributes
        .replace(/\swidth=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\sborder=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(
          /\sstyle=("([^"]*)"|'([^']*)')/gi,
          (
            _styleMatch: string,
            quotedStyle: string,
            doubleQuotedStyle: string | undefined,
            singleQuotedStyle: string | undefined,
          ) => {
            const style = doubleQuotedStyle ?? singleQuotedStyle ?? "";
            const constrainedStyle = style
              .replace(
                /(?:^|;)\s*(?:width|min-width|max-width|margin-left|margin-right|left|right|border|font-size)\s*:[^;]*/gi,
                "",
              )
              .replace(/^\s*;|;\s*$/g, "")
              .trim();
            return constrainedStyle ? ` style="${constrainedStyle}"` : "";
          },
        );

      if (tag.toLowerCase() === "table") {
        return `<table border="1" cellspacing="0" cellpadding="0" data-rich-table="true"${normalizedAttributes}>`;
      }

      return `<${tag}${normalizedAttributes}>`;
    },
  );
}

function activityPhaseBlock(
  phase: LearningActivityPhase,
  fallbackTitle: string,
) {
  if (!phase.blocks?.length) {
    return `<h3 class="activity-phase-title">${escapeHtml(phase.title || fallbackTitle)} (${phase.durationMinutes} menit)</h3><div class="sheet-content">${richTextBlock(phase.steps)}</div>`;
  }

  const blocks = phase.blocks;

  return `
    <h3 class="activity-phase-title">${escapeHtml(phase.title || fallbackTitle)} (${phase.durationMinutes} menit)</h3>
    ${blocks.map((block) => activityBlockHtml(block)).join("")}
  `;
}

function activityBlockHtml(block: ActivityBlock) {
  if (block.type === "heading") return `<h3>${escapeHtml(block.content)}</h3>`;
  if (block.type === "callout")
    return `<div class="activity-callout"><strong>Sintaks Diferensiasi:</strong> ${textBlock(block.content)}</div>`;
  if (block.type === "image") {
    if (!block.imageUrl)
      return block.content
        ? `<p><strong>Gambar:</strong> ${escapeHtml(block.content)}</p>`
        : "";
    return `<figure><img alt="${escapeHtml(block.content || block.imageName || "Gambar kegiatan pembelajaran")}" src="${escapeHtml(block.imageUrl)}" />${block.content ? `<figcaption>${escapeHtml(block.content)}</figcaption>` : ""}</figure>`;
  }
  if (block.type === "video") {
    const label = escapeHtml(block.content || "Video pembelajaran");
    const url = block.videoUrl ? escapeHtml(block.videoUrl) : "";
    return url
      ? `<p><strong>${label}:</strong> <a href="${url}">${url}</a></p>`
      : `<p><strong>${label}</strong></p>`;
  }

  const lines = block.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length
    ? `<ul class="activity-list">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "";
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
    content?: string;
  }>,
  topic: LearningTopic,
) {
  if (rows.length === 0) return "<p><em>Belum ada LKPD.</em></p>";

  return rows
    .map(
      (row) => `
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
        ${
          row.content
            ? `<div class="sheet-content">${richTextBlock(row.content)}</div>`
            : `
          <table>
            <tr><th>Petunjuk</th><td>${textBlock(row.instructions)}</td></tr>
            <tr><th>Soal</th><td>${textBlock(row.questions)}</td></tr>
          </table>
          <h3>Jawaban</h3>
          ${textBlock(row.answerArea)}
          ${answerLines(row.type === "Berkelompok" ? 8 : 5)}
          ${row.answerKey ? `<h3>Pedoman Jawaban (Guru)</h3>${textBlock(row.answerKey)}` : ""}`
        }
      `,
    )
    .join("");
}

function readingMaterialBlock(
  rows: Array<{ title: string; content: string }>,
  readingMaterials: string,
) {
  const additionalSections = rows
    .map(
      (row) => `
        <h3>${escapeHtml(row.title)}</h3>
        ${richTextBlock(row.content)}
      `,
    )
    .join("");

  return (
    `${readingMaterials.trim() ? richTextBlock(readingMaterials) : ""}${additionalSections}` ||
    richTextBlock()
  );
}

function glossaryTable(rows: Array<{ term: string; definition: string }>) {
  if (rows.length === 0) return "<p><em>Belum ada glosarium.</em></p>";

  return `
    <h3 class="center">GLOSARIUM</h3>
    <ul class="sheet-list">
      ${rows.map((row) => `<li>${escapeHtml(row.term)}: ${escapeHtml(row.definition)}</li>`).join("")}
    </ul>
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
  const documentTeacher =
    state.teachers.find((teacher) => teacher.id === topic.teacherId) ??
    state.teacher;
  const schoolName = documentTeacher.schoolName || state.school.name;
  const competency = state.moduleCompetencies[topic.id];
  const savedActivities = getModuleActivities(state, topic);
  const moduleActivities = {
    ...savedActivities,
    core: {
      ...savedActivities.core,
      steps: mergeLegacyDifferentiationIntoCore(savedActivities),
    },
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
  const teacherIdentity = documentTeacher.identityNumber
    ? `${documentTeacher.identityType}. ${documentTeacher.identityNumber}`
    : documentTeacher.identityType;
  const subject =
    moduleInfo?.subject ?? "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
  const romanGrades = ["", "I", "II", "III", "IV", "V", "VI"];
  const classRoman = romanGrades[topic.classGrade] ?? String(topic.classGrade);
  const phaseClass = `${moduleInfo?.phase ?? ""} / Kelas ${classRoman}`;
  const materialName = moduleInfo?.mainMaterial || topic.title;
  const subMaterial = moduleInfo?.subMaterial?.trim() ?? "";
  const normalizedMaterial = materialName.toLocaleLowerCase("id-ID");
  const normalizedSubMaterial = subMaterial.toLocaleLowerCase("id-ID");
  const mainMaterial =
    subMaterial && !normalizedMaterial.includes(normalizedSubMaterial)
      ? `${materialName} (${subMaterial})`
      : materialName;
  const hasContent = (value?: string) =>
    Boolean(
      value && (/<img\b/i.test(value) || value.replace(/<[^>]*>/g, "").trim()),
    );
  const hasAssessmentInstrument = Boolean(
    hasContent(moduleAppendices.assessmentInstruments) ||
    moduleAssessments.groupRubric.length ||
    moduleAssessments.individualRubric.length ||
    moduleAssessments.attitudeScores.length ||
    moduleAssessments.knowledgeScores.length ||
    moduleAssessments.practiceScores.length,
  );
  const hasLegacyFullInstrument =
    /rubrik penilaian|format penilaian|asesmen sumatif/i.test(
      moduleAppendices.assessmentInstruments,
    );
  const standardAppendixSections = [
    (hasContent(moduleAppendices.readingMaterials) ||
      moduleAppendices.readingSections.length) && {
      number: 1,
      title: "Bahan Bacaan Guru dan Peserta Didik",
      content: readingMaterialBlock(
        moduleAppendices.readingSections,
        moduleAppendices.readingMaterials,
      ),
    },
    hasContent(moduleAppendices.learningMedia) && {
      number: 2,
      title: "Media Pembelajaran",
      content: `<div class="sheet-content">${richTextBlock(moduleAppendices.learningMedia)}</div>`,
    },
    moduleWorksheets.length > 0 && {
      number: 3,
      title: "LKPD",
      content: worksheetBlocks(moduleWorksheets, topic),
    },
    hasAssessmentInstrument && {
      number: 4,
      title: "Instrumen Penilaian",
      content: hasLegacyFullInstrument
        ? `<div class="sheet-content">${richTextBlock(moduleAppendices.assessmentInstruments)}</div>`
        : `
        <div class="sheet-content">${richTextBlock(moduleAppendices.assessmentInstruments)}</div>
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
          ${infoRow("Satuan Pendidikan", schoolName)}
          ${infoRow("Mata Pelajaran", subject)}
          ${infoRow("Kelas/Semester", `Kelas ${topic.classGrade}/${moduleInfo?.semester ?? ""}`)}
          ${infoRow("Tahun Pelajaran", moduleInfo?.academicYear)}
          ${infoRow("Tugas", moduleAssessments.practiceTask)}
        </table>
        <h3>Kriteria Penilaian Praktik</h3>
        <div class="sheet-content">${richTextBlock(moduleAssessments.practiceCriteria)}</div>`,
    },
    moduleAppendices.glossary.length > 0 && {
      number: 5,
      title: "Glosarium",
      content: glossaryTable(moduleAppendices.glossary),
    },
  ].filter(Boolean) as Array<{
    number: number;
    title: string;
    content: string;
  }>;
  const additionalAppendixSections = [
    ...(moduleAppendices.files.length > 0
      ? [
          {
            title: "File Pendukung",
            content: appendixFileList(moduleAppendices.files),
          },
        ]
      : []),
    ...moduleAppendices.customSections
      .filter((section) => section.title.trim() && hasContent(section.content))
      .map((section) => ({
        title: section.title,
        content: `<div class="sheet-content">${richTextBlock(section.content)}</div>`,
      })),
  ].map((section, index) => ({ ...section, number: index + 6 }));
  const appendixSections = [
    ...standardAppendixSections,
    ...additionalAppendixSections,
  ];

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Administrasi ${escapeHtml(topic.title)}</title>
    <style>
      @page { size: A4; margin: 15mm 14mm; }
      html { background: #e2e8f0; box-sizing: border-box; }
      *, *::before, *::after { box-sizing: inherit; }
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
      table { border-collapse: collapse; border: 1px solid #000000; mso-table-lspace: 0pt; mso-table-rspace: 0pt; table-layout: fixed; width: 100% !important; max-width: 100% !important; margin: 8px 0 12px !important; page-break-inside: auto; }
      table col { width: auto !important; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      td, th { border: 1px solid #000000 !important; mso-border-alt: solid #000000 .5pt; max-width: 0; padding: 4px 7px; text-align: left; vertical-align: top; white-space: normal !important; word-break: break-word; overflow-wrap: anywhere; font-size: 10.5pt; }
      th { background: #f3f4f6; font-weight: bold; }
      table[data-rich-table="true"] { table-layout: auto; }
      table[data-rich-table="true"] td, table[data-rich-table="true"] th { max-width: none; font-size: 9.5pt; overflow-wrap: break-word; word-break: normal; }
      img[data-rich-image="true"] { display: block; width: auto !important; height: auto !important; max-width: 100% !important; max-height: 115mm !important; margin: 7px auto !important; object-fit: contain; }
      ol, ul { margin-top: 5px; padding-left: 24px; }
      li { margin-bottom: 3px; }
      .answer-line { border-bottom: 1px dotted #6b7280; min-height: 20px; }
      .muted { color: #4b5563; }
      .center { text-align: center; }
      .cover { min-height: 267mm; padding: 0; text-align: center !important; mso-text-align: center; page-break-after: always; }
      .cover-title { font-size: 17pt; font-weight: bold; margin: 0 0 2px; text-transform: uppercase; }
      .cover-subtitle { font-size: 15pt; font-weight: bold; line-height: 1.15; margin: 0; text-transform: uppercase; }
      .cover-class { font-size: 15pt; font-weight: bold; line-height: 1.15; margin: 0; text-transform: uppercase; }
      .cover-material-label { font-size: 14pt; font-weight: bold; margin: 3px 0 0; text-transform: uppercase; }
      .cover-material { font-size: 14pt; font-weight: bold; line-height: 1.15; margin: 0; text-transform: uppercase; }
      .cover-logo { display: block; width: auto; height: auto; max-width: 74mm; max-height: 74mm; margin: 27mm auto 31mm; object-fit: contain; }
      .cover-author { font-size: 15pt; font-weight: bold; line-height: 1.16; margin: 0; text-transform: uppercase; }
      .cover-footer { font-size: 15pt; font-weight: bold; line-height: 1.16; margin: 31mm 0 0; text-transform: uppercase; }
      .signature td { height: 90px; }
      .module-sheet { border: 1px solid #000000; margin: 0 0 14px; page-break-inside: auto; }
      table.module-sheet { border: 1px solid #000000 !important; mso-border-alt: solid #000000 .75pt; mso-cellspacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      td.module-sheet-frame { border: 1px solid #000000 !important; mso-border-alt: solid #000000 .75pt; padding: 0 !important; mso-padding-alt: 0in 0in 0in 0in; }
      .sheet-title { background: #DFEBEB; color: #000000; font-size: 10.5pt; font-weight: bold; line-height: 1.1; padding: 4px 8px; text-transform: uppercase; }
      .sheet-title.competency { background: #B1E3D4; }
      .sheet-subtitle { background: #001F5F; border: 0; color: #ffffff; font-size: 10.5pt; font-weight: bold; line-height: 1.1; padding: 4px 12px; text-transform: uppercase; }
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
    <section align="center" class="cover" style="text-align:center;">
      <p align="center" class="cover-title" style="text-align:center;">MODUL AJAR</p>
      <p align="center" class="cover-subtitle" style="text-align:center;">${escapeHtml(subject)}</p>
      <p align="center" class="cover-class" style="text-align:center;">KELAS ${classRoman} SD</p>
      <p align="center" class="cover-material-label" style="text-align:center;">MATERI POKOK</p>
      <p align="center" class="cover-material" style="text-align:center;">${escapeHtml(mainMaterial)}</p>
      ${documentTeacher.institutionLogoUrl ? `<p align="center" style="text-align:center;"><img align="center" class="cover-logo" src="${escapeHtml(documentTeacher.institutionLogoUrl)}" alt="Logo ${escapeHtml(documentTeacher.institutionName || schoolName)}" /></p>` : ""}
      <p align="center" class="cover-author" style="text-align:center;">DISUSUN OLEH : ${escapeHtml(documentTeacher.name)}<br>${escapeHtml(documentTeacher.identityType)} : ${escapeHtml(documentTeacher.identityNumber || "-")}</p>
      <p align="center" class="cover-footer" style="text-align:center;">${escapeHtml(documentTeacher.institutionName || schoolName)}</p>
    </section>


    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-title">Informasi Umum</div>
      <div class="sheet-subtitle">A. Identitas Modul</div>
      <table class="identity-table">
        ${infoRow("Nama Penyusun", documentTeacher.name)}
        ${infoRow("Instansi", schoolName)}
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
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
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
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-subtitle">G. Urutan Kegiatan Pembelajaran</div>
      ${activityPhaseBlock(moduleActivities.opening, "Kegiatan Pendahuluan")}
      ${activityPhaseBlock(moduleActivities.core, "Kegiatan Inti")}
      ${activityPhaseBlock(moduleActivities.closing, "Kegiatan Penutup")}
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-subtitle">H. Refleksi Guru</div>
      <div class="sheet-content">${textBlock(moduleActivities.teacherReflection)}</div>
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-subtitle">I. Refleksi Peserta Didik</div>
      <div class="sheet-content">${textBlock(moduleActivities.studentReflection)}</div>
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
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
    <h3>Kriteria Penilaian Praktik</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.practiceCriteria)}</div>

    <h3>Refleksi Diri Siswa (Sumatif)</h3>
    <div class="sheet-content">${richTextBlock(moduleAssessments.studentSelfReflection)}</div>
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-subtitle">K. Pengayaan dan Remedial</div>
      <table>
      ${infoRow("Pengayaan", moduleInfo?.enrichment)}
      ${infoRow("Remedial", moduleInfo?.remedial)}
      </table>
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet page-break"><tbody><tr><td class="module-sheet-frame">
      <div class="sheet-subtitle">L. Lampiran</div>
    <ul class="sheet-list">${appendixSections.map((section) => `<li>${section.number}. ${escapeHtml(section.title)} (Terlampir)</li>`).join("") || "<li><em>Belum ada lampiran.</em></li>"}</ul>
    ${appendixSections.map((section) => `<h3 class="page-break">Lampiran ${section.number} - ${escapeHtml(section.title)}</h3>${section.content}`).join("")}
    </td></tr></tbody></table>

    <table border="1" cellspacing="0" cellpadding="0" class="module-sheet"><tbody><tr><td class="module-sheet-frame">
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
        <td>${escapeHtml(documentTeacher.principalName || state.school.principalName)}<br>NIP. ${escapeHtml(documentTeacher.principalNip || state.school.principalNip)}</td>
        <td>${escapeHtml(documentTeacher.name)}<br>${escapeHtml(teacherIdentity)}</td>
      </tr>
    </table>
    </td></tr></tbody></table>
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
