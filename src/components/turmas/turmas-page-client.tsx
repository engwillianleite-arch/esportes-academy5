'use client'

import { useState, useEffect } from 'react'
import type { Turma } from '@/types'
import { criarTurma, atualizarTurma, deletarTurma } from '@/lib/turma-actions'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#20c997'
const PRIMARY_D = '#17a57a'
const PRIMARY_L = '#e6faf4'
const ACCENT    = '#ffa552'
const ACCENT_L  = '#fff4e8'
const SECONDARY = '#5bc0eb'
const SEC_L     = '#e8f6fd'
const PURPLE    = '#8b5cf6'
const PURPLE_L  = '#ede9fe'
const DANGER    = '#ef4444'
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
const TURMA_COLORS = [
  '#20c997', '#17a57a', '#5bc0eb', '#ffa552', '#8b5cf6',
  '#ef4444', '#06b6d4', '#0369a1', '#f59e0b', '#ec4899',
]

const DIA_CHIPS = [
  { v: '1', label: 'Seg' },
  { v: '2', label: 'Ter' },
  { v: '3', label: 'Qua' },
  { v: '4', label: 'Qui' },
  { v: '5', label: 'Sex' },
  { v: '6', label: 'Sáb' },
  { v: '0', label: 'Dom' },
]

const DIA_LABEL: Record<string, string> = {
  '0': 'Domingo', '1': 'Segunda', '2': 'Terça', '3': 'Quarta',
  '4': 'Quinta',  '5': 'Sexta',   '6': 'Sábado',
}

function turmaColor(nome: string): string {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) & 0xffff
  return TURMA_COLORS[h % TURMA_COLORS.length]
}

function barColor(pct: number) {
  return pct >= 90 ? DANGER : pct >= 70 ? ACCENT : PRIMARY
}

