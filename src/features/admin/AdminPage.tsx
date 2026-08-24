import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ArrowLeft, Plus, Settings, Trash2 } from 'lucide-react'
import { setActiveTeacher, updateTeacherInState } from '../../core/storage'
import { className, createId } from '../../core/utils'
import type { AppState, ClassGrade, Teacher } from '../../core/types'
import { TextField } from '../../shared/components/FormControls'
import { confirmDelete } from '../../shared/utils/confirmDelete'

const grades = [1, 2, 3, 4, 5, 6] as const
type AdminMode = 'list' | 'config'
type AdminTab = 'users' | 'school'

export function AdminPage({
  onActiveTeacherChange,
  setState,
  state,
}: {
  onActiveTeacherChange: (teacherId: string) => void
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [mode, setMode] = useState<AdminMode>('list')
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [teacherDraft, setTeacherDraft] = useState(createTeacherDraft())
  const [userError, setUserError] = useState('')

  function startTeacherForm(teacher?: Teacher) {
    setEditingTeacher(teacher ?? null)
    setTeacherDraft(teacher ? { ...teacher } : createTeacherDraft())
    setUserError('')
    setMode('config')
  }

  function saveTeacher() {
    if (!teacherDraft.name.trim() || !teacherDraft.email.trim()) return
    if (editingTeacher) {
      setState((current) =>
        updateTeacherInState(current, {
          ...teacherDraft,
          name: teacherDraft.name.trim(),
          email: teacherDraft.email.trim(),
          identityNumber: teacherDraft.identityNumber.trim(),
        }),
      )
    } else {
      const teacher: Teacher = {
        ...teacherDraft,
        id: createId('teacher'),
        name: teacherDraft.name.trim(),
        email: teacherDraft.email.trim(),
        identityNumber: teacherDraft.identityNumber.trim(),
      }
      setState((current) => ({
        ...current,
        teachers: [teacher, ...current.teachers],
      }))
    }
    closeTeacherConfig()
  }

  function deleteTeacher(teacherId: string) {
    if (state.teachers.length <= 1) {
      setUserError('Minimal harus ada satu guru.')
      return
    }
    if (!confirmDelete('Hapus guru ini beserta topik, peserta didik, bank pembelajaran, dan arsip miliknya?')) return

    setState((current) => {
      const topicIds = current.topics.filter((topic) => topic.teacherId === teacherId).map((topic) => topic.id)
      const nextTeachers = current.teachers.filter((teacher) => teacher.id !== teacherId)
      const nextActiveTeacher = current.activeTeacherId === teacherId ? nextTeachers[0] : current.teacher
      const nextState = {
        ...current,
        teachers: nextTeachers,
        activeTeacherId: nextActiveTeacher.id,
        teacher: nextActiveTeacher,
        students: current.students.filter((student) => student.teacherId !== teacherId),
        topics: current.topics.filter((topic) => topic.teacherId !== teacherId),
        objectives: current.objectives.filter((item) => !topicIds.includes(item.topicId)),
        materials: current.materials.filter((item) => !topicIds.includes(item.topicId)),
        activities: current.activities.filter((item) => !topicIds.includes(item.topicId)),
        assessments: current.assessments.filter((item) => !topicIds.includes(item.topicId)),
        drafts: current.drafts.filter((draft) => draft.teacherId !== teacherId),
        moduleInfo: omitTopicRecords(current.moduleInfo, topicIds),
        moduleCompetencies: omitTopicRecords(current.moduleCompetencies, topicIds),
        moduleActivities: omitTopicRecords(current.moduleActivities, topicIds),
        moduleAssessments: omitTopicRecords(current.moduleAssessments, topicIds),
        moduleWorksheets: omitTopicRecords(current.moduleWorksheets, topicIds),
        moduleAppendices: omitTopicRecords(current.moduleAppendices, topicIds),
      }
      return setActiveTeacher(nextState, nextActiveTeacher.id)
    })
  }

  function closeTeacherConfig() {
    setEditingTeacher(null)
    setTeacherDraft(createTeacherDraft())
    setMode('list')
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <button
          className={className(
            'h-10 rounded-md px-4 text-sm font-semibold transition',
            activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50',
          )}
          onClick={() => setActiveTab('users')}
          type="button"
        >
          User Guru
        </button>
        <button
          className={className(
            'h-10 rounded-md px-4 text-sm font-semibold transition',
            activeTab === 'school' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50',
          )}
          onClick={() => {
            setActiveTab('school')
            closeTeacherConfig()
          }}
          type="button"
        >
          Konfigurasi Sekolah
        </button>
      </div>

      {activeTab === 'users' ? (
        mode === 'list' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Admin sekolah</p>
                <h2 className="text-2xl font-semibold tracking-normal">Manajemen User Guru</h2>
              </div>
              <button className="btn-primary" onClick={() => startTeacherForm()} type="button">
                <Plus size={16} />
                Tambah Guru
              </button>
            </div>
            {userError && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{userError}</p>}

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
                  {state.teachers.map((teacher) => {
                    const active = teacher.id === state.activeTeacherId
                    return (
                      <tr className="border-b border-slate-100 align-middle" key={teacher.id}>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{teacher.name}</p>
                          <p className="text-xs text-slate-500">PJOK</p>
                        </td>
                        <td className="p-3 text-slate-600">{teacher.email}</td>
                        <td className="p-3 text-slate-600">
                          {teacher.identityType}. {teacher.identityNumber || '-'}
                        </td>
                        <td className="p-3 text-slate-600">Kelas {teacher.classes.join(', ') || '-'}</td>
                        <td className="p-3">
                          <span
                            className={className(
                              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                              active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            {active ? 'Aktif' : 'User'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button className="btn-secondary h-9 px-3" disabled={active} onClick={() => onActiveTeacherChange(teacher.id)} type="button">
                              {active ? 'Dipakai' : 'Pakai'}
                            </button>
                            <button className="btn-secondary h-9 px-3" onClick={() => startTeacherForm(teacher)} type="button">
                              <Settings size={15} />
                              Konfigurasi
                            </button>
                            <button
                              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                              onClick={() => deleteTeacher(teacher.id)}
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Konfigurasi data guru</p>
                <h2 className="text-2xl font-semibold tracking-normal">{editingTeacher ? editingTeacher.name : 'Tambah Guru'}</h2>
              </div>
              <button className="btn-secondary" onClick={closeTeacherConfig} type="button">
                <ArrowLeft size={16} />
                Kembali
              </button>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Nama Guru" onChange={(name) => setTeacherDraft((current) => ({ ...current, name }))} value={teacherDraft.name} />
                <TextField label="Email" onChange={(email) => setTeacherDraft((current) => ({ ...current, email }))} type="email" value={teacherDraft.email} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Identitas</label>
                  <select
                    className="input"
                    onChange={(event) => setTeacherDraft((current) => ({ ...current, identityType: event.target.value as Teacher['identityType'] }))}
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
                  onChange={(identityNumber) => setTeacherDraft((current) => ({ ...current, identityNumber }))}
                  value={teacherDraft.identityNumber}
                />
              </div>

              <TeacherClassPicker classes={teacherDraft.classes} onChange={(classes) => setTeacherDraft((current) => ({ ...current, classes }))} />

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
                <button className="btn-secondary" onClick={closeTeacherConfig} type="button">
                  Batal
                </button>
                <button className="btn-primary" onClick={saveTeacher} type="button">
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </section>
        )
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <p className="text-sm text-slate-500">Konfigurasi sekolah</p>
            <h2 className="text-2xl font-semibold tracking-normal">Data Sekolah</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nama Sekolah"
              onChange={(value) => setState((current) => ({ ...current, school: { ...current.school, name: value } }))}
              value={state.school.name}
            />
            <TextField
              label="Nama Kepala Sekolah"
              onChange={(value) => setState((current) => ({ ...current, school: { ...current.school, principalName: value } }))}
              value={state.school.principalName}
            />
            <TextField
              label="NIP Kepala Sekolah"
              onChange={(value) => setState((current) => ({ ...current, school: { ...current.school, principalNip: value } }))}
              value={state.school.principalNip}
            />
          </div>
        </section>
      )}
    </div>
  )
}

function createTeacherDraft(): Teacher {
  return {
    id: '',
    name: '',
    email: '',
    identityNumber: '',
    identityType: 'NIP',
    subject: 'PJOK',
    classes: [1],
  }
}

function TeacherClassPicker({ classes, onChange }: { classes: ClassGrade[]; onChange: (classes: ClassGrade[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Kelas yang diajar</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {grades.map((grade) => {
          const checked = classes.includes(grade)
          return (
            <label
              className={className(
                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm',
                checked ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700',
              )}
              key={grade}
            >
              <input
                checked={checked}
                className="size-4"
                onChange={() => {
                  const nextClasses = checked ? classes.filter((item) => item !== grade) : [...classes, grade].sort((a, b) => a - b)
                  onChange(nextClasses)
                }}
                type="checkbox"
              />
              Kelas {grade}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function omitTopicRecords<T>(record: Record<string, T>, topicIds: string[]): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([topicId]) => !topicIds.includes(topicId)))
}
