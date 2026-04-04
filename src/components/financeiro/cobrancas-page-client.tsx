'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  criarCobrancaManual,
  listarCobrancasEscola,
  listarMatriculasParaCobranca,
  type CobrancaListRow,
} from '@/lib/cobranca-actions'
import type { StatusCobranca } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY       = '#20c997'
const PRIMARY_DARK  = '#17a57a'
const PRIMARY_LIGHT = '#e6faf4'
const SECONDARY     = '#5bc0eb'
const INFO_LIGHT    = '#e8f6fd'
const ACCENT        = '#ffa552'
const ACCENT_LIGHT  = '#fff4e8'
const DANGER        = '#ef4444'
const DANGER_LIGHT  = '#fee2e2'
const BG            = '#f7f9fa'
const BORDER        = '#e5e7eb'
const TEXT          = '#1b1b1b'
const TEXT_MUTED    = '#6b7280'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthLabel(iso: string) {
  const [y, m] = iso.split('-')
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${y}-${m}-01`))
}

function prevMonth(iso: string) {
  const [y, m] = iso.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(iso: string) {
  const [y, m] = iso.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusCobranca, { label: string; bg: string; color: string; icon: string }> = {
  pendente:  { label: 'Pendente',  bg: ACCENT_LIGHT,  color: '#b45309',    icon: '⏳' },
  pago:      { label: 'Pago',      bg: PRIMARY_LIGHT, color: PRIMARY_DARK, icon: '✅' },
  vencido:   { label: 'Vencido',   bg: DANGER_LIGHT,  color: DANGER,       icon: '❌' },
  cancelado: { label: 'Cancelado', bg: BG,            color: TEXT_MUTED,   icon: '🚫' },
}

const STATUS_OPTS: Array<{ value: 'todas' | StatusCobranca; label: string }> = [
  { value: 'todas',     label: 'Todos os status' },
  { value: 'pendente',  label: 'Pendente'         },
  { value: 'pago',      label: 'Pago'             },
  { value: 'vencido',   label: 'Vencido'          },
  { value: 'cancelado', label: 'Cancelado'        },
]

const PAGE_SIZE = 15

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: 'green' | 'blue' | 'orange' | 'red' }) {
  const topColor = { green: PRIMARY, blue: SECONDARY, orange: ACCENT, red: DANGER }[color]
  const iconBg   = { green: PRIMARY_LIGHT, blue: INFO_LIGHT, orange: ACCENT_LIGHT, red: DANGER_LIGHT }[color]
  return (
    <div className="relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4"
      style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: topColor }} />
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px]" style={{ background: iconBg }}>{icon}</div>
      <div>
        <p className="text-[22px] font-extrabold leading-none tabular-nums" style={{ color: TEXT }}>{value}</p>
        <p className="mt-1 text-[12px] font-medium" style={{ color: TEXT_MUTED }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Nova Cobrança Drawer ─────────────────────────────────────────────────────
function NovaCobrancaDrawer({
  open, onClose, escolaId, matriculas, onSaved,
}: {
  open: boolean
  onClose: () => void
  escolaId: string
  matriculas: Array<{ matricula_id: string; atleta_nome: string }>
  onSaved: () => void
}) {
  const [matriculaId, setMatriculaId] = useState('none')
  const [valor, setValor]             = useState('')
  const [vencimento, setVencimento]   = useState(toInputDate(new Date()))
  const [descricao, setDescricao]     = useState('')
  const [referencia, setReferencia]   = useState('')
  const [asaasId, setAsaasId]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [err, setErr]                 = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null)
    const fd = new FormData()
    fd.append('matricula_id', matriculaId)
    fd.append('valor', valor)
    fd.append('vencimento', vencimento)
    fd.append('descricao', descricao)
    fd.append('referencia', referencia)
    fd.append('asaas_charge_id', asaasId)
    const r = await criarCobrancaManual(escolaId, fd)
    setSaving(false)
    if (r.error) { setErr(r.error); return }
    // reset
    setMatriculaId('none'); setValor(''); setDescricao(''); setReferencia(''); setAsaasId('')
    onSaved(); onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(2px)' }}>
      <div className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto"
        style={{ background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,.15)' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div>
            <p className="font-bold" style={{ color: TEXT, fontSize: '15px' }}>Nova Cobrança</p>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Cobrança manual ou avulsa</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100" style={{ color: TEXT_MUTED }}>✕</button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-5 py-5">
          {err && <div className="rounded-lg px-3 py-2 text-[12.5px]" style={{ background: DANGER_LIGHT, color: DANGER }}>{err}</div>}

          {/* Atleta */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Atleta / Matrícula</label>
            <select value={matriculaId} onChange={e => setMatriculaId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
              style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
              <option value="none">Cobrança avulsa (sem matrícula)</option>
              {matriculas.map(m => <option key={m.matricula_id} value={m.matricula_id}>{m.atleta_nome}</option>)}
            </select>
          </div>

          {/* Valor + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Valor *</label>
              <input type="number" step="0.01" min="0.01" required value={valor} onChange={e => setValor(e.target.value)}
                placeholder="0,00" className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Vencimento *</label>
              <input type="date" required value={vencimento} onChange={e => setVencimento(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Mensalidade abril/2026"
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
              style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
          </div>

          {/* Referência + Asaas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Referência</label>
              <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="2026-04"
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>ID Asaas</label>
              <input value={asaasId} onChange={e => setAsaasId(e.target.value)} placeholder="pay_xxxxx"
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
                style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
            </div>
          </div>

          <div className="mt-auto flex gap-3 border-t pt-4" style={{ borderColor: BORDER }}>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-[13px] font-semibold"
              style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {saving ? 'Gerando…' : 'Gerar cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CobrancasPageClient({ escolaId }: { escolaId: string }) {
  const [rows, setRows]                   = useState<CobrancaListRow[]>([])
  const [matriculas, setMatriculas]       = useState<Array<{ matricula_id: string; atleta_nome: string }>>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [page, setPage]                   = useState(1)
  const [total, setTotal]                 = useState(0)
  const [statusFilter, setStatusFilter]   = useState<'todas' | StatusCobranca>('todas')
  const [mesAtual, setMesAtual]           = useState(currentMonthISO())
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [selectedRow, setSelectedRow]     = useState<CobrancaListRow | null>(null)
  const [tab, setTab]                     = useState<'cobrancas' | 'inadimplentes'>('cobrancas')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const [cobrancasResult, matriculasResult] = await Promise.all([
      listarCobrancasEscola(escolaId, { page, pageSize: PAGE_SIZE, status: statusFilter }),
      listarMatriculasParaCobranca(escolaId),
    ])
    if (cobrancasResult.error) { setError(cobrancasResult.error); setRows([]); setTotal(0) }
    else { setRows(cobrancasResult.rows ?? []); setTotal(cobrancasResult.total ?? 0) }
    if (!matriculasResult.error && matriculasResult.rows) {
      setMatriculas(matriculasResult.rows.map(r => ({ matricula_id: r.matricula_id, atleta_nome: r.atleta_nome })))
    }
    setLoading(false)
  }, [escolaId, page, statusFilter])

  useEffect(() => { void load() }, [load])
  useEffect(() => { setPage(1) }, [statusFilter])

  // derived KPIs
  const pagas   = rows.filter(r => r.status === 'pago')
  const pendentes = rows.filter(r => r.status === 'pendente')
  const vencidas  = rows.filter(r => r.status === 'vencido')
  const receitaMes = pagas.reduce((s, r) => s + Number(r.valor ?? 0), 0)
  const inadimplentes = rows.filter(r => r.status === 'vencido')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Month navigator ── */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMesAtual(prevMonth(mesAtual))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
            style={{ background: '#fff', borderColor: BORDER }}>‹</button>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2"
            style={{ background: '#fff', borderColor: BORDER }}>
            <span className="text-[14px] font-bold capitalize" style={{ color: TEXT }}>{monthLabel(mesAtual)}</span>
            {vencidas.length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: DANGER_LIGHT, color: DANGER }}>{vencidas.length} venc.</span>
            )}
          </div>
          <button onClick={() => setMesAtual(nextMonth(mesAtual))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
            style={{ background: '#fff', borderColor: BORDER }}>›</button>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}55` }}>
          + Nova Cobrança
        </button>
      </div>

      {/* ── KPI Stats ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard icon="💰" value={fBRL(receitaMes)} label="Receita (pago)"     color="green" />
        <StatCard icon="⏳" value={pendentes.length}  label="Pendentes"          color="blue"  />
        <StatCard icon="❌" value={vencidas.length}   label="Vencidas"           color="red"   />
        <StatCard icon="📊" value={total}             label="Total cobranças"    color="orange"/>
      </div>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-[13px]" style={{ background: DANGER_LIGHT, color: DANGER }}>{error}</div>
      )}

      {/* ── Tabs ── */}
      <div className="mb-4 flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {[
          { id: 'cobrancas',      label: 'Cobranças' },
          { id: 'inadimplentes',  label: `Inadimplentes (${vencidas.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="rounded-t-lg px-4 py-2 text-[13px] font-semibold transition-colors"
            style={tab === t.id
              ? { background: PRIMARY, color: '#fff' }
              : { background: 'transparent', color: TEXT_MUTED }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cobranças tab ── */}
      {tab === 'cobrancas' && (
        <>
          {/* Filters */}
          <div className="mb-3 flex flex-wrap gap-2">
            {STATUS_OPTS.map(o => (
              <button key={o.value} onClick={() => setStatusFilter(o.value)}
                className="rounded-full border px-3 py-1 text-[12px] font-semibold transition-all"
                style={statusFilter === o.value
                  ? { background: PRIMARY, borderColor: PRIMARY, color: '#fff' }
                  : { background: '#fff', borderColor: BORDER, color: TEXT_MUTED }}>
                {o.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border"
            style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${BORDER}`, background: BG }}>
                    {['Atleta', 'Vencimento', 'Status', 'Valor', 'Descrição'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold"
                        style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>Carregando…</td></tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>Nenhuma cobrança encontrada.</td></tr>
                  )}
                  {!loading && rows.map(row => {
                    const cfg = STATUS_CFG[row.status]
                    const hoje = new Date().toISOString().slice(0, 10)
                    const isOverdue = row.status === 'vencido'
                    const diasAtraso = isOverdue && row.vencimento
                      ? Math.floor((Date.now() - new Date(row.vencimento + 'T12:00:00').getTime()) / 86400000)
                      : 0
                    return (
                      <tr key={row.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onClick={() => setSelectedRow(selectedRow?.id === row.id ? null : row)}
                        onMouseEnter={e => (e.currentTarget.style.background = BG)}
                        onMouseLeave={e => (e.currentTarget.style.background = selectedRow?.id === row.id ? BG : 'transparent')}>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: TEXT }}>{row.atleta_nome ?? 'Cobrança avulsa'}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: isOverdue ? DANGER : TEXT_MUTED }}>
                          {formatDate(row.vencimento)}
                          {diasAtraso > 0 && (
                            <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                              style={{ background: DANGER_LIGHT, color: DANGER }}>{diasAtraso}d</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums" style={{ color: TEXT }}>
                          {fBRL(row.valor)}
                        </td>
                        <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>
                          {row.descricao ?? row.referencia ?? '—'}
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
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                </p>
                <div className="flex gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
                    style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>‹ Ant.</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
                    style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>Próx. ›</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Inadimplentes tab ── */}
      {tab === 'inadimplentes' && (
        <div className="overflow-hidden rounded-xl border" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {inadimplentes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[20px]">🎉</p>
              <p className="mt-2 font-semibold" style={{ color: TEXT }}>Nenhum inadimplente!</p>
              <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>Todas as cobranças estão em dia.</p>
            </div>
          ) : (
            <table className="w-full" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${BORDER}`, background: BG }}>
                  {['Atleta', 'Vencimento', 'Dias em atraso', 'Valor'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold"
                      style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inadimplentes.map(row => {
                  const diasAtraso = row.vencimento
                    ? Math.floor((Date.now() - new Date(row.vencimento + 'T12:00:00').getTime()) / 86400000)
                    : 0
                  const severity = diasAtraso > 60 ? 'red' : diasAtraso > 30 ? 'orange' : 'yellow'
                  const severityColor = severity === 'red' ? DANGER : severity === 'orange' ? ACCENT : '#ca8a04'
                  const severityBg    = severity === 'red' ? DANGER_LIGHT : severity === 'orange' ? ACCENT_LIGHT : '#fef9c3'
                  return (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: TEXT }}>{row.atleta_nome ?? '—'}</td>
                      <td className="px-4 py-3" style={{ color: DANGER }}>{formatDate(row.vencimento)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: severityBg, color: severityColor }}>
                          {diasAtraso}d em atraso
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums" style={{ color: DANGER }}>{fBRL(row.valor)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Drawer ── */}
      <NovaCobrancaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        escolaId={escolaId}
        matriculas={matriculas}
        onSaved={() => void load()}
      />
    </div>
  )
}
