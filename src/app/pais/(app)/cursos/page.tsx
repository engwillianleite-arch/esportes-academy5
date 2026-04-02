import { listarCursosDisponiveisResponsavel, marcarAulaCursoConcluidaResponsavel } from '@/lib/curso-actions'

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

export default async function PaisCursosPage() {
  const result = await listarCursosDisponiveisResponsavel()

  if (result.error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      </div>
    )
  }

  const rows = result.rows ?? []

  async function actionConcluirAula(formData: FormData) {
    'use server'
    await marcarAulaCursoConcluidaResponsavel(formData)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Cursos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe os cursos liberados para o contexto ativo e marque o progresso das aulas concluídas.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cursos liberados</p>
          <p className="text-2xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cursos concluídos</p>
          <p className="text-2xl font-semibold">{rows.filter((row) => row.status === 'concluido').length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Por assinatura</p>
          <p className="text-2xl font-semibold">{rows.filter((row) => row.origem_acesso === 'assinatura').length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {rows.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
            Nenhum curso disponível para este responsável no contexto atual.
          </div>
        )}

        {rows.map((curso) => (
          <section key={curso.curso_id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{curso.titulo}</h2>
                <p className="text-sm text-muted-foreground">{curso.descricao ?? 'Sem descrição do curso.'}</p>
              </div>
              <div className="text-sm text-muted-foreground md:text-right">
                <p className="capitalize">Acesso: {curso.origem_acesso.replace('_', ' ')}</p>
                <p className="capitalize">Status: {curso.status}{curso.aprovado ? ' · aprovado' : ''}</p>
                <p>Última atividade: {formatDateTime(curso.ultima_atividade_em)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Progresso do curso</span>
                <span className="font-medium">{curso.progresso_pct.toFixed(2)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(curso.progresso_pct, 100)}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {curso.modulos.length === 0 && (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Estrutura pedagógica ainda não publicada para este curso.
                </div>
              )}

              {curso.modulos.map((modulo) => (
                <div key={modulo.id} className="rounded-xl border p-4">
                  <h3 className="font-medium">{modulo.ordem}. {modulo.titulo}</h3>
                  <div className="mt-3 space-y-3">
                    {modulo.aulas.length === 0 && (
                      <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                        Nenhuma aula publicada neste módulo.
                      </div>
                    )}
                    {modulo.aulas.map((aula) => (
                      <div key={aula.id} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">{modulo.ordem}.{aula.ordem} {aula.titulo}</p>
                          <p className="text-sm text-muted-foreground">{aula.descricao ?? 'Sem descrição da aula.'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {aula.concluida ? `Concluída em ${formatDateTime(aula.concluida_em)}` : 'Ainda não concluída'}
                          </p>
                        </div>
                        <form action={actionConcluirAula}>
                          <input type="hidden" name="aula_id" value={aula.id} />
                          <button
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                            disabled={aula.concluida}
                          >
                            {aula.concluida ? 'Aula concluída' : 'Marcar como concluída'}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
