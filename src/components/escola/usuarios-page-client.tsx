'use client'

import { useState, useTransition } from 'react'
import {
  listarMembrosEscola,
  atualizarPerfilMembro,
  toggleMembroAtivo,
  removerMembro,
  convidarMembroEscola,
  type MembroEscola,
} from '@/lib/equipe-actions'

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
const INFO_LIGHT    = '#e8f6fd'
const SECONDARY     = '#5bc0eb'
const BG            = '#f7f9fa'
const BORDER        = '#e5e7eb'
const TEXT          = '#1b1b1b'
const TEXT_MUTED    = '#6b7280'

// ─── Perfil config ────────────────────────────────────────────────────────────
const PERFIL_CFG: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  admin_escola:  { label: 'Admin',       icon: '👑', bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
  coordenador:   { label: 'Coordenador', icon: '📚', bg: INFO_LIGHT,    color: '#0369a1'    },
  professor:     { label: 'Professor',   icon: '🏫', bg: PURPLE_LIGHT,  color: PURPLE       },
  financeiro:    { label: 'Financeiro',  icon: '💰', bg: ACCENT_LIGHT,  color: '#b45309'    },
  secretaria:    { label: 'Secretaria',  icon: '📋', bg: '#f0fdf4',     color: '#16a34a'    },
  saude:         { label: 'Saúde',       icon: '🩺', bg: DANGER_LIGHT,  color: DANGER       },
  marketing:     { label: 'Marketing',   icon: '📣', bg: '#fef9c3',     color: '#ca8a04'    },
  visualizador:  { label: 'Visualizador',icon: '👁', bg: BG,            color: TEXT_MUTED   },
}

const PERFIS = Object.entries(PERFIL_CFG).map(([value, cfg]) => ({ value, ...cfg }))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string | null, email: string | null) {
  const src = name ?? email ?? '?'
  return src.split(/[\s@.]/)[0]?.slice(0, 2).toUpperCase() ?? '?'
}

