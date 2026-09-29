import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Archive,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  ClipboardList,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
} from 'lucide-react'
import { className } from '../core/utils'
import { getModuleCompletion } from '../core/moduleCompletion'
import type { AppState, AppView, BankTab, LearningTopic, UserRole } from '../core/types'

type AppShellProps = {
  activeTopicTab: BankTab
  activeView: AppView
  children: ReactNode
  onLogout: () => void
  onTopicTabChange: (tab: BankTab) => void
  onViewChange: (view: AppView) => void
  role: UserRole
  selectedTopic?: LearningTopic
  state: AppState
}

const navItems: Array<{ id: AppView; label: string; icon: typeof BookOpenCheck; roles: UserRole[] }> = [
  { id: 'admin', label: 'Admin Guru', icon: UsersRound, roles: ['admin'] },
  { id: 'topics', label: 'Topik Pembelajaran', icon: BookOpenCheck, roles: ['teacher'] },
  { id: 'builder', label: 'Penyusun Administrasi', icon: ClipboardList, roles: ['teacher'] },
  { id: 'archive', label: 'Arsip Administrasi', icon: Archive, roles: ['teacher'] },
]

const topicStepLabels: Record<BankTab, string> = {
  'module-info': 'Informasi Modul',
  competencies: 'Kompetensi & Tujuan',
  activities: 'Aktivitas Pembelajaran',
  assessments: 'Asesmen & Rubrik',
  worksheets: 'LKPD',
  attachments: 'Lampiran',
}

const topicSteps = Object.keys(topicStepLabels) as BankTab[]

const completionItemTotals: Record<BankTab, number> = {
  'module-info': 20,
  competencies: 10,
  activities: 1,
  assessments: 16,
  worksheets: 1,
  attachments: 7,
}

export function AppShell({ activeTopicTab, activeView, children, onLogout, onTopicTabChange, onViewChange, role, selectedTopic, state }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside
        className={className(
          'fixed inset-y-0 left-0 z-10 hidden border-r border-blue-950/40 bg-blue-950 text-white transition-[width] duration-200 md:block',
          isSidebarCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className={className('border-b border-white/10 py-5', isSidebarCollapsed ? 'px-3' : 'px-5')}>
          <div className={className('flex items-center gap-3', isSidebarCollapsed ? 'justify-center' : 'justify-between')}>
            <div className={className('flex min-w-0 items-center gap-3', isSidebarCollapsed ? 'justify-center' : '')}>
            <div className="grid size-10 place-items-center rounded-lg bg-sky-500">
              <BriefcaseBusiness size={21} />
            </div>
            {!isSidebarCollapsed && (
            <div>
              <p className="text-sm font-semibold leading-5">Administrasi Guru</p>
              <p className="text-xs text-blue-100">Bank PJOK SD</p>
            </div>
            )}
            </div>
          </div>
        </div>

        <nav className="grid gap-1 px-3 py-4">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const Icon = item.icon
              const active = activeView === item.id || (item.id === 'topics' && activeView === 'topic-detail')
              return (
                <div className="grid gap-2" key={item.id}>
                  <button
                    className={className(
                      'flex h-11 items-center rounded-md px-3 text-left text-sm font-medium transition',
                      isSidebarCollapsed ? 'justify-center' : 'gap-3',
                      active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white',
                    )}
                    onClick={() => onViewChange(item.id)}
                    title={item.label}
                    type="button"
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    {!isSidebarCollapsed && item.label}
                  </button>
                  {item.id === 'topics' && activeView === 'topic-detail' && selectedTopic && (
                    <TopicSidebarProgress activeTopicTab={activeTopicTab} isCollapsed={isSidebarCollapsed} onTopicTabChange={onTopicTabChange} selectedTopic={selectedTopic} state={state} />
                  )}
                </div>
              )
            })}
        </nav>

        <div className={className('absolute inset-x-0 bottom-0 border-t border-white/10', isSidebarCollapsed ? 'p-3' : 'p-4')}>
          <div className={className('flex w-full items-center rounded-md py-2 text-left', isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-2')}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-bold text-blue-950">
              {role === 'admin' ? 'A' : state.teacher.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{role === 'admin' ? 'Admin' : state.teacher.name}</p>
              <p className="text-xs text-blue-100">{role === 'admin' ? 'Kelola Guru' : 'Guru PJOK'}</p>
            </div>
            )}
          </div>
        </div>
      </aside>

      <main className={className('transition-[padding] duration-200', isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64')}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="grid size-9 place-items-center rounded-md border border-slate-200 md:hidden" type="button">
                <Menu size={18} />
              </button>
              <button
                className="hidden size-9 place-items-center rounded-md border border-blue-900/30 bg-blue-950 text-blue-100 hover:bg-blue-900 hover:text-white md:grid"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                title={isSidebarCollapsed ? 'Lebarkan navigasi' : 'Kecilkan navigasi'}
                type="button"
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <div>
                <p className="text-xs text-slate-500">Administrasi Guru</p>
                <h1 className="text-lg font-semibold tracking-normal sm:text-xl">{pageTitle(activeView, role)}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700 sm:flex">
                <Calendar size={16} />
                Tahun Ajaran 2024/2025
              </div>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onLogout} type="button">
                Keluar
              </button>
            </div>
          </div>
        </header>

        <div className={className('px-4 py-5 sm:px-6', activeView === 'topic-detail' ? 'lg:px-5' : 'lg:px-8')}>{children}</div>
      </main>
    </div>
  )
}

