'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RelatoriosKpis = {
  mrr: number
  totalEscolas: number
  totalAtletas: number
  escolasAtivas: number
  escolasInadimplentes: number
  ticket_medio: number
  retencaoPct: number
}

export type MonthlySeries = { mes: string; receita: number; despesa: number }

export type PlanoDist = { plano: string; count: number; mrr: number }

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
}

export type CohortRow = { mes: string; novas: number; acumulado: number; planos: string }

export type RegionRow = { estado: string; count: number }

const PLANO_VALORES: Record<string, number> = {
  starter: 199,
  pro: 399,
  enterprise: 899,
}

// ─── Main loader ──────────────────────────────────────────────────────────────

export async function carregarRelatorios(): Promise<{
  error: string | null
  kpis?: RelatoriosKpis
  monthly?: MonthlySeries[]
  planoDist?: PlanoDist[]
  escolaPerf?: EscolaPerf[]
  cohort?: CohortRow[]
  regions?: RegionRow[]
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // ── Parallel fetch ────────────────────────────────────────────────────────
  const [escolasRes, matriculasRes, fluxoRes] = await Promise.all([
    admin
      .from('escolas')
      .select('id, nome, estado, plano, ativo, deleted_at, created_at')
      .is('deleted_at', null),
    admin
      .from('matriculas')
      .select('id, escola_id, status')
      .is('deleted_at', null)
      .eq('status', 'ativa'),
    admin
      .from('fluxo_caixa_plataforma')
      .select('data_lancamento, tipo, valor, status')
      .is('deleted_at', null)
      .eq('status', 'realizado')
      .gte('data_lancamento', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10)),
  ])

  const escolas  = escolasRes.data ?? []
  const atletas  = matriculasRes.data ?? []
  const fluxoRows = fluxoRes.data ?? []

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const escolasAtivas = escolas.filter(e => e.ativo)
  const mrr = escolasAtivas.reduce((s, e) => s + (PLANO_VALORES[e.plano ?? 'starter'] ?? 0), 0)
  const ticket_medio = escolasAtivas.length > 0 ? mrr / escolasAtivas.length : 0
  const escolasInadimplentes = 0 // placeholder — would need assinaturas table

  const kpis: RelatoriosKpis = {
    mrr,
    totalEscolas: escolas.length,
    totalAtletas: atletas.length,
    escolasAtivas: escolasAtivas.length,
    escolasInadimplentes,
    ticket_medio,
    retencaoPct: escolas.length > 0 ? Math.round((escolasAtivas.length / escolas.length) * 100) : 0,
  }

  // ── Monthly series (12 months) ────────────────────────────────────────────
  const now   = new Date()
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthly: MonthlySeries[] = months.map(mes => {
    const rows = fluxoRows.filter(r => r.data_lancamento?.slice(0, 7) === mes)
    return {
      mes,
      receita: rows.filter(r => r.tipo === 'receita').reduce((s, r) => s + (r.valor ?? 0), 0),
      despesa: rows.filter(r => r.tipo === 'despesa').reduce((s, r) => s + (r.valor ?? 0), 0),
    }
  })

  // ── Plan distribution ──────────────────────────────────────────────────────
  const planMap: Record<string, { count: number; mrr: number }> = {}
  for (const e of escolasAtivas) {
    const p = e.plano ?? 'starter'
    if (!planMap[p]) planMap[p] = { count: 0, mrr: 0 }
    planMap[p].count++
    planMap[p].mrr += PLANO_VALORES[p] ?? 0
  }
  const planoDist: PlanoDist[] = Object.entries(planMap).map(([plano, v]) => ({ plano, ...v }))

  // ── Escola performance ────────────────────────────────────────────────────
  const atletasByEscola: Record<string, number> = {}
  for (const a of atletas) {
    if (a.escola_id) atletasByEscola[a.escola_id] = (atletasByEscola[a.escola_id] ?? 0) + 1
  }

  const escolaPerf: EscolaPerf[] = escolas.slice(0, 50).map(e => ({
    id:           e.id,
    nome:         e.nome,
    plano:        e.plano ?? 'starter',
    estado:       e.estado,
    atletas:      atletasByEscola[e.id] ?? 0,
    capacidade:   0,
    mensalidade:  PLANO_VALORES[e.plano ?? 'starter'] ?? 0,
    status:       e.ativo ? 'ativa' : 'inativa',
    proximoVenc:  null,
  }))

  // ── Cohort (group escolas by month of creation) ────────────────────────────
  const cohortMap: Record<string, string[]> = {}
  for (const e of escolas) {
    const mes = (e.created_at ?? '').slice(0, 7)
    if (!mes) continue
    if (!cohortMap[mes]) cohortMap[mes] = []
    cohortMap[mes].push(e.plano ?? 'starter')
  }

  const sortedMeses = Object.keys(cohortMap).sort()
  let acum = 0
  const cohort: CohortRow[] = sortedMeses.slice(-12).map(mes => {
    const planos = cohortMap[mes]
    acum += planos.length
    const planosStr = [...new Set(planos)].join(', ')
    return { mes, novas: planos.length, acumulado: acum, planos: planosStr }
  })

  // ── Regions ───────────────────────────────────────────────────────────────
  const regionMap: Record<string, number> = {}
  for (const e of escolasAtivas) {
    const est = e.estado ?? 'N/D'
    regionMap[est] = (regionMap[est] ?? 0) + 1
  }
  const regions: RegionRow[] = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([estado, count]) => ({ estado, count }))

  return { error: null, kpis, monthly, planoDist, escolaPerf, cohort, regions }
}
