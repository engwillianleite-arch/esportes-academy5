'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth-actions'

type NavSection = { type: 'section'; label: string }
type NavLink = { type: 'link'; id: string; label: string; icon: string; href: string; stub?: true }
type NavEntry = NavSection | NavLink

type SystemMode = 'saas' | 'courses' | 'competitions'

type Theme = {
  sidebarBg: string
  sidebarHover: string
  primary: string
  secondary: string
  pageBg: string
  badgeBg: string
  badgeText: string
  systemLabel: string
  topbarSubtitle: string
  brandIcon: string
}

const SAAS_NAV: NavEntry[] = [
  { type: 'section', label: 'Principal' },
  { type: 'link', id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/superadmin' },
  { type: 'link', id: 'escolas', label: 'Escolas', icon: '🏫', href: '/superadmin/escolas' },
  { type: 'link', id: 'usuarios', label: 'Usuarios', icon: '👥', href: '/superadmin/usuarios' },
  { type: 'section', label: 'Financeiro' },
  { type: 'link', id: 'cobrancas', label: 'Fluxo de Caixa', icon: '💳', href: '/superadmin/faturamento' },
  { type: 'link', id: 'planos', label: 'Planos & Licencas', icon: '🧾', href: '/superadmin/planos' },
  { type: 'link', id: 'relatorios', label: 'Relatorios', icon: '📈', href: '/superadmin/relatorios' },
  { type: 'link', id: 'notasfiscais', label: 'Notas Fiscais', icon: '🧷', href: '#', stub: true },
  { type: 'section', label: 'Sistema' },
  { type: 'link', id: 'notificacoes', label: 'Notificacoes', icon: '🔔', href: '/superadmin/notificacoes' },
  { type: 'link', id: 'permissoes', label: 'Permissoes', icon: '🔐', href: '/superadmin/permissoes' },
  { type: 'link', id: 'auditoria', label: 'Auditoria', icon: '📋', href: '/superadmin/auditoria' },
  { type: 'link', id: 'configuracoes', label: 'Configuracoes', icon: '⚙️', href: '/superadmin/configuracoes' },
]

const COURSES_NAV: NavEntry[] = [
  { type: 'section', label: 'Cursos' },
  { type: 'link', id: 'courses-dashboard', label: 'Visao Geral', icon: '🎓', href: '/superadmin/cursos' },
  { type: 'link', id: 'courses-creators', label: 'Criadores', icon: '🧑‍🏫', href: '#', stub: true },
  { type: 'link', id: 'courses-offers', label: 'Ofertas', icon: '🏷️', href: '#', stub: true },
  { type: 'section', label: 'Governanca' },
  { type: 'link', id: 'courses-split', label: 'Split da Plataforma', icon: '💸', href: '#', stub: true },
  { type: 'link', id: 'courses-approvals', label: 'Aprovacoes', icon: '✅', href: '#', stub: true },
  { type: 'link', id: 'courses-providers', label: 'Providers de Video', icon: '🎥', href: '#', stub: true },
  { type: 'section', label: 'Monitoramento' },
  { type: 'link', id: 'courses-audit', label: 'Auditoria de Cursos', icon: '🕵️', href: '#', stub: true },
  { type: 'link', id: 'courses-reports', label: 'Relatorios Comerciais', icon: '📊', href: '#', stub: true },
]

const COMPETITIONS_NAV: NavEntry[] = [
  { type: 'section', label: 'Competicoes' },
  { type: 'link', id: 'competitions-dashboard', label: 'Visao Geral', icon: '🏆', href: '/superadmin/competicoes' },
  { type: 'link', id: 'competitions-calendars', label: 'Calendarios', icon: '🗓️', href: '#', stub: true },
  { type: 'link', id: 'competitions-federations', label: 'Federacoes', icon: '🏟️', href: '#', stub: true },
  { type: 'section', label: 'Governanca' },
  { type: 'link', id: 'competitions-rules', label: 'Regras e Categorias', icon: '📚', href: '#', stub: true },
  { type: 'link', id: 'competitions-delegations', label: 'Delegacoes', icon: '🤝', href: '#', stub: true },
  { type: 'section', label: 'Monitoramento' },
  { type: 'link', id: 'competitions-audit', label: 'Auditoria de Eventos', icon: '🕵️', href: '#', stub: true },
  { type: 'link', id: 'competitions-reports', label: 'Relatorios Esportivos', icon: '📈', href: '#', stub: true },
]

const SAAS_PAGE_TITLES: Record<string, string> = {
  '/superadmin': 'Dashboard',
  '/superadmin/escolas': 'Escolas',
  '/superadmin/usuarios': 'Usuarios Internos',
  '/superadmin/faturamento': 'Fluxo de Caixa',
  '/superadmin/permissoes': 'Matriz de Permissoes',
  '/superadmin/auditoria': 'Auditoria de Permissoes',
  '/superadmin/planos': 'Planos & Licencas',
  '/superadmin/relatorios': 'Relatorios & Analytics',
  '/superadmin/notificacoes': 'Central de Notificacoes',
  '/superadmin/configuracoes': 'Configuracoes da Plataforma',
}

const COURSES_PAGE_TITLES: Record<string, string> = {
  '/superadmin/cursos': 'Cursos da Plataforma',
}

const COMPETITIONS_PAGE_TITLES: Record<string, string> = {
  '/superadmin/competicoes': 'Competicoes da Plataforma',
}

const PERFIL_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  suporte: 'Suporte',
  financeiro_interno: 'Financeiro',
}

