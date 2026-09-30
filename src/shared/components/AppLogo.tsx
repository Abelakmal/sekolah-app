export function AppLogo({ className = 'size-10' }: { className?: string }) {
  return <img alt="Logo Administrasi Guru" className={`shrink-0 rounded-lg bg-white object-contain ${className}`} height={40} src="/logo-app.png" width={40} />
}
