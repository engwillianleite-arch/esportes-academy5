import PlanosClient from '@/components/superadmin/planos-client'
import { listarAssinaturas } from '@/lib/planos-actions'

export default async function SuperadminPlanosPage() {
  const result = await listarAssinaturas()

  const rows      = result.rows      ?? []
  const kpi       = result.kpi       ?? { mrr: 0, arr: 0, licencas_ativas: 0, ticket_medio: 0, distribuicao: {}, em_atraso: 0, trial: 0 }
  const renovacoes = result.renovacoes ?? []

  return (
    <PlanosClient
      initialRows={rows}
      initialKpi={kpi}
      initialRenovacoes={renovacoes}
    />
  )
}
