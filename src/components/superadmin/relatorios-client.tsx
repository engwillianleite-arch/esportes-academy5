'use client'

import { useState } from 'react'
import type {
  RelatoriosKpis, MonthlySeries, PlanoDist,
  EscolaPerf, CohortRow, RegionRow,
} from '@/lib/relatorios-actions'

// ─── Design tokens (superadmin indigo theme) ──────────────────────────────────
const PRIMARY   = '#4f46e5'
const PRIMARY_D = '#3730a3'
const PRIMARY_L = '#eef2ff'
const SUCCESS   = '#10b981'
const SUCCESS_L = '#d1fae5'
const WARNING   = '#f59e0b'
const WARNING_L = '#fef3c7'
const DANGER    = '#ef4444'
const DANGER_L  = '#fee2e2'
const PURPLE    = '#8b5cf6'
const PURPLE_L  = '#ede9fe'
const SECONDARY = '#0ea5e9'
const SEC_L     = '#e0f2fe'
const BORDER    = '#e2e8f0'
const BG        = '#f1f5f9'
const TEXT      = '#0f172a'
const MUTED     = '#64748b'
const CARD      = '#ffffff'
const SHADOW    = '0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.06)'
const SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,.1)'
const RADIUS    = '12px'
const RADIUS_SM = '8px'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}
function fmtMes(m: string) {
  const [y, mo] = m.split('-')
  const date = new Date(Number(y), Number(mo) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const PLANO_COLORS: Record<string, string> = {
  starter:    '#94a3b8',
  basic:      '#64748b',
  pro:        SUCCESS,
  premium:    PRIMARY,
  enterprise: PURPLE,
}
const PLANO_LABEL: Record<string, string> = {
  starter: 'Starter', basic: 'Basic', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise',
}

type Tab = 'overview' | 'financeiro' | 'escolas' | 'crescimento'

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, accent }: {
  label: string; value: string | number; sub: string
  trend?: { dir: 'up' | 'down' | 'neutral'; text: string }
  accent: string
}) {
  return (
    <div style={{ background: CARD, borderRadius: RADIUS, padding: '18px 20px', boxShadow: SHADOW, borderTop: `3px solid ${accent}`, transition: 'transform .15s, box-shadow .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW_MD }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {trend && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
          background: trend.dir === 'up' ? SUCCESS_L : trend.dir === 'down' ? DANGER_L : BG,
          color: trend.dir === 'up' ? '#059669' : trend.dir === 'down' ? DANGER : MUTED,
        }}>
          {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→'} {trend.text}
        </span>
      )}
      <div style={{ fontSize: 11, color: MUTED, marginTop: trend ? 4 : 0 }}>{sub}</div>
    </div>
  )
}

function ChartCard({ title, sub, badge, children, full }: {
  title: string; sub?: string; badge?: React.ReactNode; children: React.ReactNode; full?: boolean
}) {
  return (
    <div style={{ background: CARD, borderRadius: RADIUS, padding: 20, boxShadow: SHADOW, marginBottom: full ? 20 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{sub}</div>}
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: color === 'blue' ? PRIMARY_L : SUCCESS_L, color: color === 'blue' ? PRIMARY : '#059669' }}>
      {text}
    </span>
  )
}

