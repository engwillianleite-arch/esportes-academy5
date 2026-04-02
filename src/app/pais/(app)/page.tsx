import Link from 'next/link'
import { carregarResumoPais } from '@/lib/pais-actions'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export default async function PaisHomePage() {
  const result = await carregarResumoPais()

  if (result.error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Olá, {result.responsavelNome}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe atletas, cobranças e notificações no contexto de{' '}
        <span className="font-medium text-foreground">{result.escolaAtivaNome ?? 'sua escola ativa'}</span>.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Atletas vinculados</p>
          <p className="text-2xl font-semibold">{result.atletas?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cobranças pendentes</p>
          <p className="text-2xl font-semibold">{result.financeiro?.pendentes ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cobranças vencidas</p>
          <p className="text-2xl font-semibold">{result.financeiro?.vencidas ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Atleta</th>
              <th className="px-4 py-3 font-medium">Escola</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Nascimento</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
            </tr>
          </thead>
          <tbody>
            {(result.atletas ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum atleta vinculado.</td>
              </tr>
            )}
            {(result.atletas ?? []).map((a) => (
              <tr key={a.atleta_id} className="border-b border-border/80">
                <td className="px-4 py-3 font-medium">{a.nome}</td>
                <td className="px-4 py-3">{a.escola_nome ?? '—'}</td>
                <td className="px-4 py-3">{a.turma_nome ?? 'Sem turma'}</td>
                <td className="px-4 py-3">{formatDate(a.data_nascimento)}</td>
                <td className="px-4 py-3 capitalize">{a.status_matricula ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-2">
        <Link href="/pais/cursos" className="rounded-md border px-4 py-2 text-sm font-medium">Ver cursos</Link>
        <Link href="/pais/jornada" className="rounded-md border px-4 py-2 text-sm font-medium">Ver jornada</Link>
        <Link href="/pais/presencas" className="rounded-md border px-4 py-2 text-sm font-medium">Ver presenças</Link>
        <Link href="/pais/financeiro" className="rounded-md border px-4 py-2 text-sm font-medium">Ver financeiro</Link>
        <Link href="/pais/notificacoes" className="rounded-md border px-4 py-2 text-sm font-medium">Ver notificações</Link>
      </div>
    </div>
  )
}
