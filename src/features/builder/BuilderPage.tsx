import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Save,
  X,
} from "lucide-react";
import { getModuleActivities } from "../../core/moduleActivities";
import { getModuleAppendices } from "../../core/moduleAppendices";
import { getModuleAssessments } from "../../core/moduleAssessments";
import { getModuleCompletion } from "../../core/moduleCompletion";
import { getModuleWorksheets } from "../../core/moduleWorksheets";
import type {
  AdministrationDraft,
  AppState,
  ClassGrade,
  LearningActivityPhase,
  LearningTopic,
} from "../../core/types";
import { createId, className } from "../../core/utils";
import { DraftSummary } from "../../shared/components/DraftSummary";
import { SelectionList } from "../../shared/components/SelectionList";
import { Toast } from "../../shared/components/Toast";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import {
  buildAdministrationDocumentHtml,
  downloadAdministrationDocument,
} from "./documentExport";

type BuilderSelection = {
  objectiveIds: string[];
  materialIds: string[];
  activityIds: string[];
  assessmentIds: string[];
};

type BuilderStepId =
  | "topic"
  | "identity"
  | "competencies"
  | "activities"
  | "assessments"
  | "attachments"
  | "review";

type CompletionItem = {
  complete: boolean;
  label: string;
};

const steps: Array<{ id: BuilderStepId; label: string }> = [
  { id: "topic", label: "Pilih Kelas & Topik" },
  { id: "identity", label: "Identitas Modul" },
  { id: "competencies", label: "Kompetensi & Tujuan" },
  { id: "activities", label: "Aktivitas Pembelajaran" },
  { id: "assessments", label: "Asesmen & Rubrik" },
  { id: "attachments", label: "LKPD & Lampiran" },
  { id: "review", label: "Review Dokumen" },
];

