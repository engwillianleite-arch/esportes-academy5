import Link from 'next/link'
import { listarEscolasSuperAdmin } from '@/lib/superadmin-actions'

type SearchParams = {
  q?: string
  plano?: 'todos' | 'starter' | 'pro' | 'enterprise'
  ativo?: 'todos' | 'ativo' | 'inativo'
  page?: string
}

const PLANO_BADGE: Record<string, string> = {
  starter:    'bg-slate-100 text-slate-700',
  basic:      'bg-slate-100 text-slate-700',
  pro:        'bg-indigo-100 text-indigo-700',
  premium:    'bg-purple-100 text-purple-700',
  enterprise: 'bg-teal-100 text-teal-700',
}

const PLANO_LABEL: Record<string, string> = {
  starter:    'Starter',
  basic:      'Basic',
  pro:        'Pro',
  premium:    'Premium',
  enterprise: 'Enterprise',
}

export default async function SuperadminEscolasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const q    = sp.q?.trim() ?? ''
  const plano = (sp.plano ?? 'todos') as SearchParams['plano']
  const ativo = (sp.ativo ?? 'todos') as SearchParams['ativo']

  const result = await listarEscolasSuperAdmin({ q, plano, ativo, page, pageSize: 20 })
  const rows       = result.rows ?? []
  const total      = result.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))
  const ativas     = rows.filter((r) => r.ativo).length

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (plano !== 'todos') params.set('plano', plano!)
    if (ativo !== 'todos') params.set('ativo', ativo!)
    params.set('page', String(p))
    return `/superadmin/escolas?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Escolas</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Gerencie as escolas cadastradas na plataforma</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiChip label="Total de Escolas" value={total} />
        <KpiChip label="Mostrando" value={rows.length} />
        <KpiChip label="Ativas nesta página" value={ativas} />
        <KpiChip label="Páginas" value={totalPages} />
      </div>

      {/* Filter bar */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4"
      >
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <span className="text-[13px] text-[#94a3b8]">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nome, CNPJ ou e-mail..."
            className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </div>

        <select
          name="plano"
          defaultValue={plano}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
        >
          <option value="todos">Todos os planos</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          name="ativo"
          defaultValue={ativo}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]"
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Só ativas</option>
          <option value="inativo">Só inativas</option>
        </select>

        <button
          type="submit"
          className="h-10 rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
        >
          Filtrar
        </button>

        {(q || plano !== 'todos' || ativo !== 'todos') && (
          <Link
            href="/superadmin/escolas"
            className="flex h-10 items-center rounded-xl border border-[#e2e8f0] px-4 text-sm text-[#64748b] transition hover:bg-[#f8fafc]"
          >
            Limpar
          </Link>
        )}
      </form>

      {result.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Escola</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Plano</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Criada em</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-[#94a3b8]">
                  Nenhuma escola encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : rows.map((r, idx) => (
              <tr
                key={r.id}
                className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5]/10 text-sm font-bold text-[#4f46e5]">
                      {r.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f172a]">{r.nome}</p>
                      <p className="text-xs text-[#94a3b8]">{r.email ?? 'Sem e-mail'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLANO_BADGE[r.plano] ?? 'bg-slate-100 text-slate-700'}`}>
                    {PLANO_LABEL[r.plano] ?? r.plano}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${r.ativo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {r.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-[#64748b]">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/superadmin/escolas/${r.id}`}
                    className="rounded-lg bg-[#4f46e5]/10 px-3 py-1.5 text-xs font-semibold text-[#4f46e5] transition hover:bg-[#4f46e5] hover:text-white"
                  >
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            Página {page} de {totalPages} · {total} escola{total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageUrl(page - 1)}
              className={`rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-medium transition hover:bg-[#f8fafc] ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              ← Anterior
            </Link>
            <Link
              href={pageUrl(page + 1)}
              className={`rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-medium transition hover:bg-[#f8fafc] ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
            >
              Próxima →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3">
      <p className="text-xs text-[#94a3b8]">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-[#0f172a]">{value}</p>
    </div>
  )
}
