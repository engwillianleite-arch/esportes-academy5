'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth-actions'

// ─── Design tokens (from prototype) ──────────────────────────────────────────
const SIDEBAR_BG    = '#0d2112'
const SIDEBAR_HOVER = '#162e1c'
const PRIMARY       = '#20c997'
const SECONDARY     = '#5bc0eb'
const ACCENT        = '#ffa552'
const BG            = '#f7f9fa'

// ─── Nav definition ───────────────────────────────────────────────────────────
type NavSection = { type: 'section'; label: string }
type NavLink    = { type: 'link'; id: string; label: string; icon: string; href: string; lock?: 'Pro' | 'Enterprise' }
type NavEntry   = NavSection | NavLink

const NAV: NavEntry[] = [
  { type: 'section', label: 'Principal' },
  { type: 'link', id: 'dashboard',   label: 'Dashboard',          icon: '📊', href: '/painel/dashboard' },
  { type: 'link', id: 'atletas',     label: 'Atletas',             icon: '👥', href: '/painel/atletas' },
  { type: 'link', id: 'turmas',      label: 'Turmas',              icon: '🏃', href: '/painel/turmas' },
  { type: 'link', id: 'presencas',   label: 'Presenças',           icon: '✅', href: '/painel/presencas' },

  { type: 'section', label: 'Financeiro' },
  { type: 'link', id: 'financeiro',  label: 'Cobranças',           icon: '💰', href: '/painel/financeiro' },
  { type: 'link', id: 'planos',      label: 'Planos de Pagamento', icon: '📋', href: '/painel/planos-pagamento' },

  { type: 'section', label: 'Módulos' },
  { type: 'link', id: 'saude',        label: 'Saúde',       icon: '🏥', href: '/painel/saude' },
  { type: 'link', id: 'acessos',      label: 'Acessos',     icon: '🔑', href: '/painel/acessos' },
  { type: 'link', id: 'cursos',       label: 'Cursos',      icon: '🎓', href: '/painel/cursos' },
  { type: 'link', id: 'comunicacao',  label: 'Comunicação', icon: '💬', href: '/painel/comunicacao-basica' },
  { type: 'link', id: 'eventos',      label: 'Eventos',     icon: '🎪', href: '#', lock: 'Pro' },
  { type: 'link', id: 'treinamentos', label: 'Treinamentos',icon: '🎯', href: '#', lock: 'Pro' },
  { type: 'link', id: 'competicoes',  label: 'Competições', icon: '🏆', href: '#', lock: 'Enterprise' },
  { type: 'link', id: 'relatorios',   label: 'Relatórios',  icon: '📈', href: '#', lock: 'Pro' },

  { type: 'section', label: 'Escola' },
  { type: 'link', id: 'usuarios',      label: 'Usuários',      icon: '👤', href: '/painel/usuarios'      },
  { type: 'link', id: 'configuracoes', label: 'Configurações', icon: '⚙️', href: '/painel/configuracoes' },
]

const PAGE_TITLES: Record<string, string> = {
  '/painel':                    'Dashboard',
  '/painel/dashboard':          'Dashboard',
  '/painel/atletas':            'Atletas',
  '/painel/turmas':             'Turmas',
  '/painel/presencas':          'Presenças',
  '/painel/financeiro':         'Cobranças',
  '/painel/planos-pagamento':   'Planos de Pagamento',
  '/painel/saude':              'Saúde',
  '/painel/acessos':            'Acessos',
  '/painel/cursos':             'Cursos',
  '/painel/comunicacao-basica': 'Comunicação',
  '/painel/usuarios':           'Usuários',
  '/painel/configuracoes':      'Configurações',
  '/painel/sem-permissao':      'Sem Permissão',
  '/painel/modulo-bloqueado':   'Módulo Bloqueado',
}

const PERFIL_LABEL: Record<string, string> = {
  admin_escola: 'Administrador',
  coordenador:  'Coordenador',
  professor:    'Professor',
  financeiro:   'Financeiro',
  secretaria:   'Secretaria',
  saude:        'Saúde',
  marketing:    'Marketing',
  responsavel:  'Responsável',
}

// ─── Component ────────────────────────────────────────────────────────────────
interface EscolaShellProps {
  escolaNome: string
  perfil: string
  userName: string
  children: React.ReactNode
}

