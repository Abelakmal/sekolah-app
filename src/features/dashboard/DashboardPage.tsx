import { Archive, BookOpenCheck, BriefcaseBusiness, Check, ClipboardList, FileText, GraduationCap } from 'lucide-react'
import type { AppState, AppView, ClassGrade, LearningTopic } from '../../core/types'
import { StatCard } from '../../shared/components/StatCard'
import { TopicRow } from '../../shared/components/TopicRow'

type DashboardStats = {
  topics: number
  objectives: number
  materials: number
  activities: number
  assessments: number
  drafts: number
}

export function DashboardPage({
  goToGrade,
  goToTopic,
  setActiveView,
  state,
  stats,
}: {
  goToGrade: (grade: ClassGrade) => void
  goToTopic: (topic: LearningTopic) => void
  setActiveView: (view: AppView) => void
  state: AppState
  stats: DashboardStats
}) {
  const taughtTopics = state.topics.filter((topic) => topic.teacherId === state.activeTeacherId && state.teacher.classes.includes(topic.classGrade))

  return (
    <div className="grid gap-5">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Selamat datang, {state.teacher.name}!</h2>
          <p className="mt-1 text-sm text-slate-600">Kelola bank pembelajaran PJOK dengan mudah.</p>
        </div>
        <div className="flex items-center gap-2 text-4xl" aria-hidden="true">
          <span>🏀</span>
          <span>⚽</span>
          <span>🏐</span>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold">Ringkasan Bank Pembelajaran</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard icon={BookOpenCheck} label="Topik Pembelajaran" tone="blue" value={stats.topics} />
          <StatCard icon={Check} label="Tujuan Pembelajaran" tone="emerald" value={stats.objectives} />
          <StatCard icon={FileText} label="Materi" tone="violet" value={stats.materials} />
          <StatCard icon={ClipboardList} label="Aktivitas Pembelajaran" tone="amber" value={stats.activities} />
          <StatCard icon={BriefcaseBusiness} label="Asesmen" tone="rose" value={stats.assessments} />
          <StatCard icon={Archive} label="Administrasi" tone="cyan" value={stats.drafts} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Kelas yang Anda Ajar</h3>
          <button className="text-sm font-semibold text-blue-700" onClick={() => setActiveView('topics')} type="button">
            Lihat semua
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {state.teacher.classes.map((grade) => (
            <button
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50"
              key={grade}
              onClick={() => goToGrade(grade)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="text-blue-600" size={18} />
                <p className="font-semibold">Kelas {grade}</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {taughtTopics.filter((topic) => topic.classGrade === grade).length} Topik
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-base font-semibold">Topik terbaru</h3>
        <div className="grid gap-2">
          {taughtTopics.slice(0, 5).map((topic) => (
            <TopicRow key={topic.id} onOpen={() => goToTopic(topic)} state={state} topic={topic} />
          ))}
        </div>
      </section>
    </div>
  )
}
