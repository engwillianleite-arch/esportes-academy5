'use client'

import { useState, useEffect } from 'react'
import {
  criarPlanoPagamento,
  atualizarPlanoPagamento,
  deletarPlanoPagamento,
  duplicarPlanoPagamento,
} from '@/lib/plano-actions'
import type { PlanoPagamento, FrequenciaTipo, MetodoPagamento } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#20c997'
const PRIMARY_D = '#17a57a'
const PRIMARY_L = '#e6faf4'
const SECONDARY = '#5bc0eb'
const SEC_L     = '#e8f6fd'
const ACCENT    = '#ffa552'
const ACCENT_L  = '#fff4e8'
const PURPLE    = '#8b5cf6'
const PURPLE_L  = '#ede9fe'
const DANGER    = '#ef4444'
const DANGER_L  = '#fee2e2'
const BORDER    = '#e5e7eb'
const BG        = '#f7f9fa'
const TEXT      = '#1b1b1b'
const MUTED     = '#6b7280'
const CARD      = '#ffffff'
const SHADOW    = '0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.05)'
const SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,.09)'
const RADIUS    = '12px'
const RADIUS_SM = '8px'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_SWATCHES = [
  '#20c997', '#5bc0eb', '#ffa552', '#8b5cf6',
  '#ef4444', '#0369a1', '#f59e0b', '#ec4899',
]

const FREQ_OPTS: { value: FrequenciaTipo; icon: string; label: string; desc: string }[] = [
  { value: 'mensal',     icon: '🔄', label: 'Mensal',     desc: 'Todo mês' },
  { value: 'trimestral', icon: '🗓️', label: 'Trimestral', desc: 'A cada 3 meses' },
  { value: 'semestral',  icon: '📆', label: 'Semestral',  desc: 'A cada 6 meses' },
  { value: 'anual',      icon: '🏅', label: 'Anual',      desc: 'Uma vez ao ano' },
]

const METODO_OPTS: { value: MetodoPagamento; label: string; icon: string }[] = [
  { value: 'boleto',         label: 'Boleto',           icon: '📄' },
  { value: 'pix',            label: 'PIX',              icon: '⚡' },
  { value: 'cartao_credito', label: 'Cartão de crédito',icon: '💳' },
]

const FREQ_BADGE: Record<FrequenciaTipo, { bg: string; color: string }> = {
  mensal:      { bg: '#dcfce7', color: '#166534' },
  trimestral:  { bg: SEC_L,    color: '#0369a1' },
  semestral:   { bg: ACCENT_L, color: '#c05500' },
  anual:       { bg: PURPLE_L, color: '#6d28d9' },
}

const FREQ_LABEL: Record<FrequenciaTipo, string> = {
  mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}
