'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/pais', label: 'Início' },
  { href: '/pais/cursos', label: 'Cursos' },
  { href: '/pais/jornada', label: 'Jornada' },
  { href: '/pais/carteirinhas', label: 'Carteirinhas' },
  { href: '/pais/acessos', label: 'Acessos' },
  { href: '/pais/presencas', label: 'Presenças' },
  { href: '/pais/financeiro', label: 'Financeiro' },
  { href: '/pais/notificacoes', label: 'Notificações' },
]

type PaisNavProps = {
  escolaNome?: string | null
}

export default function PaisNav({ escolaNome }: PaisNavProps) {
  const pathname = usePathname()
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
        <div className="mr-2 rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground">
          Contexto ativo: <span className="font-medium text-foreground">{escolaNome ?? 'Escola'}</span>
        </div>
        {LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          )
        })}
        <Link
          href="/selecionar-escola"
          className="ml-auto rounded-md border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Trocar escola
        </Link>
      </div>
    </nav>
  )
}
