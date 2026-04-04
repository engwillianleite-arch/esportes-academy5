'use client'

import Link from 'next/link'
import type {
  DashboardKpis,
  FinanceiroKpis,
  AulaHojeStatus,
  AniversarianteMes,
  TopTurma,
  AlertaDashboard,
} from '@/lib/dashboard-actions'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY       = '#20c997'
const PRIMARY_DARK  = '#17a57a'
const PRIMARY_LIGHT = '#e6faf4'
const SECONDARY     = '#5bc0eb'
const ACCENT        = '#ffa552'
const ACCENT_LIGHT  = '#fff4e8'
const DANGER        = '#ef4444'
const DANGER_LIGHT  = '#fee2e2'
const PURPLE        = '#8b5cf6'
const PURPLE_LIGHT  = '#ede9fe'
const INFO_LIGHT    = '#e8f6fd'
const BG            = '#f7f9fa'
const BORDER        = '#e5e7eb'
const TEXT          = '#1b1b1b'
const TEXT_MUTED    = '#6b7280'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function todayLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
}

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstWord(s: string) {
  return s.split(/[\s@]/)[0] ?? s
}

const PERFIL_LABEL: Record<string, string> = {
  admin_escola: 'Administrador',
  coordenador:  'Coordenador',
  professor:    'Professor',
  financeiro:   'Financeiro',
  secretaria:   'Secretaria',
  saude:        'Saúde',
  marketing:    'Marketing',
}

