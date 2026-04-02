import { listarNotificacoesPais } from '@/lib/pais-actions'
import { getEventoNotificacaoLabel } from '@/lib/notification-labels'

export default async function PaisNotificacoesPage() {
  const result = await listarNotificacoesPais()

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Notificacoes</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Exibindo notificações da escola ativa:{' '}
        <span className="font-medium text-foreground">
          {result.escolaAtivaNome ?? 'Escola selecionada'}
        </span>
        .
      </p>

      {result.error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Mensagem</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {(result.rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sem notificacoes.
                </td>
              </tr>
            )}

            {(result.rows ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-4 py-3">{getEventoNotificacaoLabel(row.evento_tipo)}</td>
                <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
                  {row.mensagem ?? '-'}
                </td>
                <td className="px-4 py-3">{row.canal}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  {new Date(row.created_at).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
