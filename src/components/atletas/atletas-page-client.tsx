'use client'

import { useState, useEffect, useCallback } from 'react'
import CadastroAtletaDrawer from './cadastro-atleta-drawer'
import AtletaDetalheSheet from './atleta-detalhe-sheet'
import { listarMatriculasAtletasEscola, type MatriculaAtletaListRow } from '@/lib/atleta-list-actions'
import { frequenciaResumoMatriculas, type FrequenciaResumo } from '@/lib/frequencia-actions'
import { listarTurmasAtivasEscola } from '@/lib/turma-actions'
import { formatCpf } from '@/lib/cpf'
import type { StatusMatricula } from '@/types/database'
import type { Turma } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY       = '#20c997'
const PRIMARY_DARK  = '#17a57a'
const PRIMARY_LIGHT = '#e6faf4'
const ACCENT        = '#ffa552'
const ACCENT_LIGHT  = '#fff4e8'
const DANGER        = '#ef4444'
const DANGER_LIGHT  = '#fee2e2'
const PURPLE        = '#8b5cf6'
const PURPLE_LIGHT  = '#ede9fe'
const BG            = '#f7f9fa'
const BORDER        = '#e5e7eb'
const TEXT          = '#1b1b1b'
const TEXT_MUTED    = '#6b7280'

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  escolaId: string
  canRegister: boolean
  limiarFreqPct: number
  canViewFrequencia: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcAge(iso: string) {
  if (!iso) return null
  const birth = new Date(`${iso}T12:00:00`)
  const diff = Date.now() - birth.getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  ativa:     { label: 'Ativa',     bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
  suspensa:  { label: 'Suspensa',  bg: ACCENT_LIGHT,  color: '#b45309'    },
  cancelada: { label: 'Cancelada', bg: BG,             color: TEXT_MUTED  },
  encerrada: { label: 'Encerrada', bg: BG,             color: TEXT_MUTED  },
  inativa:   { label: 'Inativa',   bg: DANGER_LIGHT,   color: DANGER      },
}

const STATUS_OPTIONS: Array<{ value: 'todos' | StatusMatricula; label: string }> = [
  { value: 'todos',     label: 'Todos os status' },
  { value: 'ativa',     label: 'Ativa'           },
  { value: 'suspensa',  label: 'Suspensa'         },
  { value: 'cancelada', label: 'Cancelada'        },
  { value: 'encerrada', label: 'Encerrada'        },
]

const PAGE_SIZE = 15

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: {
  icon: string; value: number | string; label: string
  color: 'green' | 'blue' | 'orange' | 'red' | 'purple'
}) {
  const topColor = { green: PRIMARY, blue: '#5bc0eb', orange: ACCENT, red: DANGER, purple: PURPLE }[color]
  const iconBg   = { green: PRIMARY_LIGHT, blue: '#e8f6fd', orange: ACCENT_LIGHT, red: DANGER_LIGHT, purple: PURPLE_LIGHT }[color]
  return (
    <div className="relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4"
      style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: topColor }} />
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px]" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <p className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: TEXT }}>{value}</p>
        <p className="mt-1 text-[12px] font-medium" style={{ color: TEXT_MUTED }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, foto }: { name: string; foto?: string | null }) {
  const ini = initials(name)
  if (foto) {
    return <img src={foto} alt={ini} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
  }
  // deterministic color from name
  const colors = ['#20c997','#5bc0eb','#8b5cf6','#ffa552','#ef4444','#14b8a6','#f59e0b']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ background: colors[idx] }}>
      {ini}
    </div>
  )
}

