import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Plus } from 'lucide-react'
import type { AppState, ClassGrade, Student } from '../../core/types'
import { createId } from '../../core/utils'
import { NumberField, TextField } from '../../shared/components/FormControls'
import { FormPanel } from '../../shared/components/FormPanel'
import { confirmDelete } from '../../shared/utils/confirmDelete'

const grades: ClassGrade[] = [1, 2, 3, 4, 5, 6]

export function StudentsPage({
  setState,
  state,
}: {
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const availableGrades = state.teacher.classes.length > 0 ? state.teacher.classes : grades
  const [studentGrade, setStudentGrade] = useState<ClassGrade>(availableGrades[0] ?? 1)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentDraft, setStudentDraft] = useState({ name: '', orderNumber: 1 })
  const classStudents = state.students
    .filter((student) => student.teacherId === state.activeTeacherId && student.classGrade === studentGrade)
    .sort((a, b) => a.orderNumber - b.orderNumber)

  function startStudentForm(student?: Student) {
    setEditingStudent(student ?? null)
    setStudentDraft(student ? { name: student.name, orderNumber: student.orderNumber } : { name: '', orderNumber: classStudents.length + 1 })
  }

  function saveStudent() {
    if (!studentDraft.name.trim() || studentDraft.orderNumber <= 0) return
    if (editingStudent) {
      setState((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === editingStudent.id ? { ...student, name: studentDraft.name.trim(), orderNumber: studentDraft.orderNumber } : student,
        ),
      }))
    } else {
      setState((current) => ({
        ...current,
        students: [
          ...current.students,
          {
            id: createId('student'),
            teacherId: current.activeTeacherId,
            classGrade: studentGrade,
            name: studentDraft.name.trim(),
            orderNumber: studentDraft.orderNumber,
          },
        ],
      }))
    }
    setEditingStudent(null)
    setStudentDraft({ name: '', orderNumber: classStudents.length + 1 })
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{state.teacher.name}</p>
          <h2 className="text-2xl font-semibold tracking-normal">Data Peserta Didik</h2>
        </div>
        <button className="btn-primary" onClick={() => startStudentForm()} type="button">
          <Plus size={16} />
          Tambah Peserta Didik
        </button>
      </div>

      <div className="mb-4 max-w-xs">
        <label className="mb-1 block text-sm font-medium text-slate-700">Filter Kelas</label>
        <select className="input" onChange={(event) => setStudentGrade(Number(event.target.value) as ClassGrade)} value={studentGrade}>
          {availableGrades.map((grade) => (
            <option key={grade} value={grade}>
              Kelas {grade}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500">
              <th className="border border-slate-200 p-3">No</th>
              <th className="border border-slate-200 p-3">Nama Peserta Didik</th>
              <th className="w-36 border border-slate-200 p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((student) => (
              <tr key={student.id}>
                <td className="border border-slate-200 p-3">{student.orderNumber}</td>
                <td className="border border-slate-200 p-3 font-medium">{student.name}</td>
                <td className="border border-slate-200 p-3">
                  <div className="flex gap-2">
                    <button className="text-sm font-semibold text-blue-700" onClick={() => startStudentForm(student)} type="button">
                      Edit
                    </button>
                    <button
                      className="text-sm font-semibold text-red-700"
                      onClick={() => {
                        if (confirmDelete('Hapus peserta didik ini?')) {
                          setState((current) => ({ ...current, students: current.students.filter((item) => item.id !== student.id) }))
                        }
                      }}
                      type="button"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {classStudents.length === 0 && (
              <tr>
                <td className="border border-dashed border-slate-300 p-4 text-center text-slate-500" colSpan={3}>
                  Belum ada peserta didik untuk kelas ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editingStudent || studentDraft.name) && (
        <FormPanel
          title={editingStudent ? 'Edit Peserta Didik' : 'Tambah Peserta Didik'}
          onCancel={() => {
            setEditingStudent(null)
            setStudentDraft({ name: '', orderNumber: classStudents.length + 1 })
          }}
          onSave={saveStudent}
        >
          <TextField label="Nama Peserta Didik" onChange={(name) => setStudentDraft((current) => ({ ...current, name }))} value={studentDraft.name} />
          <NumberField
            label="Nomor Urut"
            onChange={(orderNumber) => setStudentDraft((current) => ({ ...current, orderNumber }))}
            value={studentDraft.orderNumber}
          />
        </FormPanel>
      )}
    </section>
  )
}
