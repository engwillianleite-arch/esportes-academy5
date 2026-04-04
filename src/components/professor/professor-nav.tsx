'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/professor', label: 'Painel', short: 'Painel' },
  { href: '/professor/turmas', label: 'Turmas', short: 'Turmas' },
  { href: '/professor/chamada', label: 'Chamada', short: 'Chamada' },
]

export default function ProfessorNav({ escolaNome }: { escolaNome?: string | null }) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 border-b border-sky-100/80 bg-[rgba(247,251,255,0.88)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_100%)] text-sm font-black text-white shadow-[0_12px_24px_rgba(14,165,233,.28)]">
              EA
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Professor</p>
              <p className="text-sm text-slate-500">
                Contexto ativo: <span className="font-semibold text-slate-900">{escolaNome ?? 'Escola'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                    active
                      ? 'bg-sky-600 text-white shadow-[0_12px_24px_rgba(14,165,233,.22)]'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-slate-900'
                  )}
                >
                  <span className="sm:hidden">{l.short}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              )
            })}
            <Link
              href="/selecionar-escola"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-sky-200 hover:text-slate-900"
            >
              Trocar escola
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
