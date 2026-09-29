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
  const activeTabIndex = bankTabs.indexOf(activeTab);
  const previousTab = bankTabs[activeTabIndex - 1];
  const nextTab = bankTabs[activeTabIndex + 1];

  useEffect(() => {
    setQuery("");
  }, [activeTab]);

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
        {isSearchableTab(activeTab) && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 xl:shrink-0">
            <div className="max-w-lg">
              <SearchField
                className="input h-9 pl-9 text-sm"
                onChange={setQuery}
                placeholder={`Cari ${bankLabels[activeTab].toLowerCase()}...`}
                value={query}
              />
            </div>
          </div>
        )}

        <div className="min-w-0 min-h-0 xl:overflow-y-auto xl:pr-1">
          <BankTabContent
            query={query}
            setState={setState}
            state={state}
            tab={activeTab}
            topic={selectedTopic}
          />
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

function isSearchableTab(tab: BankTab) {
  return (
    tab === "competencies" ||
    tab === "activities" ||
    tab === "assessments" ||
    tab === "attachments"
  );
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
  const identityComplete = Boolean(
    info.academicYear &&
    info.semester &&
    info.subject &&
    info.phase &&
    info.mainMaterial &&
    info.timeAllocation &&
    info.targetStudents,
  );
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
          defaultOpen
          isComplete={identityComplete}
          title="Identitas dan Materi Modul"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="Tahun Ajaran"
              onChange={(academicYear) => updateInfo({ academicYear })}
              value={info.academicYear}
            />
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Semester
              </label>
              <select
                className="input"
                onChange={(event) =>
                  updateInfo({
                    semester: event.target.value as ModuleInfo["semester"],
                  })
                }
                value={info.semester}
              >
                <option>Ganjil</option>
                <option>Genap</option>
              </select>
            </div>
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
            <NumberField
              label="Jumlah Peserta Didik"
              onChange={(studentCount) => updateInfo({ studentCount })}
              value={info.studentCount}
            />
            <div className="md:col-span-2">
              <TextArea
                label="Target Peserta Didik"
                onChange={(targetStudents) => updateInfo({ targetStudents })}
                value={info.targetStudents}
              />
            </div>
          </div>
        </BankSection>

        <BankSection
          defaultOpen={!identityComplete}
          isComplete={strategyComplete}
          title="Strategi Pembelajaran"
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

        <BankSection isComplete={facilityComplete} title="Sarana dan Prasarana">
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

        <BankSection
          isComplete={followUpComplete}
          title="Pengayaan, Remedial, dan Pengesahan"
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
    competency.initialCompetency &&
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
          isComplete={coreComplete}
          title="Kompetensi, Capaian, dan Persiapan"
        >
          <div className="grid gap-6">
            <TextArea
              label="Komponen Awal"
              onChange={(initialCompetency) =>
                updateCompetency({ initialCompetency })
              }
              value={competency.initialCompetency}
            />
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
        label="Profil Pelajar Pancasila"
        onChange={(pancasilaProfiles) =>
          updateCompetency({ pancasilaProfiles })
        }
        placeholder="Contoh: Mandiri: peserta didik dapat bertanggung jawab saat latihan."
        values={competency.pancasilaProfiles}
      />
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

      <ObjectivesTab
        query={query}
        setState={setState}
        state={state}
        topic={topic}
      />
    </div>
  );
}

function StringListEditor({
  label,
  onChange,
  placeholder,
  values,
}: {
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
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold">{label}</h3>
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