// ─── Freq Badge ───────────────────────────────────────────────────────────────
function FreqBadge({ freq, limiar }: { freq: FrequenciaResumo | undefined; limiar: number }) {
  if (!freq || freq.total === 0 || freq.percentual === null) {
    return <span style={{ color: TEXT_MUTED }}>—</span>
  }
  const risk = freq.percentual < limiar
  return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: risk ? DANGER_LIGHT : PRIMARY_LIGHT, color: risk ? DANGER : PRIMARY_DARK }}>
      {risk && '⚠ '}{freq.percentual}%
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AtletasPageClient({ escolaId, canRegister, limiarFreqPct, canViewFrequencia }: Props) {
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [q, setQ]                     = useState('')
  const [debouncedQ, setDebouncedQ]   = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusMatricula>('todos')
  const [turmaFilter, setTurmaFilter]   = useState<string>('todas')
  const [turmas, setTurmas]           = useState<Turma[]>([])
  const [page, setPage]               = useState(1)
  const [rows, setRows]               = useState<MatriculaAtletaListRow[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [listError, setListError]     = useState<string | null>(null)
  const [detailOpen, setDetailOpen]   = useState(false)
  const [detailRow, setDetailRow]     = useState<MatriculaAtletaListRow | null>(null)
  const [freqMap, setFreqMap]         = useState<Record<string, FrequenciaResumo>>({})

  // stats derived from rows (full unfiltered — we use total+rows approximation)
  const ativas    = rows.filter(r => r.status === 'ativa').length
  const suspensas = rows.filter(r => r.status === 'suspensa').length
  const outras    = rows.filter(r => r.status !== 'ativa' && r.status !== 'suspensa').length

  // debounce search
  useEffect(() => {
    const delay = q.trim() === '' ? 0 : 350
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, delay)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => { setPage(1) }, [statusFilter, turmaFilter])

  // load turmas
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r = await listarTurmasAtivasEscola(escolaId)
      if (!cancelled) setTurmas(!r.error && r.turmas ? r.turmas : [])
    })()
    return () => { cancelled = true }
  }, [escolaId])

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    const result = await listarMatriculasAtletasEscola(escolaId, {
      q: debouncedQ.trim() || undefined,
      status: statusFilter,
      turmaId: turmaFilter,
      page,
      pageSize: PAGE_SIZE,
    })
    if (result.error) { setListError(result.error); setRows([]); setTotal(0) }
    else              { setRows(result.rows ?? []); setTotal(result.total ?? 0) }
    setLoading(false)
  }, [escolaId, debouncedQ, statusFilter, turmaFilter, page])

  useEffect(() => { void load() }, [load])

  // load frequências
  useEffect(() => {
    if (!canViewFrequencia || rows.length === 0) { setFreqMap({}); return }
    let cancelled = false
    void (async () => {
      const ids = rows.map(r => r.matricula_id)
      const r   = await frequenciaResumoMatriculas(escolaId, ids)
      if (!cancelled) setFreqMap(!r.error && r.map ? r.map : {})
    })()
    return () => { cancelled = true }
  }, [canViewFrequencia, escolaId, rows])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Stat cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard icon="👥" value={total}    label="Total de matrículas" color="blue"   />
        <StatCard icon="✅" value={ativas}   label="Ativos (página atual)" color="green" />
        <StatCard icon="⏸️" value={suspensas} label="Suspensos"           color="orange" />
        <StatCard icon="📋" value={outras}   label="Outros status"        color="purple" />
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          {/* search */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border px-3 py-2"
            style={{ background: '#fff', borderColor: BORDER }}>
            <span className="text-[13px]" style={{ color: TEXT_MUTED }}>🔍</span>
            <input
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ color: TEXT }}
              placeholder="Buscar por nome, CPF, responsável…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          {/* status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'todos' | StatusMatricula)}
            className="rounded-lg border px-3 py-2 text-[13px] font-medium outline-none"
            style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* turma filter */}
          <select
            value={turmaFilter}
            onChange={e => setTurmaFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-[13px] font-medium outline-none"
            style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
            <option value="todas">Todas as turmas</option>
            <option value="sem_turma">Sem turma</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>

        {canRegister && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}55` }}>
            + Novo Atleta
          </button>
        )}
      </div>

      {listError && (
        <div className="mb-4 rounded-lg px-4 py-3 text-[13px] font-medium" style={{ background: DANGER_LIGHT, color: DANGER }}>
          {listError}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${BORDER}`, background: BG }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Atleta</th>
                <th className="hidden px-4 py-3 text-left font-semibold md:table-cell" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Nascimento</th>
                <th className="hidden px-4 py-3 text-left font-semibold lg:table-cell" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>CPF</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Status</th>
                {canViewFrequencia && (
                  <th className="hidden px-4 py-3 text-center font-semibold sm:table-cell" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Freq.</th>
                )}
                <th className="px-4 py-3 text-right font-semibold" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Valor</th>
                <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell" style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Início</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>
                    {debouncedQ.trim() ? 'Nenhum resultado para esta busca.' : 'Nenhuma matrícula encontrada.'}
                  </td>
                </tr>
              )}
              {!loading && rows.map(row => {
                const cfg  = STATUS_CFG[row.status] ?? STATUS_CFG.inativa
                const age  = calcAge(row.atleta.data_nascimento)
                return (
                  <tr key={row.matricula_id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                    onClick={() => { setDetailRow(row); setDetailOpen(true) }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {/* Atleta */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.atleta.nome} foto={row.atleta.foto_url} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: TEXT }}>{row.atleta.nome}</p>
                          <p className="text-[11px] sm:hidden" style={{ color: TEXT_MUTED }}>
                            {formatDate(row.atleta.data_nascimento)}{age !== null ? ` · ${age} anos` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Nascimento */}
                    <td className="hidden px-4 py-3 md:table-cell" style={{ color: TEXT_MUTED }}>
                      {formatDate(row.atleta.data_nascimento)}
                      {age !== null && <span className="ml-1 text-[11px]">({age}a)</span>}
                    </td>
                    {/* CPF */}
                    <td className="hidden px-4 py-3 tabular-nums lg:table-cell" style={{ color: TEXT_MUTED }}>
                      {formatCpf(row.atleta.cpf)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    {/* Frequência */}
                    {canViewFrequencia && (
                      <td className="hidden px-4 py-3 text-center sm:table-cell">
                        <FreqBadge freq={freqMap[row.matricula_id]} limiar={limiarFreqPct} />
                      </td>
                    )}
                    {/* Valor */}
                    <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: TEXT }}>
                      {fBRL(row.valor_liquido)}
                    </td>
                    {/* Início */}
                    <td className="hidden px-4 py-3 sm:table-cell" style={{ color: TEXT_MUTED }}>
                      {formatDate(row.data_inicio)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: BORDER }}>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
                ‹ Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
                Próxima ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers ── */}
      {canRegister && (
        <CadastroAtletaDrawer
          escolaId={escolaId}
          open={drawerOpen}
          onOpenChange={open => { setDrawerOpen(open); if (!open) void load() }}
        />
      )}

      <AtletaDetalheSheet
        open={detailOpen}
        onOpenChange={open => { setDetailOpen(open); if (!open) setDetailRow(null) }}
        row={detailRow}
        escolaId={escolaId}
        limiarFreqPct={limiarFreqPct}
        canViewFrequencia={canViewFrequencia}
      />
    </div>
  )
}
