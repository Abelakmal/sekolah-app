import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type {
  AppState,
  BankTab,
  LearningMaterial,
  LearningObjective,
  LearningTopic,
  MaterialAttachment,
  ModuleCompetency,
  ModuleInfo,
} from "../../../core/types";
import { supabase } from "../../../core/supabase/client";
import {
  applyTopicModuleData,
  getTopicModuleData,
} from "../../../core/supabase/topicModuleData";
import type {
  SupabaseTopicModuleData,
  TopicModuleData,
} from "../../../core/supabase/topicModuleData";
import {
  className,
  createId,
  maxAttachmentBytes,
  readAttachment,
} from "../../../core/utils";
import { getModuleActivities } from "../../../core/moduleActivities";
import { getModuleAppendices } from "../../../core/moduleAppendices";
import { getModuleAssessments } from "../../../core/moduleAssessments";
import { getModuleWorksheets } from "../../../core/moduleWorksheets";
import {
  SearchField,
  NumberField,
  TextArea as BaseTextArea,
  TextField,
} from "../../../shared/components/FormControls";
import { FormPanel } from "../../../shared/components/FormPanel";
import { confirmDelete } from "../../../shared/utils/confirmDelete";
import { ActivitiesTab } from "./ActivitiesTab";
import { AppendicesTab } from "./AppendicesTab";
import { AssessmentsTab } from "./AssessmentsTab";
import { AutoSavedNotice, BankSection } from "./BankSection";
import { CrudSection } from "./CrudSection";
import { TemplateActions } from "./TemplateActions";

const bankLabels: Record<BankTab, string> = {
  "module-info": "Informasi Modul",
  competencies: "Kompetensi & Tujuan",
  activities: "Aktivitas Pembelajaran",
  assessments: "Asesmen & Rubrik",
  attachments: "Lampiran",
};

const bankTabs = Object.keys(bankLabels) as BankTab[];

type ModuleSearchResult = {
  id: string;
  preview: string;
  tab: BankTab;
  targetId: string;
  title: string;
};

function TextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <BaseTextArea
      className="min-h-32"
      label={label}
      onChange={onChange}
      value={value}
    />
  );
}

type BankTabProps = {
  query: string;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
  topic: LearningTopic;
};

