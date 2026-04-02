import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { carregarResumoAcessosEscola } from '@/lib/atleta-acesso-actions'
import AcessosPageClient from '@/components/escola/acessos-page-client'

export default async function PainelAcessosPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/')

  const result = await carregarResumoAcessosEscola(ctx.escolaId)

  if (result.error || !result.summary) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error ?? 'Erro ao carregar acessos.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Acessos dos atletas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre entrada e saída por QR Code e acompanhe quem está na unidade.
        </p>
      </div>

      <AcessosPageClient
        escolaId={result.summary.escolaId}
        checkinAtivo={result.summary.checkinAtivo}
        presentesAgora={result.summary.presentesAgora}
        rows={result.summary.rows}
      />
    </div>
  )
}
