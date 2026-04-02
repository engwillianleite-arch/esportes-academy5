import Link from 'next/link'
import { listarEscolasSuperAdmin } from '@/lib/superadmin-actions'

type SearchParams = {
  q?: string
  plano?: 'todos' | 'starter' | 'pro' | 'enterprise'
  ativo?: 'todos' | 'ativo' | 'inativo'
  page?: string
}

export default async function SuperadminEscolasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const q = sp.q?.trim() ?? ''
  const plano = (sp.plano ?? 'todos') as 'todos' | 'starter' | 'pro' | 'enterprise'
  const ativo = (sp.ativo ?? 'todos') as 'todos' | 'ativo' | 'inativo'

  const result = await listarEscolasSuperAdmin({ q, plano, ativo, page, pageSize: 20 })
  const rows = result.rows ?? []
  const total = result.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">SuperAdmin · Escolas</h1>

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4" method="get">
        <input name="q" defaultValue={q} placeholder="Nome, CNPJ ou e-mail" className="h-9 rounded-md border px-3 text-sm md:col-span-2" />
        <select name="plano" defaultValue={plano} className="h-9 rounded-md border px-3 text-sm">
          <option value="todos">Todos os planos</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select name="ativo" defaultValue={ativo} className="h-9 rounded-md border px-3 text-sm">
          <option value="todos">Ativo e inativo</option>
          <option value="ativo">Só ativos</option>
          <option value="inativo">Só inativos</option>
        </select>
        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filtrar</button>
          <Link href="/superadmin/escolas" className="h-9 rounded-md border px-4 text-sm font-medium inline-flex items-center">Limpar</Link>
        </div>
      </form>

      {result.error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{result.error}</p>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Escola</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criada em</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhuma escola encontrada.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/80">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.nome}</p>
                  <p className="text-xs text-muted-foreground">{r.email ?? 'Sem e-mail'} · {r.cnpj ?? 'Sem CNPJ'}</p>
                </td>
                <td className="px-4 py-3 capitalize">{r.plano}</td>
                <td className="px-4 py-3">{r.ativo ? 'Ativa' : 'Inativa'}</td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">
                  <Link className="text-primary underline underline-offset-2" href={`/superadmin/escolas/${r.id}`}>
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>Página {page} de {totalPages} · {total} escolas</p>
        <div className="flex gap-2">
          <Link
            className={`rounded-md border px-3 py-1.5 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            href={`/superadmin/escolas?q=${encodeURIComponent(q)}&plano=${plano}&ativo=${ativo}&page=${Math.max(1, page - 1)}`}
          >Anterior</Link>
          <Link
            className={`rounded-md border px-3 py-1.5 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            href={`/superadmin/escolas?q=${encodeURIComponent(q)}&plano=${plano}&ativo=${ativo}&page=${Math.min(totalPages, page + 1)}`}
          >Próxima</Link>
        </div>
      </div>
    </div>
  )
}