export function TopicDetailPanel({
  activeTab,
  onBack,
  onTopicTabChange,
  selectedTopic,
  setState,
  state,
}: {
  activeTab: BankTab;
  onBack: () => void;
  onTopicTabChange: (tab: BankTab) => void;
  selectedTopic: LearningTopic;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
}) {
  const [query, setQuery] = useState("");
  const [isRemoteDataReady, setIsRemoteDataReady] = useState(false);
  const info = getModuleInfo(state, selectedTopic);
  const searchResults = getModuleSearchResults(state, selectedTopic, info, query);
  const activeTabIndex = bankTabs.indexOf(activeTab);
  const previousTab = bankTabs[activeTabIndex - 1];
  const nextTab = bankTabs[activeTabIndex + 1];

  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  function openSearchResult(result: ModuleSearchResult) {
    setQuery("");
    onTopicTabChange(result.tab);
    const sectionId = getSearchSectionId(result.targetId);

    let attempts = 0;
    const scrollToResult = () => {
      if (document.getElementById(sectionId)) {
        window.dispatchEvent(new CustomEvent("bank-search-focus", { detail: { targetId: sectionId } }));
      }
      const target = document.getElementById(result.targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < 6) window.setTimeout(scrollToResult, 80);
    };
    window.setTimeout(scrollToResult, 80);
  }

  useEffect(() => {
    let isCurrent = true;
    setIsRemoteDataReady(false);

    async function loadTopicModuleData() {
      const { data, error } = await supabase
        .from("topic_module_data")
        .select("topic_id,data")
        .eq("topic_id", selectedTopic.id)
        .maybeSingle<SupabaseTopicModuleData>();

      if (!isCurrent) return;
      if (error) {
        console.error("Data modul gagal dimuat dari Supabase.", error);
        return;
      }
      if (data?.data) {
        setState((current) =>
          applyTopicModuleData(current, selectedTopic.id, data.data),
        );
      }
      setIsRemoteDataReady(true);
    }

    void loadTopicModuleData();
    return () => {
      isCurrent = false;
    };
  }, [selectedTopic.id, setState]);

  const remoteModuleData = getTopicModuleData(state, selectedTopic.id);
  const remoteModuleDataKey = JSON.stringify(remoteModuleData);

  useEffect(() => {
    if (!isRemoteDataReady) return;

    const timer = window.setTimeout(() => {
      void supabase
        .from("topic_module_data")
        .upsert(
          {
            data: JSON.parse(remoteModuleDataKey) as TopicModuleData,
            teacher_id: selectedTopic.teacherId,
            topic_id: selectedTopic.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "topic_id" },
        )
        .then(({ error }) => {
          if (error) console.error("Data modul gagal disimpan ke Supabase.", error);
        });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isRemoteDataReady, remoteModuleDataKey, selectedTopic.id, selectedTopic.teacherId]);

  return (
    <div className="grid gap-4 xl:h-[calc(100vh-116px)] xl:min-h-0 xl:grid-cols-[300px_minmax(0,1fr)] xl:overflow-hidden 2xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="grid gap-3 xl:min-h-0 xl:content-start xl:overflow-y-auto">
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <button
            className="btn-secondary h-9 px-3 text-sm"
            onClick={onBack}
            type="button"
          >
            Kembali
          </button>
          <h2 className="mt-3 text-base font-semibold leading-6 text-slate-950">
            {selectedTopic.title}
          </h2>
          <div className="mt-3 grid gap-2">
            <InfoChip
              label="Kelas"
              value={`Kelas ${selectedTopic.classGrade}`}
            />
            <InfoChip
              label="Alokasi"
              value={info.timeAllocation || "Belum diisi"}
              muted={!info.timeAllocation}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Step Aktif
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            {bankLabels[activeTab]}
          </h3>
          <div className="mt-2">
            <TemplateActions
              selectedTopic={selectedTopic}
              setState={setState}
              state={state}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
            <button
              className="btn-secondary h-9 px-2 text-xs"
              disabled={!previousTab}
              onClick={() => previousTab && onTopicTabChange(previousTab)}
              type="button"
            >
              <ChevronLeft size={15} />
              Kembali
            </button>
            <button
              className="btn-primary h-9 px-2 text-xs"
              disabled={!nextTab}
              onClick={() => nextTab && onTopicTabChange(nextTab)}
              type="button"
            >
              Lanjut
              <ChevronRight size={15} />
            </button>
          </div>
        </section>
      </aside>

      <section className="min-w-0 grid gap-3 xl:min-h-0 xl:grid-rows-[auto_1fr] xl:overflow-hidden">
          <div className="rounded-lg border border-slate-200 bg-white p-3 xl:shrink-0">
            <div className="max-w-lg">
              <SearchField
                className="input h-9 pl-9 text-sm"
                onChange={setQuery}
                placeholder="Cari seluruh isi modul..."
                value={query}
              />
              {query.trim().length >= 2 && (
                <div className="relative">
                  <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          className="block w-full rounded-md px-3 py-2 text-left hover:bg-blue-50"
                          key={result.id}
                          onClick={() => openSearchResult(result)}
                          type="button"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                              {result.title}
                            </span>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {bankLabels[result.tab]}
                            </span>
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500">
                            {result.preview}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-sm text-slate-500">Tidak ada hasil di modul ini.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        <div className="min-w-0 min-h-0 xl:overflow-y-auto xl:pr-1">
          <div className="min-w-0 max-w-full overflow-x-hidden" id={`bank-tab-${activeTab}`}>
            <BankTabContent
              query={query}
              setState={setState}
              state={state}
              tab={activeTab}
              topic={selectedTopic}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function BankTabContent({
  query,
  setState,
  state,
  tab,
  topic,
}: {
  query: string;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
  tab: BankTab;
  topic: LearningTopic;
}) {
  if (tab === "module-info")
    return <ModuleInfoTab setState={setState} state={state} topic={topic} />;
  if (tab === "competencies")
    return (
      <CompetenciesTab
        query={query}
        setState={setState}
        state={state}
        topic={topic}
      />
    );
  if (tab === "activities")
    return (
      <ActivitiesTab
        query={query}
        setState={setState}
        state={state}
        topic={topic}
      />
    );
  if (tab === "assessments")
    return (
      <AssessmentsTab
        setState={setState}
        state={state}
        topic={topic}
      />
    );
  return (
    <AppendicesTab
      query={query}
      setState={setState}
      state={state}
      topic={topic}
    />
  );
}

function getModuleInfo(state: AppState, topic: LearningTopic): ModuleInfo {
  return (
    state.moduleInfo[topic.id] ?? {
      ...fallbackModuleInfo,
      phase: topic.classGrade >= 5 ? "C" : topic.classGrade >= 3 ? "B" : "A",
      mainMaterial: topic.title,
      subMaterial: topic.title,
      targetStudents: `Peserta didik kelas ${topic.classGrade} dengan kemampuan bervariasi.`,
    }
  );
}

const fallbackModuleCompetency: ModuleCompetency = {
  initialCompetency: "",
  pancasilaProfiles: [],
  learningAchievements: "",
  meaningfulUnderstanding: "",
  triggerQuestions: [],
  diagnosticQuestions: [],
  affectivePreparation: "",
  cognitivePreparation: "",
  psychomotorPreparation: "",
};

function getModuleCompetency(
  state: AppState,
  topic: LearningTopic,
): ModuleCompetency {
  return state.moduleCompetencies[topic.id] ?? fallbackModuleCompetency;
}

function getModuleSearchResults(
  state: AppState,
  topic: LearningTopic,
  moduleInfo: ModuleInfo,
  query: string,
): ModuleSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  if (normalizedQuery.length < 2) return [];

  const results: ModuleSearchResult[] = [];
  const add = (tab: BankTab, title: string, value: string | string[], id: string) => {
    const preview = searchPlainText(Array.isArray(value) ? value.join(" ") : value);
    const titleMatches = title.toLocaleLowerCase("id-ID").includes(normalizedQuery);
    if (!titleMatches && !preview.toLocaleLowerCase("id-ID").includes(normalizedQuery)) return;
    results.push({
      id,
      preview: preview || "Bagian ini belum memiliki isi.",
      tab,
      targetId: getSearchTargetId(tab, id),
      title,
    });
  };

  const infoFields: Array<[string, string]> = [
    ["Tahun Ajaran", moduleInfo.academicYear],
    ["Mata Pelajaran", moduleInfo.subject],
    ["Fase", moduleInfo.phase],
    ["Materi Pokok", moduleInfo.mainMaterial],
    ["Sub Materi", moduleInfo.subMaterial],
    ["Bab/Pertemuan", moduleInfo.chapterMeeting],
    ["Alokasi Waktu", moduleInfo.timeAllocation],
    ["Target Peserta Didik", moduleInfo.targetStudents],
    ["Jumlah Peserta Didik", String(moduleInfo.studentCount || "")],
    ["Model Pembelajaran", moduleInfo.learningModel],
    ["Metode Pembelajaran", moduleInfo.learningMethods],
    ["Strategi Pembelajaran Berdiferensiasi", moduleInfo.differentiationStrategy],
    ["Media", moduleInfo.media],
    ["Alat dan Bahan", moduleInfo.toolsAndMaterials],
    ["Sumber Belajar", moduleInfo.learningResources],
    ["Lapangan/Tempat Praktik", moduleInfo.practiceArea],
    ["Peralatan PJOK", moduleInfo.sportEquipment],
    ["Pengayaan", moduleInfo.enrichment],
    ["Remedial", moduleInfo.remedial],
  ];
  infoFields.forEach(([title, value], index) => add("module-info", title, value, `info-${index}`));

  const competency = getModuleCompetency(state, topic);
  add("module-info", "Komponen Awal", competency.initialCompetency, "module-info-initial");
  add("module-info", "Profil Pelajar Pancasila", competency.pancasilaProfiles, "module-info-pancasila");
  [
    ["Capaian Pembelajaran", competency.learningAchievements],
    ["Pemahaman Bermakna", competency.meaningfulUnderstanding],
    ["Pertanyaan Pemantik", competency.triggerQuestions],
    ["Asesmen Diagnostik Non-Kognitif", competency.diagnosticQuestions],
    ["Persiapan Afektif", competency.affectivePreparation],
    ["Persiapan Kognitif", competency.cognitivePreparation],
    ["Persiapan Psikomotor", competency.psychomotorPreparation],
  ].forEach(([title, value], index) => add("competencies", title as string, value as string | string[], `competency-${index}`));
  state.objectives.filter((item) => item.topicId === topic.id).forEach((item) => add("competencies", `Tujuan: ${item.title}`, item.description, item.id));
  state.materials.filter((item) => item.topicId === topic.id).forEach((item) => add("competencies", `Materi: ${item.title}`, `${item.description} ${item.videoUrl ?? ""} ${item.attachment?.name ?? ""}`, item.id));

  const activities = getModuleActivities(state, topic);
  [
    ["Kegiatan Pendahuluan", activities.opening.steps],
    ["Kegiatan Inti", activities.core.steps],
    ["Kegiatan Penutup", activities.closing.steps],
    ["Diferensiasi Konten", activities.contentDifferentiation],
    ["Diferensiasi Proses", activities.processDifferentiation],
    ["Diferensiasi Lingkungan", activities.environmentDifferentiation],
    ["Refleksi Guru", activities.teacherReflection],
    ["Refleksi Peserta Didik", activities.studentReflection],
  ].forEach(([title, value], index) => add("activities", title, value, `activity-${index}`));
  state.activities.filter((item) => item.topicId === topic.id).forEach((item) => add("activities", `Aktivitas: ${item.name}`, item.steps, item.id));

  const assessments = getModuleAssessments(state, topic);
  [
    ["Asesmen Diagnostik", assessments.diagnosticAssessment],
    ["Asesmen Formatif", assessments.formativeAssessment],
    ["Asesmen Sumatif", assessments.summativeAssessment],
    ["Konteks Rubrik Kelompok", assessments.groupRubricContext],
    ["Catatan Guru", assessments.teacherNotes],
    ["Tujuan Rubrik Individu", assessments.individualRubricObjective],
    ["Waktu Rubrik Individu", assessments.individualRubricTiming],
    ["Skala Nilai Rubrik Individu", assessments.individualScoreScale],
    ["Tujuan Penilaian Praktik", assessments.practiceObjective],
    ["Waktu Penilaian Praktik", assessments.practiceTiming],
    ["Instrumen/Tugas Praktik", assessments.practiceTask],
    ["Kriteria Penilaian Praktik", assessments.practiceCriteria],
    ["Refleksi Diri Siswa", assessments.studentSelfReflection],
  ].forEach(([title, value], index) => add("assessments", title, value, `assessment-${index}`));
  assessments.groupRubric.forEach((row) => add("assessments", `Rubrik Kelompok: ${row.aspect}`, `${row.excellent} ${row.good} ${row.fair} ${row.needsImprovement}`, row.id));
  assessments.individualRubric.forEach((row) => add("assessments", `Rubrik Individu: ${row.aspect}`, `${row.excellent} ${row.good} ${row.fair} ${row.needsImprovement}`, row.id));

  const appendices = getModuleAppendices(state, topic);
  add("attachments", "Lampiran", "Bahan bacaan, media pembelajaran, LKPD, instrumen penilaian, dan dokumen pendukung.", "attachments-tab");
  add("attachments", "Lampiran 1 — Bahan Bacaan", appendices.readingMaterials, "reading-materials");
  add("attachments", "Lampiran 2 — Media Pembelajaran", appendices.learningMedia, "learning-media");
  add("attachments", "Lampiran 4 — Instrumen Penilaian", appendices.assessmentInstruments, "assessment-instruments");
  appendices.readingSections.forEach((item) => add("attachments", `Lampiran 1 — Bahan Bacaan: ${item.title}`, item.content, item.id));
  getModuleWorksheets(state, topic).forEach((item) => add("attachments", `Lampiran 3 — LKPD ${item.type}: ${item.title}`, `${item.content ?? ""} ${item.instructions} ${item.questions}`, item.id));
  appendices.glossary.forEach((item) => add("attachments", `Lampiran 5 — Glosarium: ${item.term}`, item.definition, item.id));
  appendices.customSections.forEach((item) => add("attachments", `Lampiran: ${item.title}`, item.content, item.id));
  appendices.files.forEach((item) => add("attachments", `Lampiran — File: ${item.title}`, `${item.description} ${item.attachment?.name ?? ""}`, item.id));

  return results.slice(0, 12);
}

function searchPlainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTargetId(tab: BankTab, resultId: string) {
  if (tab === "module-info") {
    if (resultId === "module-info-initial") return "module-info-initial";
    if (resultId === "module-info-pancasila") return "module-info-pancasila";
    const index = Number(resultId.replace("info-", ""));
    if (index <= 6) return "module-info-identity";
    if (index === 7) return "module-info-target";
    if (index === 8) return "module-info-students";
    if (index <= 11) return "module-info-strategy";
    if (index <= 16) return "module-info-facilities";
    return "module-info-follow-up";
  }
  if (tab === "competencies") {
    if (resultId.startsWith("objective")) return "competencies-objectives";
    if (resultId.startsWith("material")) return "competencies-objectives";
    return "competencies-core";
  }
  if (tab === "activities") {
    if (resultId === "activity-0") return "activities-opening";
    if (resultId === "activity-1") return "activities-core";
    if (resultId === "activity-2") return "activities-closing";
    if (resultId === "activity-6" || resultId === "activity-7") return "activities-reflection";
    return "bank-tab-activities";
  }
  if (tab === "assessments") {
    const index = Number(resultId.replace("assessment-", ""));
    if (Number.isInteger(index) && index >= 0 && index <= 12) return `assessment-field-${index}`;
    if (index <= 2) return "assessments-learning";
    if (index <= 4 || resultId.startsWith("rubric-group")) return "assessments-group";
    if (index <= 7 || resultId.startsWith("rubric-individual")) return "assessments-individual";
    return "assessments-practice";
  }
  if (resultId === "reading-materials" || resultId.startsWith("reading-")) return "attachments-reading";
  if (resultId === "learning-media") return "attachments-media";
  if (resultId === "assessment-instruments") return "attachments-instruments";
  if (resultId.startsWith("worksheet")) return "attachments-worksheets";
  if (resultId.startsWith("glossary")) return "attachments-glossary";
  if (resultId.startsWith("appendix-section")) return "attachments-custom";
  if (resultId.startsWith("appendix-file")) return "attachments-files";
  return "bank-tab-attachments";
}

function getSearchSectionId(targetId: string) {
  if (targetId.startsWith("assessment-field-")) {
    const index = Number(targetId.replace("assessment-field-", ""));
    if (index <= 2) return "assessments-learning";
    if (index <= 4) return "assessments-group";
    if (index <= 7) return "assessments-practice";
    return "assessments-practice";
  }
  return targetId;
}

function InfoChip({
  label,
  muted,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
      <span className="truncate font-semibold uppercase text-slate-500">
        {label}
      </span>
      <span
        className={className(
          "truncate font-semibold",
          muted ? "text-slate-400" : "text-slate-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

const fallbackModuleInfo: ModuleInfo = {
  academicYear: "2024/2025",
  semester: "Ganjil",
  phase: "",
  subject: "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
  mainMaterial: "",
  subMaterial: "",
  chapterMeeting: "",
  timeAllocation: "",
  learningMode: "Teori dan Praktek",
  learningModel: "",
  learningMethods: "",
  differentiationStrategy: "",
  media: "",
  toolsAndMaterials: "",
  learningResources: "",
  practiceArea: "",
  sportEquipment: "",
  enrichment: "",
  remedial: "",
  approvalPlace: "",
  approvalDate: "",
  studentCount: 0,
  targetStudents: "",
};

function ModuleInfoTab({
  setState,
  state,
  topic,
}: {
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
  topic: LearningTopic;
}) {
  const info = getModuleInfo(state, topic);
  const competency = getModuleCompetency(state, topic);
  const identityComplete = Boolean(
    info.academicYear &&
    info.subject &&
    info.phase &&
    info.mainMaterial &&
    info.timeAllocation,
  );
  const initialComplete = Boolean(competency.initialCompetency);
  const profileComplete = competency.pancasilaProfiles.length > 0;
  const strategyComplete = Boolean(
    info.learningModel && info.learningMethods && info.differentiationStrategy,
  );
  const facilityComplete = Boolean(
    info.media && info.toolsAndMaterials && info.learningResources,
  );
  const followUpComplete = Boolean(info.enrichment && info.remedial);

  function updateInfo(patch: Partial<ModuleInfo>) {
    setState((current) => ({
      ...current,
      moduleInfo: {
        ...current.moduleInfo,
        [topic.id]: {
          ...info,
          ...patch,
        },
      },
    }));
  }

  function updateCompetency(patch: Partial<ModuleCompetency>) {
    setState((current) => ({
      ...current,
      moduleCompetencies: {
        ...current.moduleCompetencies,
        [topic.id]: { ...competency, ...patch },
      },
    }));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
          <FileText size={19} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Informasi Modul</h3>
          <p className="text-sm text-slate-500">
            Data ini dipakai sebagai identitas dokumen Modul Ajar.
          </p>
        </div>
      </div>
      <div className="mb-4">
        <AutoSavedNotice />
      </div>
      <div className="grid gap-3">
        <BankSection
          className="order-1"
          defaultOpen
          id="module-info-identity"
          isComplete={identityComplete}
          title="A. Identitas Modul"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Tahun Ajaran"
              onChange={(academicYear) => updateInfo({ academicYear })}
              value={info.academicYear}
            />
            <TextField
              label="Mata Pelajaran"
              onChange={(subject) => updateInfo({ subject })}
              value={info.subject}
            />
            <TextField
              label="Fase"
              onChange={(phase) => updateInfo({ phase })}
              value={info.phase}
            />
            <TextField
              label="Materi Pokok"
              onChange={(mainMaterial) => updateInfo({ mainMaterial })}
              value={info.mainMaterial}
            />
            <TextField
              label="Sub Materi"
              onChange={(subMaterial) => updateInfo({ subMaterial })}
              value={info.subMaterial}
            />
            <TextField
              label="Bab/Pertemuan"
              onChange={(chapterMeeting) => updateInfo({ chapterMeeting })}
              value={info.chapterMeeting}
            />
            <TextField
              label="Alokasi Waktu"
              onChange={(timeAllocation) => updateInfo({ timeAllocation })}
              value={info.timeAllocation}
            />
          </div>
        </BankSection>

        <BankSection className="order-2" defaultOpen id="module-info-initial" isComplete={initialComplete} title="B. Komponen Awal">
          <TextArea
            label="Komponen Awal"
            onChange={(initialCompetency) => updateCompetency({ initialCompetency })}
            value={competency.initialCompetency}
          />
        </BankSection>

        <BankSection className="order-3" defaultOpen id="module-info-pancasila" isComplete={profileComplete} title="C. Profil Pelajar Pancasila">
          <StringListEditor
            embedded
            label="Profil Pelajar Pancasila"
            onChange={(pancasilaProfiles) => updateCompetency({ pancasilaProfiles })}
            placeholder="Contoh: Mandiri: peserta didik bertanggung jawab saat latihan."
            values={competency.pancasilaProfiles}
          />
        </BankSection>

        <BankSection
          className="order-7"
          defaultOpen
          id="module-info-strategy"
          isComplete={strategyComplete}
          title="G. Model Pembelajaran"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Model Pembelajaran"
              onChange={(learningModel) => updateInfo({ learningModel })}
              value={info.learningModel}
            />
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mode Pembelajaran
              </label>
              <select
                className="input"
                onChange={(event) =>
                  updateInfo({
                    learningMode: event.target
                      .value as ModuleInfo["learningMode"],
                  })
                }
                value={info.learningMode}
              >
                <option>Teori</option>
                <option>Praktek</option>
                <option>Teori dan Praktek</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Metode Pembelajaran"
                onChange={(learningMethods) => updateInfo({ learningMethods })}
                value={info.learningMethods}
              />
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Strategi Pembelajaran Berdiferensiasi"
                onChange={(differentiationStrategy) =>
                  updateInfo({ differentiationStrategy })
                }
                value={info.differentiationStrategy}
              />
            </div>
          </div>
        </BankSection>

        <BankSection className="order-4" defaultOpen id="module-info-facilities" isComplete={facilityComplete} title="D. Sarana dan Prasarana">
          <div className="grid gap-6 md:grid-cols-2">
            <TextArea
              label="Media"
              onChange={(media) => updateInfo({ media })}
              value={info.media}
            />
            <TextArea
              label="Alat dan Bahan"
              onChange={(toolsAndMaterials) =>
                updateInfo({ toolsAndMaterials })
              }
              value={info.toolsAndMaterials}
            />
            <TextArea
              label="Sumber Belajar"
              onChange={(learningResources) =>
                updateInfo({ learningResources })
              }
              value={info.learningResources}
            />
            <TextArea
              label="Lapangan/Tempat Praktik"
              onChange={(practiceArea) => updateInfo({ practiceArea })}
              value={info.practiceArea}
            />
            <div className="md:col-span-2">
              <TextArea
                label="Peralatan PJOK"
                onChange={(sportEquipment) => updateInfo({ sportEquipment })}
                value={info.sportEquipment}
              />
            </div>
          </div>
        </BankSection>

        <BankSection className="order-5" defaultOpen id="module-info-target" isComplete={Boolean(info.targetStudents)} title="E. Target Peserta Didik">
          <TextArea
            label="Target Peserta Didik"
            onChange={(targetStudents) => updateInfo({ targetStudents })}
            value={info.targetStudents}
          />
        </BankSection>

        <BankSection className="order-6" defaultOpen id="module-info-students" isComplete={info.studentCount > 0} title="F. Jumlah Peserta Didik">
          <NumberField
            label="Jumlah Peserta Didik"
            onChange={(studentCount) => updateInfo({ studentCount })}
            value={info.studentCount}
          />
        </BankSection>

        <BankSection
          className="order-8"
          defaultOpen
          id="module-info-follow-up"
          isComplete={followUpComplete}
          title="K. Kegiatan Pengayaan dan Remedial"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextArea
              label="Pengayaan"
              onChange={(enrichment) => updateInfo({ enrichment })}
              value={info.enrichment}
            />
            <TextArea
              label="Remedial"
              onChange={(remedial) => updateInfo({ remedial })}
              value={info.remedial}
            />
          </div>
        </BankSection>

        <BankSection className="order-9" defaultOpen id="module-info-approval" isComplete={Boolean(info.approvalPlace && info.approvalDate)} title="M. Mengetahui / Mengesahkan">
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Tempat Pengesahan"
              onChange={(approvalPlace) => updateInfo({ approvalPlace })}
              value={info.approvalPlace}
            />
            <TextField
              label="Tanggal Pengesahan"
              onChange={(approvalDate) => updateInfo({ approvalDate })}
              value={info.approvalDate}
            />
          </div>
        </BankSection>
      </div>
    </section>
  );
}

function CompetenciesTab({ query, setState, state, topic }: BankTabProps) {
  const competency = getModuleCompetency(state, topic);
  const coreComplete = Boolean(
    competency.learningAchievements &&
    competency.meaningfulUnderstanding &&
    competency.affectivePreparation &&
    competency.cognitivePreparation &&
    competency.psychomotorPreparation,
  );

  function updateCompetency(patch: Partial<ModuleCompetency>) {
    setState((current) => ({
      ...current,
      moduleCompetencies: {
        ...current.moduleCompetencies,
        [topic.id]: {
          ...competency,
          ...patch,
        },
      },
    }));
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Kompetensi Inti</h3>
            <p className="text-sm text-slate-500">
              Lengkapi bagian awal Modul Ajar sesuai format dokumen guru.
            </p>
          </div>
          <AutoSavedNotice />
        </div>
        <BankSection
          defaultOpen
          id="competencies-core"
          isComplete={coreComplete}
          title="Kompetensi, Capaian, dan Persiapan"
        >
          <div className="grid gap-6">
            <TextArea
              label="Capaian Pembelajaran"
              onChange={(learningAchievements) =>
                updateCompetency({ learningAchievements })
              }
              value={competency.learningAchievements}
            />
            <TextArea
              label="Pemahaman Bermakna"
              onChange={(meaningfulUnderstanding) =>
                updateCompetency({ meaningfulUnderstanding })
              }
              value={competency.meaningfulUnderstanding}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <TextArea
                label="Persiapan Afektif"
                onChange={(affectivePreparation) =>
                  updateCompetency({ affectivePreparation })
                }
                value={competency.affectivePreparation}
              />
              <TextArea
                label="Persiapan Kognitif"
                onChange={(cognitivePreparation) =>
                  updateCompetency({ cognitivePreparation })
                }
                value={competency.cognitivePreparation}
              />
              <div className="lg:col-span-2">
                <TextArea
                  label="Persiapan Psikomotor"
                  onChange={(psychomotorPreparation) =>
                    updateCompetency({ psychomotorPreparation })
                  }
                  value={competency.psychomotorPreparation}
                />
              </div>
            </div>
          </div>
        </BankSection>
      </section>

      <StringListEditor
        label="Pertanyaan Pemantik"
        onChange={(triggerQuestions) => updateCompetency({ triggerQuestions })}
        placeholder="Contoh: Bagaimana cara melakukan passing bawah dengan benar?"
        values={competency.triggerQuestions}
      />
      <StringListEditor
        label="Asesmen Diagnostik Non-Kognitif"
        onChange={(diagnosticQuestions) =>
          updateCompetency({ diagnosticQuestions })
        }
        placeholder="Contoh: Bagaimana kabar peserta didik hari ini?"
        values={competency.diagnosticQuestions}
      />

      <div id="competencies-objectives">
        <ObjectivesTab
          query={query}
          setState={setState}
          state={state}
          topic={topic}
        />
      </div>
    </div>
  );
}

function StringListEditor({
  embedded = false,
  label,
  onChange,
  placeholder,
  values,
}: {
  embedded?: boolean;
  label: string;
  onChange: (values: string[]) => void;
  placeholder: string;
  values: string[];
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const value = draft.trim();
    if (!value) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <section className={embedded ? "" : "rounded-lg border border-slate-200 bg-white p-5"}>
      {!embedded && <h3 className="mb-3 text-base font-semibold">{label}</h3>}
      <div className="grid gap-2">
        {values.map((value, index) => (
          <div
            className="flex items-start gap-3 rounded-md border border-slate-200 p-3"
            key={`${value}-${index}`}
          >
            <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700">
              {value}
            </p>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirmDelete("Hapus item ini?"))
                  onChange(
                    values.filter((_, itemIndex) => itemIndex !== index),
                  );
              }}
              type="button"
            >
              Hapus
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada data.
          </div>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="input"
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          value={draft}
        />
        <button className="btn-primary" onClick={addItem} type="button">
          Tambah
        </button>
      </div>
    </section>
  );
}

function ObjectivesTab({ query, setState, state, topic }: BankTabProps) {
  const [editing, setEditing] = useState<LearningObjective | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const items = state.objectives
    .filter((item) => item.topicId === topic.id)
    .filter((item) =>
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return;
    if (editing) {
      setState((current) => ({
        ...current,
        objectives: current.objectives.map((item) =>
          item.id === editing.id ? { ...item, ...draft } : item,
        ),
      }));
    } else {
      setState((current) => ({
        ...current,
        objectives: [
          { id: createId("objective"), topicId: topic.id, ...draft },
          ...current.objectives,
        ],
      }));
    }
    setEditing(null);
    setDraft({ title: "", description: "" });
  }

  return (
    <CrudSection
      empty="Belum ada tujuan pembelajaran."
      items={items.map((item) => ({
        id: item.id,
        title: item.description,
        meta: item.title,
        onEdit: () => {
          setEditing(item);
          setDraft({ title: item.title, description: item.description });
        },
        onDelete: () =>
          setState((current) => ({
            ...current,
            objectives: current.objectives.filter(
              (entry) => entry.id !== item.id,
            ),
          })),
      }))}
      onAdd={() => {
        setEditing(null);
        setDraft({ title: "", description: "" });
      }}
      title="Tujuan Pembelajaran"
    >
      {(editing || draft.title || draft.description) && (
        <FormPanel
          title={editing ? "Edit Tujuan" : "Tambah Tujuan"}
          onCancel={() => {
            setEditing(null);
            setDraft({ title: "", description: "" });
          }}
          onSave={save}
        >
          <TextField
            label="Judul"
            onChange={(title) => setDraft((current) => ({ ...current, title }))}
            value={draft.title}
          />
          <TextArea
            label="Deskripsi"
            onChange={(description) =>
              setDraft((current) => ({ ...current, description }))
            }
            value={draft.description}
          />
        </FormPanel>
      )}
    </CrudSection>
  );
}

function MaterialsTab({ query, setState, state, topic }: BankTabProps) {
  const [editing, setEditing] = useState<LearningMaterial | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    videoUrl: string;
    attachment?: MaterialAttachment;
  }>({
    title: "",
    description: "",
    videoUrl: "",
  });
  const [fileError, setFileError] = useState("");
  const items = state.materials
    .filter((item) => item.topicId === topic.id)
    .filter((item) =>
      `${item.title} ${item.description} ${item.videoUrl ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return;
    if (draft.videoUrl && !URL.canParse(draft.videoUrl)) return;
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      videoUrl: draft.videoUrl.trim() || undefined,
      attachment: draft.attachment,
    };
    if (editing) {
      setState((current) => ({
        ...current,
        materials: current.materials.map((item) =>
          item.id === editing.id ? { ...item, ...payload } : item,
        ),
      }));
    } else {
      setState((current) => ({
        ...current,
        materials: [
          { id: createId("material"), topicId: topic.id, ...payload },
          ...current.materials,
        ],
      }));
    }
    setEditing(null);
    setDraft({ title: "", description: "", videoUrl: "" });
  }

  async function handleFile(file?: File) {
    setFileError("");
    if (!file) return;
    if (file.size > maxAttachmentBytes) {
      setFileError("Ukuran file maksimal 2 MB.");
      return;
    }
    setDraft((current) => ({ ...current, attachment: undefined }));
    const attachment = await readAttachment(file);
    setDraft((current) => ({ ...current, attachment }));
  }

  return (
    <CrudSection
      empty="Belum ada materi."
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        meta:
          [item.attachment?.name, item.videoUrl ? "Video" : undefined]
            .filter(Boolean)
            .join(" | ") || "Materi teks",
        description: item.description,
        onEdit: () => {
          setEditing(item);
          setDraft({
            title: item.title,
            description: item.description,
            videoUrl: item.videoUrl ?? "",
            attachment: item.attachment,
          });
        },
        onDelete: () =>
          setState((current) => ({
            ...current,
            materials: current.materials.filter(
              (entry) => entry.id !== item.id,
            ),
          })),
      }))}
      onAdd={() => {
        setEditing(null);
        setDraft({ title: "", description: "", videoUrl: "" });
      }}
      title="Materi"
    >
      {(editing ||
        draft.title ||
        draft.description ||
        draft.videoUrl ||
        draft.attachment) && (
        <FormPanel
          title={editing ? "Edit Materi" : "Tambah Materi"}
          onCancel={() => {
            setEditing(null);
            setDraft({ title: "", description: "", videoUrl: "" });
            setFileError("");
          }}
          onSave={save}
        >
          <TextField
            label="Judul Materi"
            onChange={(title) => setDraft((current) => ({ ...current, title }))}
            value={draft.title}
          />
          <TextArea
            label="Deskripsi"
            onChange={(description) =>
              setDraft((current) => ({ ...current, description }))
            }
            value={draft.description}
          />
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Lampiran File
            </label>
            <input
              className="input"
              onChange={(event) => void handleFile(event.target.files?.[0])}
              type="file"
            />
            {draft.attachment && (
              <p className="mt-1 text-xs text-slate-500">
                {draft.attachment.name} (
                {Math.round(draft.attachment.size / 1024)} KB)
              </p>
            )}
            {fileError && (
              <p className="mt-1 text-xs text-red-600">{fileError}</p>
            )}
          </div>
          <TextField
            label="Link Video (Opsional)"
            onChange={(videoUrl) =>
              setDraft((current) => ({ ...current, videoUrl }))
            }
            value={draft.videoUrl}
          />
        </FormPanel>
      )}
    </CrudSection>
  );
}
