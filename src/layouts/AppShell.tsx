import type { ReactNode } from 'react'
import {
  Archive,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  ClipboardList,
  Menu,
  UsersRound,
} from 'lucide-react'
import { className } from '../core/utils'
import type { AppState, AppView, UserRole } from '../core/types'

type AppShellProps = {
  activeView: AppView
  children: ReactNode
  onLogout: () => void
  onViewChange: (view: AppView) => void
  role: UserRole
  state: AppState
}

const navItems: Array<{ id: AppView; label: string; icon: typeof BookOpenCheck; roles: UserRole[] }> = [
  { id: 'admin', label: 'Admin Guru', icon: UsersRound, roles: ['admin'] },
  { id: 'topics', label: 'Topik Pembelajaran', icon: BookOpenCheck, roles: ['teacher'] },
  { id: 'builder', label: 'Penyusun Administrasi', icon: ClipboardList, roles: ['teacher'] },
  { id: 'archive', label: 'Arsip Administrasi', icon: Archive, roles: ['teacher'] },
]

export function AppShell({ activeView, children, onLogout, onViewChange, role, state }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 border-r border-blue-950/40 bg-blue-950 text-white md:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-sky-500">
              <BriefcaseBusiness size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">Administrasi Guru</p>
              <p className="text-xs text-blue-100">Bank PJOK SD</p>
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
                <button
                  className={className(
                    'flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition',
                    active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white',
                  )}
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  type="button"
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </button>
              )
            })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-bold text-blue-950">
              {role === 'admin' ? 'A' : state.teacher.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{role === 'admin' ? 'Admin' : state.teacher.name}</p>
              <p className="text-xs text-blue-100">{role === 'admin' ? 'Kelola Guru' : 'Guru PJOK'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="grid size-9 place-items-center rounded-md border border-slate-200 md:hidden" type="button">
                <Menu size={18} />
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

        <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
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