const THEMES: Record<SystemMode, Theme> = {
  saas: {
    sidebarBg: '#0d1117',
    sidebarHover: '#161b22',
    primary: '#4f46e5',
    secondary: '#7c3aed',
    pageBg: '#f8fafc',
    badgeBg: '#eef2ff',
    badgeText: '#4338ca',
    systemLabel: 'Sistema SaaS',
    topbarSubtitle: 'Esportes Academy | Portal SuperAdmin | SaaS',
    brandIcon: '🛡️',
  },
  courses: {
    sidebarBg: '#1c1917',
    sidebarHover: '#292524',
    primary: '#ea580c',
    secondary: '#f59e0b',
    pageBg: '#fffaf5',
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    systemLabel: 'Sistema de Cursos',
    topbarSubtitle: 'Esportes Academy | Portal SuperAdmin | Cursos',
    brandIcon: '🎓',
  },
  competitions: {
    sidebarBg: '#172033',
    sidebarHover: '#1e293b',
    primary: '#0ea5e9',
    secondary: '#22c55e',
    pageBg: '#f4fbff',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    systemLabel: 'Sistema de Competicoes',
    topbarSubtitle: 'Esportes Academy | Portal SuperAdmin | Competicoes',
    brandIcon: '🏆',
  },
}

interface SuperAdminShellProps {
  perfil: string
  userName: string
  children: React.ReactNode
}

