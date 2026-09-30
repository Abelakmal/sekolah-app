import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { FileUp, Paperclip } from "lucide-react";
import { getModuleAppendices } from "../../../core/moduleAppendices";
import type {
  AppState,
  AppendixFile,
  CustomAppendixSection,
  GlossaryTerm,
  LearningTopic,
  MaterialAttachment,
  ModuleAppendices,
  ReadingSection,
} from "../../../core/types";
import {
  createId,
  maxAttachmentBytes,
  readAttachment,
} from "../../../core/utils";
import { TextArea, TextField } from "../../../shared/components/FormControls";
import { FormPanel } from "../../../shared/components/FormPanel";
import { RichTextEditor } from "../../../shared/components/RichTextEditor";
import { confirmDelete } from "../../../shared/utils/confirmDelete";
import { AutoSavedNotice, BankSection } from "./BankSection";
import { RichWorksheetEditor } from "./RichWorksheetEditor";

type AppendicesTabProps = {
  query: string;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
  topic: LearningTopic;
};

export function AppendicesTab({
  query,
  setState,
  state,
  topic,
}: AppendicesTabProps) {
  const appendices = getModuleAppendices(state, topic);
  const mainAppendicesComplete = Boolean(
    appendices.readingMaterials &&
    appendices.learningMedia &&
    appendices.assessmentInstruments,
  );

  function updateAppendices(patch: Partial<ModuleAppendices>) {
    setState((current) => ({
      ...current,
      moduleAppendices: {
        ...current.moduleAppendices,
        [topic.id]: {
          ...appendices,
          ...patch,
        },
      },
    }));
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-700">
              <Paperclip size={19} />
            </div>
            <div>
              <h3 className="text-base font-semibold">Lampiran Modul</h3>
              <p className="text-sm text-slate-500">
                Isi bahan bacaan, media pembelajaran, dan instrumen penilaian.
              </p>
            </div>
          </div>
          <AutoSavedNotice />
        </div>
        <BankSection
          defaultOpen
          id="attachments-reading"
          isComplete={mainAppendicesComplete}
          title="Lampiran 1 — Bahan Bacaan Guru dan Peserta Didik"
        >
          <RichTextEditor
            label="Bahan Bacaan"
            onChange={(readingMaterials) =>
              updateAppendices({ readingMaterials })
            }
            value={appendices.readingMaterials}
          />
        </BankSection>
      </section>

      <div id="attachments-reading-sections">
        <ReadingSectionEditor
          onChange={(readingSections) => updateAppendices({ readingSections })}
          query={query}
          values={appendices.readingSections}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <BankSection
          defaultOpen
          id="attachments-media"
          title="Lampiran 2 — Media Pembelajaran"
        >
          <RichTextEditor
            label="Media Pembelajaran"
            onChange={(learningMedia) => updateAppendices({ learningMedia })}
            value={appendices.learningMedia}
          />
        </BankSection>
      </section>

      <section
        className="rounded-lg border border-slate-200 bg-white p-5"
        id="attachments-worksheets"
      >
        <h3 className="mb-1 text-base font-semibold">Lampiran 3 — LKPD</h3>
        <p className="mb-5 text-sm text-slate-500">
          Buat LKPD berkelompok dan individu yang akan ditempatkan sebagai
          Lampiran 3 pada dokumen Word.
        </p>
        <RichWorksheetEditor
          query={query}
          setState={setState}
          state={state}
          topic={topic}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <BankSection
          defaultOpen
          id="attachments-instruments"
          title="Lampiran 4 — Instrumen Penilaian"
        >
          <p className="mb-5 text-sm leading-6 text-slate-500">
            Isi langsung seluruh instrumen, rubrik, dan format penilaian sesuai
            kebutuhan modul. Konten ini diekspor sebagai satu Lampiran 4.
          </p>
          <RichTextEditor
            label="Isi Instrumen Penilaian"
            onChange={(assessmentInstruments) =>
              updateAppendices({ assessmentInstruments })
            }
            value={appendices.assessmentInstruments}
          />
        </BankSection>
      </section>

      <div id="attachments-glossary">
        <GlossaryEditor
          onChange={(glossary) => updateAppendices({ glossary })}
          query={query}
          values={appendices.glossary}
        />
      </div>
      <div id="attachments-custom">
        <CustomAppendixEditor
          onChange={(customSections) => updateAppendices({ customSections })}
          values={appendices.customSections}
        />
      </div>
      <div id="attachments-files">
        <AppendixFileEditor
          files={appendices.files}
          onChange={(files) => updateAppendices({ files })}
          query={query}
        />
      </div>
    </div>
  );
}

