'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

export type RelatoriosKpis = {
  mrr: number
  totalEscolas: number
  totalAtletas: number
  escolasAtivas: number
  escolasInadimplentes: number
  ticket_medio: number
  retencaoPct: number
}

export type MonthlySeries = {
  mes: string
  receita: number
  despesa: number
}

export type PlanoDist = {
  plano: string
  count: number
  mrr: number
}

export type EscolaPerf = {
  id: string
  nome: string
  plano: string
  estado: string | null
  atletas: number
  capacidade: number
  mensalidade: number
  status: string
  proximoVenc: string | null
  createdAt: string | null
}

export type CohortRow = {
  mes: string
  novas: number
  acumulado: number
  planos: string
}

export type RegionRow = {
  estado: string
  count: number
}

export type TicketSeriesRow = {
  mes: string
  ticket: number
}

export type ChurnSeriesRow = {
  mes: string
  total: number
  inativas: number
  percentual: number
}

export type StatusSeriesRow = {
  status: string
  count: number
}

const FALLBACK_PLAN_PRICE: Record<string, number> = {
  starter: 199,
  basic: 199,
  pro: 399,
  premium: 599,
  enterprise: 899,
}

function monthKey(dateIso: string) {
  return dateIso.slice(0, 7)
}

function summarizePlans(planos: string[]) {
  return [...new Set(planos)].join(', ')
}