export function SuperAdminShell({ perfil, userName, children }: SuperAdminShellProps) {
  const [open, setOpen] = useState(false)
  const [environmentOpen, setEnvironmentOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const mode: SystemMode = pathname.startsWith('/superadmin/cursos')
    ? 'courses'
    : pathname.startsWith('/superadmin/competicoes')
      ? 'competitions'
      : 'saas'

  const theme = THEMES[mode]
  const nav = mode === 'courses' ? COURSES_NAV : mode === 'competitions' ? COMPETITIONS_NAV : SAAS_NAV
  const titles = mode === 'courses'
    ? COURSES_PAGE_TITLES
    : mode === 'competitions'
      ? COMPETITIONS_PAGE_TITLES
      : SAAS_PAGE_TITLES

  const pageTitle =
    titles[pathname] ??
    titles[Object.keys(titles).find((key) => key !== '/superadmin' && pathname.startsWith(key)) ?? ''] ??
    'SuperAdmin'

  const userInitials = userName.split(' ').slice(0, 2).map((name) => name[0]).join('').toUpperCase() || 'SA'
  const perfilLabel = PERFIL_LABEL[perfil] ?? perfil

  const switchItems = useMemo(
    () => [
      { id: 'saas', label: 'SaaS Esportes Academy', href: '/superadmin', active: mode === 'saas' },
      { id: 'courses', label: 'Sistema de Cursos', href: '/superadmin/cursos', active: mode === 'courses' },
      { id: 'competitions', label: 'Sistema de Competicoes', href: '/superadmin/competicoes', active: mode === 'competitions' },
    ],
    [mode]
  )

  function isActive(href: string) {
    if (href === '/superadmin') return pathname === '/superadmin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-dvh" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {open && <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[100] flex h-dvh w-[86vw] max-w-[320px] flex-col overflow-y-auto transition-transform duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)] lg:w-[280px] lg:max-w-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: theme.sidebarBg }}
      >
        <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[19px]"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              {theme.brandIcon}
            </div>
            <div>
              <p className="text-[13.5px] font-bold leading-tight text-white">Esportes Academy</p>
              <p className="text-[9.5px] uppercase tracking-[0.6px] text-white/30">{theme.systemLabel}</p>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-1.5">
          <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: theme.primary }} />
          <span className="flex-1 text-[11px] font-medium text-white/45">Perfil</span>
          <span className="text-[11px] font-bold text-white/85">{perfilLabel}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {nav.map((item, index) => {
            if (item.type === 'section') {
              return <p key={index} className="mb-1 mt-3.5 px-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/22 first:mt-2">{item.label}</p>
            }

            if (item.stub) {
              return (
                <span key={item.id} className="mb-px flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium opacity-35">
                  <span className="w-5 flex-shrink-0 text-center text-[15px]">{item.icon}</span>
                  <span className="flex-1 text-white/55">{item.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white/40">em breve</span>
                </span>
              )
            }

            return (
              <NavItem
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                hoverBg={theme.sidebarHover}
                activeBg={theme.primary}
                onClick={() => setOpen(false)}
              />
            )
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-white/[0.06] p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{userName}</p>
              <p className="text-[10.5px] text-white/30">{perfilLabel}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="rounded p-1 text-sm text-white/25 transition-colors hover:text-red-400" title="Sair">↗</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-50 flex flex-shrink-0 flex-col gap-3 border-b px-4 py-3 sm:px-6 lg:h-[60px] lg:flex-row lg:items-center lg:gap-2.5 lg:px-7 lg:py-0" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-center gap-2.5 lg:min-w-0 lg:flex-1">
          <button onClick={() => setOpen((value) => !value)} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-[17px] lg:hidden" style={{ background: theme.pageBg, borderColor: '#e2e8f0' }}>☰</button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold sm:text-base" style={{ color: '#0f172a' }}>{pageTitle}</p>
            <p className="hidden text-[11px] sm:block" style={{ color: '#64748b' }}>{theme.topbarSubtitle}</p>
          </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:flex-shrink-0">
            <div className="relative" style={{ width: '100%' }}>
              <button
                type="button"
                onClick={() => setEnvironmentOpen((value) => !value)}
                className="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left md:py-1.5"
                style={{
                  background: '#fff',
                  borderColor: environmentOpen ? theme.primary : '#e2e8f0',
                  boxShadow: environmentOpen ? `0 0 0 3px ${theme.badgeBg}` : 'none',
                }}
              >
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{ background: theme.badgeBg, color: theme.badgeText }}
                >
                  {theme.brandIcon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#64748b' }}>
                    Ambiente
                  </p>
                  <p className="truncate text-[13px] font-semibold" style={{ color: '#0f172a' }}>
                    {switchItems.find((item) => item.active)?.label}
                  </p>
                </div>
                <span className="text-xs" style={{ color: '#64748b' }}>{environmentOpen ? '▲' : '▼'}</span>
              </button>

              {environmentOpen ? (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border bg-white p-2 shadow-2xl"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  {switchItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setEnvironmentOpen(false)
                        router.push(item.href)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                      style={{
                        background: item.active ? theme.badgeBg : 'transparent',
                        color: item.active ? theme.badgeText : '#0f172a',
                      }}
                    >
                      <span
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm"
                        style={{
                          background: item.active ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : '#f8fafc',
                          color: item.active ? '#fff' : '#475569',
                        }}
                      >
                        {item.id === 'saas' ? '🛡️' : item.id === 'courses' ? '🎓' : '🏆'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{item.label}</p>
                        <p className="text-[11px]" style={{ color: item.active ? theme.badgeText : '#64748b' }}>
                          {item.id === 'saas' ? 'Gestão central da plataforma' : item.id === 'courses' ? 'Governança comercial e conteúdo' : 'Governança de eventos esportivos'}
                        </p>
                      </div>
                      {item.active ? (
                        <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ background: '#fff', color: theme.badgeText }}>
                          Atual
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2 md:py-1.5" style={{ background: theme.pageBg, borderColor: '#e2e8f0', width: '100%' }}>
              <span className="text-[13px] text-gray-400">🔎</span>
              <input placeholder={mode === 'courses' ? 'Buscar cursos...' : mode === 'competitions' ? 'Buscar competicoes...' : 'Buscar...'} className="w-full bg-transparent text-[13px] outline-none" style={{ color: '#0f172a', border: 'none' }} />
            </div>

            <div className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold sm:self-auto" style={{ background: theme.badgeBg, color: theme.badgeText }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: theme.primary }} />
              {theme.systemLabel}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-7" style={{ background: theme.pageBg }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label, active, hoverBg, activeBg, onClick }: { href: string; icon: string; label: string; active: boolean; hoverBg: string; activeBg: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mb-px flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors duration-150"
      style={{ background: active ? activeBg : hovered ? hoverBg : 'transparent', color: active ? '#fff' : hovered ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)' }}
    >
      <span className="w-5 flex-shrink-0 text-center text-[15px]">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}
