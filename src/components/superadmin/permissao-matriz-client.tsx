'use client'

import { useState, useTransition } from 'react'
import { atualizarPermissaoMatriz } from '@/lib/superadmin-actions'
import { MODULO_INFO } from '@/lib/modulo-info'
import type { PermissaoMatrizRow } from '@/lib/superadmin-actions'

const PERFIS = [
  { key: 'admin_escola', label: 'Admin' },
  { key: 'coordenador',  label: 'Coord.' },
  { key: 'professor',    label: 'Prof.' },
  { key: 'financeiro',   label: 'Financ.' },
  { key: 'secretaria',   label: 'Secret.' },
  { key: 'saude',        label: 'Saúde' },
  { key: 'marketing',    label: 'Mktg.' },
] as const

type Props = {
  matrizInicial: PermissaoMatrizRow[]
}

export default function PermissaoMatrizClient({ matrizInicial }: Props) {
  const [matriz, setMatriz] = useState<PermissaoMatrizRow[]>(matrizInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function getAtivo(moduloSlug: string, perfil: string): boolean {
    return matriz.find((r) => r.modulo_slug === moduloSlug && r.perfil === perfil)?.ativo ?? false
  }

  function onToggle(moduloSlug: string, perfil: string, checked: boolean) {
    setErro(null)
    setMsg(null)

    // Optimistic update
    setMatriz((prev) =>
      prev.map((r) =>
        r.modulo_slug === moduloSlug && r.perfil === perfil ? { ...r, ativo: checked } : r
      )
    )

    startTransition(async () => {
      const r = await atualizarPermissaoMatriz(moduloSlug, perfil, checked)
      if (r.error) {
        // Revert on error
        setMatriz((prev) =>
          prev.map((row) =>
            row.modulo_slug === moduloSlug && row.perfil === perfil
              ? { ...row, ativo: !checked }
              : row
          )
        )
        setErro(r.error)
      } else {
        setMsg(`Permissão atualizada: ${moduloSlug} × ${perfil} → ${checked ? 'liberado' : 'bloqueado'}.`)
      }
    })
  }

  return (
    <div className="space-y-4">
      {(erro || msg) && (
        <p
          className={`rounded-md border px-4 py-3 text-sm ${
            erro
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'
          }`}
        >
          {erro ?? msg}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Módulo</th>
              {PERFIS.map((p) => (
                <th key={p.key} className="px-3 py-3 text-center font-medium text-muted-foreground">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(MODULO_INFO).map(([slug, info], idx) => (
              <tr key={slug} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-4 py-2 font-medium">{info.label}</td>
                {PERFIS.map((p) => {
                  const isChecked = getAtivo(slug, p.key)
                  const isGuarded = slug === 'administrativo' && p.key === 'admin_escola'
                  return (
                    <td key={p.key} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPending || isGuarded}
                        onChange={(e) => onToggle(slug, p.key, e.target.checked)}
                        title={isGuarded ? 'Acesso obrigatório — não pode ser removido' : undefined}
                        className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="text-xs text-muted-foreground">Salvando alteração...</p>
      )}
    </div>
  )
}
