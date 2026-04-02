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
  { value: '', label: 'Todos os tipos' },
  { value: 'permissao_matriz', label: 'Matriz de permissões' },
  { value: 'modulo_escola', label: 'Módulo da escola' },
  { value: 'plano_escola', label: 'Plano da escola' },
]

const TIPO_BADGE: Record<string, string> = {
  permissao_matriz: 'bg-blue-100 text-blue-700',
  modulo_escola: 'bg-orange-100 text-orange-700',
  plano_escola: 'bg-emerald-100 text-emerald-700',
}

function formatBool(v: boolean | null): string {
  if (v === null) return '—'
  return v ? '✓' : '✗'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const pageSize = 50

  const result = await listarAuditoriaPermissoes({
    escola_id: sp.escola_id?.trim() || undefined,
    ator_email: sp.ator_email?.trim() || undefined,
    tipo: sp.tipo?.trim() || undefined,
    data_inicio: sp.data_inicio?.trim() || undefined,
    data_fim: sp.data_fim?.trim() || undefined,
    page,
    pageSize,
  })

  const rows = result.rows ?? []
  const total = result.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (sp.escola_id) params.set('escola_id', sp.escola_id)
    if (sp.ator_email) params.set('ator_email', sp.ator_email)
    if (sp.tipo) params.set('tipo', sp.tipo)
    if (sp.data_inicio) params.set('data_inicio', sp.data_inicio)
    if (sp.data_fim) params.set('data_fim', sp.data_fim)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Auditoria de Permissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico de todas as alterações em permissões e módulos feitas pelo SuperAdmin.
        </p>
      </div>

      {result.error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      )}

      {/* Filters */}
      <form method="get" className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-5">
        <input
          name="ator_email"
          defaultValue={sp.ator_email ?? ''}
          placeholder="E-mail do ator"
          className="h-9 rounded-md border px-3 text-sm"
        />
        <select name="tipo" defaultValue={sp.tipo ?? ''} className="h-9 rounded-md border px-3 text-sm">
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          name="data_inicio"
          type="date"
          defaultValue={sp.data_inicio ?? ''}
          className="h-9 rounded-md border px-3 text-sm"
        />
        <input
          name="data_fim"
          type="date"
          defaultValue={sp.data_fim ?? ''}
          className="h-9 rounded-md border px-3 text-sm"
        />
        <div className="flex gap-2">
          <button type="submit" className="h-9 flex-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Filtrar
          </button>
          <a href="/superadmin/auditoria" className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted">
            Limpar
          </a>
        </div>
      </form>

      {/* Summary */}
      <p className="mb-2 text-sm text-muted-foreground">
        {total} {total === 1 ? 'entrada encontrada' : 'entradas encontradas'}
        {totalPages > 1 && ` — página ${page} de ${totalPages}`}
      </p>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhum registro de auditoria encontrado com os filtros aplicados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Data/hora</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Escola</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ator</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Módulo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Antes→Depois</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(r.criado_em)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_BADGE[r.tipo] ?? 'bg-muted text-muted-foreground'}`}>
                      {r.tipo.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r.escola_nome ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2 text-xs">{r.ator_email ?? '—'}</td>
                  <td className="px-4 py-2 text-xs">{r.modulo_slug ?? '—'}</td>
                  <td className="px-4 py-2 text-xs">{r.perfil ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-xs">
                    {r.tipo === 'plano_escola' ? (
                      <span className="text-muted-foreground">
                        {r.detalhes?.plano_novo ? String(r.detalhes.plano_novo) : '—'}
                      </span>
                    ) : (
                      <span>
                        <span className={r.valor_antes ? 'text-emerald-600' : 'text-destructive'}>{formatBool(r.valor_antes)}</span>
                        {' → '}
                        <span className={r.valor_depois ? 'text-emerald-600' : 'text-destructive'}>{formatBool(r.valor_depois)}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <a href={pageUrl(page - 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              ← Anterior
            </a>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a href={pageUrl(page + 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              Próxima →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
