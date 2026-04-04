'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  carregarChamada,
  listarTurmasParaChamada,
  salvarPresencaLinha,
  type ChamadaPayload,
  type LinhaChamada,
} from '@/lib/presenca-actions'
import type { StatusPresenca, Turma } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY       = '#20c997'
const PRIMARY_DARK  = '#17a57a'
const PRIMARY_LIGHT = '#e6faf4'
const ACCENT        = '#ffa552'
const ACCENT_LIGHT  = '#fff4e8'
const DANGER        = '#ef4444'
const DANGER_LIGHT  = '#fee2e2'
const SECONDARY     = '#5bc0eb'
const BG            = '#f7f9fa'
const BORDER        = '#e5e7eb'
const TEXT          = '#1b1b1b'
const TEXT_MUTED    = '#6b7280'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function buildDateChips() {
  const chips: Array<{ iso: string; label: string; sub: string }> = []
  const today = new Date()
  for (let i = -2; i <= 2; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const iso  = d.toISOString().slice(0, 10)
    const label = i === 0 ? 'Hoje'
      : i === -1 ? 'Ontem'
      : i === 1  ? 'Amanhã'
      : new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '')
    const sub  = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d)
    chips.push({ iso, label, sub })
  }
  return chips
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusPresenca, { icon: string; label: string; bg: string; color: string }> = {
  presente:   { icon: '✅', label: 'Presente',   bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
  ausente:    { icon: '❌', label: 'Ausente',    bg: DANGER_LIGHT,  color: DANGER       },
  justificada:{ icon: '📝', label: 'Justificada',bg: ACCENT_LIGHT,  color: '#b45309'    },
  justificado:{ icon: '📝', label: 'Justificado',bg: ACCENT_LIGHT,  color: '#b45309'    },
} as Record<StatusPresenca, { icon: string; label: string; bg: string; color: string }>

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = { escolaId: string; janelaChamadaH: number; fusoHorario: string }

// ─── Chamada Modal ────────────────────────────────────────────────────────────
function ChamadaModal({
  turma, chamada, savingId, onStatusChange, onClose, dataAula,
}: {
  turma: Turma
  chamada: ChamadaPayload
  savingId: string | null
  onStatusChange: (matriculaId: string, status: StatusPresenca) => void
  onClose: () => void
  dataAula: string
}) {
  const [tab, setTab] = useState<'todos' | StatusPresenca>('todos')
  const total     = chamada.linhas.length
  const presentes = chamada.linhas.filter(l => l.registro?.status === 'presente').length
  const ausentes  = chamada.linhas.filter(l => l.registro?.status === 'ausente').length
  const justif    = chamada.linhas.filter(l => l.registro?.status === 'justificada' || l.registro?.status === 'justificado').length
  const pendentes = chamada.linhas.filter(l => !l.registro).length

  const filtered = tab === 'todos' ? chamada.linhas
    : tab === 'presente'    ? chamada.linhas.filter(l => l.registro?.status === 'presente')
    : tab === 'ausente'     ? chamada.linhas.filter(l => l.registro?.status === 'ausente')
    : chamada.linhas.filter(l => l.registro?.status === 'justificada' || l.registro?.status === 'justificado')

  const [d, m, y] = dataAula.split('-')
  const dateLabel = `${d}/${m}/${y}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)' }}>
      <div className="flex max-h-[90dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[15px]"
                style={{ background: PRIMARY_LIGHT }}>{turma.nome.charAt(0)}</div>
              <p className="font-bold" style={{ color: TEXT, fontSize: '15px' }}>{turma.nome}</p>
              {!chamada.podeEditar && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: ACCENT_LIGHT, color: '#b45309' }}>
                  Somente leitura
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px]" style={{ color: TEXT_MUTED }}>
              Chamada de {dateLabel} · {total} atletas matriculados
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100" style={{ color: TEXT_MUTED }}>✕</button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 divide-x border-b" style={{ borderColor: BORDER }}>
          {[
            { label: 'Presentes',   val: presentes, color: PRIMARY     },
            { label: 'Ausentes',    val: ausentes,  color: DANGER      },
            { label: 'Justif.',     val: justif,    color: '#b45309'   },
            { label: 'Pendentes',   val: pendentes, color: TEXT_MUTED  },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-2.5">
              <p className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10.5px] font-medium" style={{ color: TEXT_MUTED }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b px-4 pt-2" style={{ borderColor: BORDER }}>
          {(['todos', 'presente', 'ausente', 'justificada'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-t-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={tab === t
                ? { background: PRIMARY, color: '#fff' }
                : { background: 'transparent', color: TEXT_MUTED }}>
              {t === 'todos' ? 'Todos' : STATUS_CFG[t]?.label ?? t}
            </button>
          ))}
        </div>

        {/* Athlete grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
              Nenhum atleta nesta categoria
            </p>
          ) : (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(145px,1fr))' }}>
              {filtered.map(linha => {
                const status = linha.registro?.status as StatusPresenca | undefined
                const cfg    = status ? STATUS_CFG[status] : null
                const busy   = savingId === linha.matricula.id
                return (
                  <div key={linha.matricula.id}
                    className="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all"
                    style={{
                      background: cfg ? cfg.bg : BG,
                      borderColor: cfg ? cfg.color + '44' : BORDER,
                      opacity: busy ? .6 : 1,
                    }}>
                    {/* Avatar */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold text-white"
                      style={{ background: PRIMARY }}>
                      {initials(linha.atleta.nome)}
                    </div>
                    <p className="max-w-full truncate text-center text-[12px] font-semibold" style={{ color: TEXT }}>
                      {linha.atleta.nome.split(' ')[0]}
                    </p>
                    {/* Status buttons */}
                    {chamada.podeEditar && chamada.aulaId ? (
                      <div className="flex gap-1">
                        {(['presente', 'ausente', 'justificada'] as StatusPresenca[]).map(s => {
                          const c = STATUS_CFG[s]
                          const active = status === s
                          return (
                            <button key={s} disabled={busy}
                              onClick={() => onStatusChange(linha.matricula.id, s)}
                              title={c.label}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-all"
                              style={{
                                background: active ? c.color : '#fff',
                                border: `1.5px solid ${active ? c.color : BORDER}`,
                                transform: active ? 'scale(1.15)' : 'scale(1)',
                              }}>
                              {c.icon}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={cfg ? { background: cfg.bg, color: cfg.color } : { background: BG, color: TEXT_MUTED }}>
                        {cfg ? cfg.label : 'Pendente'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: BORDER }}>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            {presentes}/{total} presentes ({total > 0 ? Math.round((presentes / total) * 100) : 0}%)
          </p>
          <button onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: PRIMARY }}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Turma Card ───────────────────────────────────────────────────────────────
function TurmaCard({
  turma, chamada, dataAula, onOpenChamada,
}: {
  turma: Turma
  chamada: ChamadaPayload | null | undefined
  dataAula: string
  onOpenChamada: (t: Turma) => void
}) {
  const isToday    = dataAula === hojeISO()
  const isFuture   = dataAula > hojeISO()
  const total      = chamada?.linhas.length ?? 0
  const presentes  = chamada ? chamada.linhas.filter(l => l.registro?.status === 'presente').length : 0
  const ausentes   = chamada ? chamada.linhas.filter(l => l.registro?.status === 'ausente').length : 0
  const podeEditar = chamada?.podeEditar ?? false
  const chamadaFeita = chamada && total > 0 && chamada.linhas.every(l => l.registro !== null)
  const statusLabel = isFuture ? 'futura' : chamadaFeita ? 'feita' : isToday ? 'pendente' : 'pendente'

  const statusStyle = {
    futura:   { bg: BG,             color: TEXT_MUTED,  label: 'Futura'   },
    feita:    { bg: PRIMARY_LIGHT,  color: PRIMARY_DARK, label: 'Realizada' },
    pendente: { bg: ACCENT_LIGHT,   color: '#b45309',   label: 'Pendente'  },
  }
  const ss = statusStyle[statusLabel]
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold" style={{ color: TEXT, fontSize: '13.5px' }}>{turma.nome}</p>
          {typeof (turma as unknown as Record<string, unknown>).modalidade === 'string' && (
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{String((turma as unknown as Record<string, unknown>).modalidade)}</p>
          )}
        </div>
        <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
          style={{ background: ss.bg, color: ss.color }}>
          {ss.label}
        </span>
      </div>

      {/* Stats */}
      {chamada && total > 0 && (
        <>
          <div className="flex items-center gap-3 text-[12px]">
            <span style={{ color: PRIMARY_DARK }}>✅ {presentes}</span>
            <span style={{ color: DANGER }}>❌ {ausentes}</span>
            <span style={{ color: TEXT_MUTED }}>👥 {total}</span>
          </div>
          {/* freq bar */}
          <div>
            <div className="mb-1 flex justify-between">
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>Frequência</span>
              <span className="text-[10.5px] font-bold" style={{ color: pct >= 75 ? PRIMARY_DARK : '#b45309' }}>{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 75 ? PRIMARY : ACCENT }} />
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      {!isFuture && (
        <button
          onClick={() => onOpenChamada(turma)}
          className="mt-auto w-full rounded-lg py-2 text-[12px] font-semibold transition-all"
          style={{
            background: chamadaFeita ? BG : PRIMARY,
            color: chamadaFeita ? TEXT_MUTED : '#fff',
            border: chamadaFeita ? `1.5px solid ${BORDER}` : 'none',
          }}>
          {chamadaFeita ? (podeEditar ? '✏️ Editar chamada' : '👁 Ver chamada') : '✅ Fazer chamada'}
        </button>
      )}
      {isFuture && (
        <div className="mt-auto rounded-lg py-2 text-center text-[12px] font-medium" style={{ background: BG, color: TEXT_MUTED }}>
          Aula futura
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PresencasPageClient({ escolaId, janelaChamadaH, fusoHorario }: Props) {
  const [turmas, setTurmas]       = useState<Turma[]>([])
  const [dataAula, setDataAula]   = useState(hojeISO())
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // chamadas per turma
  const [chamadaMap, setChamadaMap] = useState<Record<string, ChamadaPayload | null>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  // modal state
  const [modalTurma, setModalTurma]   = useState<Turma | null>(null)
  const [modalChamada, setModalChamada] = useState<ChamadaPayload | null>(null)
  const [savingId, setSavingId]       = useState<string | null>(null)

  const dateChips = buildDateChips()

  // load turmas
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const r = await listarTurmasParaChamada(escolaId)
      if (cancelled) return
      if (r.error) setError(r.error)
      else setTurmas(r.turmas ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [escolaId])

  // load chamada for each turma when date changes
  useEffect(() => {
    if (turmas.length === 0) return
    let cancelled = false
    void (async () => {
      const map: Record<string, boolean> = {}
      turmas.forEach(t => (map[t.id] = true))
      setLoadingMap(map)
      const results = await Promise.all(
        turmas.map(t => carregarChamada(escolaId, t.id, dataAula))
      )
      if (cancelled) return
      const chamadas: Record<string, ChamadaPayload | null> = {}
      turmas.forEach((t, i) => { chamadas[t.id] = results[i].chamada ?? null })
      setChamadaMap(chamadas)
      setLoadingMap({})
    })()
    return () => { cancelled = true }
  }, [escolaId, turmas, dataAula])

  async function openChamada(turma: Turma) {
    const existing = chamadaMap[turma.id]
    if (existing) { setModalTurma(turma); setModalChamada(existing); return }
    // reload
    const r = await carregarChamada(escolaId, turma.id, dataAula)
    const c = r.chamada ?? null
    setChamadaMap(prev => ({ ...prev, [turma.id]: c }))
    setModalTurma(turma)
    setModalChamada(c)
  }

  async function onStatusChange(matriculaId: string, status: StatusPresenca) {
    if (!modalChamada?.aulaId || !modalTurma) return
    setSavingId(matriculaId)
    const r = await salvarPresencaLinha(escolaId, modalChamada.aulaId, matriculaId, status)
    setSavingId(null)
    if (r.error) { setError(r.error); return }
    // refresh this turma's chamada
    const refresh = await carregarChamada(escolaId, modalTurma.id, dataAula)
    const updated = refresh.chamada ?? null
    setChamadaMap(prev => ({ ...prev, [modalTurma.id]: updated }))
    setModalChamada(updated)
  }

  function closeModal() { setModalTurma(null); setModalChamada(null) }

  // total stats across all turmas
  const totalPresentes = Object.values(chamadaMap).reduce((s, c) =>
    s + (c?.linhas.filter(l => l.registro?.status === 'presente').length ?? 0), 0)
  const totalAusentes  = Object.values(chamadaMap).reduce((s, c) =>
    s + (c?.linhas.filter(l => l.registro?.status === 'ausente').length ?? 0), 0)
  const totalAtletas   = Object.values(chamadaMap).reduce((s, c) => s + (c?.linhas.length ?? 0), 0)

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Date chips ── */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {dateChips.map(chip => (
          <button key={chip.iso}
            onClick={() => setDataAula(chip.iso)}
            className="flex flex-shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 transition-all"
            style={{
              background: dataAula === chip.iso ? PRIMARY : '#fff',
              borderColor: dataAula === chip.iso ? PRIMARY : BORDER,
              color: dataAula === chip.iso ? '#fff' : TEXT,
              boxShadow: dataAula === chip.iso ? `0 2px 8px ${PRIMARY}55` : '0 1px 3px rgba(0,0,0,.05)',
            }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{chip.label}</span>
            <span className="text-[14px] font-extrabold">{chip.sub}</span>
          </button>
        ))}
        {/* manual date */}
        <input type="date" value={dataAula} onChange={e => setDataAula(e.target.value)}
          className="flex-shrink-0 rounded-xl border px-3 py-2 text-[12px] font-medium outline-none"
          style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
      </div>

      {/* ── Summary stats ── */}
      {!loading && turmas.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: PRIMARY_LIGHT, borderColor: PRIMARY + '44' }}>
          <span className="text-[13px] font-semibold" style={{ color: PRIMARY_DARK }}>
            {dataAula === hojeISO() ? 'Hoje' : dataAula.split('-').reverse().join('/')} ·
          </span>
          <span className="text-[13px] font-semibold" style={{ color: PRIMARY_DARK }}>
            ✅ {totalPresentes} presentes
          </span>
          <span className="text-[13px] font-semibold" style={{ color: DANGER }}>
            ❌ {totalAusentes} ausentes
          </span>
          <span className="text-[13px] font-medium" style={{ color: TEXT_MUTED }}>
            👥 {totalAtletas} total
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-[13px]" style={{ background: DANGER_LIGHT, color: DANGER }}>
          {error}
        </div>
      )}

      {/* ── Turma cards grid ── */}
      {loading ? (
        <div className="py-16 text-center" style={{ color: TEXT_MUTED }}>Carregando turmas…</div>
      ) : turmas.length === 0 ? (
        <div className="rounded-xl border py-12 text-center" style={{ background: '#fff', borderColor: BORDER }}>
          <p className="text-[14px] font-semibold" style={{ color: TEXT }}>Nenhuma turma disponível</p>
          <p className="mt-1 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            Se você é professor, confira se foi vinculado à turma.
          </p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {turmas.map(turma => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              chamada={loadingMap[turma.id] ? undefined : (chamadaMap[turma.id] ?? null)}
              dataAula={dataAula}
              onOpenChamada={openChamada}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-[11.5px]" style={{ color: TEXT_MUTED }}>
        Janela de edição: até {janelaChamadaH}h após o fim do dia (fuso: {fusoHorario}).
      </p>

      {/* ── Chamada Modal ── */}
      {modalTurma && modalChamada && (
        <ChamadaModal
          turma={modalTurma}
          chamada={modalChamada}
          dataAula={dataAula}
          savingId={savingId}
          onStatusChange={onStatusChange}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
