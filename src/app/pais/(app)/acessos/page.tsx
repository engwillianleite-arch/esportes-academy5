import { listarAcessosPais } from '@/lib/pais-actions'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

export default async function PaisAcessosPage() {
  const result = await listarAcessosPais()

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
      <h1 className="text-2xl font-semibold">Acessos dos atletas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Consulte entrada, saída e o status mais recente dos atletas vinculados em{' '}
        <span className="font-medium text-foreground">
          {result.escolaAtivaNome ?? 'sua escola ativa'}
        </span>
        .
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(result.currentStatus ?? []).length === 0 && (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Nenhum atleta vinculado para acompanhar.
          </div>
        )}

        {(result.currentStatus ?? []).map((row) => (
          <div key={row.atleta_id} className="rounded-lg border bg-card p-4">
            <p className="font-medium">{row.atleta_nome}</p>
            <p className="mt-2 text-sm text-muted-foreground">Status atual</p>
            <p
              className={`text-lg font-semibold ${
                row.status_atual === 'na_escola' ? 'text-green-600' : ''
              }`}
            >
              {row.status_atual === 'na_escola' ? 'Na escola' : 'Fora da escola'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Último evento:{' '}
              {row.ultimo_evento === 'check_in'
                ? 'check-in'
                : row.ultimo_evento === 'check_out'
                  ? 'check-out'
                  : 'nenhum'}{' '}
              em {formatDateTime(row.ultimo_evento_em)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Atleta</th>
              <th className="px-4 py-3 font-medium">Escola</th>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Data / hora</th>
            </tr>
          </thead>
          <tbody>
            {(result.rows ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum acesso registrado até o momento.
                </td>
              </tr>
            )}
            {(result.rows ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-4 py-3 font-medium">{row.atleta_nome}</td>
                <td className="px-4 py-3">{row.escola_nome}</td>
                <td className="px-4 py-3">
                  {row.tipo === 'check_in' ? 'Check-in' : 'Check-out'}
                </td>
                <td className="px-4 py-3">{formatDateTime(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
