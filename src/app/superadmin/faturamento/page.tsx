import FluxoCaixaClient from '@/components/superadmin/fluxo-caixa-client'
import {
  listarFluxoCaixa,
  getKpiFluxo,
  getAggregatosMensais,
} from '@/lib/fluxo-caixa-actions'

export default async function SuperadminFaturamentoPage() {
  const today  = new Date()
  const mesIni = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const mesFim = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [listResult, kpiResult, aggResult] = await Promise.all([
    listarFluxoCaixa({ data_inicio: mesIni, data_fim: mesFim, pageSize: 200 }),
    getKpiFluxo(),
    getAggregatosMensais(6),
  ])

  const rows       = listResult.rows ?? []
  const total      = listResult.total ?? 0
  const kpi        = kpiResult.kpi ?? { saldo_atual: 0, entradas_mes: 0, saidas_mes: 0, saldo_projetado: 0, mrr: 0 }
  const monthly    = aggResult.monthly ?? []
  const byCategoria = aggResult.byCategoria ?? { receitas: [], despesas: [] }

  return (
    <FluxoCaixaClient
      initialRows={rows}
      initialTotal={total}
      kpi={kpi}
      monthly={monthly}
      byCategoria={byCategoria}
    />
  )
}