function fmt(t: string | null) {
  if (!t) return '—'
  return t.slice(0, 5)
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = {
  nome: string
  modalidade: string
  local: string
  capacidade_max: string
  idade_min: string
  idade_max: string
  professor_nome: string
  professor_user_id: string
  dia_semana: string
  hora_inicio: string
  hora_fim: string
  ativo: boolean
}

function emptyForm(): FormState {
  return {
    nome: '', modalidade: '', local: '',
    capacidade_max: '20', idade_min: '', idade_max: '',
    professor_nome: '', professor_user_id: 'none',
    dia_semana: 'none', hora_inicio: '', hora_fim: '', ativo: true,
  }
}

function turmaToForm(t: Turma): FormState {
  return {
    nome: t.nome, modalidade: t.modalidade, local: t.local ?? '',
    capacidade_max: String(t.capacidade_max),
    idade_min: t.idade_min !== null ? String(t.idade_min) : '',
    idade_max: t.idade_max !== null ? String(t.idade_max) : '',
    professor_nome: t.professor_nome ?? '',
    professor_user_id: t.professor_user_id ?? 'none',
    dia_semana: t.dia_semana !== null ? String(t.dia_semana) : 'none',
    hora_inicio: t.hora_inicio ? fmt(t.hora_inicio) : '',
    hora_fim: t.hora_fim ? fmt(t.hora_fim) : '',
    ativo: t.ativo,
  }
}

type Props = {
  turmas: Turma[]
  ocupacao: Record<string, number>
  escolaId: string
  isAdmin: boolean
  loadError: boolean
  membros?: { user_id: string; perfil: string; email: string | null }[]
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, val, valColor, label }: {
  icon: string; iconBg: string; val: string | number; valColor: string; label: string
}) {
  return (
    <div style={{ background: CARD, borderRadius: RADIUS, boxShadow: SHADOW, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: valColor }}>{val}</div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TurmasPageClient({ turmas, ocupacao, escolaId, isAdmin, loadError, membros }: Props) {
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [form, setForm]               = useState<FormState>(emptyForm())
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Turma | null>(null)
  const [deleting, setDeleting]       = useState(false)
  const [search, setSearch]           = useState('')
  const [filterModal, setFilterModal] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function openCreate() {
    setEditingId(null); setForm(emptyForm()); setError(null); setShowForm(true)
  }
  function openEdit(t: Turma) {
    setEditingId(t.id); setForm(turmaToForm(t)); setError(null); setShowForm(true)
  }
  function closeForm() {
    setShowForm(false); setEditingId(null); setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('nome', form.nome)
      fd.append('modalidade', form.modalidade)
      fd.append('local', form.local)
      fd.append('capacidade_max', form.capacidade_max)
      fd.append('idade_min', form.idade_min)
      fd.append('idade_max', form.idade_max)
      fd.append('professor_nome', form.professor_nome)
      fd.append('professor_user_id', form.professor_user_id === 'none' ? '' : form.professor_user_id)
      fd.append('dia_semana', form.dia_semana === 'none' ? '' : form.dia_semana)
      fd.append('hora_inicio', form.hora_inicio)
      fd.append('hora_fim', form.hora_fim)
      fd.append('ativo', form.ativo ? 'true' : 'false')
      const result = editingId
        ? await atualizarTurma(escolaId, editingId, fd)
        : await criarTurma(escolaId, fd)
      if (result?.error) setError(result.error)
      else closeForm()
    } catch { setError('Erro inesperado. Tente novamente.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true); setError(null)
    try {
      const result = await deletarTurma(escolaId, deleteTarget.id)
      if (result?.error) setError(result.error)
      else setDeleteTarget(null)
    } catch { setError('Erro inesperado.') }
    finally { setDeleting(false) }
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
  const ativas    = turmas.filter(t => t.ativo).length
  const pausadas  = turmas.filter(t => !t.ativo).length
  const profIds   = new Set(turmas.map(t => t.professor_user_id).filter(Boolean))
  const totalAtletas = turmas.reduce((s, t) => s + (ocupacao[t.id] ?? 0), 0)
  const totalCap  = turmas.reduce((s, t) => s + (t.capacidade_max ?? 0), 0)
  const ocupPct   = totalCap > 0 ? Math.round(totalAtletas / totalCap * 100) : 0

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = turmas.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.nome.toLowerCase().includes(q) && !(t.professor_nome ?? '').toLowerCase().includes(q)) return false
    if (filterModal && t.modalidade !== filterModal) return false
    if (filterStatus === 'ativa' && !t.ativo) return false
    if (filterStatus === 'pausada' && t.ativo) return false
    return true
  })

  const modalidades = [...new Set(turmas.map(t => t.modalidade).filter(Boolean))]

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM,
    fontSize: 13, fontFamily: 'inherit', color: TEXT, background: BG, outline: 'none',
    transition: 'border-color .15s', width: '100%',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: TEXT }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>🏃 Turmas</h1>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Gerencie turmas, horários, modalidades e professores responsáveis.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: RADIUS_SM, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: PRIMARY, color: '#fff', boxShadow: `0 2px 8px rgba(32,201,151,.3)` }}
          >
            + Nova Turma
          </button>
        )}
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: RADIUS_SM, fontSize: 13, color: MUTED }}>
          Apenas o administrador da escola pode criar ou editar turmas.
        </div>
      )}

      {loadError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
          Erro ao carregar turmas. Tente recarregar a página.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard icon="🏃" iconBg={PRIMARY_L} val={turmas.length}  valColor={PRIMARY}   label="Total de Turmas" />
        <StatCard icon="👥" iconBg={SEC_L}      val={totalAtletas}  valColor={SECONDARY} label="Atletas Matriculados" />
        <StatCard icon="⚡" iconBg={ACCENT_L}   val={ativas}        valColor={ACCENT}    label="Turmas Ativas" />
        <StatCard icon="📊" iconBg={PURPLE_L}   val={`${ocupPct}%`} valColor={PURPLE}    label="Taxa de Ocupação" />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM, padding: '8px 12px', flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 13, color: MUTED }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar turma ou professor..."
            style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, outline: 'none', width: '100%' }}
          />
        </div>
        <select
          value={filterModal} onChange={e => setFilterModal(e.target.value)}
          style={{ height: 38, padding: '0 10px', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM, background: CARD, fontSize: 13, color: TEXT, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <option value="">Todas as modalidades</option>
          {modalidades.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ height: 38, padding: '0 10px', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM, background: CARD, fontSize: 13, color: TEXT, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <option value="">Todas</option>
          <option value="ativa">Ativas</option>
          <option value="pausada">Pausadas</option>
        </select>
      </div>

      {/* ── Turma grid ───────────────────────────────────────────────────── */}
      {visible.length === 0 && !loadError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Nenhuma turma encontrada</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {turmas.length === 0 ? 'Crie a primeira turma clicando em "+ Nova Turma".' : 'Tente ajustar os filtros.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {visible.map(t => {
            const oc  = ocupacao[t.id] ?? 0
            const cap = t.capacidade_max ?? 1
            const pct = Math.min(Math.round(oc / cap * 100), 100)
            const cor = turmaColor(t.nome)
            const diaLabel = t.dia_semana !== null ? DIA_LABEL[String(t.dia_semana)] : null
            const hora = t.hora_inicio && t.hora_fim
              ? `${fmt(t.hora_inicio)} – ${fmt(t.hora_fim)}`
              : t.hora_inicio ? fmt(t.hora_inicio) : null

            return (
              <div
                key={t.id}
                style={{ background: CARD, borderRadius: RADIUS, boxShadow: SHADOW, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW_MD; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = SHADOW; (e.currentTarget as HTMLDivElement).style.transform = '' }}
              >
                {/* Color bar */}
                <div style={{ height: 4, background: cor, flexShrink: 0 }} />

                {/* Body */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Head */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{t.nome}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: PRIMARY_L, color: PRIMARY_D, whiteSpace: 'nowrap' }}>
                        {t.modalidade}
                      </span>
                      {!t.ativo && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: ACCENT_L, color: '#b45309' }}>
                          Pausada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(diaLabel || hora) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                        <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>📅</span>
                        <span>{[diaLabel, hora].filter(Boolean).join(' · ')}</span>
                      </div>
                    )}
                    {t.professor_nome && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                        <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>👤</span>
                        <strong style={{ color: TEXT, fontWeight: 600 }}>{t.professor_nome}</strong>
                      </div>
                    )}
                    {t.local && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                        <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>📍</span>
                        <span>{t.local}</span>
                      </div>
                    )}
                    {(t.idade_min !== null || t.idade_max !== null) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}>
                        <span style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>🎂</span>
                        <span>
                          {t.idade_min !== null && t.idade_max !== null
                            ? `${t.idade_min}–${t.idade_max} anos`
                            : t.idade_min !== null ? `A partir de ${t.idade_min} anos`
                            : `Até ${t.idade_max} anos`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Capacity progress */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                      <span style={{ color: MUTED }}>Ocupação</span>
                      <span style={{ fontWeight: 700, color: barColor(pct) }}>{oc}/{cap} atletas ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor(pct), borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                  {isAdmin && (
                    <button
                      onClick={() => openEdit(t)}
                      style={{ flex: 1, minWidth: 70, padding: '6px 8px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: BG, color: TEXT, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY; (e.currentTarget as HTMLButtonElement).style.background = PRIMARY_L; (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_D }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = BG; (e.currentTarget as HTMLButtonElement).style.color = TEXT }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                  <a
                    href={`/painel/atletas?turma=${t.id}`}
                    style={{ flex: 1, minWidth: 70, padding: '6px 8px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: BG, color: TEXT, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'all .15s', display: 'inline-block' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = SECONDARY; (e.currentTarget as HTMLAnchorElement).style.background = SEC_L; (e.currentTarget as HTMLAnchorElement).style.color = '#0369a1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = BORDER; (e.currentTarget as HTMLAnchorElement).style.background = BG; (e.currentTarget as HTMLAnchorElement).style.color = TEXT }}
                  >
                    👥 Atletas
                  </a>
                  <a
                    href={`/painel/presencas?turma=${t.id}`}
                    style={{ flex: 1, minWidth: 70, padding: '6px 8px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: PRIMARY, borderColor: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'all .15s', display: 'inline-block' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = PRIMARY_D; (e.currentTarget as HTMLAnchorElement).style.borderColor = PRIMARY_D }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = PRIMARY; (e.currentTarget as HTMLAnchorElement).style.borderColor = PRIMARY }}
                  >
                    ✅ Chamadas
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(t)}
                      style={{ padding: '6px 10px', borderRadius: RADIUS_SM, border: `1.5px solid #fecaca`, background: '#fef2f2', color: '#b91c1c', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Drawer backdrop ──────────────────────────────────────────────── */}
      {showForm && (
        <div
          onClick={() => { if (!saving) closeForm() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: showForm ? 0 : -520,
          width: '100%', maxWidth: 500, height: '100dvh',
          background: CARD, zIndex: 201,
          display: 'flex', flexDirection: 'column',
          transition: 'right .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: '-4px 0 32px rgba(0,0,0,.15)',
        }}
      >
        {/* Drawer header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{editingId ? 'Editar Turma' : 'Nova Turma'}</div>
          <button
            onClick={closeForm}
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: BG, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Drawer body + footer wrapped in form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Nome da turma <span style={{ color: DANGER }}>*</span></label>
            <input
              required value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Futebol Sub-13 A"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>

          {/* Modalidade */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Modalidade <span style={{ color: DANGER }}>*</span></label>
            <input
              required value={form.modalidade} onChange={e => set('modalidade', e.target.value)}
              placeholder="Futebol, Natação, Ginástica..."
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>

          {/* Cor da turma (derived — displayed only) */}
          {form.nome && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelStyle}>Cor da turma</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {TURMA_COLORS.map(c => {
                  const isSel = turmaColor(form.nome) === c
                  return (
                    <div
                      key={c}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'default',
                        border: isSel ? '3px solid #fff' : '3px solid transparent',
                        boxShadow: isSel ? `0 0 0 2px ${TEXT}` : 'none',
                        transform: isSel ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform .15s',
                      }}
                    />
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: MUTED }}>A cor é definida automaticamente pelo nome da turma.</p>
            </div>
          )}

          {/* Dia da semana chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={labelStyle}>Dia da semana</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIA_CHIPS.map(d => {
                const active = form.dia_semana === d.v
                return (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => set('dia_semana', active ? 'none' : d.v)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', userSelect: 'none', transition: 'all .15s',
                      background: active ? PRIMARY : BG,
                      border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                      color: active ? '#fff' : TEXT,
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horário */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Início</label>
              <input
                type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Fim</label>
              <input
                type="time" value={form.hora_fim} onChange={e => set('hora_fim', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          {/* Capacidade + Local */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Capacidade máx. <span style={{ color: DANGER }}>*</span></label>
              <input
                required type="number" min={1} value={form.capacidade_max}
                onChange={e => set('capacidade_max', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Local</label>
              <input
                value={form.local} onChange={e => set('local', e.target.value)}
                placeholder="Quadra 1..."
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          {/* Idade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Idade mínima</label>
              <input
                type="number" min={0} max={120} value={form.idade_min} placeholder="—"
                onChange={e => set('idade_min', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Idade máxima</label>
              <input
                type="number" min={0} max={120} value={form.idade_max} placeholder="—"
                onChange={e => set('idade_max', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          {/* Professor nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Professor(a) — nome exibido</label>
            <input
              value={form.professor_nome} onChange={e => set('professor_nome', e.target.value)}
              placeholder="Nome que aparece nos cards"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>

          {/* Professor conta */}
          {isAdmin && membros && membros.filter(m => m.perfil === 'professor').length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Professor(a) — conta (chamada)</label>
              <p style={{ fontSize: 11, color: MUTED }}>Vincule o usuário com perfil professor para liberar a chamada.</p>
              <select
                value={form.professor_user_id || 'none'}
                onChange={e => set('professor_user_id', e.target.value)}
                style={{ ...inputStyle, height: 38 }}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <option value="none">Nenhum</option>
                {membros.filter(m => m.perfil === 'professor').map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.email ?? m.user_id.slice(0, 8) + '…'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ativo toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox" checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>Turma ativa (visível para novas matrículas)</span>
          </label>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
              {error}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            type="button" onClick={closeForm} disabled={saving}
            style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit" disabled={saving}
            style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: 'none', background: saving ? '#a7f3d0' : PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .15s' }}
          >
            {saving ? 'Salvando…' : 'Salvar Turma'}
          </button>
        </div>
        </form>
      </div>

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      {deleteTarget && (
        <>
          <div
            onClick={() => { if (!deleting) setDeleteTarget(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: CARD, borderRadius: RADIUS, padding: 28, width: 'calc(100% - 32px)', maxWidth: 420,
            zIndex: 301, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Excluir turma?</h3>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 20 }}>
              A turma <strong>{deleteTarget.nome}</strong> será desativada. Não é possível excluir se houver matrículas ativas vinculadas.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '9px 0', borderRadius: RADIUS_SM, border: 'none', background: deleting ? '#fca5a5' : DANGER, color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
