import { listarAssinaturasPlataforma } from '@/lib/superadmin-actions'

export default async function SuperadminFaturamentoPage() {
  const result = await listarAssinaturasPlataforma()
  const rows = result.rows ?? []

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">SuperAdmin · Faturamento da plataforma</h1>

      {result.error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Escola</th>
              <th className="px-4 py-3 font-medium">Valor mensal</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Próx. venc.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Sem registros de assinatura.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/80">
                <td className="px-4 py-3 font-medium">{r.escola_nome}</td>
                <td className="px-4 py-3">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor_mensal)}</td>
                <td className="px-4 py-3">Dia {r.dia_vencimento}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3">{r.proximo_vencimento ? new Date(r.proximo_vencimento).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