// ─── Inline bar chart (CSS) ───────────────────────────────────────────────────
function BarChart({ data, height = 200 }: { data: { label: string; receita: number; despesa: number }[]; height?: number }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.receita, d.despesa)), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const rH = Math.round((d.receita / maxVal) * (height - 28))
        const eH = Math.round((d.despesa / maxVal) * (height - 28))
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%' }}>
              <div style={{ flex: 1, height: rH, background: `linear-gradient(180deg, ${PRIMARY}, #818cf8)`, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
              <div style={{ flex: 1, height: eH, background: `linear-gradient(180deg, ${DANGER}, #f87171)`, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, fontSize: 9, color: MUTED, whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// Simple single-series bar chart
function SimpleBarChart({ data, color, height = 200 }: { data: { label: string; value: number }[]; color: string; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const bH = Math.round((d.value / maxVal) * (height - 28))
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: '100%', height: bH, background: color, borderRadius: '3px 3px 0 0', minHeight: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, fontSize: 9, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', textAlign: 'center' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Donut-like breakdown list
function PlanBreakdown({ data }: { data: PlanoDist[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => {
        const pct = Math.round((d.count / total) * 100)
        const color = PLANO_COLORS[d.plano] ?? MUTED
        return (
          <div key={d.plano}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{PLANO_LABEL[d.plano] ?? d.plano}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: MUTED }}>{d.count} escolas</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{pct}%</span>
                <span style={{ fontSize: 12, color: MUTED }}>{fmtBRL(d.mrr)}/mês</span>
              </div>
            </div>
            <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Plano chip ───────────────────────────────────────────────────────────────
function PlanoChip({ plano }: { plano: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    enterprise: { bg: PURPLE_L, color: '#6d28d9' },
    premium:    { bg: '#dbeafe', color: '#1d4ed8' },
    pro:        { bg: SUCCESS_L, color: '#065f46' },
    basic:      { bg: BG, color: '#475569' },
    starter:    { bg: BG, color: '#475569' },
  }
  const c = cfg[plano] ?? cfg.starter
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', background: c.bg, color: c.color }}>
      {PLANO_LABEL[plano] ?? plano}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string }> = {
    ativa:        { bg: SUCCESS_L, color: '#065f46', dot: '#059669' },
    inativa:      { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    inadimplente: { bg: DANGER_L, color: '#991b1b', dot: DANGER },
  }
  const c = cfg[status] ?? cfg.inativa
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RelatoriosClient({
  kpis, monthly, planoDist, escolaPerf, cohort, regions, loadError,
}: {
  kpis: RelatoriosKpis
  monthly: MonthlySeries[]
  planoDist: PlanoDist[]
  escolaPerf: EscolaPerf[]
  cohort: CohortRow[]
  regions: RegionRow[]
  loadError: boolean
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<'mes' | 'trimestre' | 'ano'>('mes')
  const [sortBy, setSortBy] = useState<'atletas' | 'mensalidade' | 'nome'>('atletas')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Filter monthly data by period
  const filteredMonthly = period === 'mes' ? monthly.slice(-1)
    : period === 'trimestre' ? monthly.slice(-3)
    : monthly

  const barData = filteredMonthly.map(m => ({ label: fmtMes(m.mes), receita: m.receita, despesa: m.despesa }))
  const mrrData = monthly.map(m => ({ label: fmtMes(m.mes), value: m.receita }))

  // Sort escolas
  const sortedEscolas = [...escolaPerf].sort((a, b) => {
    const va = sortBy === 'atletas' ? a.atletas : sortBy === 'mensalidade' ? a.mensalidade : a.nome.localeCompare(b.nome)
    const vb = sortBy === 'atletas' ? b.atletas : sortBy === 'mensalidade' ? b.mensalidade : b.nome.localeCompare(a.nome)
    if (typeof va === 'string') return 0
    return sortDir === 'desc' ? (vb as number) - (va as number) : (va as number) - (vb as number)
  })

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const maxRegion = Math.max(...regions.map(r => r.count), 1)

  const periodLabel = {
    mes: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    trimestre: 'Último trimestre',
    ano: new Date().getFullYear().toString(),
  }[period]

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: `1.5px solid ${BORDER}`, background: BG, whiteSpace: 'nowrap' }
  const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle', fontSize: 13 }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {loadError && (
        <div style={{ marginBottom: 20, padding: '10px 14px', background: DANGER_L, border: `1px solid #fecaca`, borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
          Erro ao carregar dados. Tente recarregar a página.
        </div>
      )}

      {/* ── Hero bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a56db 0%, #4f46e5 50%, #7c3aed 100%)',
        borderRadius: RADIUS, padding: '20px 24px', marginBottom: 24,
        boxShadow: '0 8px 24px rgba(79,70,229,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>📈 Relatórios & Analytics</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 4 }}>{periodLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {(['mes', 'trimestre', 'ano'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', border: `1.5px solid ${period === p ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.3)'}`, background: period === p ? 'rgba(255,255,255,.25)' : 'transparent', color: period === p ? '#fff' : 'rgba(255,255,255,.75)' }}>
              {p === 'mes' ? 'Este Mês' : p === 'trimestre' ? 'Último Trimestre' : 'Este Ano'}
            </button>
          ))}
          <button style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#fff', color: PRIMARY, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            ⬇ CSV
          </button>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="MRR" value={fmtBRL(kpis.mrr)} sub="Receita mensal recorrente" accent={PRIMARY}
          trend={{ dir: 'up', text: 'Crescimento' }} />
        <KpiCard label="Total de Escolas" value={kpis.totalEscolas} sub={`${kpis.escolasAtivas} ativas`} accent={SUCCESS}
          trend={{ dir: 'neutral', text: `${kpis.escolasAtivas} ativas` }} />
        <KpiCard label="Total de Atletas" value={kpis.totalAtletas.toLocaleString('pt-BR')} sub="Matrículas ativas" accent={WARNING}
          trend={{ dir: 'up', text: 'Ativo' }} />
        <KpiCard label="Taxa de Retenção" value={`${kpis.retencaoPct}%`} sub="Escolas ativas / total" accent={PURPLE}
          trend={{ dir: kpis.retencaoPct >= 80 ? 'up' : 'down', text: kpis.retencaoPct >= 80 ? 'Saudável' : 'Atenção' }} />
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: CARD, borderRadius: RADIUS, padding: 6, marginBottom: 24, boxShadow: SHADOW, overflowX: 'auto' }}>
        {([
          { id: 'overview',     label: 'Visão Geral' },
          { id: 'financeiro',   label: 'Financeiro' },
          { id: 'escolas',      label: 'Escolas' },
          { id: 'crescimento',  label: 'Crescimento' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s', flexShrink: 0,
              background: tab === t.id ? PRIMARY : 'transparent',
              color: tab === t.id ? '#fff' : MUTED,
              boxShadow: tab === t.id ? `0 2px 8px rgba(79,70,229,.3)` : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ TAB: VISÃO GERAL ════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>
            <ChartCard title="Tendência de Receita (MRR)" sub="Últimos 12 meses — receitas realizadas" badge={<Badge text="Mensal" color="blue" />}>
              <SimpleBarChart data={mrrData} color={`linear-gradient(180deg, ${PRIMARY}, #818cf8)`} height={240} />
              {mrrData.every(d => d.value === 0) && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: MUTED, fontSize: 13 }}>Nenhum dado de fluxo de caixa registrado</div>
              )}
            </ChartCard>

            <ChartCard title="Distribuição por Plano" sub="Escolas ativas por tipo de plano">
              {planoDist.length > 0
                ? <PlanBreakdown data={planoDist} />
                : <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>Sem dados de planos</div>}
            </ChartCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>
            <ChartCard title="Receita vs Despesa" sub="Período selecionado" badge={<Badge text="Comparativo" color="green" />}>
              <BarChart data={barData} height={240} />
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: PRIMARY, display: 'inline-block' }} /> Receita
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: DANGER, display: 'inline-block' }} /> Despesa
                </span>
              </div>
            </ChartCard>

            <ChartCard title="Escolas por Região" sub="Distribuição geográfica">
              {regions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {regions.map(r => (
                    <div key={r.estado}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{r.estado}</span>
                        <span style={{ fontSize: 12, color: MUTED }}>{r.count} escola{r.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ height: 8, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((r.count / maxRegion) * 100)}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`, borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>Sem dados regionais</div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* ══════════ TAB: FINANCEIRO ══════════════════════════════════════════ */}
      {tab === 'financeiro' && (
        <>
          {/* Summary cards */}
          {(() => {
            const rec = filteredMonthly.reduce((s, m) => s + m.receita, 0)
            const des = filteredMonthly.reduce((s, m) => s + m.despesa, 0)
            const net = rec - des
            const margin = rec > 0 ? Math.round((net / rec) * 100) : 0
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Receita Realizada', val: fmtBRL(rec), cls: '#1a56db', border: '#1a56db' },
                  { label: 'Despesa Realizada', val: fmtBRL(des), cls: DANGER, border: DANGER },
                  { label: 'Resultado Líquido', val: fmtBRL(net), cls: net >= 0 ? '#059669' : DANGER, border: SUCCESS },
                  { label: 'Margem %', val: `${margin}%`, cls: PURPLE, border: PURPLE },
                ].map(s => (
                  <div key={s.label} style={{ background: CARD, borderRadius: RADIUS, padding: '16px 18px', boxShadow: SHADOW, borderLeft: `4px solid ${s.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 2px', color: s.cls }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>Total do período</div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Cash flow bar chart */}
          <ChartCard title="Fluxo de Caixa — Receitas vs Despesas" sub="12 meses" badge={<Badge text="12 Meses" color="blue" />} full>
            <BarChart data={monthly.map(m => ({ label: fmtMes(m.mes), receita: m.receita, despesa: m.despesa }))} height={280} />
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: PRIMARY, display: 'inline-block' }} /> Receita
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: DANGER, display: 'inline-block' }} /> Despesa
              </span>
            </div>
          </ChartCard>

          <div style={{ background: CARD, borderRadius: RADIUS, boxShadow: SHADOW, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Evolução Mensal</div>
              <div style={{ fontSize: 11, color: MUTED }}>Receita e despesa por mês</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Mês', 'Receita', 'Despesa', 'Resultado', 'Margem'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.length === 0 ? (
                    <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: MUTED }}>Nenhum lançamento registrado</td></tr>
                  ) : monthly.map((m, i) => {
                    const net = m.receita - m.despesa
                    const margin = m.receita > 0 ? Math.round((net / m.receita) * 100) : 0
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? CARD : BG }}>
                        <td style={tdStyle}><strong>{fmtMes(m.mes)}</strong></td>
                        <td style={{ ...tdStyle, color: '#1a56db', fontWeight: 700 }}>{fmtBRL(m.receita)}</td>
                        <td style={{ ...tdStyle, color: DANGER, fontWeight: 700 }}>{fmtBRL(m.despesa)}</td>
                        <td style={{ ...tdStyle, color: net >= 0 ? '#059669' : DANGER, fontWeight: 700 }}>{fmtBRL(net)}</td>
                        <td style={tdStyle}><span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: margin >= 0 ? SUCCESS_L : DANGER_L, color: margin >= 0 ? '#059669' : DANGER }}>{margin}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════ TAB: ESCOLAS ════════════════════════════════════════════ */}
      {tab === 'escolas' && (
        <>
          <div style={{ background: CARD, borderRadius: RADIUS, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Performance das Escolas</div>
                <div style={{ fontSize: 11, color: MUTED }}>Todas as escolas cadastradas · clique no cabeçalho para ordenar</div>
              </div>
              <span style={{ fontSize: 12, color: MUTED }}>{escolaPerf.length} escolas</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Escola</th>
                    <th style={thStyle}>Plano</th>
                    <th style={thStyle}>Estado</th>
                    <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('atletas')}>
                      Atletas {sortBy === 'atletas' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                    </th>
                    <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('mensalidade')}>
                      Mensalidade {sortBy === 'mensalidade' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                    </th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEscolas.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: MUTED }}>Nenhuma escola cadastrada</td></tr>
                  ) : sortedEscolas.map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? CARD : BG }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {e.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: TEXT }}>{e.nome}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}><PlanoChip plano={e.plano} /></td>
                      <td style={{ ...tdStyle, color: MUTED }}>{e.estado ?? '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{e.atletas}</td>
                      <td style={{ ...tdStyle, color: '#1a56db', fontWeight: 700 }}>{fmtBRL(e.mensalidade)}</td>
                      <td style={tdStyle}><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
            <ChartCard title="Top Escolas por Atletas" sub="Top 10 por número de atletas">
              <SimpleBarChart
                data={[...escolaPerf].sort((a, b) => b.atletas - a.atletas).slice(0, 10).map(e => ({ label: e.nome.slice(0, 10), value: e.atletas }))}
                color={PRIMARY}
                height={220}
              />
            </ChartCard>

            <ChartCard title="Distribuição por Plano" sub="Escolas ativas">
              {planoDist.length > 0
                ? <PlanBreakdown data={planoDist} />
                : <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>Sem dados</div>}
            </ChartCard>
          </div>
        </>
      )}

      {/* ══════════ TAB: CRESCIMENTO ════════════════════════════════════════ */}
      {tab === 'crescimento' && (
        <>
          <ChartCard title="Crescimento Acumulado de Escolas" sub="Número total de escolas ao longo do tempo" badge={<Badge text="Acumulado" color="green" />} full>
            <SimpleBarChart
              data={cohort.map(c => ({ label: c.mes.slice(0, 7), value: c.acumulado }))}
              color={`linear-gradient(180deg, ${SUCCESS}, #34d399)`}
              height={260}
            />
          </ChartCard>

          <div style={{ background: CARD, borderRadius: RADIUS, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Cohort por Mês de Cadastro</div>
              <div style={{ fontSize: 11, color: MUTED }}>Escolas agrupadas por mês de criação</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Mês/Ano', 'Novas Escolas', 'Acumulado', 'Planos'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohort.length === 0 ? (
                    <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: MUTED }}>Nenhum dado de cohort disponível</td></tr>
                  ) : cohort.map((c, i) => (
                    <tr key={c.mes} style={{ background: i % 2 === 0 ? CARD : BG }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtMes(c.mes)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: PRIMARY }}>+{c.novas}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{c.acumulado}</td>
                      <td style={tdStyle}><span style={{ fontSize: 11.5, color: MUTED }}>{c.planos || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Growth cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {[
              { label: 'Total de Escolas', val: kpis.totalEscolas, icon: '🏫', color: PRIMARY },
              { label: 'Escolas Ativas', val: kpis.escolasAtivas, icon: '✅', color: SUCCESS },
              { label: 'Taxa de Ativação', val: `${kpis.retencaoPct}%`, icon: '📊', color: PURPLE },
              { label: 'Ticket Médio', val: fmtBRL(kpis.ticket_medio), icon: '💰', color: WARNING },
            ].map(c => (
              <div key={c.label} style={{ background: CARD, borderRadius: RADIUS, padding: '16px 18px', boxShadow: SHADOW }}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{c.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{c.icon}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.val}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
