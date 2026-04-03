import { listarAuditoriaPermissoes } from '@/lib/superadmin-actions'

type SearchParams = {
  escola_id?: string
  ator_email?: string
  tipo?: string
  data_inicio?: string
  data_fim?: string
  page?: string
}

const TIPOS = [
  { value: '',                 label: 'Todos os tipos'       },
  { value: 'permissao_matriz', label: 'Matriz de permissões' },
  { value: 'modulo_escola',    label: 'Módulo da escola'     },
  { value: 'plano_escola',     label: 'Plano da escola'      },
]

const TIPO_BADGE: Record<string, { cls: string; label: string }> = {
  permissao_matriz: { cls: 'bg-indigo-100 text-indigo-700', label: 'Permissão'  },
  modulo_escola:    { cls: 'bg-amber-100 text-amber-700',   label: 'Módulo'     },
  plano_escola:     { cls: 'bg-emerald-100 text-emerald-700', label: 'Plano'    },
}

function fmtBool(v: boolean | null): { text: string; cls: string } {
  if (v === null) return { text: '—', cls: 'text-[#94a3b8]' }
  return v
    ? { text: '✓', cls: 'font-bold text-emerald-600' }
    : { text: '✗', cls: 'font-bold text-red-500' }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp       = await searchParams
  const page     = Math.max(1, Number(sp.page ?? '1') || 1)
  const pageSize = 50

  const result = await listarAuditoriaPermissoes({
    escola_id:   sp.escola_id?.trim()   || undefined,
    ator_email:  sp.ator_email?.trim()  || undefined,
    tipo:        sp.tipo?.trim()        || undefined,
    data_inicio: sp.data_inicio?.trim() || undefined,
    data_fim:    sp.data_fim?.trim()    || undefined,
    page,
    pageSize,
  })

  const rows       = result.rows ?? []
  const total      = result.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilter  = !!(sp.ator_email || sp.tipo || sp.data_inicio || sp.data_fim)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (sp.escola_id)   params.set('escola_id',   sp.escola_id)
    if (sp.ator_email)  params.set('ator_email',  sp.ator_email)
    if (sp.tipo)        params.set('tipo',        sp.tipo)
    if (sp.data_inicio) params.set('data_inicio', sp.data_inicio)
    if (sp.data_fim)    params.set('data_fim',    sp.data_fim)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#0f172a]">Auditoria de Permissões</h1>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Histórico de todas as alterações em permissões e módulos feitas pelo SuperAdmin.
        </p>
      </div>

      {result.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Filter bar */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4"
      >
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <span className="text-[13px] text-[#94a3b8]">👤</span>
          <input
            name="ator_email"
            defaultValue={sp.ator_email ?? ''}
            placeholder="E-mail do ator..."
            className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </div>

        <select
          name="tipo"
          defaultValue={sp.tipo ?? ''}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          name="data_inicio"
          type="date"
          defaultValue={sp.data_inicio ?? ''}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
        />

        <input
          name="data_fim"
          type="date"
          defaultValue={sp.data_fim ?? ''}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
        />

        <button
          type="submit"
          className="h-10 rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
        >
          Filtrar
        </button>

        {hasFilter && (
          <a
            href="/superadmin/auditoria"
            className="flex h-10 items-center rounded-xl border border-[#e2e8f0] px-4 text-sm text-[#64748b] transition hover:bg-[#f8fafc]"
          >
            Limpar
          </a>
        )}
      </form>

      {/* Summary */}
      <p className="text-sm text-[#64748b]">
        {total} {total === 1 ? 'entrada encontrada' : 'entradas encontradas'}
        {totalPages > 1 && ` — página ${page} de ${totalPages}`}
      </p>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white px-6 py-14 text-center text-sm text-[#94a3b8]">
          Nenhum registro de auditoria encontrado com os filtros aplicados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Data/hora</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Tipo</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Escola</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Ator</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Módulo</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Perfil</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#64748b]">Antes → Depois</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const badge = TIPO_BADGE[r.tipo] ?? { cls: 'bg-slate-100 text-slate-600', label: r.tipo }
                const antes  = fmtBool(r.valor_antes)
                const depois = fmtBool(r.valor_depois)
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-[#94a3b8]">
                      {fmtDate(r.criado_em)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#0f172a]">
                      {r.escola_nome ?? <span className="text-[#94a3b8]">Plataforma</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#64748b]">
                      {r.ator_email ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#64748b]">
                      {r.modulo_slug ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#64748b]">
                      {r.perfil ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-xs">
                      {r.tipo === 'plano_escola' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {r.detalhes?.plano_novo ? String(r.detalhes.plano_novo) : '—'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className={antes.cls}>{antes.text}</span>
                          <span className="text-[#94a3b8]">→</span>
                          <span className={depois.cls}>{depois.text}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={pageUrl(page - 1)}
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-medium transition hover:bg-[#f8fafc]"
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={pageUrl(page + 1)}
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-medium transition hover:bg-[#f8fafc]"
              >
                Próxima →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
