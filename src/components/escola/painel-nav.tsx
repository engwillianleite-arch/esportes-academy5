'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/painel', label: 'Início' },
  { href: '/painel/dashboard', label: 'Dashboard' },
  { href: '/painel/atletas', label: 'Atletas' },
  { href: '/painel/turmas', label: 'Turmas' },
  { href: '/painel/presencas', label: 'Chamada' },
  { href: '/painel/acessos', label: 'Acessos' },
  { href: '/painel/planos-pagamento', label: 'Planos' },
  { href: '/painel/financeiro', label: 'Financeiro' },
  { href: '/painel/saude', label: 'Saúde' },
  { href: '/painel/cursos', label: 'Cursos' },
  { href: '/painel/comunicacao-basica', label: 'Comunicação' },
  { href: '/painel/configuracoes', label: 'Configurações' },
]

export function PainelNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
        {LINKS.map((l) => {
          const active = pathname === l.href || (l.href !== '/painel' && pathname.startsWith(l.href))
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
          Trocar perfil
        </Link>
      </div>
    </nav>
  )
}

