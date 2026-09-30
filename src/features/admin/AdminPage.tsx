import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ImagePlus, Plus, Settings, Trash2 } from "lucide-react";
import { setActiveTeacher, updateTeacherInState } from "../../core/storage";
import { supabase } from "../../core/supabase/client";
import { mapSupabaseTeacher } from "../../core/supabase/types";
import type { SupabaseTeacher } from "../../core/supabase/types";
import { className } from "../../core/utils";
import type { AppState, ClassGrade, Teacher } from "../../core/types";
import { TextField } from "../../shared/components/FormControls";
import { confirmDelete } from "../../shared/utils/confirmDelete";

const grades = [1, 2, 3, 4, 5, 6] as const;
type AdminMode = "list" | "config";
type AdminTab = "users" | "school";

export function AdminPage({
  onActiveTeacherChange,
  setState,
  state,
}: {
  onActiveTeacherChange: (teacherId: string) => void;
  setState: Dispatch<SetStateAction<AppState>>;
  state: AppState;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [mode, setMode] = useState<AdminMode>("list");
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherDraft, setTeacherDraft] = useState(createTeacherDraft());
  const [teacherPasswordDraft, setTeacherPasswordDraft] = useState("");
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    if (activeTab === "users" && mode === "list") {
      void loadTeachers();
    }
    // Refresh the Supabase-backed list when returning to the list tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, mode]);

  function startTeacherForm(teacher?: Teacher) {
    setEditingTeacher(teacher ?? null);
    setTeacherDraft(teacher ? { ...teacher } : createTeacherDraft());
    setTeacherPasswordDraft("");
    setUserError("");
    setMode("config");
  }

  async function saveTeacher() {
    if (!teacherDraft.name.trim() || !teacherDraft.email.trim()) return;
    setIsSavingTeacher(true);
    setUserError("");

    if (editingTeacher) {
      if (teacherPasswordDraft && teacherPasswordDraft.trim().length < 6) {
        setUserError("Password baru minimal 6 karakter.");
        setIsSavingTeacher(false);
        return;
      }

      const session = await getAdminSession();
      if (!session) {
        setIsSavingTeacher(false);
        return;
      }

      const response = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: teacherDraft.id,
          classes: teacherDraft.classes,
          email: teacherDraft.email,
          identityNumber: teacherDraft.identityNumber,
          identityType: teacherDraft.identityType,
          name: teacherDraft.name,
          password: teacherPasswordDraft || undefined,
          schoolName: teacherDraft.schoolName,
          principalName: teacherDraft.principalName,
          principalNip: teacherDraft.principalNip,
          institutionName: teacherDraft.institutionName,
          institutionLogoUrl: teacherDraft.institutionLogoUrl,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        teacher?: SupabaseTeacher;
      };
      if (!response.ok || !result.teacher) {
        setUserError(result.error ?? "Data guru gagal diperbarui di Supabase.");
        setIsSavingTeacher(false);
        return;
      }

      const teacher = mapSupabaseTeacher(result.teacher);
      setState((current) => updateTeacherInState(current, teacher));
    } else {
      if (teacherPasswordDraft.trim().length < 6) {
        setUserError("Password awal minimal 6 karakter.");
        setIsSavingTeacher(false);
        return;
      }

      const session = await getAdminSession();
      if (!session) {
        setIsSavingTeacher(false);
        return;
      }

      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classes: teacherDraft.classes,
          email: teacherDraft.email,
          identityNumber: teacherDraft.identityNumber,
          identityType: teacherDraft.identityType,
          name: teacherDraft.name,
          password: teacherPasswordDraft,
          schoolName: teacherDraft.schoolName,
          principalName: teacherDraft.principalName,
          principalNip: teacherDraft.principalNip,
          institutionName: teacherDraft.institutionName,
          institutionLogoUrl: teacherDraft.institutionLogoUrl,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        teacher?: SupabaseTeacher;
      };
      if (!response.ok || !result.teacher) {
        setUserError(result.error ?? "User guru gagal dibuat di Supabase.");
        setIsSavingTeacher(false);
        return;
      }

      const supabaseTeacher = mapSupabaseTeacher(result.teacher);
      const teacher: Teacher = {
        ...supabaseTeacher,
      };
      setState((current) => ({
        ...current,
        teachers: [
          teacher,
          ...current.teachers.filter((item) => item.id !== teacher.id),
        ],
      }));
    }
    setIsSavingTeacher(false);
    closeTeacherConfig();
  }

  async function deleteTeacher(teacherId: string) {
    if (
      !confirmDelete(
        "Hapus guru ini beserta topik, peserta didik, bank pembelajaran, dan arsip miliknya?",
      )
    )
      return;

    setUserError("");
    const session = await getAdminSession();
    if (!session) return;

    const response = await fetch(
      `/api/admin/teachers?id=${encodeURIComponent(teacherId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    const result = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok || !result.ok) {
      setUserError(result.error ?? "User guru gagal dihapus dari Supabase.");
      return;
    }

    setState((current) => {
      const topicIds = current.topics
        .filter((topic) => topic.teacherId === teacherId)
        .map((topic) => topic.id);
      const nextTeachers = current.teachers.filter(
        (teacher) => teacher.id !== teacherId,
      );
      const nextActiveTeacher =
        current.activeTeacherId === teacherId
          ? nextTeachers[0]
          : current.teacher;
      const nextState = {
        ...current,
        teachers: nextTeachers,
        activeTeacherId: nextActiveTeacher.id,
        teacher: nextActiveTeacher,
        students: current.students.filter(
          (student) => student.teacherId !== teacherId,
        ),
        topics: current.topics.filter((topic) => topic.teacherId !== teacherId),
        objectives: current.objectives.filter(
          (item) => !topicIds.includes(item.topicId),
        ),
        materials: current.materials.filter(
          (item) => !topicIds.includes(item.topicId),
        ),
        activities: current.activities.filter(
          (item) => !topicIds.includes(item.topicId),
        ),
        assessments: current.assessments.filter(
          (item) => !topicIds.includes(item.topicId),
        ),
        drafts: current.drafts.filter((draft) => draft.teacherId !== teacherId),
        moduleInfo: omitTopicRecords(current.moduleInfo, topicIds),
        moduleCompetencies: omitTopicRecords(
          current.moduleCompetencies,
          topicIds,
        ),
        moduleActivities: omitTopicRecords(current.moduleActivities, topicIds),
        moduleAssessments: omitTopicRecords(
          current.moduleAssessments,
          topicIds,
        ),
        moduleWorksheets: omitTopicRecords(current.moduleWorksheets, topicIds),
        moduleAppendices: omitTopicRecords(current.moduleAppendices, topicIds),
      };
      return setActiveTeacher(nextState, nextActiveTeacher.id);
    });
  }

  async function loadTeachers() {
    setIsLoadingTeachers(true);
    setUserError("");

    const session = await getAdminSession();
    if (!session) {
      setIsLoadingTeachers(false);
      return;
    }

    const response = await fetch("/api/admin/teachers", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = (await response.json()) as {
      error?: string;
      teachers?: SupabaseTeacher[];
    };
    if (!response.ok || !result.teachers) {
      setUserError(
        result.error ?? "Daftar user guru gagal dibaca dari Supabase.",
      );
      setIsLoadingTeachers(false);
      return;
    }

    const teachers = result.teachers.map(mapSupabaseTeacher);
    setState((current) => {
      const activeTeacher =
        teachers.find((teacher) => teacher.id === current.activeTeacherId) ??
        teachers[0];
      return {
        ...current,
        teachers,
        ...(activeTeacher
          ? {
              activeTeacherId: activeTeacher.id,
              teacher: activeTeacher,
            }
          : {}),
      };
    });
    setIsLoadingTeachers(false);
  }

  async function getAdminSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUserError("Sesi admin tidak ditemukan. Silakan login ulang.");
      return null;
    }

    return session;
  }

  async function uploadInstitutionLogo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setUserError("Logo harus berupa gambar dengan ukuran maksimal 2 MB.");
      return;
    }
    const session = await getAdminSession();
    if (!session) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/storage/images", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });
    const result = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !result.url) {
      setUserError(result.error ?? "Logo gagal diunggah.");
      return;
    }
    setTeacherDraft((current) => ({ ...current, institutionLogoUrl: result.url! }));
  }

  function closeTeacherConfig() {
    setEditingTeacher(null);
    setTeacherDraft(createTeacherDraft());
    setTeacherPasswordDraft("");
    setMode("list");
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <button
          className={className(
            "h-10 rounded-md px-4 text-sm font-semibold transition",
            activeTab === "users"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50",
          )}
          onClick={() => setActiveTab("users")}
          type="button"
        >
          User Guru
        </button>
        <button
          className={className(
            "h-10 rounded-md px-4 text-sm font-semibold transition",
            activeTab === "school"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50",
          )}
          onClick={() => {
            setActiveTab("school");
            closeTeacherConfig();
          }}
          type="button"
        >
          Konfigurasi Sekolah
        </button>
      </div>

      {activeTab === "users" ? (
        mode === "list" ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Admin sekolah</p>
                <h2 className="text-2xl font-semibold tracking-normal">
                  Manajemen User Guru
                </h2>
              </div>
              <button
                className="btn-primary"
                onClick={() => startTeacherForm()}
                type="button"
              >
                <Plus size={16} />
                Tambah Guru
              </button>
            </div>
            {userError && (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {userError}
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="p-3 font-semibold">Nama</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Identitas</th>
                    <th className="p-3 font-semibold">Kelas</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="w-64 p-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTeachers && (
                    <tr>
                      <td
                        className="p-4 text-center text-slate-500"
                        colSpan={6}
                      >
                        Memuat user guru...
                      </td>
                    </tr>
                  )}
                  {state.teachers.map((teacher) => {
                    const active = teacher.id === state.activeTeacherId;
                    return (
                      <tr
                        className="border-b border-slate-100 align-middle"
                        key={teacher.id}
                      >
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-slate-500">PJOK</p>
                        </td>
                        <td className="p-3 text-slate-600">{teacher.email}</td>
                        <td className="p-3 text-slate-600">
                          {teacher.identityType}.{" "}
                          {teacher.identityNumber || "-"}
                        </td>
                        <td className="p-3 text-slate-600">
                          Kelas {teacher.classes.join(", ") || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={className(
                              "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                              active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {active ? "Aktif" : "User"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn-secondary h-9 px-3"
                              disabled={active}
                              onClick={() => onActiveTeacherChange(teacher.id)}
                              type="button"
                            >
                              {active ? "Dipakai" : "Pakai"}
                            </button>
                            <button
                              className="btn-secondary h-9 px-3"
                              onClick={() => startTeacherForm(teacher)}
                              type="button"
                            >
                              <Settings size={15} />
                              Konfigurasi
                            </button>
                            <button
                              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                              onClick={() => void deleteTeacher(teacher.id)}
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoadingTeachers && state.teachers.length === 0 && (
                    <tr>
                      <td
                        className="p-4 text-center text-slate-500"
                        colSpan={6}
                      >
                        Belum ada user guru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Konfigurasi data guru</p>
                <h2 className="text-2xl font-semibold tracking-normal">
                  {editingTeacher ? editingTeacher.name : "Tambah Guru"}
                </h2>
              </div>
              <button
                className="btn-secondary"
                onClick={closeTeacherConfig}
                type="button"
              >
                <ArrowLeft size={16} />
                Kembali
              </button>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nama Guru"
                  onChange={(name) =>
                    setTeacherDraft((current) => ({ ...current, name }))
                  }
                  value={teacherDraft.name}
                />
                <TextField
                  label="Email"
                  onChange={(email) =>
                    setTeacherDraft((current) => ({ ...current, email }))
                  }
                  type="email"
                  value={teacherDraft.email}
                />
                <TextField
                  label={editingTeacher ? "Password Baru (opsional)" : "Password Awal"}
                  onChange={setTeacherPasswordDraft}
                  type="password"
                  value={teacherPasswordDraft}
                />
                {editingTeacher && (
                  <p className="-mt-3 text-xs text-slate-500 md:col-span-2">
                    Kosongkan jika password guru tidak perlu diubah. Password baru minimal 6 karakter.
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Jenis Identitas
                  </label>
                  <select
                    className="input"
                    onChange={(event) =>
                      setTeacherDraft((current) => ({
                        ...current,
                        identityType: event.target
                          .value as Teacher["identityType"],
                      }))
                    }
                    value={teacherDraft.identityType}
                  >
                    <option>NIP</option>
                    <option>NUPTK</option>
                    <option>No UKG</option>
                    <option>NIM</option>
                  </select>
                </div>
                <TextField
                  label="Nomor Identitas"
                  onChange={(identityNumber) =>
                    setTeacherDraft((current) => ({
                      ...current,
                      identityNumber,
                    }))
                  }
                  value={teacherDraft.identityNumber}
                />
                <div className="md:col-span-2 border-t border-slate-200 pt-5">
                  <p className="text-base font-semibold text-slate-900">Profil Sekolah dan Cover Dokumen</p>
                  <p className="mt-1 text-sm text-slate-500">Data ini khusus untuk dokumen guru ini.</p>
                </div>
                <TextField
                  label="Nama Sekolah"
                  onChange={(schoolName) => setTeacherDraft((current) => ({ ...current, schoolName }))}
                  value={teacherDraft.schoolName}
                />
                <TextField
                  label="Nama Kepala Sekolah"
                  onChange={(principalName) => setTeacherDraft((current) => ({ ...current, principalName }))}
                  value={teacherDraft.principalName}
                />
                <TextField
                  label="NIP Kepala Sekolah"
                  onChange={(principalNip) => setTeacherDraft((current) => ({ ...current, principalNip }))}
                  value={teacherDraft.principalNip}
                />
                <TextField
                  label="Nama Instansi pada Cover (opsional)"
                  onChange={(institutionName) => setTeacherDraft((current) => ({ ...current, institutionName }))}
                  value={teacherDraft.institutionName}
                />
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Logo Instansi pada Cover</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {teacherDraft.institutionLogoUrl ? <img alt="Logo instansi" className="size-16 rounded-md border border-slate-200 object-contain" src={teacherDraft.institutionLogoUrl} /> : <div className="grid size-16 place-items-center rounded-md border border-dashed border-slate-300 text-slate-400"><ImagePlus size={20} /></div>}
                    <label className="btn-secondary h-10 cursor-pointer px-3 text-sm">
                      <ImagePlus size={16} /> Upload Logo
                      <input accept="image/*" className="hidden" onChange={(event) => void uploadInstitutionLogo(event.target.files?.[0])} type="file" />
                    </label>
                    {teacherDraft.institutionLogoUrl && <button className="btn-secondary h-10 px-3 text-sm" onClick={() => setTeacherDraft((current) => ({ ...current, institutionLogoUrl: "" }))} type="button">Hapus Logo</button>}
                    <p className="w-full text-xs text-slate-500">PNG, JPG, atau WEBP; maksimal 2 MB.</p>
                  </div>
                </div>
              </div>

              {userError && (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {userError}
                </p>
              )}

              <TeacherClassPicker
                classes={teacherDraft.classes}
                onChange={(classes) =>
                  setTeacherDraft((current) => ({ ...current, classes }))
                }
              />

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
                <button
                  className="btn-secondary"
                  onClick={closeTeacherConfig}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="btn-primary"
                  disabled={isSavingTeacher}
                  onClick={() => void saveTeacher()}
                  type="button"
                >
                  {isSavingTeacher ? "Menyimpan..." : "Simpan Konfigurasi"}
                </button>
              </div>
            </div>
          </section>
        )
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <p className="text-sm text-slate-500">Profil sekolah per guru</p>
            <h2 className="text-2xl font-semibold tracking-normal">
              Manajemen Sekolah
            </h2>
            <p className="mt-2 text-sm text-slate-600">Nama sekolah, kepala sekolah, dan logo cover tersimpan bersama akun guru pemilik dokumen.</p>
          </div>
          <div className="grid gap-3">
            {state.teachers.map((teacher) => (
              <article className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between" key={teacher.id}>
                <div className="flex min-w-0 items-center gap-3">
                  {teacher.institutionLogoUrl ? <img alt="Logo instansi" className="size-12 shrink-0 rounded-md border border-slate-200 object-contain" src={teacher.institutionLogoUrl} /> : <div className="grid size-12 shrink-0 place-items-center rounded-md bg-slate-100 text-xs text-slate-400">Logo</div>}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{teacher.schoolName || "Sekolah belum diisi"}</p>
                    <p className="text-sm text-slate-600">Guru: {teacher.name} · Kepala sekolah: {teacher.principalName || "-"}</p>
                  </div>
                </div>
                <button className="btn-secondary shrink-0" onClick={() => { setActiveTab("users"); startTeacherForm(teacher); }} type="button">Kelola</button>
              </article>
            ))}
            {state.teachers.length === 0 && <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Tambahkan guru terlebih dahulu.</p>}
          </div>
        </section>
      )}
    </div>
  );
}

function createTeacherDraft(): Teacher {
  return {
    id: "",
    name: "",
    email: "",
    identityNumber: "",
    identityType: "NIP",
    subject: "PJOK",
    classes: [1],
    schoolName: "",
    principalName: "",
    principalNip: "",
    institutionName: "",
    institutionLogoUrl: "",
  };
}

function TeacherClassPicker({
  classes,
  onChange,
}: {
  classes: ClassGrade[];
  onChange: (classes: ClassGrade[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Kelas yang diajar</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {grades.map((grade) => {
          const checked = classes.includes(grade);
          return (
            <label
              className={className(
                "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm",
                checked
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-700",
              )}
              key={grade}
            >
              <input
                checked={checked}
                className="size-4"
                onChange={() => {
                  const nextClasses = checked
                    ? classes.filter((item) => item !== grade)
                    : [...classes, grade].sort((a, b) => a - b);
                  onChange(nextClasses);
                }}
                type="checkbox"
              />
              Kelas {grade}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function omitTopicRecords<T>(
  record: Record<string, T>,
  topicIds: string[],
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([topicId]) => !topicIds.includes(topicId)),
  );
}
