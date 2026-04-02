import { listarPresencasPais } from '@/lib/pais-actions'

function fmt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export default async function PaisPresencasPage() {
  const r = await listarPresencasPais()
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Presenças</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Exibindo presenças da escola ativa:{' '}
        <span className="font-medium text-foreground">{r.escolaAtivaNome ?? 'Escola selecionada'}</span>.
      </p>
      {r.error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{r.error}</p>}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Atleta</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Data da aula</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(r.rows ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sem registros.</td></tr>
            )}
            {(r.rows ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-4 py-3 font-medium">{row.atleta_nome}</td>
                <td className="px-4 py-3">{row.turma_nome}</td>
                <td className="px-4 py-3">{fmt(row.data_aula)}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
