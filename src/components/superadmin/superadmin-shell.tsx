'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth-actions'

// ─── Design tokens ────────────────────────────────────────────────────────────
const SIDEBAR_BG    = '#0d1117'
const SIDEBAR_HOVER = '#161b22'
const PRIMARY       = '#4f46e5'
const SECONDARY     = '#7c3aed'
const BG            = '#f8fafc'

// ─── Nav definition ───────────────────────────────────────────────────────────
type NavSection = { type: 'section'; label: string }
type NavLink    = { type: 'link'; id: string; label: string; icon: string; href: string; stub?: true }
type NavEntry   = NavSection | NavLink

const NAV: NavEntry[] = [
  { type: 'section', label: 'Principal' },
  { type: 'link', id: 'dashboard',     label: 'Dashboard',        icon: '📊', href: '/superadmin'           },
  { type: 'link', id: 'escolas',       label: 'Escolas',          icon: '🏫', href: '/superadmin/escolas'   },
  { type: 'link', id: 'usuarios',      label: 'Usuários',         icon: '👤', href: '/superadmin/usuarios'  },

  { type: 'section', label: 'Financeiro' },
  { type: 'link', id: 'cobrancas',     label: 'Fluxo de Caixa',   icon: '💸', href: '/superadmin/faturamento' },
  { type: 'link', id: 'planos',        label: 'Planos & Licenças',icon: '📦', href: '#', stub: true          },
  { type: 'link', id: 'relatorios',    label: 'Relatórios',       icon: '📈', href: '#', stub: true          },
  { type: 'link', id: 'notasfiscais',  label: 'Notas Fiscais',    icon: '🧾', href: '#', stub: true          },

  { type: 'section', label: 'Sistema' },
  { type: 'link', id: 'notificacoes',  label: 'Notificações',     icon: '🔔', href: '#', stub: true          },
  { type: 'link', id: 'permissoes',    label: 'Permissões',       icon: '🛡️', href: '/superadmin/permissoes' },
  { type: 'link', id: 'auditoria',     label: 'Auditoria',        icon: '📋', href: '/superadmin/auditoria'  },
  { type: 'link', id: 'configuracoes', label: 'Configurações',    icon: '⚙️', href: '#', stub: true          },
]

const PAGE_TITLES: Record<string, string> = {
  '/superadmin':              'Dashboard',
  '/superadmin/escolas':      'Escolas',
  '/superadmin/usuarios':     'Usuários Internos',
  '/superadmin/faturamento':  'Fluxo de Caixa',
  '/superadmin/permissoes':   'Matriz de Permissões',
  '/superadmin/auditoria':    'Auditoria de Permissões',
}

const PERFIL_LABEL: Record<string, string> = {
  super_admin:        'Super Admin',
  suporte:            'Suporte',
  financeiro_interno: 'Financeiro',
}

// ─── Component ────────────────────────────────────────────────────────────────
interface SuperAdminShellProps {
  perfil: string
  userName: string
  children: React.ReactNode
}

export function SuperAdminShell({ perfil, userName, children }: SuperAdminShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const pageTitle =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => k !== '/superadmin' && pathname.startsWith(k)) ?? ''] ??
    'SuperAdmin'

  const userInitials = userName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'SA'
  const perfilLabel  = PERFIL_LABEL[perfil] ?? perfil

  function isActive(href: string) {
    if (href === '/superadmin') return pathname === '/superadmin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-dvh" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-[100] flex h-dvh w-[260px] flex-col overflow-y-auto transition-transform duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Brand */}
        <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-[19px]"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              🛡️
            </div>
            <div>
              <p className="text-[13.5px] font-bold leading-tight text-white">Esportes Academy</p>
              <p className="text-[9.5px] uppercase tracking-[0.6px] text-white/30">Portal SuperAdmin</p>
            </div>
          </div>
        </div>

        {/* Profile chip */}
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-1.5">
          <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: PRIMARY }} />
          <span className="flex-1 text-[11px] font-medium text-white/45">Perfil</span>
          <span className="text-[11px] font-bold text-white/85">{perfilLabel}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {NAV.map((item, i) => {
            if (item.type === 'section') {
              return (
                <p
                  key={i}
                  className="mb-1 mt-3.5 px-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/22 first:mt-2"
                >
                  {item.label}
                </p>
              )
            }

            if (item.stub) {
              return (
                <span
                  key={item.id}
                  className="mb-px flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium opacity-35"
                >
                  <span className="w-5 flex-shrink-0 text-center text-[15px]">{item.icon}</span>
                  <span className="flex-1 text-white/55">{item.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-px text-[9px] font-semibold text-white/40 uppercase tracking-wide">em breve</span>
                </span>
              )
            }

            const active = isActive(item.href)

            return (
              <NavItem
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={active}
                hoverBg={SIDEBAR_HOVER}
                activeBg={PRIMARY}
                onClick={() => setOpen(false)}
              />
            )
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/[0.06] p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
              <p className="text-[10.5px] text-white/30">{perfilLabel}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded p-1 text-sm text-white/25 transition-colors hover:text-red-400"
                title="Sair"
              >
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col lg:ml-[260px]">

        {/* Topbar */}
        <header
          className="sticky top-0 z-50 flex h-[60px] flex-shrink-0 items-center gap-2.5 border-b px-4 sm:px-6 lg:px-7"
          style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
        >
          <button
            onClick={() => setOpen(v => !v)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-[17px] lg:hidden"
            style={{ background: BG, borderColor: '#e2e8f0' }}
          >
            ☰
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold sm:text-base" style={{ color: '#0f172a' }}>
              {pageTitle}
            </p>
            <p className="hidden text-[11px] sm:block" style={{ color: '#64748b' }}>
              Esportes Academy · Portal SuperAdmin
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div
              className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 md:flex"
              style={{ background: BG, borderColor: '#e2e8f0', width: 200 }}
            >
              <span className="text-[13px] text-gray-400">🔍</span>
              <input
                placeholder="Buscar..."
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: '#0f172a', border: 'none' }}
              />
            </div>

            <div
              className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:flex"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: PRIMARY }} />
              {perfilLabel}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-5 lg:p-7" style={{ background: BG }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── NavItem helper ───────────────────────────────────────────────────────────
function NavItem({
  href, icon, label, active, hoverBg, activeBg, onClick
}: {
  href: string; icon: string; label: string; active: boolean
  hoverBg: string; activeBg: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mb-px flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors duration-150"
      style={{
        background: active ? activeBg : hovered ? hoverBg : 'transparent',
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,.80)' : 'rgba(255,255,255,.45)',
      }}
    >
      <span className="w-5 flex-shrink-0 text-center text-[15px]">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}
