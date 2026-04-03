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
  const [matriz, setMatriz]     = useState<PermissaoMatrizRow[]>(matrizInicial)
  const [erro, setErro]         = useState<string | null>(null)
  const [msg, setMsg]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function getAtivo(moduloSlug: string, perfil: string): boolean {
    return matriz.find((r) => r.modulo_slug === moduloSlug && r.perfil === perfil)?.ativo ?? false
  }

  function onToggle(moduloSlug: string, perfil: string, checked: boolean) {
    setErro(null)
    setMsg(null)

    setMatriz((prev) =>
      prev.map((r) =>
        r.modulo_slug === moduloSlug && r.perfil === perfil ? { ...r, ativo: checked } : r
      )
    )

    startTransition(async () => {
      const r = await atualizarPermissaoMatriz(moduloSlug, perfil, checked)
      if (r.error) {
        setMatriz((prev) =>
          prev.map((row) =>
            row.modulo_slug === moduloSlug && row.perfil === perfil
              ? { ...row, ativo: !checked }
              : row
          )
        )
        setErro(r.error)
      } else {
        setMsg(`${moduloSlug} × ${perfil} → ${checked ? 'liberado ✓' : 'bloqueado ✗'}`)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
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

      {/* Saving indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
          Salvando alteração...
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0] bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Módulo
              </th>
              {PERFIS.map((p) => (
                <th
                  key={p.key}
                  className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[#64748b]"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(MODULO_INFO).map(([slug, info], idx) => (
              <tr
                key={slug}
                className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'
                }`}
              >
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-[#0f172a]">{info.label}</span>
                </td>
                {PERFIS.map((p) => {
                  const isChecked = getAtivo(slug, p.key)
                  const isGuarded = slug === 'administrativo' && p.key === 'admin_escola'
                  return (
                    <td key={p.key} className="px-4 py-3.5 text-center">
                      {isGuarded ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#4f46e5]/10 text-[13px] text-[#4f46e5]"
                          title="Obrigatório — não pode ser removido"
                        >
                          🔒
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onToggle(slug, p.key, !isChecked)}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all disabled:opacity-50 ${
                            isChecked
                              ? 'border-[#4f46e5] bg-[#4f46e5] text-white'
                              : 'border-[#e2e8f0] bg-white text-transparent hover:border-[#4f46e5]/50'
                          }`}
                          title={isChecked ? 'Remover acesso' : 'Conceder acesso'}
                        >
                          <svg viewBox="0 0 12 10" width="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 5 4.5 8.5 11 1" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