const METODO_LABEL: Record<MetodoPagamento, string> = {
  boleto: 'Boleto', pix: 'PIX', cartao_credito: 'Cartão de crédito',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function liquidoCalc(valor: string, pct: string) {
  const v = parseFloat(valor) || 0
  const d = parseFloat(pct) || 0
  return parseFloat((v * (1 - d / 100)).toFixed(2))
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PlanoWithCount = PlanoPagamento & { linked_count: number }

type FormState = {
  nome: string
  frequencia: FrequenciaTipo
  valor: string
  desconto_pct: string
  dia_vencimento: string
  metodo_pagamento: MetodoPagamento
  cor: string
}

function emptyForm(): FormState {
  return {
    nome: '', frequencia: 'mensal', valor: '', desconto_pct: '0',
    dia_vencimento: '10', metodo_pagamento: 'boleto', cor: '#20c997',
  }
}
function planoToForm(p: PlanoPagamento): FormState {
  return {
    nome: p.nome, frequencia: p.frequencia as FrequenciaTipo,
    valor: String(p.valor), desconto_pct: String(p.desconto_pct),
    dia_vencimento: String(p.dia_vencimento),
    metodo_pagamento: p.metodo_pagamento as MetodoPagamento,
    cor: p.cor,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PlanosPagamentoClient({
  planos, escolaId, isAdmin,
}: { planos: PlanoWithCount[]; escolaId: string; isAdmin: boolean }) {
  const [showForm, setShowForm]           = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<PlanoWithCount | null>(null)
  const [form, setForm]                   = useState<FormState>(emptyForm())
  const [saving, setSaving]               = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [duplicating, setDuplicating]     = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [filterFreq, setFilterFreq]       = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }
  function openCreate() { setEditingId(null); setForm(emptyForm()); setError(null); setShowForm(true) }
  function openEdit(p: PlanoWithCount) { setEditingId(p.id); setForm(planoToForm(p)); setError(null); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditingId(null); setError(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('nome', form.nome)
      fd.append('frequencia', form.frequencia)
      fd.append('valor', form.valor)
      fd.append('desconto_pct', form.desconto_pct)
      fd.append('dia_vencimento', form.dia_vencimento)
      fd.append('metodo_pagamento', form.metodo_pagamento)
      fd.append('cor', form.cor)
      const result = editingId
        ? await atualizarPlanoPagamento(escolaId, editingId, fd)
        : await criarPlanoPagamento(escolaId, fd)
      if (result?.error) setError(result.error)
      else closeForm()
    } catch { setError('Erro inesperado. Tente novamente.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true); setError(null)
    try {
      const result = await deletarPlanoPagamento(escolaId, deleteTarget.id)
      if (result?.error) setError(result.error)
      else setDeleteTarget(null)
    } catch { setError('Erro inesperado.') }
    finally { setDeleting(false) }
  }

  async function handleDuplicate(p: PlanoWithCount) {
    if (duplicating) return
    setDuplicating(p.id); setError(null)
    try {
      const result = await duplicarPlanoPagamento(escolaId, p.id)
      if (result?.error) setError(result.error)
    } catch { setError('Erro inesperado.') }
    finally { setDuplicating(null) }
  }

  useEffect(() => {
    if (!deleteTarget) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !deleting) setDeleteTarget(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deleteTarget, deleting])

  useEffect(() => {
    if (!showForm) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !saving) closeForm() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showForm, saving])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalAtletas = planos.reduce((s, p) => s + p.linked_count, 0)
  const mostUsed = planos.slice().sort((a, b) => b.linked_count - a.linked_count)[0]
  const avgTicket = planos.length
    ? planos.reduce((s, p) => s + (p.valor_liquido ?? p.valor), 0) / planos.length
    : 0

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = planos.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.nome.toLowerCase().includes(q)) return false
    if (filterFreq && p.frequencia !== filterFreq) return false
    return true
  })

  const liquido = liquidoCalc(form.valor, form.desconto_pct)

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM,
    fontSize: 13, fontFamily: 'inherit', color: TEXT, background: CARD, outline: 'none',
    transition: 'border-color .15s',
  }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 5, display: 'block' }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>📋 Planos de Pagamento</h1>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>Templates de planos usados nas matrículas dos atletas.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: RADIUS_SM, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: PRIMARY, color: '#fff', boxShadow: `0 2px 8px rgba(32,201,151,.3)` }}>
            + Novo Plano
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: DANGER_L, border: `1px solid #fecaca`, borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total de Planos', val: planos.length, sub: `${planos.length} cadastrados` },
          { label: 'Atletas Vinculados', val: totalAtletas, sub: 'matrículas ativas' },
          { label: 'Plano Mais Usado', val: mostUsed?.nome ?? '—', sub: mostUsed ? `${mostUsed.linked_count} atletas` : '' },
          { label: 'Ticket Médio', val: fmtBRL(avgTicket), sub: 'valor líquido médio' },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: RADIUS, padding: 16, boxShadow: SHADOW }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: typeof s.val === 'string' && s.val.length > 10 ? 15 : 22, fontWeight: 800, color: TEXT, lineHeight: 1.2 }}>{s.val}</div>
            <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: MUTED }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar plano..."
            style={{ ...inp, padding: '8px 12px 8px 32px' }}
            onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>
        <select
          value={filterFreq} onChange={e => setFilterFreq(e.target.value)}
          style={{ padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: RADIUS_SM, fontSize: 13, background: CARD, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', color: TEXT }}
        >
          <option value="">Todas as frequências</option>
          {FREQ_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: MUTED }}>{visible.length} {visible.length === 1 ? 'plano' : 'planos'}</span>
      </div>

      {/* ── Plans grid ──────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Nenhum plano encontrado</div>
          <div style={{ fontSize: 13.5, maxWidth: 320, margin: '0 auto' }}>
            {planos.length === 0
              ? <>Crie o primeiro plano de pagamento.{' '}{isAdmin && <button type="button" onClick={openCreate} style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', textDecoration: 'underline', fontSize: 13.5, fontFamily: 'inherit' }}>Criar agora.</button>}</>
              : 'Tente ajustar os filtros.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {visible.map(p => {
            const fb = FREQ_BADGE[p.frequencia as FrequenciaTipo] ?? { bg: BG, color: MUTED }
            return (
              <div
                key={p.id}
                style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: RADIUS, overflow: 'hidden', transition: 'all .2s', position: 'relative' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = SHADOW_MD; el.style.borderColor = 'transparent' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = BORDER }}
              >
                {/* Color top bar */}
                <div style={{ height: 6, background: p.cor }} />

                <div style={{ padding: 18 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, lineHeight: 1.2 }}>{p.nome}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: fb.bg, color: fb.color, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}>
                      {FREQ_LABEL[p.frequencia as FrequenciaTipo]}
                    </span>
                  </div>

                  {/* Value */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                      {fmtBRL(p.valor_liquido ?? p.valor)}
                    </span>
                    {p.desconto_pct > 0 && (
                      <span style={{ fontSize: 12, color: MUTED, textDecoration: 'line-through' }}>
                        {fmtBRL(p.valor)}
                      </span>
                    )}
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Vencimento', val: `Dia ${p.dia_vencimento}` },
                      { label: 'Método',     val: METODO_LABEL[p.metodo_pagamento as MetodoPagamento] },
                      { label: 'Desconto',   val: p.desconto_pct > 0 ? `${p.desconto_pct}%` : 'Sem desconto' },
                      { label: 'Frequência', val: FREQ_LABEL[p.frequencia as FrequenciaTipo] },
                    ].map(d => (
                      <div key={d.label}>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '.4px' }}>{d.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{d.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Athletes row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: BG, borderRadius: RADIUS_SM, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, color: MUTED }}>Atletas vinculados</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.linked_count > 0 ? TEXT : MUTED }}>
                      {p.linked_count} {p.linked_count === 1 ? 'atleta' : 'atletas'}
                    </span>
                  </div>

                  {/* Footer actions */}
                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                      <button
                        type="button" onClick={() => handleDuplicate(p)} disabled={!!duplicating}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: BG, color: TEXT, fontSize: 11, fontWeight: 600, cursor: duplicating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY; (e.currentTarget as HTMLButtonElement).style.background = PRIMARY_L; (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_D }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = BG; (e.currentTarget as HTMLButtonElement).style.color = TEXT }}
                      >
                        {duplicating === p.id ? '⏳' : '⧉ Duplicar'}
                      </button>
                      <button
                        type="button" onClick={() => openEdit(p)}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: BG, color: TEXT, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY; (e.currentTarget as HTMLButtonElement).style.background = PRIMARY_L; (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_D }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = BG; (e.currentTarget as HTMLButtonElement).style.color = TEXT }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button" onClick={() => setDeleteTarget(p)}
                        disabled={p.linked_count > 0}
                        title={p.linked_count > 0 ? 'Plano possui atletas vinculados' : 'Excluir'}
                        style={{ padding: '6px 10px', borderRadius: RADIUS_SM, border: `1.5px solid #fecaca`, background: '#fef2f2', color: '#b91c1c', fontSize: 11, fontWeight: 600, cursor: p.linked_count > 0 ? 'not-allowed' : 'pointer', opacity: p.linked_count > 0 ? .4 : 1 }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Drawer backdrop ─────────────────────────────────────────────── */}
      {showForm && (
        <div onClick={() => { if (!saving) closeForm() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      )}

      {/* ── Drawer ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, right: showForm ? 0 : -520,
        width: '100%', maxWidth: 480, height: '100dvh',
        background: CARD, zIndex: 201, display: 'flex', flexDirection: 'column',
        transition: 'right .3s cubic-bezier(.4,0,.2,1)',
        boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{editingId ? 'Editar Plano' : 'Novo Plano de Pagamento'}</h3>
          <button onClick={closeForm} style={{ width: 32, height: 32, borderRadius: RADIUS_SM, border: `1px solid ${BORDER}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: MUTED }}>✕</button>
        </div>

        {/* Body + Footer in form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Section: Identificação */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
              Identificação
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Nome do plano <span style={{ color: DANGER }}>*</span></label>
              <input required value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Mensalidade Padrão"
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Cor de identificação</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLOR_SWATCHES.map(c => (
                  <div key={c} onClick={() => set('cor', c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.cor === c ? `3px solid ${TEXT}` : '3px solid transparent',
                      transform: form.cor === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all .15s',
                    }} />
                ))}
              </div>
            </div>

            {/* Section: Frequência */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px', margin: '20px 0 12px', paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
              Frequência de Pagamento
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {FREQ_OPTS.map(f => {
                const active = form.frequencia === f.value
                return (
                  <div key={f.value} onClick={() => set('frequencia', f.value)}
                    style={{
                      border: `2px solid ${active ? PRIMARY : BORDER}`, borderRadius: RADIUS_SM,
                      padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
                      background: active ? PRIMARY_L : CARD,
                    }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? PRIMARY_D : TEXT }}>{f.label}</div>
                    <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>{f.desc}</div>
                  </div>
                )
              })}
            </div>

            {/* Section: Valores */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px', margin: '4px 0 12px', paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
              Valores
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Valor por cobrança <span style={{ color: DANGER }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: MUTED, fontWeight: 600, pointerEvents: 'none' }}>R$</span>
                  <input required type="number" min={0} step={0.01} placeholder="0,00"
                    value={form.valor} onChange={e => set('valor', e.target.value)}
                    style={{ ...inp, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Dia de vencimento <span style={{ color: DANGER }}>*</span></label>
                <select value={form.dia_vencimento} onChange={e => set('dia_vencimento', e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}>
                  {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Desconto (%)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" min={0} max={100} step={1} placeholder="0"
                    value={form.desconto_pct} onChange={e => set('desconto_pct', e.target.value)}
                    style={{ ...inp, paddingRight: 26 }}
                    onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: MUTED }}>%</span>
                </div>
              </div>
              <div>
                <label style={lbl}>Método de pagamento</label>
                <select value={form.metodo_pagamento} onChange={e => set('metodo_pagamento', e.target.value as MetodoPagamento)}
                  style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}>
                  {METODO_OPTS.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                </select>
              </div>
            </div>

            {/* Valor líquido preview */}
            {(parseFloat(form.valor) > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: RADIUS_SM, border: `1px solid ${PRIMARY}`, background: PRIMARY_L, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY_D }}>💰 Valor líquido por cobrança</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: PRIMARY_D }}>{fmtBRL(liquido)}</span>
              </div>
            )}

            {/* Section: Preview */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.6px', margin: '4px 0 12px', paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
              Pré-visualização
            </div>

            <div style={{ border: `2px solid ${BORDER}`, borderRadius: RADIUS, overflow: 'hidden' }}>
              <div style={{ height: 6, background: form.cor }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{form.nome || 'Nome do plano'}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: form.cor, margin: '6px 0 4px' }}>
                  {parseFloat(form.valor) > 0 ? fmtBRL(liquido) : 'R$ 0,00'}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  {FREQ_LABEL[form.frequencia]} · Vence todo dia {form.dia_vencimento}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[METODO_LABEL[form.metodo_pagamento], form.desconto_pct !== '0' ? `${form.desconto_pct}% desc.` : null].filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: BG, border: `1px solid ${BORDER}`, color: MUTED }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: DANGER_L, border: `1px solid #fecaca`, borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, flexShrink: 0 }}>
            <button type="button" onClick={closeForm} disabled={saving}
              style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: 'none', background: saving ? '#a7f3d0' : PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Delete modal ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <>
          <div onClick={() => { if (!deleting) setDeleteTarget(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, backdropFilter: 'blur(2px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: CARD, borderRadius: RADIUS, width: 400, maxWidth: 'calc(100vw - 32px)',
            zIndex: 301, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.2)',
          }}>
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: DANGER_L, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🗑️</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Excluir plano</h3>
                <p style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{deleteTarget.nome}</p>
              </div>
            </div>
            <div style={{ padding: '16px 20px', fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>
              {deleteTarget.linked_count > 0
                ? <span style={{ color: '#b91c1c' }}>Este plano possui <strong>{deleteTarget.linked_count}</strong> {deleteTarget.linked_count === 1 ? 'atleta vinculado' : 'atletas vinculados'} e não pode ser excluído.</span>
                : <>Tem certeza que deseja excluir o plano <strong style={{ color: TEXT }}>{deleteTarget.nome}</strong>? Esta ação não pode ser desfeita.</>}
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding: '7px 16px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting || deleteTarget.linked_count > 0}
                style={{ padding: '7px 16px', borderRadius: RADIUS_SM, border: 'none', background: DANGER, color: '#fff', fontSize: 13, fontWeight: 600, cursor: (deleting || deleteTarget.linked_count > 0) ? 'not-allowed' : 'pointer', opacity: deleteTarget.linked_count > 0 ? .4 : 1, fontFamily: 'inherit' }}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