export async function carregarRelatorios(): Promise<{
  error: string | null
  kpis?: RelatoriosKpis
  monthly?: MonthlySeries[]
  planoDist?: PlanoDist[]
  escolaPerf?: EscolaPerf[]
  cohort?: CohortRow[]
  regions?: RegionRow[]
  ticketSeries?: TicketSeriesRow[]
  churnSeries?: ChurnSeriesRow[]
  statusSeries?: StatusSeriesRow[]
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10)

  const [escolasRes, matriculasRes, fluxoRes, assinaturasRes] = await Promise.all([
    admin
      .from('escolas')
      .select('id, nome, estado, plano, ativo, created_at')
      .is('deleted_at', null),
    admin
      .from('matriculas')
      .select('escola_id, status')
      .is('deleted_at', null)
      .eq('status', 'ativa'),
    admin
      .from('fluxo_caixa_plataforma')
      .select('escola_id, data_lancamento, tipo, valor, status')
      .is('deleted_at', null)
      .gte('data_lancamento', startDate),
    admin
      .from('assinaturas_plataforma')
      .select('escola_id, status, valor_mensal, proximo_vencimento')
      .is('deleted_at', null),
  ])

  if (escolasRes.error || matriculasRes.error || fluxoRes.error || assinaturasRes.error) {
    return { error: 'Erro ao carregar relatórios.' }
  }

  const escolas = escolasRes.data ?? []
  const matriculas = matriculasRes.data ?? []
  const fluxoRows = fluxoRes.data ?? []
  const assinaturas = assinaturasRes.data ?? []

  const matriculasByEscola = new Map<string, number>()
  for (const row of matriculas) {
    if (!row.escola_id) continue
    matriculasByEscola.set(row.escola_id, (matriculasByEscola.get(row.escola_id) ?? 0) + 1)
  }

  const assinaturaByEscola = new Map(assinaturas.map((row) => [row.escola_id, row]))

  const escolaPerf: EscolaPerf[] = escolas.map((escola) => {
    const assinatura = assinaturaByEscola.get(escola.id)
    const mensalidade = Number(assinatura?.valor_mensal ?? FALLBACK_PLAN_PRICE[escola.plano ?? 'starter'] ?? 0)

    let status = escola.ativo ? 'ativa' : 'inativa'
    if (escola.ativo && assinatura?.status) {
      status = assinatura.status
    } else if (escola.ativo && !assinatura) {
      status = 'sem_assinatura'
    }

    return {
      id: escola.id,
      nome: escola.nome,
      plano: escola.plano ?? 'starter',
      estado: escola.estado,
      atletas: matriculasByEscola.get(escola.id) ?? 0,
      capacidade: 0,
      mensalidade,
      status,
      proximoVenc: assinatura?.proximo_vencimento ?? null,
      createdAt: escola.created_at ?? null,
    }
  })

  const escolasAtivas = escolaPerf.filter((row) => row.status !== 'inativa' && row.status !== 'cancelado')
  const escolasPagantes = escolaPerf.filter((row) => row.status === 'adimplente')
  const escolasInadimplentes = escolaPerf.filter((row) => row.status === 'inadimplente' || row.status === 'atraso')

  const mrr = escolasPagantes.reduce((sum, row) => sum + row.mensalidade, 0)
  const ticketMedio = escolasPagantes.length ? mrr / escolasPagantes.length : 0

  const kpis: RelatoriosKpis = {
    mrr,
    totalEscolas: escolaPerf.length,
    totalAtletas: matriculas.length,
    escolasAtivas: escolasAtivas.length,
    escolasInadimplentes: escolasInadimplentes.length,
    ticket_medio: ticketMedio,
    retencaoPct: escolaPerf.length ? Math.round((escolasAtivas.length / escolaPerf.length) * 100) : 0,
  }

  const now = new Date()
  const months: string[] = []
  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthly = months.map((mes) => {
    const rows = fluxoRows.filter((row) => monthKey(row.data_lancamento) === mes && row.status === 'realizado')
    return {
      mes,
      receita: rows.filter((row) => row.tipo === 'receita').reduce((sum, row) => sum + Number(row.valor ?? 0), 0),
      despesa: rows.filter((row) => row.tipo === 'despesa').reduce((sum, row) => sum + Number(row.valor ?? 0), 0),
    }
  })

  const ticketSeries: TicketSeriesRow[] = monthly.map((row) => ({
    mes: row.mes,
    ticket: escolasPagantes.length ? Math.round(row.receita / escolasPagantes.length) : 0,
  }))

  const planMap = new Map<string, { count: number; mrr: number }>()
  for (const escola of escolasAtivas) {
    const current = planMap.get(escola.plano) ?? { count: 0, mrr: 0 }
    current.count += 1
    current.mrr += escola.status === 'adimplente' ? escola.mensalidade : 0
    planMap.set(escola.plano, current)
  }

  const planoDist: PlanoDist[] = [...planMap.entries()].map(([plano, values]) => ({
    plano,
    count: values.count,
    mrr: values.mrr,
  }))

  const cohortMonths = [...new Set(escolaPerf.map((row) => row.createdAt).filter(Boolean).map((row) => monthKey(row!)))].sort()
  let acumulado = 0
  const cohort: CohortRow[] = cohortMonths.map((mes) => {
    const schools = escolaPerf.filter((row) => row.createdAt && monthKey(row.createdAt) === mes)
    acumulado += schools.length
    return {
      mes,
      novas: schools.length,
      acumulado,
      planos: summarizePlans(schools.map((row) => row.plano)),
    }
  })

  const churnSeries: ChurnSeriesRow[] = cohortMonths.map((mes) => {
    const schools = escolaPerf.filter((row) => row.createdAt && monthKey(row.createdAt) === mes)
    const inativas = schools.filter((row) => row.status === 'inativa' || row.status === 'cancelado').length
    return {
      mes,
      total: schools.length,
      inativas,
      percentual: schools.length ? Math.round((inativas / schools.length) * 100) : 0,
    }
  })

  const regionMap = new Map<string, number>()
  for (const escola of escolasAtivas) {
    const key = escola.estado ?? 'N/D'
    regionMap.set(key, (regionMap.get(key) ?? 0) + 1)
  }

  const regions: RegionRow[] = [...regionMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([estado, count]) => ({ estado, count }))

  const statusMap = new Map<string, number>()
  for (const escola of escolaPerf) {
    statusMap.set(escola.status, (statusMap.get(escola.status) ?? 0) + 1)
  }

  const statusSeries: StatusSeriesRow[] = [...statusMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ status, count }))

  return {
    error: null,
    kpis,
    monthly,
    planoDist,
    escolaPerf,
    cohort,
    regions,
    ticketSeries,
    churnSeries,
    statusSeries,
  }
}
