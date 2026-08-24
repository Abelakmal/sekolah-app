import { BriefcaseBusiness, LockKeyhole, Mail } from 'lucide-react'
import type { AppState } from '../../core/types'

const classroomImageUrl =
  'https://images.unsplash.com/photo-1758270705696-ec9caffc73dd?auto=format&fit=crop&ixlib=rb-4.1.0&q=80&w=1600'

type LoginPageProps = {
  error: string
  email: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: () => void
  password: string
  state: AppState
}

export function LoginPage({ email, error, onEmailChange, onPasswordChange, onSubmit, password, state }: LoginPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8 text-slate-950 sm:px-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:min-h-[680px] lg:grid-cols-[1fr_420px]">
        <div className="relative hidden overflow-hidden bg-blue-950 text-white lg:block">
          <img alt="Guru dan peserta didik berdiskusi di ruang kelas" className="absolute inset-0 size-full object-cover" src={classroomImageUrl} />
          <div className="absolute inset-0 bg-blue-950/75" />
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div>
              <div className="grid size-12 place-items-center rounded-lg bg-sky-500">
                <BriefcaseBusiness size={24} />
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-normal">Administrasi Guru</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">
                Bank pembelajaran dan penyusun administrasi PJOK SD untuk guru dan admin sekolah.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-blue-100">
              <CredentialRow label="Guru" tone="dark" value={state.teacher.email} />
              <CredentialRow label="Admin" tone="dark" value="admin@sekolah.test" />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="mb-7 lg:hidden">
            <div className="grid size-11 place-items-center rounded-lg bg-blue-950 text-white">
              <BriefcaseBusiness size={22} />
            </div>
          </div>

          <p className="text-sm font-medium text-slate-500">Masuk akun</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">Administrasi Guru</h2>

          <form
            className="mt-7 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  autoComplete="email"
                  className="input input-with-icon"
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="nama@sekolah.test"
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  autoComplete="current-password"
                  className="input input-with-icon"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Password"
                  type="password"
                  value={password}
                />
              </span>
            </label>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            )}

            <button className="btn-primary w-full" type="submit">
              Masuk
            </button>
          </form>

          <div className="mt-6 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <CredentialRow label="Guru" value={`${state.teacher.email} / guru123`} />
            <CredentialRow label="Admin" value="admin@sekolah.test / admin123" />
          </div>
        </div>
      </section>
    </main>
  )
}

function CredentialRow({ label, tone = 'light', value }: { label: string; tone?: 'dark' | 'light'; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={tone === 'dark' ? 'font-semibold text-blue-50' : 'font-semibold text-slate-700'}>{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  )
}
