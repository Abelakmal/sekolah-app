import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../shared/styles/global.css'

export const metadata: Metadata = {
  title: 'Administrasi Guru',
  description: 'Bank pembelajaran dan penyusun administrasi guru PJOK SD.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
