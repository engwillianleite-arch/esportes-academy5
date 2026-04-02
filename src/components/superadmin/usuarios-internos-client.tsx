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

export default function UsuariosInternosClient() {
  const [rows, setRows] = useState<Row[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<PerfilPlataforma>('suporte')

  async function load() {
    const r = await listarUsuariosInternosPlataforma()
    if (r.error) setErro(r.error)
    else {
      setErro(null)
      setRows((r.rows ?? []) as Row[])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function onInvite(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMsg(null)
    startTransition(async () => {
      const r = await convidarUsuarioInternoPlataforma(email, perfil)
      if (r.error) setErro(r.error)
      else {
        setMsg('Convite enviado.')
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
        setMsg('Usuário atualizado.')
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
        setMsg('Perfil atualizado.')
        await load()
      }
    })
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">SuperAdmin · Usuários internos</h1>

      {(erro || msg) && (
        <p className={`mb-4 rounded-md border px-4 py-3 text-sm ${erro ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'}`}>
          {erro ?? msg}
        </p>
      )}

      <form onSubmit={onInvite} className="mb-6 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input
          className="h-9 rounded-md border px-3 text-sm md:col-span-2"
          placeholder="email@empresa.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select className="h-9 rounded-md border px-3 text-sm" value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilPlataforma)}>
          <option value="super_admin">Super admin</option>
          <option value="suporte">Suporte</option>
          <option value="financeiro_interno">Financeiro interno</option>
        </select>
        <button type="submit" disabled={isPending} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          Convidar
        </button>
      </form>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Ativo</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/80">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.email ?? r.user_id}</p>
                  <p className="text-xs text-muted-foreground">{r.user_id}</p>
                </td>
                <td className="px-4 py-3">
                  <select className="h-8 rounded-md border px-2 text-sm" value={r.perfil} onChange={(e) => onChangePerfil(r, e.target.value as PerfilPlataforma)}>
                    <option value="super_admin">Super admin</option>
                    <option value="suporte">Suporte</option>
                    <option value="financeiro_interno">Financeiro interno</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={r.ativo} onChange={(e) => onToggleAtivo(r, e.target.checked)} />
                </td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