export function EscolaShell({ escolaNome, perfil, userName, children }: EscolaShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const pageTitle =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => k !== '/painel' && pathname.startsWith(k)) ?? ''] ??
    'Painel'

  const escolaInitial = escolaNome.charAt(0).toUpperCase()
  const userInitials  = userName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U'
  const perfilLabel   = PERFIL_LABEL[perfil] ?? perfil

  function isActive(href: string) {
    if (href === '/painel/dashboard') return pathname === '/painel' || pathname.startsWith('/painel/dashboard')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-dvh" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-[100] flex h-dvh w-[268px] flex-col overflow-y-auto transition-transform duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Brand */}
        <div className="flex-shrink-0 border-b border-white/[0.07] px-4 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-[19px]"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              🏟️
            </div>
            <div>
              <p className="text-[13.5px] font-bold leading-tight text-white">Esportes Academy</p>
              <p className="text-[9.5px] uppercase tracking-[0.6px] text-white/35">Portal da Escola</p>
            </div>
          </div>
        </div>

        {/* School chip */}
        <div className="mx-3 mt-2.5 overflow-hidden rounded-lg border border-[#20c997]/20 bg-[#20c997]/10">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              {escolaInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white/90">{escolaNome}</p>
              <p className="text-[10px] text-white/38">Escola ativa</p>
            </div>
            <Link
              href="/selecionar-escola"
              className="flex-shrink-0 text-[11px] text-white/30 transition-colors hover:text-white/70"
              title="Trocar escola"
              onClick={() => setOpen(false)}
            >
              ⇄
            </Link>
          </div>
        </div>

        {/* Profile chip */}
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5">
          <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: PRIMARY }} />
          <span className="flex-1 text-[11px] font-medium text-white/55">Perfil</span>
          <span className="text-[11px] font-bold text-white/90">{perfilLabel}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {NAV.map((item, i) => {
            if (item.type === 'section') {
              return (
                <p
                  key={i}
                  className="mb-1 mt-3.5 px-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/25 first:mt-2"
                >
                  {item.label}
                </p>
              )
            }

            if (item.lock) {
              return (
                <span
                  key={item.id}
                  className="mb-px flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-[9px] opacity-45"
                >
                  <span className="w-5 flex-shrink-0 text-center text-[15px]">{item.icon}</span>
                  <span className="flex-1 text-[13px] font-medium text-white/55">{item.label}</span>
                  <span
                    className="rounded-full px-1.5 py-px text-[10px] font-bold"
                    style={{ background: 'rgba(255,165,82,.2)', color: ACCENT }}
                  >
                    🔒 {item.lock}
                  </span>
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
        <div className="flex-shrink-0 border-t border-white/[0.07] p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
              <p className="text-[10.5px] text-white/35">{perfilLabel}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded p-1 text-sm text-white/28 transition-colors hover:text-red-400"
                title="Sair"
              >
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col lg:ml-[268px]">

        {/* Topbar */}
        <header
          className="sticky top-0 z-50 flex h-[60px] flex-shrink-0 items-center gap-2.5 border-b px-4 sm:px-6 lg:px-7"
          style={{ background: '#fff', borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}
        >
          <button
            onClick={() => setOpen(v => !v)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-[17px] lg:hidden"
            style={{ background: BG, borderColor: '#e5e7eb' }}
          >
            ☰
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold sm:text-base" style={{ color: '#0f172a' }}>
              {pageTitle}
            </p>
            <p className="hidden text-[11px] sm:block" style={{ color: '#64748b' }}>
              Esportes Academy · {escolaNome}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div
              className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 md:flex"
              style={{ background: BG, borderColor: '#e5e7eb', width: 200 }}
            >
              <span className="text-[13px] text-gray-400">🔍</span>
              <input
                placeholder="Buscar..."
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: '#0f172a', border: 'none' }}
              />
            </div>

            <button
              className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg border text-[15px] transition-colors"
              style={{ background: BG, borderColor: '#e5e7eb' }}
            >
              🔔
              <span
                className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-2 border-white"
                style={{ background: ACCENT }}
              />
            </button>

            <div
              className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:flex"
              style={{ borderColor: '#e5e7eb', color: '#0f172a' }}
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

// ─── NavItem helper (manages hover state cleanly) ─────────────────────────────
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
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)',
      }}
    >
      <span className="w-5 flex-shrink-0 text-center text-[15px]">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}
