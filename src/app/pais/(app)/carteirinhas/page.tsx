import CarteirinhasPrintButton from '@/components/pais/carteirinhas-print-button'
import { listarCarteirinhasPais } from '@/lib/pais-actions'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export default async function PaisCarteirinhasPage() {
  const result = await listarCarteirinhasPais()

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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Carteirinhas dos atletas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use no celular ou imprima para a escola utilizar nas operações presenciais em{' '}
            <span className="font-medium text-foreground">
              {result.escolaAtivaNome ?? 'sua escola ativa'}
            </span>
            .
          </p>
        </div>
        <CarteirinhasPrintButton />
      </div>

      {(result.rows ?? []).length === 0 ? (
        <div className="mt-6 rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Nenhuma carteirinha disponível no momento.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(result.rows ?? []).map((row) => (
            <article
              key={row.carteirinha_id}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm print:break-inside-avoid"
            >
              <div className="bg-[#20c997] px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] opacity-85">Esportes Academy</p>
                <h2 className="mt-2 text-xl font-semibold">{row.atleta_nome}</h2>
                <p className="mt-1 text-sm opacity-90">{row.escola_nome}</p>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Nascimento
                      </p>
                      <p className="font-medium">{formatDate(row.data_nascimento)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Turma</p>
                      <p className="font-medium">{row.turma_nome ?? 'Sem turma'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{row.status_matricula}</p>
                    </div>
                  </div>

                  <div
                    className="h-[180px] w-[180px] rounded-xl border bg-white p-2"
                    dangerouslySetInnerHTML={{ __html: row.qr_svg }}
                  />
                </div>

                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Código da carteirinha
                  </p>
                  <p className="mt-1 break-all font-mono text-xs">{row.qr_token}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
