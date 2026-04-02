'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/superadmin/escolas', label: 'Escolas' },
  { href: '/superadmin/usuarios', label: 'Usuários internos' },
  { href: '/superadmin/faturamento', label: 'Faturamento' },
  { href: '/superadmin/permissoes', label: 'Permissões' },
  { href: '/superadmin/auditoria', label: 'Auditoria' },
]

export default function SuperAdminNav() {
  const pathname = usePathname()
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
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
      </div>
    </nav>
  )
}
