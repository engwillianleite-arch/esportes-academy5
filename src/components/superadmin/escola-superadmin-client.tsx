'use client'

import { useState, useTransition } from 'react'
import {
  atualizarModuloAvulsoSuperAdmin,
  atualizarPlanoEscolaSuperAdmin,
  salvarAssinaturaPlataforma,
} from '@/lib/superadmin-actions'
import { MODULO_INFO } from '@/lib/modulo-info'
import type { ModuloSlug, PlanoTipo, StatusAssinaturaPlataforma } from '@/types'

type Modulo = {
  id: string
  modulo_slug: ModuloSlug
  ativo: boolean
  expira_em: string | null
}

type Props = {
  escolaId: string
  planoAtual: PlanoTipo
  modulos: Modulo[]
  assinatura: {
    valor_mensal: number
    dia_vencimento: number
    status: StatusAssinaturaPlataforma
    proximo_vencimento: string | null
    referencia_externa: string | null
  } | null
}

function diasParaExpirar(expiraEm: string): number {
  const diff = new Date(expiraEm).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ExpiracaoBadge({ expiraEm }: { expiraEm: string | null }) {
  if (!expiraEm) return <span className="text-xs text-muted-foreground">Sem expiração</span>
  const dias = diasParaExpirar(expiraEm)
  const data = new Date(expiraEm).toLocaleDateString('pt-BR')
  if (dias < 0) {
    return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Expirado</span>
  }
  if (dias <= 7) {
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Expira em {dias}d ({data})</span>
  }
  return <span className="text-xs text-muted-foreground">Expira {data}</span>
}

export default function EscolaSuperadminClient({ escolaId, planoAtual, modulos, assinatura }: Props) {
  const [plano, setPlano] = useState<PlanoTipo>(planoAtual)
  const [localModulos, setLocalModulos] = useState(modulos)
  // Track per-module expiry date inputs (keyed by modulo_slug)
  const [expiraInputs, setExpiraInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const m of modulos) {
      init[m.modulo_slug] = m.expira_em ? m.expira_em.slice(0, 10) : ''
    }
    return init
  })
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function onSalvarPlano() {
    setErro(null)
    setMsg(null)
    startTransition(async () => {
      const r = await atualizarPlanoEscolaSuperAdmin(escolaId, plano)
      if (r.error) setErro(r.error)
      else setMsg('Plano e módulos sincronizados com sucesso.')
    })
  }

  function onToggleModulo(slug: ModuloSlug, checked: boolean) {
    setErro(null)
    setMsg(null)
    // When disabling, clear expiry
    if (!checked) {
      setExpiraInputs((prev) => ({ ...prev, [slug]: '' }))
    }
    setLocalModulos((prev) => prev.map((m) => (m.modulo_slug === slug ? { ...m, ativo: checked, expira_em: checked ? m.expira_em : null } : m)))
    startTransition(async () => {
      const r = await atualizarModuloAvulsoSuperAdmin(escolaId, slug, checked, null)
      if (r.error) {
        setErro(r.error)
        // Revert
        setLocalModulos((prev) => prev.map((m) => (m.modulo_slug === slug ? { ...m, ativo: !checked } : m)))
      } else {
        setMsg(`Módulo ${slug} ${checked ? 'ativado' : 'desativado'}.`)
      }
    })
  }

  function onSalvarExpiracao(slug: ModuloSlug) {
    setErro(null)
    setMsg(null)
    const dateStr = expiraInputs[slug]
    // Convert YYYY-MM-DD to end-of-day UTC timestamptz or null
    const expiraEm = dateStr ? `${dateStr}T23:59:59Z` : null
    setLocalModulos((prev) => prev.map((m) => (m.modulo_slug === slug ? { ...m, expira_em: expiraEm } : m)))
    startTransition(async () => {
      const modulo = localModulos.find((m) => m.modulo_slug === slug)
      const r = await atualizarModuloAvulsoSuperAdmin(escolaId, slug, modulo?.ativo ?? true, expiraEm)
      if (r.error) setErro(r.error)
      else setMsg(`Expiração de ${slug} atualizada.`)
    })
  }

  async function onSalvarAssinatura(formData: FormData) {
    setErro(null)
    setMsg(null)
    const r = await salvarAssinaturaPlataforma(escolaId, formData)
    if (r.error) setErro(r.error)
    else setMsg('Assinatura da plataforma atualizada.')
  }

  return (
    <div className="space-y-6">
      {(erro || msg) && (
        <p className={`rounded-md border px-4 py-3 text-sm ${erro ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'}`}>
          {erro ?? msg}
        </p>
      )}

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">Plano SaaS</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48">
            <label className="mb-1 block text-sm">Plano</label>
            <select className="h-9 w-full rounded-md border px-3 text-sm" value={plano} onChange={(e) => setPlano(e.target.value as PlanoTipo)}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onSalvarPlano}
            disabled={isPending}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isPending ? 'Salvando...' : 'Salvar plano'}
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">Módulos por tenant</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Módulo ativo = habilitado E não expirado. Data de expiração é opcional.
        </p>
        <div className="space-y-2">
          {localModulos.map((m) => {
            const info = MODULO_INFO[m.modulo_slug]
            const label = info?.label ?? m.modulo_slug
            return (
              <div key={m.id} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      id={`modulo-${m.modulo_slug}`}
                      checked={m.ativo}
                      onChange={(e) => onToggleModulo(m.modulo_slug, e.target.checked)}
                      disabled={isPending}
                      className="h-4 w-4 accent-primary"
                    />
                    <label htmlFor={`modulo-${m.modulo_slug}`} className="cursor-pointer text-sm font-medium">
                      {label}
                    </label>
                  </div>
                  <ExpiracaoBadge expiraEm={m.expira_em} />
                </div>

                {m.ativo && (
                  <div className="mt-2 flex items-center gap-2 pl-6">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Expira em:</label>
                    <input
                      type="date"
                      value={expiraInputs[m.modulo_slug] ?? ''}
                      onChange={(e) => setExpiraInputs((prev) => ({ ...prev, [m.modulo_slug]: e.target.value }))}
                      disabled={isPending}
                      className="h-7 rounded border px-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => onSalvarExpiracao(m.modulo_slug)}
                      disabled={isPending}
                      className="h-7 rounded bg-muted px-2 text-xs font-medium hover:bg-muted/80 disabled:opacity-60"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">Faturamento da plataforma</h2>
        <form action={onSalvarAssinatura} className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Valor mensal (R$)</label>
            <input
              name="valor_mensal"
              type="number"
              step="0.01"
              min="0"
              defaultValue={assinatura?.valor_mensal ?? 0}
              className="h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Dia de vencimento</label>
            <input
              name="dia_vencimento"
              type="number"
              min="1"
              max="28"
              defaultValue={assinatura?.dia_vencimento ?? 10}
              className="h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Status</label>
            <select name="status" defaultValue={assinatura?.status ?? 'adimplente'} className="h-9 w-full rounded-md border px-3 text-sm">
              <option value="adimplente">Adimplente</option>
              <option value="atraso">Atraso</option>
              <option value="suspenso">Suspenso</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Próximo vencimento</label>
            <input name="proximo_vencimento" type="date" defaultValue={assinatura?.proximo_vencimento ?? ''} className="h-9 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Referência externa</label>
            <input name="referencia_externa" defaultValue={assinatura?.referencia_externa ?? ''} className="h-9 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Salvar faturamento</button>
          </div>
        </form>
      </section>
    </div>
  )
}
