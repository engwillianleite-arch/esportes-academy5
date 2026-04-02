import { carregarJornadaGlobalPais } from '@/lib/pais-actions'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

export default async function PaisJornadaPage() {
  const result = await carregarJornadaGlobalPais()

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
      <h1 className="text-2xl font-semibold">Jornada global dos atletas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe a linha do tempo esportiva e clínica dos atletas vinculados, incluindo
        passagens por escolas, acessos e registros de saúde já cadastrados.
      </p>

      {(result.atletas ?? []).length === 0 ? (
        <div className="mt-6 rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Nenhum atleta vinculado para exibir jornada.
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          {(result.atletas ?? []).map((atleta) => (
            <section key={atleta.atleta_id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{atleta.atleta_nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    Nascimento {formatDate(atleta.data_nascimento)} • Último evento{' '}
                    {formatDateTime(atleta.ultimo_evento_em)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Escolas</p>
                  <p className="text-2xl font-semibold">{atleta.escolas_count}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Matrículas</p>
                  <p className="text-2xl font-semibold">{atleta.matriculas_count}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Presenças registradas</p>
                  <p className="text-2xl font-semibold">{atleta.presencas_total}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Presenças confirmadas</p>
                  <p className="text-2xl font-semibold">{atleta.presentes_total}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-xl border p-4">
                  <h3 className="text-base font-semibold">Linha do tempo</h3>
                  <div className="mt-4 space-y-3">
                    {atleta.timeline.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sem eventos disponíveis para este atleta.
                      </p>
                    )}
                    {atleta.timeline.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{item.titulo}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(item.data)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.resumo}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.escola_nome ?? 'Escola não identificada'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <h3 className="text-base font-semibold">Módulos da jornada</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="font-medium">Competições</p>
                      <p className="mt-1 text-muted-foreground">
                        {atleta.modulos_futuros.competicoes.total} registros agora. Histórico
                        detalhado será expandido quando o módulo estiver ativo.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="font-medium">Exames e atestados</p>
                      <p className="mt-1 text-muted-foreground">
                        {atleta.modulos_futuros.exames.total} registros já fazem parte da jornada
                        clínica deste atleta.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="font-medium">Treinos</p>
                      <p className="mt-1 text-muted-foreground">
                        {atleta.modulos_futuros.treinos.total} registros agora. Resumo de treinos
                        e evolução aparecerá conforme o módulo for implantado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