function PerfilBadge({ perfil }: { perfil: string }) {
  const cfg = PERFIL_CFG[perfil] ?? { label: perfil, icon: '👤', bg: BG, color: TEXT_MUTED }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Invite Drawer ────────────────────────────────────────────────────────────
function ConviteDrawer({
  open, escolaId, onClose, onSaved,
}: {
  open: boolean; escolaId: string; onClose: () => void; onSaved: () => void
}) {
  const [email, setEmail]   = useState('')
  const [perfil, setPerfil] = useState('professor')
  const [err, setErr]       = useState<string | null>(null)
  const [msg, setMsg]       = useState<string | null>(null)
  const [pending, start]    = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    start(async () => {
      const r = await convidarMembroEscola(escolaId, email, perfil)
      if (r.error) { setErr(r.error); return }
      setMsg(r.message ?? 'Membro adicionado!')
      setEmail('')
      onSaved()
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end"
      style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(2px)' }}>
      <div className="flex h-full w-full max-w-[500px] flex-col"
        style={{ background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,.15)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: BORDER }}>
          <div>
            <p className="font-bold" style={{ color: TEXT, fontSize: '15px' }}>Adicionar Usuário</p>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Adicione um usuário já cadastrado na plataforma</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100" style={{ color: TEXT_MUTED }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {err && <div className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ background: DANGER_LIGHT, color: DANGER }}>⚠ {err}</div>}
          {msg && <div className="rounded-lg px-3 py-2.5 text-[12.5px]" style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>✅ {msg}</div>}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: TEXT }}>
              E-mail do usuário <span style={{ color: DANGER }}>*</span>
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none"
              style={{ background: '#fff', borderColor: BORDER, color: TEXT }} />
            <p className="mt-1 text-[11.5px]" style={{ color: TEXT_MUTED }}>
              O usuário precisa ter uma conta ativa na plataforma.
            </p>
          </div>

          {/* Perfil grid */}
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold" style={{ color: TEXT }}>Perfil</label>
            <div className="grid grid-cols-2 gap-2">
              {PERFIS.map(p => (
                <button key={p.value} type="button" onClick={() => setPerfil(p.value)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all"
                  style={{
                    background: perfil === p.value ? p.bg : '#fff',
                    borderColor: perfil === p.value ? p.color : BORDER,
                    color: perfil === p.value ? p.color : TEXT,
                  }}>
                  <span className="text-[16px]">{p.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold">{p.label}</p>
                  </div>
                  {perfil === p.value && (
                    <span className="ml-auto text-[11px] font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex gap-3 border-t pt-4" style={{ borderColor: BORDER }}>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-[13px] font-semibold"
              style={{ background: '#fff', borderColor: BORDER, color: TEXT }}>
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {pending ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Props = {
  escolaId: string
  currentUserId: string
  currentPerfil: string
  initialMembros: MembroEscola[]
}

export default function UsuariosPageClient({ escolaId, currentUserId, currentPerfil, initialMembros }: Props) {
  const [membros, setMembros]           = useState<MembroEscola[]>(initialMembros)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [editPerfil, setEditPerfil]     = useState<string>('')
  const [confirmRemove, setConfirmRemove] = useState<MembroEscola | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState<string | null>(null)
  const [pending, start]                = useTransition()
  const [q, setQ]                       = useState('')

  const isAdmin = currentPerfil === 'admin_escola'

  async function refresh() {
    const r = await listarMembrosEscola(escolaId)
    if (!r.error) setMembros(r.membros ?? [])
  }

  function openEdit(m: MembroEscola) {
    setSelectedId(m.id); setEditPerfil(m.perfil)
    setError(null); setSuccess(null)
  }

  function handleSavePerfil() {
    if (!selectedId) return
    start(async () => {
      const r = await atualizarPerfilMembro(escolaId, selectedId, editPerfil)
      if (r.error) { setError(r.error); return }
      setSuccess('Perfil atualizado.')
      setSelectedId(null)
      await refresh()
    })
  }

  function handleToggleAtivo(m: MembroEscola) {
    start(async () => {
      const r = await toggleMembroAtivo(escolaId, m.id, !m.ativo)
      if (r.error) { setError(r.error); return }
      await refresh()
    })
  }

  function handleRemover() {
    if (!confirmRemove) return
    start(async () => {
      const r = await removerMembro(escolaId, confirmRemove.id)
      setConfirmRemove(null)
      if (r.error) { setError(r.error); return }
      setSuccess('Membro removido.')
      await refresh()
    })
  }

  const filtered = q.trim()
    ? membros.filter(m => (m.nome ?? '').toLowerCase().includes(q.toLowerCase()) || (m.email ?? '').toLowerCase().includes(q.toLowerCase()))
    : membros

  const ativos    = membros.filter(m => m.ativo).length
  const inativos  = membros.filter(m => !m.ativo).length

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Stat Cards ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: '👥', value: membros.length, label: 'Total de usuários', color: SECONDARY,  bg: INFO_LIGHT    },
          { icon: '✅', value: ativos,          label: 'Ativos',            color: PRIMARY,     bg: PRIMARY_LIGHT },
          { icon: '⏸️', value: inativos,         label: 'Suspensos',         color: ACCENT,      bg: ACCENT_LIGHT  },
          { icon: '🛡️', value: membros.filter(m => m.perfil === 'admin_escola').length, label: 'Admins', color: PURPLE, bg: PURPLE_LIGHT },
        ].map(s => (
          <div key={s.label} className="relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4"
            style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: s.color }} />
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[17px]" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <p className="text-[26px] font-extrabold leading-none" style={{ color: TEXT }}>{s.value}</p>
              <p className="mt-1 text-[12px] font-medium" style={{ color: TEXT_MUTED }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2"
          style={{ background: '#fff', borderColor: BORDER, maxWidth: 340 }}>
          <span className="text-[13px]" style={{ color: TEXT_MUTED }}>🔍</span>
          <input className="w-full bg-transparent text-[13px] outline-none" style={{ color: TEXT }}
            placeholder="Buscar por nome ou e-mail…"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {isAdmin && (
          <button onClick={() => setDrawerOpen(true)}
            className="flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}55` }}>
            + Adicionar Usuário
          </button>
        )}
      </div>

      {error   && <div className="mb-3 rounded-lg px-4 py-2.5 text-[12.5px]" style={{ background: DANGER_LIGHT, color: DANGER }}>{error}</div>}
      {success && <div className="mb-3 rounded-lg px-4 py-2.5 text-[12.5px]" style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>{success}</div>}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${BORDER}`, background: BG }}>
                {['Usuário', 'Perfil', 'Status', 'Desde', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold"
                    style={{ color: TEXT_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>
                  {q ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </td></tr>
              )}
              {filtered.map(m => {
                const isSelf = m.user_id === currentUserId
                const ini    = initials(m.nome, m.email)
                const colors = [PRIMARY, SECONDARY, PURPLE, ACCENT, DANGER]
                const c      = colors[(m.nome ?? m.email ?? '').charCodeAt(0) % colors.length]
                return (
                  <tr key={m.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, opacity: m.ativo ? 1 : .55 }}>
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: c }}>{ini}</div>
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: TEXT }}>
                            {m.nome ?? '—'}
                            {isSelf && <span className="ml-1.5 rounded-full px-2 py-px text-[10px] font-bold" style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK }}>Você</span>}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>{m.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Perfil */}
                    <td className="px-4 py-3">
                      {selectedId === m.id ? (
                        <div className="flex items-center gap-2">
                          <select value={editPerfil} onChange={e => setEditPerfil(e.target.value)}
                            className="rounded-lg border px-2 py-1.5 text-[12px] outline-none"
                            style={{ borderColor: BORDER, color: TEXT }}>
                            {PERFIS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                          </select>
                          <button onClick={handleSavePerfil} disabled={pending}
                            className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-white"
                            style={{ background: PRIMARY }}>✓</button>
                          <button onClick={() => setSelectedId(null)}
                            className="rounded-lg px-2 py-1.5 text-[11px]" style={{ color: TEXT_MUTED }}>✕</button>
                        </div>
                      ) : (
                        <PerfilBadge perfil={m.perfil} />
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={m.ativo
                          ? { background: PRIMARY_LIGHT, color: PRIMARY_DARK }
                          : { background: BG, color: TEXT_MUTED }}>
                        {m.ativo ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    {/* Desde */}
                    <td className="hidden px-4 py-3 sm:table-cell" style={{ color: TEXT_MUTED, fontSize: '12px' }}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      {isAdmin && !isSelf && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(m)} title="Trocar perfil"
                            className="rounded-lg p-1.5 text-[13px] transition-colors hover:bg-gray-100"
                            style={{ color: TEXT_MUTED }}>✏️</button>
                          <button onClick={() => handleToggleAtivo(m)} disabled={pending}
                            title={m.ativo ? 'Suspender' : 'Reativar'}
                            className="rounded-lg p-1.5 text-[13px] transition-colors hover:bg-gray-100"
                            style={{ color: m.ativo ? ACCENT : PRIMARY }}>
                            {m.ativo ? '⏸️' : '▶️'}
                          </button>
                          <button onClick={() => setConfirmRemove(m)} title="Remover"
                            className="rounded-lg p-1.5 text-[13px] transition-colors hover:bg-red-50"
                            style={{ color: DANGER }}>🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Remove Modal ── */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="w-full max-w-[400px] rounded-2xl p-6" style={{ background: '#fff' }}>
            <p className="text-[15px] font-bold" style={{ color: TEXT }}>Remover usuário?</p>
            <p className="mt-1.5 text-[13px]" style={{ color: TEXT_MUTED }}>
              <strong>{confirmRemove.nome ?? confirmRemove.email}</strong> perderá o acesso a esta escola. Esta ação pode ser revertida re-adicionando o usuário.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-lg border py-2.5 text-[13px] font-semibold"
                style={{ borderColor: BORDER, color: TEXT }}>Cancelar</button>
              <button onClick={handleRemover} disabled={pending}
                className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                style={{ background: DANGER }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Convite Drawer ── */}
      <ConviteDrawer
        open={drawerOpen}
        escolaId={escolaId}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => { void refresh() }}
      />
    </div>
  )
}
