import type { Metadata } from 'next'
import { Geist, Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { QueryProvider } from '@/providers/query-provider'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Esportes Academy',
  description: 'Plataforma SaaS para gestão de escolas esportivas',
  icons: {
    icon: '/esportes-academy-logo.jpg',
    shortcut: '/esportes-academy-logo.jpg',
    apple: '/esportes-academy-logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn('h-full', 'antialiased', inter.variable, 'font-sans', geist.variable)}
    >
      <body className="flex min-h-full flex-col bg-[var(--bg)]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