function TopicSidebarProgress({
  activeTopicTab,
  isCollapsed,
  onTopicTabChange,
  selectedTopic,
  state,
}: {
  activeTopicTab: BankTab
  isCollapsed: boolean
  onTopicTabChange: (tab: BankTab) => void
  selectedTopic: LearningTopic
  state: AppState
}) {
  const completion = getModuleCompletion(state, selectedTopic)
  const sectionByTab = new Map(completion.sections.map((section) => [getTopicTabForCompletionLabel(section.label), section]))

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <ProgressRing className="size-10" progress={completion.progress} title={`${completion.progress}% Modul Ajar`}>
          <div className="grid size-8 place-items-center rounded-full bg-blue-950 text-[10px] font-bold text-white">{completion.progress}%</div>
        </ProgressRing>
      </div>
    )
  }

  return (
    <div className="border-l border-white/10 py-2 pl-3 text-blue-100">
      <div className="mb-2 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-200">Modul Ajar</p>
        <p className="text-xs text-blue-100">{completion.complete}/{completion.total} step lengkap</p>
      </div>
      <div className="grid gap-0.5">
        {topicSteps.map((step, index) => {
          const section = sectionByTab.get(step)
          const isComplete = Boolean(section?.complete)
          const isActive = activeTopicTab === step
          const totalItems = completionItemTotals[step]
          const completedItems = Math.max(0, totalItems - (section?.missing.length ?? totalItems))
          const stepProgress = isComplete ? 100 : Math.max(isActive ? 8 : 4, Math.round((completedItems / totalItems) * 100))

          return (
            <button
              className={className(
                'flex min-w-0 items-center gap-2 rounded-r-md border-l-2 py-2 pl-2 pr-1 text-left transition',
                isActive ? 'border-rose-500 bg-white/10 text-white' : 'border-transparent text-blue-100 hover:bg-white/5 hover:text-white',
              )}
              key={step}
              onClick={() => onTopicTabChange(step)}
              type="button"
            >
              <ProgressRing className="size-6" progress={stepProgress} title={`${topicStepLabels[step]} ${isComplete ? 'lengkap' : 'belum lengkap'}`}>
                <span className="grid size-4 place-items-center rounded-full bg-blue-950 text-[9px] font-bold text-blue-100">{isComplete ? '' : index + 1}</span>
              </ProgressRing>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{topicStepLabels[step]}</span>
                {isActive && <span className="mt-0.5 block truncate text-[11px] text-blue-200">{isComplete ? 'Lengkap' : section?.missing[0] ?? 'Belum lengkap'}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgressRing({
  children,
  className: ringClassName,
  progress,
  title,
}: {
  children: ReactNode
  className?: string
  progress: number
  title?: string
}) {
  return (
    <span
      className={className('grid shrink-0 place-items-center rounded-full', ringClassName)}
      style={{
        background: `conic-gradient(#14b8a6 ${progress * 3.6}deg, rgba(203,213,225,0.55) 0deg)`,
      }}
      title={title}
    >
      {children}
    </span>
  )
}

function getTopicTabForCompletionLabel(label: string): BankTab {
  if (label === 'Identitas Modul') return 'module-info'
  if (label === 'Kompetensi & Tujuan') return 'competencies'
  if (label === 'Aktivitas Pembelajaran') return 'activities'
  if (label === 'Asesmen & Rubrik') return 'assessments'
  if (label === 'LKPD') return 'worksheets'
  return 'attachments'
}

function pageTitle(view: AppView, role: UserRole) {
  if (role === 'admin') return 'Admin Guru'
  const titles: Record<AppView, string> = {
    admin: 'Admin Guru',
    topics: 'Topik Pembelajaran',
    'topic-detail': 'Detail Topik Pembelajaran',
    builder: 'Penyusun Administrasi',
    archive: 'Arsip Administrasi',
  }
  return titles[view]
}
