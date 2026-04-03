'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssinaturaRow = {
  id: string
  escola_id: string
  escola_nome: string
  escola_cidade: string | null
  escola_estado: string | null
  plano: string
  status: string
  valor_mensal: number
  dia_vencimento: number
  proximo_vencimento: string | null
  referencia_externa: string | null
  created_at: string
  total_matriculas: number
}

export type KpiPlanos = {
  mrr: number
  arr: number
  licencas_ativas: number
  ticket_medio: number
  distribuicao: Record<string, { count: number; mrr: number }>
  em_atraso: number
  trial: number
}

export type RenovacaoRow = {
  escola_id: string
  escola_nome: string
  plano: string
  valor_mensal: number
  proximo_vencimento: string
  status: string
}

// ─── Listar assinaturas ───────────────────────────────────────────────────────

export async function listarAssinaturas(params?: {
  q?: string
  plano?: string
  status?: string
}): Promise<{ error: string | null; rows?: AssinaturaRow[]; kpi?: KpiPlanos; renovacoes?: RenovacaoRow[] }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Escolas + assinaturas + matrículas
  const { data: escolas } = await admin
    .from('escolas')
    .select('id, nome, cidade, estado, plano, ativo')
    .is('deleted_at', null)

  const { data: assinaturas } = await admin
    .from('assinaturas_plataforma')
    .select('id, escola_id, status, valor_mensal, dia_vencimento, proximo_vencimento, referencia_externa, created_at')
    .is('deleted_at', null)

  const { data: matriculas } = await admin
    .from('matriculas')
    .select('escola_id')
    .is('deleted_at', null)

  const escolaMap = new Map((escolas ?? []).map(e => [e.id, e]))
  const assMap    = new Map((assinaturas ?? []).map(a => [a.escola_id, a]))
  const matCount  = new Map<string, number>()
  for (const m of matriculas ?? []) {
    matCount.set(m.escola_id, (matCount.get(m.escola_id) ?? 0) + 1)
  }

  // Build rows — uma linha por escola que tem assinatura
  let rows: AssinaturaRow[] = []
  for (const ass of assinaturas ?? []) {
    const escola = escolaMap.get(ass.escola_id)
    if (!escola) continue
    rows.push({
      id:                 ass.id,
      escola_id:          ass.escola_id,
      escola_nome:        escola.nome,
      escola_cidade:      escola.cidade,
      escola_estado:      escola.estado,
      plano:              escola.plano,
      status:             ass.status,
      valor_mensal:       Number(ass.valor_mensal ?? 0),
      dia_vencimento:     ass.dia_vencimento,
      proximo_vencimento: ass.proximo_vencimento,
      referencia_externa: ass.referencia_externa,
      created_at:         ass.created_at,
      total_matriculas:   matCount.get(ass.escola_id) ?? 0,
    })
  }

  // Escolas SEM assinatura também aparecem (plano vem da escola)
  for (const escola of escolas ?? []) {
    if (assMap.has(escola.id)) continue
    rows.push({
      id:                 escola.id,
      escola_id:          escola.id,
      escola_nome:        escola.nome,
      escola_cidade:      escola.cidade,
      escola_estado:      escola.estado,
      plano:              escola.plano,
      status:             escola.ativo ? 'sem_assinatura' : 'inativa',
      valor_mensal:       0,
      dia_vencimento:     5,
      proximo_vencimento: null,
      referencia_externa: null,
      created_at:         '',
      total_matriculas:   matCount.get(escola.id) ?? 0,
    })
  }

  // Filtros
  const q = params?.q?.toLowerCase().trim()
  if (q) rows = rows.filter(r => r.escola_nome.toLowerCase().includes(q) || (r.escola_cidade ?? '').toLowerCase().includes(q))
  if (params?.plano && params.plano !== 'todos') rows = rows.filter(r => r.plano === params.plano)
  if (params?.status && params.status !== 'todos') rows = rows.filter(r => r.status === params.status)

  // KPI
  const ativas       = rows.filter(r => r.status === 'adimplente')
  const emAtraso     = rows.filter(r => r.status === 'atraso' || r.status === 'inadimplente')
  const trialRows    = rows.filter(r => r.status === 'trial')
  const mrr          = ativas.reduce((s, r) => s + r.valor_mensal, 0)
  const distribuicao: Record<string, { count: number; mrr: number }> = {}
  for (const r of rows.filter(r => r.status === 'adimplente')) {
    if (!distribuicao[r.plano]) distribuicao[r.plano] = { count: 0, mrr: 0 }
    distribuicao[r.plano].count++
    distribuicao[r.plano].mrr += r.valor_mensal
  }

  const kpi: KpiPlanos = {
    mrr,
    arr: mrr * 12,
    licencas_ativas: ativas.length,
    ticket_medio: ativas.length ? Math.round(mrr / ativas.length) : 0,
    distribuicao,
    em_atraso: emAtraso.length,
    trial: trialRows.length,
  }

  // Próximas renovações (próximos 30 dias)
  const hoje   = new Date()
  const limite = new Date(); limite.setDate(limite.getDate() + 30)
  const renovacoes: RenovacaoRow[] = rows
    .filter(r => r.proximo_vencimento && new Date(r.proximo_vencimento) <= limite)
    .sort((a, b) => (a.proximo_vencimento ?? '') < (b.proximo_vencimento ?? '') ? -1 : 1)
    .slice(0, 8)
    .map(r => ({
      escola_id:          r.escola_id,
      escola_nome:        r.escola_nome,
      plano:              r.plano,
      valor_mensal:       r.valor_mensal,
      proximo_vencimento: r.proximo_vencimento!,
      status:             r.status,
    }))

  void hoje // suppress unused warning

  return { error: null, rows, kpi, renovacoes }
}

// ─── Atribuir / atualizar plano ───────────────────────────────────────────────

export async function atribuirPlano(
  escolaId: string,
  plano: string,
  valorMensal: number,
  diaVencimento: number,
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Atualiza plano na escola
  await admin.from('escolas').update({ plano }).eq('id', escolaId)

  // Upsert assinatura
  const { data: existing } = await admin
    .from('assinaturas_plataforma')
    .select('id')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('assinaturas_plataforma')
      .update({ valor_mensal: valorMensal, dia_vencimento: diaVencimento, status: 'adimplente' })
      .eq('id', existing.id)
    if (error) return { error: 'Erro ao atualizar assinatura.' }
  } else {
    const { error } = await admin
      .from('assinaturas_plataforma')
      .insert({ escola_id: escolaId, valor_mensal: valorMensal, dia_vencimento: diaVencimento, status: 'adimplente' })
    if (error) return { error: 'Erro ao criar assinatura.' }
  }

  return { error: null }
}

// ─── Cancelar / suspender assinatura ─────────────────────────────────────────

export async function atualizarStatusAssinatura(
  assinaturaId: string,
  status: 'adimplente' | 'inadimplente' | 'atraso' | 'suspenso' | 'cancelado',
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('assinaturas_plataforma')
    .update({ status })
    .eq('id', assinaturaId)
    .is('deleted_at', null)

  if (error) return { error: 'Erro ao atualizar status.' }
  return { error: null }
}
