import EscolasClient from '@/components/superadmin/escolas-client'
import { listarEscolas } from '@/lib/escolas-actions'

export default async function SuperadminEscolasPage() {
  const result = await listarEscolas({ pageSize: 100 })

  const rows  = result.rows  ?? []
  const total = result.total ?? 0
  const kpi   = result.kpi   ?? { total: 0, ativas: 0, trial: 0, inativas: 0 }

  return (
    <EscolasClient
      initialRows={rows}
      initialTotal={total}
      initialKpi={kpi}
    />
  )
}
