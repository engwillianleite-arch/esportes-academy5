'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  atualizarUsuarioInternoPlataforma,
  convidarUsuarioInternoPlataforma,
  listarUsuariosInternosPlataforma,
} from '@/lib/superadmin-actions'
import type { PerfilPlataforma } from '@/types'

type Row = {
  id: string
  user_id: string
  perfil: PerfilPlataforma
  ativo: boolean
  created_at: string
  email: string | null
}

const PERFIL_BADGE: Record<string, string> = {
  super_admin:        'bg-[#4f46e5]/10 text-[#4f46e5]',
  suporte:            'bg-sky-100 text-sky-700',
  financeiro_interno: 'bg-emerald-100 text-emerald-700',
}

function initials(email: string | null): string {
  if (!email) return 'U'
  return email.charAt(0).toUpperCase()
}

export default function UsuariosInternosClient() {
  const [rows, setRows]         = useState<Row[]>([])
  const [erro, setErro]         = useState<string | null>(null)
  const [msg, setMsg]           = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [isPending, startTransition] = useTransition()

  const [email, setEmail]   = useState('')
  const [perfil, setPerfil] = useState<PerfilPlataforma>('suporte')

  async function load() {
    setLoading(true)
    const r = await listarUsuariosInternosPlataforma()
    if (r.error) setErro(r.error)
    else {
      setErro(null)
      setRows((r.rows ?? []) as Row[])
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  function onInvite(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMsg(null)
    startTransition(async () => {
      const r = await convidarUsuarioInternoPlataforma(email, perfil)
      if (r.error) setErro(r.error)
      else {
        setMsg(`Convite enviado para ${email}`)
        setEmail('')
        await load()
      }
    })
  }

  function onToggleAtivo(row: Row, ativo: boolean) {
    setErro(null)
    setMsg(null)
    startTransition(async () => {
      const r = await atualizarUsuarioInternoPlataforma(row.user_id, { ativo })
      if (r.error) setErro(r.error)
      else {
        setMsg(`Usuário ${ativo ? 'ativado' : 'desativado'}`)
        await load()
      }
    })
  }

  function onChangePerfil(row: Row, p: PerfilPlataforma) {
    setErro(null)
    setMsg(null)
    startTransition(async () => {
      const r = await atualizarUsuarioInternoPlataforma(row.user_id, { perfil: p })
      if (r.error) setErro(r.error)
      else {
        setMsg('Perfil atualizado')
        await load()
      }
    })
  }

  const ativos   = rows.filter((r) => r.ativo).length
  const inativos = rows.length - ativos

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#0f172a]">Usuários Internos</h1>
        <p className="mt-0.5 text-sm text-[#64748b]">Gerencie os colaboradores internos da plataforma</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3">
          <p className="text-xs text-[#94a3b8]">Total</p>
          <p className="mt-0.5 text-xl font-bold text-[#0f172a]">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3">
          <p className="text-xs text-[#94a3b8]">Ativos</p>
          <p className="mt-0.5 text-xl font-bold text-emerald-600">{ativos}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3">
          <p className="text-xs text-[#94a3b8]">Inativos</p>
          <p className="mt-0.5 text-xl font-bold text-[#94a3b8]">{inativos}</p>
        </div>
      </div>

      {/* Feedback */}
      {(erro || msg) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            erro
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {erro ?? msg}
        </div>
      )}

      {/* Invite form */}
      <form onSubmit={onInvite} className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-5">
        <p className="mb-3 text-sm font-semibold text-[#0f172a]">Convidar novo usuário interno</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
            <span className="text-[13px] text-[#94a3b8]">✉️</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            />
          </div>

          <select
            value={perfil}
            onChange={(e) => setPerfil(e.target.value as PerfilPlataforma)}
            className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
          >
            <option value="super_admin">Super Admin</option>
            <option value="suporte">Suporte</option>
            <option value="financeiro_interno">Financeiro Interno</option>
          </select>

          <button
            type="submit"
            disabled={isPending || !email}
            className="h-10 rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
          >
            {isPending ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Usuário</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Perfil</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Adicionado em</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#94a3b8]">Carregando...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#94a3b8]">
                  Nenhum usuário interno cadastrado.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#4f46e5]/10 text-sm font-bold text-[#4f46e5]">
                      {initials(r.email)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f172a]">{r.email ?? '—'}</p>
                      <p className="text-[11px] text-[#94a3b8]">{r.user_id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <select
                    value={r.perfil}
                    disabled={isPending}
                    onChange={(e) => onChangePerfil(r, e.target.value as PerfilPlataforma)}
                    className={`cursor-pointer rounded-full border-0 px-3 py-1 text-[11px] font-semibold outline-none ${PERFIL_BADGE[r.perfil] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="suporte">Suporte</option>
                    <option value="financeiro_interno">Financeiro Interno</option>
                  </select>
                </td>

                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${r.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {r.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-[#64748b]">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onToggleAtivo(r, !r.ativo)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${r.ativo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    {r.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