function CustomAppendixEditor({
  onChange,
  values,
}: {
  onChange: (values: CustomAppendixSection[]) => void;
  values: CustomAppendixSection[];
}) {
  const [editing, setEditing] = useState<CustomAppendixSection | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });

  function closeForm() {
    setEditing(null);
    setIsFormOpen(false);
    setDraft({ title: "", content: "" });
  }

  function save() {
    if (!draft.title.trim() || !draft.content.trim()) return;
    onChange(
      editing
        ? values.map((item) =>
            item.id === editing.id ? { ...item, ...draft } : item,
          )
        : [...values, { id: createId("appendix-section"), ...draft }],
    );
    closeForm();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Lampiran Tambahan</h3>
          <p className="text-sm text-slate-500">
            Tambahkan lampiran bebas, misalnya gambar kegiatan, materi
            pendukung, atau panduan khusus.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setDraft({ title: "", content: "" });
            setIsFormOpen(true);
          }}
          type="button"
        >
          Tambah Lampiran
        </button>
      </div>
      <div className="grid gap-2">
        {values.map((item, index) => (
          <div
            className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3"
            key={item.id}
          >
            <div className="min-w-0">
              <p className="font-medium">
                Lampiran {index + 7} — {item.title}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(item);
                  setDraft({ title: item.title, content: item.content });
                  setIsFormOpen(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete("Hapus lampiran tambahan ini?"))
                    onChange(values.filter((entry) => entry.id !== item.id));
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {values.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada lampiran tambahan.
          </div>
        )}
      </div>
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"
          onMouseDown={closeForm}
        >
          <section
            aria-modal="true"
            className="max-h-full w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold">
                {editing
                  ? "Edit Lampiran Tambahan"
                  : "Tambah Lampiran Tambahan"}
              </h4>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={closeForm}
                  type="button"
                >
                  Batal
                </button>
                <button className="btn-primary" onClick={save} type="button">
                  Simpan
                </button>
              </div>
            </div>
            <div className="grid gap-5">
              <TextField
                label="Judul Lampiran"
                onChange={(title) =>
                  setDraft((current) => ({ ...current, title }))
                }
                value={draft.title}
              />
              <RichTextEditor
                label="Isi Lampiran"
                onChange={(content) =>
                  setDraft((current) => ({ ...current, content }))
                }
                value={draft.content}
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ReadingSectionEditor({
  onChange,
  query,
  values,
}: {
  onChange: (values: ReadingSection[]) => void;
  query: string;
  values: ReadingSection[];
}) {
  const [editing, setEditing] = useState<ReadingSection | null>(null);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const items = values.filter((item) =>
    `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase()),
  );

  function reset() {
    setEditing(null);
    setDraft({ title: "", content: "" });
  }

  function save() {
    if (!draft.title.trim() || !draft.content.trim()) return;
    if (editing) {
      onChange(
        values.map((item) =>
          item.id === editing.id ? { ...item, ...draft } : item,
        ),
      );
    } else {
      onChange([...values, { id: createId("reading"), ...draft }]);
    }
    reset();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Bagian Bahan Bacaan</h3>
          <p className="text-sm text-slate-500">
            Tambahkan sejarah, pengertian, langkah gerak, atau submateri lain ke
            Lampiran 1.
          </p>
        </div>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div className="rounded-md border border-slate-200 p-3" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {item.content}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  className="text-sm font-semibold text-blue-700"
                  onClick={() => {
                    setEditing(item);
                    setDraft({ title: item.title, content: item.content });
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-sm font-semibold text-red-700"
                  onClick={() => {
                    if (confirmDelete("Hapus subbagian bahan bacaan ini?"))
                      onChange(values.filter((entry) => entry.id !== item.id));
                  }}
                  type="button"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada subbagian bahan bacaan.
          </div>
        )}
      </div>
      {(editing || draft.title || draft.content) && (
        <FormPanel
          title={editing ? "Edit Bahan Bacaan" : "Tambah Bahan Bacaan"}
          onCancel={reset}
          onSave={save}
        >
          <TextField
            label="Judul Subbagian"
            onChange={(title) => setDraft((current) => ({ ...current, title }))}
            value={draft.title}
          />
          <TextArea
            label="Isi Bahan Bacaan"
            onChange={(content) =>
              setDraft((current) => ({ ...current, content }))
            }
            value={draft.content}
          />
        </FormPanel>
      )}
    </section>
  );
}

function GlossaryEditor({
  onChange,
  query,
  values,
}: {
  onChange: (values: GlossaryTerm[]) => void;
  query: string;
  values: GlossaryTerm[];
}) {
  const [editing, setEditing] = useState<GlossaryTerm | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState({ term: "", definition: "" });
  const items = values.filter((item) =>
    `${item.term} ${item.definition}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  function reset() {
    setEditing(null);
    setIsFormOpen(false);
    setDraft({ term: "", definition: "" });
  }

  function openNewForm() {
    setEditing(null);
    setDraft({ term: "", definition: "" });
    setIsFormOpen(true);
  }

  function save() {
    if (!draft.term.trim() || !draft.definition.trim()) return;
    if (editing) {
      onChange(
        values.map((item) =>
          item.id === editing.id ? { ...item, ...draft } : item,
        ),
      );
    } else {
      onChange([{ id: createId("glossary"), ...draft }, ...values]);
    }
    reset();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Lampiran 5 — Glosarium</h3>
        <button className="btn-primary" onClick={openNewForm} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3"
            key={item.id}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.term}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.definition}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(item);
                  setDraft({ term: item.term, definition: item.definition });
                  setIsFormOpen(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete("Hapus istilah glosarium ini?"))
                    onChange(values.filter((entry) => entry.id !== item.id));
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada glosarium.
          </div>
        )}
      </div>
      {isFormOpen && (
        <GlossaryFormModal
          title={editing ? "Edit Glosarium" : "Tambah Glosarium"}
          onCancel={reset}
          onSave={save}
        >
          <TextField
            label="Istilah"
            onChange={(term) => setDraft((current) => ({ ...current, term }))}
            value={draft.term}
          />
          <TextArea
            label="Definisi"
            onChange={(definition) =>
              setDraft((current) => ({ ...current, definition }))
            }
            value={draft.definition}
          />
        </GlossaryFormModal>
      )}
    </section>
  );
}

