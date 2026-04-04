import type { Metadata } from 'next'
import { carregarRelatorios } from '@/lib/relatorios-actions'
import RelatoriosClient from '@/components/superadmin/relatorios-client'

export const metadata: Metadata = {
  title: 'Relatórios & Analytics — Esportes Academy',
}

export default async function SuperadminRelatoriosPage() {
  const result = await carregarRelatorios()

  return (
    <RelatoriosClient
      kpis={result.kpis ?? { mrr: 0, totalEscolas: 0, totalAtletas: 0, escolasAtivas: 0, escolasInadimplentes: 0, ticket_medio: 0, retencaoPct: 0 }}
      monthly={result.monthly ?? []}
      planoDist={result.planoDist ?? []}
      escolaPerf={result.escolaPerf ?? []}
      cohort={result.cohort ?? []}
      regions={result.regions ?? []}
      loadError={!!result.error}
    />
  )
}