export function BuilderPage({
  selectedTopic,
  setState,
  state,
}: {
  selectedTopic: LearningTopic;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
}) {
  const [step, setStep] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toast, setToast] = useState("");
  const [gradeFilter, setGradeFilter] = useState<ClassGrade>(
    selectedTopic.classGrade,
  );
  const [topicId, setTopicId] = useState(selectedTopic.id);
  const visibleGrades =
    state.teacher.classes.length > 0
      ? state.teacher.classes
      : ([1, 2, 3, 4, 5, 6] as ClassGrade[]);
  const teacherTopics = state.topics.filter(
    (item) => item.teacherId === state.activeTeacherId,
  );
  const filteredTopics = teacherTopics.filter(
    (item) =>
      item.classGrade === gradeFilter &&
      visibleGrades.includes(item.classGrade),
  );
  const topic =
    teacherTopics.find((item) => item.id === topicId) ?? selectedTopic;
  const [selected, setSelected] = useState<BuilderSelection>({
    objectiveIds: state.objectives
      .filter((item) => item.topicId === topic.id)
      .map((item) => item.id),
    materialIds: state.materials
      .filter((item) => item.topicId === topic.id)
      .map((item) => item.id),
    activityIds: state.activities
      .filter((item) => item.topicId === topic.id)
      .map((item) => item.id),
    assessmentIds: state.assessments
      .filter((item) => item.topicId === topic.id)
      .map((item) => item.id),
  });
  const completion = useMemo(
    () => getCompletion(state, topic, selected),
    [state, topic, selected],
  );
  const moduleCompletion = useMemo(
    () => getModuleCompletion(state, topic, selected),
    [state, topic, selected],
  );
  const completedCount = completion.filter((item) => item.complete).length;
  const progress = moduleCompletion.progress;

  function toggle(group: keyof BuilderSelection, id: string) {
    setSelected((current) => ({
      ...current,
      [group]: current[group].includes(id)
        ? current[group].filter((item) => item !== id)
        : [...current[group], id],
    }));
  }

  function selectAll(group: keyof BuilderSelection, ids: string[]) {
    setSelected((current) => ({ ...current, [group]: ids }));
  }

  function resetSelections(nextTopic: LearningTopic) {
    setSelected({
      objectiveIds: state.objectives
        .filter((item) => item.topicId === nextTopic.id)
        .map((item) => item.id),
      materialIds: state.materials
        .filter((item) => item.topicId === nextTopic.id)
        .map((item) => item.id),
      activityIds: state.activities
        .filter((item) => item.topicId === nextTopic.id)
        .map((item) => item.id),
      assessmentIds: state.assessments
        .filter((item) => item.topicId === nextTopic.id)
        .map((item) => item.id),
    });
  }

  function changeGrade(grade: ClassGrade) {
    const firstTopic = teacherTopics.find(
      (item) =>
        item.classGrade === grade && visibleGrades.includes(item.classGrade),
    );
    setGradeFilter(grade);
    if (firstTopic) {
      setTopicId(firstTopic.id);
      resetSelections(firstTopic);
    }
  }

  function buildDraft(): AdministrationDraft {
    const now = new Date().toISOString();
    return {
      id: createId("draft"),
      teacherId: state.activeTeacherId,
      title: `Administrasi ${topic.title} - Kelas ${topic.classGrade}`,
      topicId: topic.id,
      status: "Draft",
      version: 1,
      changeNotes: "Dokumen dibuat dari Penyusun Administrasi.",
      ...selected,
      createdAt: now,
      updatedAt: now,
    };
  }

  function resetBuilder() {
    resetSelections(topic);
    setShowSaveModal(false);
    setStep(0);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function saveDraft() {
    const draft = buildDraft();
    setState((current) => ({ ...current, drafts: [draft, ...current.drafts] }));
    resetBuilder();
    showToast("Draft administrasi berhasil disimpan ke Arsip Administrasi.");
  }

  function saveDraftAndDownload() {
    const draft = buildDraft();
    setState((current) => ({ ...current, drafts: [draft, ...current.drafts] }));
    downloadAdministrationDocument({ selected, state, topic });
    resetBuilder();
    showToast("Draft disimpan dan file Word mulai diunduh.");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-900">
            Progress Dokumen
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {completedCount}/{completion.length} bagian lengkap
          </p>
        </div>
        <div className="grid gap-1">
          {steps.map((item, index) => {
            const status = completion[index];
            return (
              <button
                className={className(
                  "flex min-h-12 items-center gap-3 rounded-md px-3 py-3 text-left text-sm",
                  step === index
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-600 hover:bg-slate-50",
                )}
                key={item.id}
                onClick={() => setStep(index)}
                type="button"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
                {status?.complete ? (
                  <CheckCircle2
                    className="shrink-0 text-emerald-600"
                    size={16}
                  />
                ) : (
                  <AlertCircle className="shrink-0 text-amber-500" size={16} />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Penyusun Administrasi</p>
            <h2 className="text-xl font-semibold">{steps[step].label}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              onClick={() => setShowPreviewModal(true)}
              type="button"
            >
              <Eye size={16} />
              Preview A4
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowSaveModal(true)}
              type="button"
            >
              <Save size={16} />
              Simpan Administrasi
            </button>
          </div>
        </div>

        {steps[step].id === "topic" && (
          <TopicStep
            changeGrade={changeGrade}
            filteredTopics={filteredTopics}
            gradeFilter={gradeFilter}
            onSelectTopic={(nextTopic) => {
              setTopicId(nextTopic.id);
              resetSelections(nextTopic);
            }}
            topicId={topicId}
            visibleGrades={visibleGrades}
          />
        )}
        {steps[step].id === "identity" && (
          <IdentityStep state={state} topic={topic} />
        )}
        {steps[step].id === "competencies" && (
          <CompetenciesStep
            selected={selected}
            selectAll={selectAll}
            state={state}
            toggle={toggle}
            topic={topic}
          />
        )}
        {steps[step].id === "activities" && <ActivitiesStep state={state} topic={topic} />}
        {steps[step].id === "assessments" && <AssessmentsStep state={state} topic={topic} />}
        {steps[step].id === "attachments" && (
          <AttachmentsStep state={state} topic={topic} />
        )}
        {steps[step].id === "review" && (
          <ReviewStep
            completion={completion}
            onPreview={() => setShowPreviewModal(true)}
            progress={progress}
            selected={selected}
            state={state}
            topic={topic}
          />
        )}

        <div className="mt-6 flex justify-between">
          <button
            className="btn-secondary"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Sebelumnya
          </button>
          <button
            className="btn-primary"
            disabled={step === steps.length - 1}
            onClick={() =>
              setStep((current) => Math.min(steps.length - 1, current + 1))
            }
            type="button"
          >
            Selanjutnya
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {showSaveModal && (
        <SaveAdministrationModal
          completion={completion}
          missingRequired={moduleCompletion.missing}
          onClose={() => setShowSaveModal(false)}
          onSave={saveDraft}
          onSaveAndDownload={saveDraftAndDownload}
          progress={progress}
          selected={selected}
          state={state}
          topic={topic}
        />
      )}
      {showPreviewModal && (
        <DocumentPreviewModal
          html={buildAdministrationDocumentHtml({ selected, state, topic })}
          onClose={() => setShowPreviewModal(false)}
          onDownload={() => {
            downloadAdministrationDocument({ selected, state, topic });
            showToast("File Word mulai diunduh.");
          }}
          title={`Administrasi ${topic.title} - Kelas ${topic.classGrade}`}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

function TopicStep({
  changeGrade,
  filteredTopics,
  gradeFilter,
  onSelectTopic,
  topicId,
  visibleGrades,
}: {
  changeGrade: (grade: ClassGrade) => void;
  filteredTopics: LearningTopic[];
  gradeFilter: ClassGrade;
  onSelectTopic: (topic: LearningTopic) => void;
  topicId: string;
  visibleGrades: ClassGrade[];
}) {
  return (
    <div className="grid gap-4">
      <div className="max-w-xs">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Filter Kelas
        </label>
        <select
          className="input"
          onChange={(event) =>
            changeGrade(Number(event.target.value) as ClassGrade)
          }
          value={gradeFilter}
        >
          {visibleGrades.map((grade) => (
            <option key={grade} value={grade}>
              Kelas {grade}
            </option>
          ))}
        </select>
      </div>
      <SelectionList
        items={filteredTopics.map((item) => ({
          id: item.id,
          title: item.title,
          meta: `Kelas ${item.classGrade}`,
        }))}
        onSelect={(id) => {
          const nextTopic = filteredTopics.find((item) => item.id === id);
          if (nextTopic) onSelectTopic(nextTopic);
        }}
        selectedIds={[topicId]}
        single
      />
    </div>
  );
}

function IdentityStep({
  state,
  topic,
}: {
  state: AppState;
  topic: LearningTopic;
}) {
  const info = state.moduleInfo[topic.id];
  const competency = state.moduleCompetencies[topic.id];

  return (
    <ModuleInformationSheet
      competency={competency}
      info={info}
      state={state}
      topic={topic}
    />
  );
}

function ModuleInformationSheet({
  competency,
  info,
  state,
  topic,
}: {
  competency: AppState["moduleCompetencies"][string] | undefined;
  info: AppState["moduleInfo"][string] | undefined;
  state: AppState;
  topic: LearningTopic;
}) {
  const identityRows: Array<[string, string | number | undefined]> = [
    ["Nama Penyusun", state.teacher.name],
    ["Instansi", state.school.name],
    ["Tahun Ajaran", info?.academicYear],
    ["Mata Pelajaran", info?.subject],
    ["Fase/Kelas", `${info?.phase ?? "-"} / Kelas ${topic.classGrade}`],
    ["Materi", info?.mainMaterial],
    ["Bab/Pertemuan", info?.chapterMeeting],
    [
      "Alokasi Waktu",
      [info?.timeAllocation, info?.learningMode].filter(Boolean).join("\n"),
    ],
  ];
  const facilities = [
    ["Media", info?.media],
    ["Alat dan Bahan", info?.toolsAndMaterials],
    ["Sumber Belajar", info?.learningResources],
    ["Lapangan/Tempat Praktik", info?.practiceArea],
    ["Peralatan PJOK", info?.sportEquipment],
  ].filter(([, value]) => Boolean(value));

  return (
    <section className="overflow-hidden border border-black bg-white font-serif shadow-none">
      <p className="bg-[#DFEBEB] px-3 py-1 text-sm font-bold uppercase leading-4 text-black">
        Informasi Umum
      </p>
      <ModuleSheetHeading>A. Identitas Modul</ModuleSheetHeading>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm leading-[1.17] text-black">
          <tbody>
            {identityRows.map(([label, value]) => (
              <tr key={label}>
                <th className="w-[51%] border-r border-black px-3 py-0.5 align-top font-normal">
                  {label}
                </th>
                <td className="whitespace-pre-line px-3 py-0.5 align-top">
                  {value || "Belum diisi"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModuleSheetHeading>B. Komponen Awal</ModuleSheetHeading>
      <ModuleSheetContent value={competency?.initialCompetency} />

      <ModuleSheetHeading>C. Profil Pelajar Pancasila</ModuleSheetHeading>
      <div className="px-5 py-3 text-sm leading-5 text-black">
        {competency?.pancasilaProfiles.length ? (
          <ul className="list-disc space-y-2 pl-5">
            {competency.pancasilaProfiles.map((profile) => (
              <li key={profile}>{profile}</li>
            ))}
          </ul>
        ) : (
          "Belum diisi"
        )}
      </div>

      <ModuleSheetHeading>D. Sarana dan Prasarana</ModuleSheetHeading>
      <div className="space-y-1 px-5 py-2 text-sm leading-5 text-black">
        {facilities.length ? (
          facilities.map(([label, value]) => (
            <p className="whitespace-pre-line" key={label}>
              <span className="font-semibold">{label}:</span> {value}
            </p>
          ))
        ) : (
          <p>Belum diisi</p>
        )}
      </div>

      <ModuleSheetHeading>E. Target Peserta Didik</ModuleSheetHeading>
      <ModuleSheetContent value={info?.targetStudents} />

      <ModuleSheetHeading>F. Jumlah Peserta Didik</ModuleSheetHeading>
      <ModuleSheetContent value={info?.studentCount || undefined} />

      <ModuleSheetHeading>G. Model Pembelajaran</ModuleSheetHeading>
      <div className="space-y-1 px-5 py-2 text-sm leading-5 text-black">
        <p>
          <span className="font-semibold">Model:</span>{" "}
          {info?.learningModel || "Belum diisi"}
        </p>
        <p>
          <span className="font-semibold">Metode:</span>{" "}
          {info?.learningMethods || "Belum diisi"}
        </p>
        <p>
          <span className="font-semibold">Berdiferensiasi:</span>{" "}
          {info?.differentiationStrategy || "Belum diisi"}
        </p>
      </div>
    </section>
  );
}

function ModuleSheetHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-y border-black bg-[#001F5F] px-3 py-1 text-sm font-bold uppercase leading-4 text-white">
      {children}
    </h3>
  );
}

function ModuleSheetContent({ value }: { value?: string | number }) {
  return (
    <p className="whitespace-pre-line px-3 py-2 text-sm leading-5 text-black">
      {value || "Belum diisi"}
    </p>
  );
}

function CompetenciesStep({
  selected,
  selectAll,
  state,
  toggle,
  topic,
}: {
  selected: BuilderSelection;
  selectAll: (group: keyof BuilderSelection, ids: string[]) => void;
  state: AppState;
  toggle: (group: keyof BuilderSelection, id: string) => void;
  topic: LearningTopic;
}) {
  const competency = state.moduleCompetencies[topic.id];
  const objectiveIds = state.objectives
    .filter((item) => item.topicId === topic.id)
    .map((item) => item.id);
  const objectives = state.objectives.filter(
    (item) => item.topicId === topic.id,
  );

  return (
    <div className="grid gap-5">
      <CompetencySheet
        competency={competency}
        objectives={objectives.map((item) => item.description)}
      />
      <SelectablePanel
        actionLabel="Pilih semua tujuan"
        onSelectAll={() => selectAll("objectiveIds", objectiveIds)}
        title="Tujuan Pembelajaran Terpilih"
      >
        <SelectionList
          items={state.objectives
            .filter((item) => item.topicId === topic.id)
            .map((item) => ({
              id: item.id,
              title: item.description,
              meta: item.title,
            }))}
          onSelect={(id) => toggle("objectiveIds", id)}
          selectedIds={selected.objectiveIds}
        />
      </SelectablePanel>
    </div>
  );
}

function CompetencySheet({
  competency,
  objectives,
}: {
  competency: AppState["moduleCompetencies"][string] | undefined;
  objectives: string[];
}) {
  return (
    <section className="overflow-hidden border border-black bg-white font-serif shadow-none">
      <p className="bg-[#B1E3D4] px-3 py-1 text-sm font-bold uppercase leading-4 text-black">
        Kompetensi Inti
      </p>
      <ModuleSheetHeading>A. Capaian Pembelajaran</ModuleSheetHeading>
      <ModuleSheetList
        items={
          competency?.learningAchievements
            ? [competency.learningAchievements]
            : []
        }
      />
      <ModuleSheetHeading>B. Tujuan Pembelajaran</ModuleSheetHeading>
      <ModuleSheetList items={objectives} />
      <ModuleSheetHeading>C. Pemahaman Bermakna</ModuleSheetHeading>
      <ModuleSheetList
        items={
          competency?.meaningfulUnderstanding
            ? [competency.meaningfulUnderstanding]
            : []
        }
      />
      <ModuleSheetHeading>D. Pertanyaan Pemantik</ModuleSheetHeading>
      <ModuleSheetList items={competency?.triggerQuestions ?? []} />
      <ModuleSheetHeading>
        E. Asesmen Diagnostik Non-Kognitif
      </ModuleSheetHeading>
      <div className="px-3 py-2 text-sm leading-5 text-black">
        <p>Pertanyaan yang diajukan kepada peserta didik meliputi:</p>
        {competency?.diagnosticQuestions.length ? (
          <ol className="list-decimal pl-7">
            {competency.diagnosticQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : (
          <p>Belum diisi</p>
        )}
      </div>
      <ModuleSheetHeading>F. Persiapan Pembelajaran</ModuleSheetHeading>
      <div className="space-y-3 px-3 py-2 text-sm leading-5 text-black">
        <p>
          <strong>Afektif:</strong>{" "}
          {competency?.affectivePreparation || "Belum diisi"}
        </p>
        <p>
          <strong>Kognitif:</strong>{" "}
          {competency?.cognitivePreparation || "Belum diisi"}
        </p>
        <p>
          <strong>Psikomotor:</strong>{" "}
          {competency?.psychomotorPreparation || "Belum diisi"}
        </p>
      </div>
    </section>
  );
}

function ModuleSheetList({ items }: { items: string[] }) {
  if (items.length === 0) return <ModuleSheetContent value={undefined} />;

  return (
    <ul className="space-y-1 px-5 py-2 text-sm leading-5 text-black">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span aria-hidden="true">➢</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MaterialsStep({
  selected,
  selectAll,
  state,
  toggle,
  topic,
}: {
  selected: BuilderSelection;
  selectAll: (group: keyof BuilderSelection, ids: string[]) => void;
  state: AppState;
  toggle: (group: keyof BuilderSelection, id: string) => void;
  topic: LearningTopic;
}) {
  const materialIds = state.materials
    .filter((item) => item.topicId === topic.id)
    .map((item) => item.id);

  return (
    <SelectablePanel
      actionLabel="Pilih semua materi"
      onSelectAll={() => selectAll("materialIds", materialIds)}
      title="Materi & Media Terpilih"
    >
      <SelectionList
        items={state.materials
          .filter((item) => item.topicId === topic.id)
          .map((item) => ({
            id: item.id,
            title: item.title,
            meta: item.attachment?.name ?? "Materi teks",
          }))}
        onSelect={(id) => toggle("materialIds", id)}
        selectedIds={selected.materialIds}
      />
    </SelectablePanel>
  );
}

function ActivitiesStep({ state, topic }: { state: AppState; topic: LearningTopic }) {
  const moduleActivities = getModuleActivities(state, topic);
  return (
    <div className="grid gap-5">
      <ActivityDocumentPreview activities={moduleActivities} />
    </div>
  );
}

function ActivityDocumentPreview({
  activities,
}: {
  activities: {
    closing: LearningActivityPhase;
    core: LearningActivityPhase;
    opening: LearningActivityPhase;
  };
}) {
  const phases: Array<[string, LearningActivityPhase]> = [
    ["A. Kegiatan Pendahuluan", activities.opening],
    ["B. Kegiatan Inti", activities.core],
    ["C. Kegiatan Penutup", activities.closing],
  ];

  return (
    <section className="overflow-hidden border border-black bg-white font-serif shadow-sm">
      <p className="bg-[#DFEBEB] px-3 py-1 text-sm font-bold uppercase leading-4 text-black">Urutan Kegiatan Pembelajaran</p>
      {phases.map(([label, phase]) => (
        <article className="border-t border-black" key={label}>
          <h3 className="px-3 py-1 text-sm font-bold uppercase leading-5 text-black">
            {label} ({phase.durationMinutes} menit)
          </h3>
          {phase.title && phase.title !== "Pendahuluan" && phase.title !== "Inti" && phase.title !== "Penutup" && (
            <p className="px-4 pb-1 text-sm font-semibold text-black">{phase.title}</p>
          )}
          <div
            className="px-4 pb-4 text-sm leading-6 text-black [&_a]:text-blue-700 [&_a]:underline [&_h3]:mt-3 [&_h3]:font-bold [&_img]:my-3 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:rounded [&_li]:ml-5 [&_ol]:my-2 [&_ul]:my-2"
            dangerouslySetInnerHTML={{ __html: activityPreviewHtml(phase.steps) }}
          />
        </article>
      ))}
    </section>
  );
}

function activityPreviewHtml(value: string) {
  if (!value) return '<p><em>Belum diisi</em></p>';
  if (!/<[a-z][\s\S]*>/i.test(value)) return `<p>${escapePreviewHtml(value)}</p>`;

  return value
    .replace(/<\/?(script|style)[^>]*>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function escapePreviewHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function AssessmentsStep({ state, topic }: { state: AppState; topic: LearningTopic }) {
  const moduleAssessments = getModuleAssessments(state, topic);

  return (
    <div className="grid gap-5">
      <ReadOnlyTable
        caption="Asesmen dan rubrik terstruktur otomatis masuk ke export Word."
        rows={[
          ["Diagnostik", moduleAssessments.diagnosticAssessment],
          ["Formatif", moduleAssessments.formativeAssessment],
          ["Sumatif", moduleAssessments.summativeAssessment],
          ["Konteks Rubrik Kelompok", moduleAssessments.groupRubricContext],
          ["Rubrik Kelompok", `${moduleAssessments.groupRubric.length} aspek`],
          ["Catatan Guru", moduleAssessments.teacherNotes],
          [
            "Rubrik Individu",
            `${moduleAssessments.individualRubric.length} aspek`,
          ],
          [
            "Tujuan Rubrik Individu",
            moduleAssessments.individualRubricObjective,
          ],
          ["Waktu Rubrik Individu", moduleAssessments.individualRubricTiming],
          ["Skala Nilai Individu", moduleAssessments.individualScoreScale],
          ["Tujuan Penilaian Praktik", moduleAssessments.practiceObjective],
          ["Waktu Penilaian Praktik", moduleAssessments.practiceTiming],
          ["Tugas Praktik", moduleAssessments.practiceTask],
          ["Total Skor Praktik", moduleAssessments.practiceTotalScore],
          ["Kriteria Praktik", moduleAssessments.practiceCriteria],
          ["Refleksi Diri Siswa", moduleAssessments.studentSelfReflection],
        ]}
      />
    </div>
  );
}

function AttachmentsStep({
  state,
  topic,
}: {
  state: AppState;
  topic: LearningTopic;
}) {
  const worksheets = getModuleWorksheets(state, topic);
  const appendices = getModuleAppendices(state, topic);
  const moduleAssessments = getModuleAssessments(state, topic);

  return (
    <div className="grid gap-5">
      <ReadOnlyTable
        caption="LKPD otomatis masuk ke export Word."
        rows={[
          [
            "LKPD Berkelompok",
            `${worksheets.filter((item) => item.type === "Berkelompok").length} item`,
          ],
          [
            "LKPD Individu",
            `${worksheets.filter((item) => item.type === "Individu").length} item`,
          ],
        ]}
      />
      <ReadOnlyTable
        caption="Lampiran otomatis masuk ke export Word."
        rows={[
          [
            "Bahan Bacaan",
            appendices.readingSections.length > 0
              ? `${appendices.readingSections.length} subbagian`
              : appendices.readingMaterials,
          ],
          ["Media Pembelajaran", appendices.learningMedia],
          ["Instrumen Penilaian", appendices.assessmentInstruments],
          ["Format Penilaian Sikap", `${moduleAssessments.attitudeScores.length} aspek`],
          ["Format Penilaian Pengetahuan", `${moduleAssessments.knowledgeScores.length} aspek`],
          ["Format Penilaian Praktik", `${moduleAssessments.practiceScores.length} aspek`],
          ["Glosarium", `${appendices.glossary.length} istilah`],
          ["File Pendukung", `${appendices.files.length} file`],
        ]}
      />
    </div>
  );
}

function ReviewStep({
  completion,
  onPreview,
  progress,
  selected,
  state,
  topic,
}: {
  completion: CompletionItem[];
  onPreview: () => void;
  progress: number;
  selected: BuilderSelection;
  state: AppState;
  topic: LearningTopic;
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-blue-100 text-blue-700">
              <FileText size={19} />
            </div>
            <div>
              <p className="font-semibold">Administrasi {topic.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                Kelas {topic.classGrade} | PJOK | Kelengkapan {progress}%
              </p>
            </div>
          </div>
          <button
            className="btn-primary md:shrink-0"
            onClick={onPreview}
            type="button"
          >
            <Eye size={16} />
            Preview Dokumen A4
          </button>
        </div>
      </section>
      <CompletionGrid completion={completion} />
      <DraftSummary selected={selected} state={state} topic={topic} />
    </div>
  );
}

function SelectablePanel({
  actionLabel,
  children,
  onSelectAll,
  title,
}: {
  actionLabel: string;
  children: ReactNode;
  onSelectAll: () => void;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="btn-secondary" onClick={onSelectAll} type="button">
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyTable({
  caption,
  rows,
}: {
  caption: string;
  rows: Array<[string, string | number | undefined]>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <p className="mb-3 text-sm text-slate-500">{caption}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="w-56 border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700">
                  {label}
                </th>
                <td className="whitespace-pre-line border border-slate-200 p-3 text-slate-600">
                  {value || "Belum diisi"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompletionGrid({ completion }: { completion: CompletionItem[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {completion.map((item) => (
        <div
          className={className(
            "flex items-center gap-2 rounded-md border p-3 text-sm",
            item.complete
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800",
          )}
          key={item.label}
        >
          {item.complete ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SaveAdministrationModal({
  completion,
  missingRequired,
  onClose,
  onSave,
  onSaveAndDownload,
  progress,
  selected,
  state,
  topic,
}: {
  completion: CompletionItem[];
  missingRequired: string[];
  onClose: () => void;
  onSave: () => void;
  onSaveAndDownload: () => void;
  progress: number;
  selected: BuilderSelection;
  state: AppState;
  topic: LearningTopic;
}) {
  const completeItems = completion.filter((item) => item.complete);
  const missingItems = completion.filter((item) => !item.complete);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Konfirmasi penyimpanan</p>
            <h2 className="text-xl font-semibold">Simpan Administrasi</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            title="Tutup"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold">Administrasi {topic.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            Kelas {topic.classGrade} | Kelengkapan {progress}% |{" "}
            {completeItems.length}/{completion.length} bagian lengkap
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatusList
            items={completeItems.map((item) => item.label)}
            title="Komponen Lengkap"
            tone="success"
          />
          <StatusList
            items={missingItems.map((item) => item.label)}
            title="Komponen Masih Kosong"
            tone="warning"
          />
        </div>
        {missingRequired.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Peringatan sebelum export
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Dokumen tetap bisa disimpan atau diunduh, tetapi field wajib
              berikut belum lengkap:
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-amber-800">
              {missingRequired.slice(0, 8).map((item) => (
                <li key={item}>- {item}</li>
              ))}
              {missingRequired.length > 8 && (
                <li>+{missingRequired.length - 8} field lainnya.</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <DraftSummary
            selected={selected}
            state={state}
            topic={topic}
            compact
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={onClose} type="button">
            Batal
          </button>
          <button className="btn-secondary" onClick={onSave} type="button">
            <Save size={16} />
            Simpan Draft
          </button>
          <button
            className="btn-primary"
            onClick={onSaveAndDownload}
            type="button"
          >
            <Download size={16} />
            Simpan & Download Word
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusList({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "success" | "warning";
}) {
  return (
    <div
      className={className(
        "rounded-md border p-4",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
      )}
    >
      <p
        className={className(
          "text-sm font-semibold",
          tone === "success" ? "text-emerald-900" : "text-amber-900",
        )}
      >
        {title}
      </p>
      <ul className="mt-2 grid gap-1 text-sm text-slate-700">
        {items.length > 0 ? (
          items.map((item) => <li key={item}>- {item}</li>)
        ) : (
          <li>Tidak ada.</li>
        )}
      </ul>
    </div>
  );
}

function getCompletion(
  state: AppState,
  topic: LearningTopic,
  selected: BuilderSelection,
): CompletionItem[] {
  const moduleCompletion = getModuleCompletion(state, topic, selected);

  return [
    { label: "Pilih Kelas & Topik", complete: Boolean(topic.id) },
    {
      label: "Identitas Modul",
      complete: Boolean(
        moduleCompletion.sections.find(
          (section) => section.label === "Identitas Modul",
        )?.complete,
      ),
    },
    {
      label: "Kompetensi & Tujuan",
      complete: Boolean(
        moduleCompletion.sections.find(
          (section) => section.label === "Kompetensi & Tujuan",
        )?.complete,
      ),
    },
    {
      label: "Aktivitas Pembelajaran",
      complete: Boolean(
        moduleCompletion.sections.find(
          (section) => section.label === "Aktivitas Pembelajaran",
        )?.complete,
      ),
    },
    {
      label: "Asesmen & Rubrik",
      complete: Boolean(
        moduleCompletion.sections.find(
          (section) => section.label === "Asesmen & Rubrik",
        )?.complete,
      ),
    },
    {
      label: "LKPD & Lampiran",
      complete: Boolean(
        moduleCompletion.sections.find((section) => section.label === "LKPD")
          ?.complete &&
        moduleCompletion.sections.find(
          (section) => section.label === "Lampiran",
        )?.complete,
      ),
    },
    { label: "Review Dokumen", complete: true },
  ];
}
