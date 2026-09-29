import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { LoaderCircle, Plus, Save, X } from "lucide-react";
import { supabase } from "../../core/supabase/client";
import { mapSupabaseLearningTopic } from "../../core/supabase/types";
import type { SupabaseLearningTopic } from "../../core/supabase/types";
import type { AppState, ClassGrade, LearningTopic } from "../../core/types";
import { EmptyState } from "../../shared/components/EmptyState";
import {
  SearchField,
  TextArea,
  TextField,
} from "../../shared/components/FormControls";
import { TopicRow } from "../../shared/components/TopicRow";
import { Toast } from "../../shared/components/Toast";
import { confirmDelete } from "../../shared/utils/confirmDelete";

const grades: ClassGrade[] = [1, 2, 3, 4, 5, 6];

export function TopicsPage({
  goToTopic,
  selectedGrade,
  setSelectedGrade,
  setState,
  state,
}: {
  goToTopic: (topic: LearningTopic) => void;
  selectedGrade: ClassGrade;
  setSelectedGrade: (grade: ClassGrade) => void;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
}) {
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<LearningTopic | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState("");
  const [topicError, setTopicError] = useState("");
  const [toast, setToast] = useState("");
  const availableGrades =
    state.teacher.classes.length > 0 ? state.teacher.classes : grades;
  const filtered = state.topics
    .filter(
      (topic) =>
        topic.teacherId === state.activeTeacherId &&
        topic.classGrade === selectedGrade,
    )
    .filter((topic) =>
      `${topic.title} ${topic.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  useEffect(() => {
    let isCurrent = true;

    async function loadTopics() {
      setIsLoading(true);
      setTopicError("");

      const { data, error } = await supabase
        .from("learning_topics")
        .select(
          "id,teacher_id,class_grade,title,description,color,created_at,updated_at",
        )
        .eq("teacher_id", state.activeTeacherId)
        .order("created_at", { ascending: false })
        .returns<SupabaseLearningTopic[]>();

      if (!isCurrent) return;

      if (error) {
        setTopicError(`Topik pembelajaran gagal dimuat: ${error.message}`);
        setIsLoading(false);
        return;
      }

      const topics = (data ?? []).map(mapSupabaseLearningTopic);
      setState((current) => ({
        ...current,
        topics: [
          ...topics,
          ...current.topics.filter(
            (topic) => topic.teacherId !== current.activeTeacherId,
          ),
        ],
      }));
      setIsLoading(false);
    }

    void loadTopics();

    return () => {
      isCurrent = false;
    };
  }, [setState, state.activeTeacherId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function startEdit(topic?: LearningTopic) {
    setIsFormOpen(true);
    setEditing(topic ?? null);
    setDraft(
      topic
        ? { title: topic.title, description: topic.description }
        : { title: "", description: "" },
    );
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setDraft({ title: "", description: "" });
  }

  async function saveTopic() {
    const title = draft.title.trim();
    if (!title || isSaving) return;

    setIsSaving(true);
    setTopicError("");

    const description =
      draft.description.trim() ||
      `Kelola komponen pembelajaran untuk ${title}.`;
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-amber-500",
      "bg-violet-500",
      "bg-rose-500",
    ];

    try {
      if (editing) {
        const { data, error } = await supabase
          .from("learning_topics")
          .update({ title, description, updated_at: new Date().toISOString() })
          .eq("id", editing.id)
          .eq("teacher_id", state.activeTeacherId)
          .select(
            "id,teacher_id,class_grade,title,description,color,created_at,updated_at",
          )
          .single<SupabaseLearningTopic>();

        if (error || !data) {
          setTopicError(
            `Topik pembelajaran gagal diperbarui: ${error?.message ?? "data tidak ditemukan"}`,
          );
          return;
        }

        const savedTopic = mapSupabaseLearningTopic(data);
        setState((current) => ({
          ...current,
          topics: current.topics.map((topic) =>
            topic.id === savedTopic.id ? savedTopic : topic,
          ),
        }));
        showToast("Topik pembelajaran berhasil diperbarui di Supabase.");
      } else {
        const color =
          colors[
            state.topics.filter(
              (topic) => topic.teacherId === state.activeTeacherId,
            ).length % colors.length
          ];
        const { data, error } = await supabase
          .from("learning_topics")
          .insert({
            teacher_id: state.activeTeacherId,
            class_grade: selectedGrade,
            title,
            description,
            color,
          })
          .select(
            "id,teacher_id,class_grade,title,description,color,created_at,updated_at",
          )
          .single<SupabaseLearningTopic>();

        if (error || !data) {
          setTopicError(
            `Topik pembelajaran gagal ditambahkan: ${error?.message ?? "data tidak ditemukan"}`,
          );
          return;
        }

        const savedTopic = mapSupabaseLearningTopic(data);
        setState((current) => ({
          ...current,
          topics: [savedTopic, ...current.topics],
        }));
        showToast("Topik pembelajaran berhasil ditambahkan ke Supabase.");
      }

      closeForm();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTopic(topicId: string) {
    if (
      !confirmDelete(
        "Hapus Topik Pembelajaran dan seluruh komponen Modul Ajar di dalamnya?",
      )
    )
      return;
    if (deletingTopicId) return;

    setDeletingTopicId(topicId);
    setTopicError("");

    const { data, error } = await supabase
      .from("learning_topics")
      .delete()
      .eq("id", topicId)
      .eq("teacher_id", state.activeTeacherId)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error || !data) {
      setTopicError(
        `Topik pembelajaran gagal dihapus: ${error?.message ?? "data tidak ditemukan atau akses ditolak"}`,
      );
      setDeletingTopicId("");
      return;
    }

    setState((current) => ({
      ...current,
      moduleInfo: Object.fromEntries(
        Object.entries(current.moduleInfo).filter(([id]) => id !== topicId),
      ),
      moduleCompetencies: Object.fromEntries(
        Object.entries(current.moduleCompetencies).filter(
          ([id]) => id !== topicId,
        ),
      ),
      moduleActivities: Object.fromEntries(
        Object.entries(current.moduleActivities).filter(
          ([id]) => id !== topicId,
        ),
      ),
      moduleAssessments: Object.fromEntries(
        Object.entries(current.moduleAssessments).filter(
          ([id]) => id !== topicId,
        ),
      ),
      moduleWorksheets: Object.fromEntries(
        Object.entries(current.moduleWorksheets).filter(
          ([id]) => id !== topicId,
        ),
      ),
      moduleAppendices: Object.fromEntries(
        Object.entries(current.moduleAppendices).filter(
          ([id]) => id !== topicId,
        ),
      ),
      topics: current.topics.filter((topic) => topic.id !== topicId),
      objectives: current.objectives.filter((item) => item.topicId !== topicId),
      materials: current.materials.filter((item) => item.topicId !== topicId),
      activities: current.activities.filter((item) => item.topicId !== topicId),
      assessments: current.assessments.filter(
        (item) => item.topicId !== topicId,
      ),
      drafts: current.drafts.filter(
        (draftItem) => draftItem.topicId !== topicId,
      ),
    }));
    setDeletingTopicId("");
    showToast("Topik pembelajaran berhasil dihapus dari Supabase.");
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Kelola Topik Pembelajaran</p>
            <h2 className="text-2xl font-semibold">Kelas {selectedGrade}</h2>
          </div>
          <button
            className="btn-primary"
            onClick={() => startEdit()}
            type="button"
          >
            <Plus size={16} />
            Tambah Topik Pembelajaran
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
          <select
            className="input"
            onChange={(event) =>
              setSelectedGrade(Number(event.target.value) as ClassGrade)
            }
            value={selectedGrade}
          >
            {availableGrades.map((grade) => (
              <option key={grade} value={grade}>
                Kelas {grade}
              </option>
            ))}
          </select>
          <SearchField
            onChange={setQuery}
            placeholder="Cari Topik Pembelajaran..."
            value={query}
          />
        </div>
        {topicError && (
          <p
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            role="alert"
          >
            {topicError}
          </p>
        )}
        <div className="mt-5 grid gap-2">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-slate-500">
              <LoaderCircle className="animate-spin" size={18} />
              Memuat topik pembelajaran dari Supabase...
            </div>
          )}
          {!isLoading &&
            filtered.map((topic) => (
              <TopicRow
                key={topic.id}
                onDelete={() => void deleteTopic(topic.id)}
                onEdit={() => startEdit(topic)}
                onOpen={() => goToTopic(topic)}
                state={state}
                topic={topic}
              />
            ))}
          {!isLoading && filtered.length === 0 && (
            <EmptyState
              text="Belum ada Topik Pembelajaran yang cocok dengan pencarian."
              title="Topik Pembelajaran kosong"
            />
          )}
        </div>
      </section>
      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <section
            className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-form-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Topik Pembelajaran</p>
                <h2 className="text-xl font-semibold" id="topic-form-title">
                  {editing
                    ? "Edit Topik Pembelajaran"
                    : "Tambah Topik Pembelajaran"}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={closeForm}
                title="Tutup"
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-5">
              <TextField
                label="Judul Topik Pembelajaran"
                onChange={(title) =>
                  setDraft((current) => ({ ...current, title }))
                }
                value={draft.title}
              />
              <TextArea
                label="Deskripsi"
                onChange={(description) =>
                  setDraft((current) => ({ ...current, description }))
                }
                value={draft.description}
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="btn-secondary"
                onClick={closeForm}
                type="button"
              >
                Batal
              </button>
              <button
                className="btn-primary"
                disabled={isSaving || !draft.title.trim()}
                onClick={() => void saveTopic()}
                type="button"
              >
                {isSaving ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Simpan
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