function GlossaryFormModal({
  children,
  onCancel,
  onSave,
  title,
}: {
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"
      onMouseDown={onCancel}
    >
      <section
        aria-modal="true"
        className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h4 className="text-lg font-semibold">{title}</h4>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onCancel} type="button">
              Batal
            </button>
            <button className="btn-primary" onClick={onSave} type="button">
              Simpan
            </button>
          </div>
        </div>
        <div className="grid gap-5">{children}</div>
      </section>
    </div>
  );
}

function AppendixFileEditor({
  files,
  onChange,
  query,
}: {
  files: AppendixFile[];
  onChange: (files: AppendixFile[]) => void;
  query: string;
}) {
  const [editing, setEditing] = useState<AppendixFile | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    attachment?: MaterialAttachment;
  }>({ title: "", description: "" });
  const [fileError, setFileError] = useState("");
  const items = files.filter((item) =>
    `${item.title} ${item.description} ${item.attachment?.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  function reset() {
    setEditing(null);
    setDraft({ title: "", description: "" });
    setFileError("");
  }

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return;
    if (editing) {
      onChange(
        files.map((item) =>
          item.id === editing.id ? { ...item, ...draft } : item,
        ),
      );
    } else {
      onChange([{ id: createId("appendix-file"), ...draft }, ...files]);
    }
    reset();
  }

  async function handleFile(file?: File) {
    setFileError("");
    if (!file) return;
    if (file.size > maxAttachmentBytes) {
      setFileError("Ukuran file maksimal 2 MB.");
      return;
    }
    const attachment = await readAttachment(file);
    setDraft((current) => ({ ...current, attachment }));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">File Pendukung</h3>
          <p className="text-sm text-slate-500">
            Preview sederhana menampilkan nama, ukuran, dan tipe file.
          </p>
        </div>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div className="rounded-lg border border-slate-200 p-4" key={item.id}>
            <div className="mb-3 flex items-center gap-2 text-blue-700">
              <FileUp size={17} />
              <p className="truncate text-sm font-semibold text-slate-900">
                {item.title}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {item.description}
            </p>
            <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs font-medium text-slate-500">
              {item.attachment
                ? `${item.attachment.name} | ${Math.round(item.attachment.size / 1024)} KB | ${item.attachment.type || "file"}`
                : "Tanpa file"}
            </p>
            <div className="mt-3 flex gap-3">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(item);
                  setDraft({
                    title: item.title,
                    description: item.description,
                    attachment: item.attachment,
                  });
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete("Hapus file pendukung ini?"))
                    onChange(files.filter((entry) => entry.id !== item.id));
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Belum ada file pendukung.
          </div>
        )}
      </div>

      {(editing || draft.title || draft.description || draft.attachment) && (
        <FormPanel
          title={editing ? "Edit File Pendukung" : "Tambah File Pendukung"}
          onCancel={reset}
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
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              File
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
        </FormPanel>
      )}
    </section>
  );
}