const PERFIL_ICON: Record<string, string> = {
  admin_escola: '👑',
  coordenador:  '📚',
  professor:    '🏫',
  financeiro:   '💰',
  secretaria:   '📋',
  saude:        '🩺',
  marketing:    '📣',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  escolaNome: string
  escolaPlano: string
  userName: string
  perfil: string
  kpis: DashboardKpis
  finKpis: FinanceiroKpis | null
  aulasHoje: AulaHojeStatus[]
  aniversariantesMes: AniversarianteMes[]
  topTurmas: TopTurma[]
  alertas: AlertaDashboard[]
  showAthletes: boolean
  showGroups: boolean
  showFinanceiro: boolean
  showAttendance: boolean
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, value, label, sub, color, trend, trendLabel,
}: {
  icon: string
  value: string | number
  label: string
  sub?: string
  color: 'green' | 'blue' | 'orange' | 'red' | 'purple'
  trend?: 'up' | 'down' | 'warn' | 'neutral'
  trendLabel?: string
}) {
  const topColor   = { green: PRIMARY, blue: SECONDARY, orange: ACCENT, red: DANGER, purple: PURPLE }[color]
  const iconBg     = { green: PRIMARY_LIGHT, blue: INFO_LIGHT, orange: ACCENT_LIGHT, red: DANGER_LIGHT, purple: PURPLE_LIGHT }[color]
  const trendStyle: Record<string, { bg: string; color: string }> = {
    up:      { bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
    down:    { bg: DANGER_LIGHT,  color: DANGER },
    warn:    { bg: ACCENT_LIGHT,  color: '#b45309' },
    neutral: { bg: BG,            color: TEXT_MUTED },
  }
  const trendS = trend ? trendStyle[trend] : null
  const trendArrow = { up: '↑', down: '↓', warn: '⚠', neutral: '—' }

  return (
    <div
      className="relative flex flex-col gap-2.5 overflow-hidden rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.07)',
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* colored top bar */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: topColor }} />

      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px]" style={{ background: iconBg }}>
          {icon}
        </div>
        {trend && trendLabel && trendS && (
          <span className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: trendS.bg, color: trendS.color }}>
            {trendArrow[trend]} {trendLabel}
          </span>
        )}
      </div>

      <div>
        <p className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: TEXT }}>
          {value}
        </p>
        <p className="mt-1 text-[12px] font-medium" style={{ color: TEXT_MUTED }}>{label}</p>
        {sub && <p className="mt-0.5 text-[11px]" style={{ color: TEXT_MUTED }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickBtn({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link href={href}
      className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-[#20c997] hover:bg-[#e6faf4]"
      style={{ background: '#fff', borderColor: BORDER, color: TEXT, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <span className="text-[19px]">{icon}</span>
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </Link>
  )
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ alerta }: { alerta: AlertaDashboard }) {
  const styles = {
    red:    { bg: DANGER_LIGHT,  border: DANGER,     icon: '🔴' },
    orange: { bg: ACCENT_LIGHT,  border: ACCENT,     icon: '🟠' },
    blue:   { bg: INFO_LIGHT,    border: SECONDARY,  icon: '🔵' },
  }
  const s = styles[alerta.cor]
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
      style={{ background: s.bg, borderLeft: `3px solid ${s.border}` }}>
      <span className="mt-px text-[15px]">{s.icon}</span>
      <div>
        <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{alerta.texto}</p>
        <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{alerta.sub}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPageClient({
  escolaNome, escolaPlano, userName, perfil,
  kpis, finKpis, aulasHoje, aniversariantesMes, topTurmas, alertas,
  showAthletes, showGroups, showFinanceiro, showAttendance,
}: Props) {
  const now       = new Date()
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now)
  const monthNum   = String(now.getMonth() + 1).padStart(2, '0')
  const perfilIcon = PERFIL_ICON[perfil] ?? '👤'
  const perfilLbl  = PERFIL_LABEL[perfil] ?? perfil

  // max for top turmas bar
  const maxMat = Math.max(...topTurmas.map(t => t.totalMatriculas), 1)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Welcome Banner ── */}
      <div
        className="relative mb-5 flex items-center justify-between gap-4 overflow-hidden rounded-2xl px-5 py-4"
        style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`, color: '#fff' }}
      >
        {/* decorative emoji */}
        <span className="pointer-events-none absolute right-24 top-[-8px] text-[60px] opacity-10 select-none">🏃</span>
        <div>
          <p className="text-[11.5px] font-medium opacity-80">{greetingWord()}, {firstWord(userName)} {perfilIcon}</p>
          <p className="mt-0.5 text-[19px] font-extrabold sm:text-xl">{escolaNome}</p>
          <p className="mt-0.5 text-[11.5px] opacity-72 capitalize">{perfilLbl} · {todayLabel()}</p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <span className="hidden items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold sm:flex"
            style={{ background: 'rgba(255,255,255,.2)' }}>
            🏅 Plano {escolaPlano.charAt(0).toUpperCase() + escolaPlano.slice(1)}
          </span>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-5 grid grid-cols-4 gap-2.5 sm:gap-3">
        {showAttendance && <QuickBtn icon="✅" label="Registrar Chamada" href="/painel/presencas" />}
        {showAthletes   && <QuickBtn icon="👥" label="Novo Atleta"       href="/painel/atletas" />}
        {showFinanceiro && <QuickBtn icon="💰" label="Nova Cobrança"     href="/painel/financeiro" />}
        {showAthletes   && <QuickBtn icon="🗂️"  label="Ver Turmas"       href="/painel/turmas" />}
        {!showAttendance && !showAthletes && !showFinanceiro && (
          <QuickBtn icon="⚙️" label="Configurações" href="/painel/configuracoes" />
        )}
      </div>

      {/* ── KPI Grid ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {showAthletes && (
          <KpiCard icon="👥" value={kpis.atletasAtivos} label="Atletas ativos" color="green"
            trend="neutral" trendLabel="ativos" />
        )}
        {showGroups && (
          <KpiCard icon="🗂️" value={kpis.turmasAtivas} label="Turmas ativas" color="blue"
            trend="neutral" trendLabel="turmas" />
        )}
        {showAttendance && (
          <KpiCard
            icon="✅"
            value={kpis.aulasHoje}
            label="Aulas hoje"
            color="purple"
            sub={kpis.aulasHoje > 0 ? `${kpis.aulasComChamada} com chamada` : undefined}
            trend={kpis.aulasComChamada >= kpis.aulasHoje && kpis.aulasHoje > 0 ? 'up' : kpis.aulasHoje > 0 ? 'warn' : 'neutral'}
            trendLabel={kpis.aulasHoje > 0 ? `${kpis.aulasComChamada}/${kpis.aulasHoje}` : '—'}
          />
        )}
        {showFinanceiro && finKpis && (
          <>
            <KpiCard
              icon="💰"
              value={fBRL(finKpis.receitaMes)}
              label="Receita do mês"
              color="green"
              trend={finKpis.receitaMes > 0 ? 'up' : 'neutral'}
              trendLabel={finKpis.receitaMes > 0 ? 'pago' : '—'}
            />
            <KpiCard
              icon="⚠️"
              value={`${finKpis.inadimplentesPct}%`}
              label="Inadimplência"
              color={finKpis.inadimplentesPct > 20 ? 'red' : 'orange'}
              sub={`${finKpis.cobrancasVencidas} cobrança${finKpis.cobrancasVencidas !== 1 ? 's' : ''} vencida${finKpis.cobrancasVencidas !== 1 ? 's' : ''}`}
              trend={finKpis.inadimplentesPct > 20 ? 'down' : finKpis.inadimplentesPct > 5 ? 'warn' : 'up'}
              trendLabel={`${finKpis.cobrancasPendentes} pend.`}
            />
          </>
        )}
      </div>

      {/* ── Main Grid: Aulas + Top Turmas ── */}
      {(showAttendance || showGroups) && (
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">

          {/* Chamada do Dia */}
          {showAttendance && (
            <div className="rounded-xl border p-4 sm:p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] font-bold" style={{ color: TEXT }}>Chamada do Dia</p>
                  <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Status das aulas de hoje</p>
                </div>
                <Link href="/painel/presencas"
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>
                  Ver todas →
                </Link>
              </div>
              {aulasHoje.length === 0 ? (
                <div className="rounded-lg py-8 text-center" style={{ background: BG }}>
                  <p className="text-[13px]" style={{ color: TEXT_MUTED }}>Nenhuma aula programada para hoje</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {aulasHoje.map(aula => (
                    <div key={aula.turmaId}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                      style={{ background: BG }}>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[14px]"
                        style={{ background: aula.chamadaFeita ? PRIMARY_LIGHT : ACCENT_LIGHT }}>
                        {aula.chamadaFeita ? '✅' : '⏳'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold" style={{ color: TEXT }}>{aula.turmaNome}</p>
                        <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                          {aula.registrosPresenca}/{aula.matriculasAtivas} registros
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                        style={aula.chamadaFeita
                          ? { background: PRIMARY_LIGHT, color: PRIMARY_DARK }
                          : { background: ACCENT_LIGHT, color: '#b45309' }}>
                        {aula.chamadaFeita ? 'Feita' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top Turmas */}
          {showGroups && (
            <div className="rounded-xl border p-4 sm:p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] font-bold" style={{ color: TEXT }}>Top Turmas</p>
                  <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Por total de atletas</p>
                </div>
                <Link href="/painel/turmas"
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>
                  Ver todas →
                </Link>
              </div>
              {topTurmas.length === 0 ? (
                <div className="rounded-lg py-8 text-center" style={{ background: BG }}>
                  <p className="text-[13px]" style={{ color: TEXT_MUTED }}>Nenhuma turma cadastrada</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {topTurmas.map((t, i) => {
                    const rankColors = ['#fef9c3', '#f1f5f9', '#fef3c7', BG, BG]
                    const rankText   = ['#b45309', '#64748b', '#92400e', TEXT_MUTED, TEXT_MUTED]
                    const barPct     = Math.round((t.totalMatriculas / maxMat) * 100)
                    return (
                      <div key={t.turmaId} className="flex items-center gap-2.5">
                        <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                          style={{ background: rankColors[i], color: rankText[i] }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold" style={{ color: TEXT }}>{t.nome}</p>
                          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                            {t.totalMatriculas} atletas{t.capacidade ? ` / ${t.capacidade}` : ''}
                          </p>
                        </div>
                        <div className="h-[5px] w-[80px] flex-shrink-0 overflow-hidden rounded-full" style={{ background: BORDER }}>
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: PRIMARY }} />
                        </div>
                        <span className="w-8 flex-shrink-0 text-right text-[11px] font-bold" style={{ color: TEXT_MUTED }}>
                          {t.capacidade ? `${t.ocupacaoPct}%` : t.totalMatriculas}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Grid: Alertas + Aniversariantes + Financeiro resumo ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="rounded-xl border p-4 sm:p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div className="mb-3">
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>Alertas</p>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Itens que precisam de atenção</p>
            </div>
            <div className="flex flex-col gap-2">
              {alertas.map((a, i) => <AlertItem key={i} alerta={a} />)}
            </div>
          </div>
        )}

        {/* Aniversariantes */}
        <div className="rounded-xl border p-4 sm:p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[16px]">🎂</span>
            <div>
              <p className="text-[14px] font-bold" style={{ color: TEXT }}>Aniversariantes de {monthLabel}</p>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>{aniversariantesMes.length} atleta{aniversariantesMes.length !== 1 ? 's' : ''} neste mês</p>
            </div>
          </div>
          {aniversariantesMes.length === 0 ? (
            <div className="rounded-lg py-6 text-center" style={{ background: BG }}>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Nenhum aniversariante este mês</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {aniversariantesMes.slice(0, 6).map(a => (
                <div key={a.atletaId} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: TEXT }}>{a.nome}</p>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{a.turmaNome ?? 'Sem turma'}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>
                    Dia {String(a.diaAniversario).padStart(2, '0')}/{monthNum}
                  </span>
                </div>
              ))}
              {aniversariantesMes.length > 6 && (
                <p className="pt-2 text-center text-[11px]" style={{ color: TEXT_MUTED }}>
                  +{aniversariantesMes.length - 6} mais neste mês
                </p>
              )}
            </div>
          )}
        </div>

        {/* Financeiro resumo */}
        {showFinanceiro && finKpis && (
          <div className="rounded-xl border p-4 sm:p-5" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[14px] font-bold" style={{ color: TEXT }}>Resumo Financeiro</p>
                <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Mês atual</p>
              </div>
              <Link href="/painel/financeiro"
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>
                Ver →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Receita do mês', value: fBRL(finKpis.receitaMes), color: PRIMARY },
                { label: 'Cobranças pendentes', value: String(finKpis.cobrancasPendentes), color: '#b45309' },
                { label: 'Cobranças vencidas', value: String(finKpis.cobrancasVencidas), color: DANGER },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: BG }}>
                  <span className="text-[12.5px] font-medium" style={{ color: TEXT_MUTED }}>{row.label}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              {/* inadimplência bar */}
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11.5px] font-medium" style={{ color: TEXT_MUTED }}>Taxa de inadimplência</span>
                  <span className="text-[12px] font-bold" style={{ color: finKpis.inadimplentesPct > 20 ? DANGER : '#b45309' }}>
                    {finKpis.inadimplentesPct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: BORDER }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, finKpis.inadimplentesPct)}%`,
                      background: finKpis.inadimplentesPct > 20 ? DANGER : ACCENT,
                    }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
