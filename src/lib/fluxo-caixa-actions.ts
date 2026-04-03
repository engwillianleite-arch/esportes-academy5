'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FluxoCaixaTipo       = 'receita' | 'despesa'
export type FluxoCaixaCategoria  =
  | 'mensalidade_escola' | 'percentual_vendas' | 'setup_fee'
  | 'upgrade_plano' | 'modulo_avulso' | 'outro_receita'
  | 'payroll' | 'infra_cloud' | 'marketing' | 'impostos_taxas'
  | 'ferramentas_saas' | 'servicos_externos' | 'outro_despesa'
export type FluxoCaixaStatus     = 'previsto' | 'realizado' | 'cancelado'
export type FluxoCaixaRecorrencia= 'unico' | 'mensal' | 'trimestral' | 'anual'
export type FormaPagamento       = 'asaas' | 'cartao_credito' | 'pix' | 'boleto' | 'manual' | 'debito'

export const CATEGORIAS_RECEITA: { value: FluxoCaixaCategoria; label: string }[] = [
  { value: 'mensalidade_escola', label: 'Mensalidade de Escola'  },
  { value: 'percentual_vendas',  label: '% sobre Vendas'         },
  { value: 'setup_fee',          label: 'Setup Fee'              },
  { value: 'upgrade_plano',      label: 'Upgrade de Plano'       },
  { value: 'modulo_avulso',      label: 'Módulo Avulso'          },
  { value: 'outro_receita',      label: 'Outro'                  },
]

export const CATEGORIAS_DESPESA: { value: FluxoCaixaCategoria; label: string }[] = [
  { value: 'payroll',            label: 'Payroll / Equipe'       },
  { value: 'infra_cloud',        label: 'Infraestrutura Cloud'   },
  { value: 'marketing',          label: 'Marketing'              },
  { value: 'impostos_taxas',     label: 'Impostos & Taxas'       },
  { value: 'ferramentas_saas',   label: 'Ferramentas SaaS'       },
  { value: 'servicos_externos',  label: 'Serviços Externos'      },
  { value: 'outro_despesa',      label: 'Outro'                  },
]

export const CATEGORIA_LABEL: Record<FluxoCaixaCategoria, string> = {
  mensalidade_escola: 'Mensalidade',
  percentual_vendas:  '% Vendas',
  setup_fee:          'Setup Fee',
  upgrade_plano:      'Upgrade Plano',
  modulo_avulso:      'Módulo Avulso',
  outro_receita:      'Outro',
  payroll:            'Payroll',
  infra_cloud:        'Infra Cloud',
  marketing:          'Marketing',
  impostos_taxas:     'Impostos',
  ferramentas_saas:   'Ferramentas SaaS',
  servicos_externos:  'Serviços Ext.',
  outro_despesa:      'Outro',
}

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  asaas:          'Asaas',
  cartao_credito: 'Cartão de Crédito',
  pix:            'Pix',
  boleto:         'Boleto',
  manual:         'Manual',
  debito:         'Débito',
}

export type LancamentoRow = {
  id:                  string
  tipo:                FluxoCaixaTipo
  categoria:           FluxoCaixaCategoria
  descricao:           string
  observacao:          string | null
  escola_id:           string | null
  escola_nome_cache:   string | null
  valor:               number
  data_lancamento:     string
  status:              FluxoCaixaStatus
  forma_pagamento:     FormaPagamento
  recorrencia:         FluxoCaixaRecorrencia
  percentual:          number | null
  base_calculo:        number | null
  ator_email:          string | null
  created_at:          string
}

export type KpiFluxo = {
  saldo_atual:      number  // soma realizados até hoje (receitas - despesas)
  entradas_mes:     number  // receitas realizadas no mês corrente
  saidas_mes:       number  // despesas realizadas no mês corrente
  saldo_projetado:  number  // saldo_atual + todos os previstos futuros
  mrr:              number  // receitas mensalidade_escola status adimplente (assinaturas ativas)
}

// ─── List / filter ────────────────────────────────────────────────────────────

type ListParams = {
  tipo?:       FluxoCaixaTipo | 'todos'
  categoria?:  FluxoCaixaCategoria | 'todas'
  status?:     FluxoCaixaStatus | 'todos'
  data_inicio?: string
  data_fim?:   string
  q?:          string
  page?:       number
  pageSize?:   number
}

export async function listarFluxoCaixa(params?: ListParams): Promise<{
  error: string | null
  rows?: LancamentoRow[]
  total?: number
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin    = createAdminClient()
  const page     = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(200, Math.max(20, params?.pageSize ?? 50))
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  let query = admin
    .from('fluxo_caixa_plataforma')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('data_lancamento', { ascending: false })
    .range(from, to)

  if (params?.tipo && params.tipo !== 'todos')           query = query.eq('tipo', params.tipo)
  if (params?.categoria && params.categoria !== 'todas') query = query.eq('categoria', params.categoria)
  if (params?.status && params.status !== 'todos')       query = query.eq('status', params.status)
  if (params?.data_inicio)                               query = query.gte('data_lancamento', params.data_inicio)
  if (params?.data_fim)                                  query = query.lte('data_lancamento', params.data_fim)
  if (params?.q?.trim()) {
    const q = params.q.trim()
    query = query.or(`descricao.ilike.%${q}%,escola_nome_cache.ilike.%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[listarFluxoCaixa]', error.message)
    return { error: 'Erro ao carregar lançamentos.' }
  }

  return {
    error: null,
    rows: (data ?? []).map(normalizeRow),
    total: count ?? 0,
  }
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getKpiFluxo(): Promise<{ error: string | null; kpi?: KpiFluxo }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const mesInicio = today.slice(0, 7) + '-01'
  const mesFim    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().slice(0, 10)

  // Todos os lançamentos ativos
  const { data: all } = await admin
    .from('fluxo_caixa_plataforma')
    .select('tipo, valor, status, data_lancamento, categoria')
    .is('deleted_at', null)

  const rows = (all ?? []) as Array<{
    tipo: string; valor: number; status: string; data_lancamento: string; categoria: string
  }>

  // Saldo atual = realizados até hoje
  const realizados = rows.filter(r => r.status === 'realizado' && r.data_lancamento <= today)
  const saldo_atual = realizados.reduce((s, r) =>
    s + (r.tipo === 'receita' ? Number(r.valor) : -Number(r.valor)), 0)

  // Entradas e saídas do mês (realizadas)
  const realizadosMes = realizados.filter(r => r.data_lancamento >= mesInicio && r.data_lancamento <= mesFim)
  const entradas_mes = realizadosMes.filter(r => r.tipo === 'receita').reduce((s, r) => s + Number(r.valor), 0)
  const saidas_mes   = realizadosMes.filter(r => r.tipo === 'despesa').reduce((s, r) => s + Number(r.valor), 0)

  // Saldo projetado = saldo_atual + todos os previstos
  const previstos = rows.filter(r => r.status === 'previsto')
  const saldo_projetado = saldo_atual + previstos.reduce((s, r) =>
    s + (r.tipo === 'receita' ? Number(r.valor) : -Number(r.valor)), 0)

  // MRR real = soma das assinaturas ativas (mensalidade_escola realizadas no mês corrente)
  const { data: assinaturas } = await admin
    .from('assinaturas_plataforma')
    .select('valor_mensal')
    .eq('status', 'adimplente')
    .is('deleted_at', null)
  const mrr = (assinaturas ?? []).reduce((s, r) => s + Number(r.valor_mensal ?? 0), 0)

  return {
    error: null,
    kpi: { saldo_atual, entradas_mes, saidas_mes, saldo_projetado, mrr },
  }
}

// ─── Aggregates for charts ────────────────────────────────────────────────────

export type MonthlyAggregate = {
  mes: string   // "2026-03"
  receitas: number
  despesas: number
}

export type CategoriaAggregate = {
  categoria: FluxoCaixaCategoria
  valor: number
}

export async function getAggregatosMensais(meses = 6): Promise<{
  error: string | null
  monthly?: MonthlyAggregate[]
  byCategoria?: { receitas: CategoriaAggregate[]; despesas: CategoriaAggregate[] }
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const dataInicio = new Date()
  dataInicio.setMonth(dataInicio.getMonth() - (meses - 1))
  dataInicio.setDate(1)

  const { data } = await admin
    .from('fluxo_caixa_plataforma')
    .select('tipo, categoria, valor, data_lancamento, status')
    .is('deleted_at', null)
    .eq('status', 'realizado')
    .gte('data_lancamento', dataInicio.toISOString().slice(0, 10))

  const rows = (data ?? []) as Array<{
    tipo: string; categoria: string; valor: number; data_lancamento: string
  }>

  // Build monthly map
  const monthMap = new Map<string, { receitas: number; despesas: number }>()
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    monthMap.set(key, { receitas: 0, despesas: 0 })
  }

  for (const r of rows) {
    const key = r.data_lancamento.slice(0, 7)
    const entry = monthMap.get(key)
    if (!entry) continue
    if (r.tipo === 'receita') entry.receitas += Number(r.valor)
    else                      entry.despesas += Number(r.valor)
  }

  const monthly: MonthlyAggregate[] = Array.from(monthMap.entries()).map(([mes, v]) => ({
    mes, ...v,
  }))

  // By categoria
  const catReceitaMap = new Map<string, number>()
  const catDespesaMap = new Map<string, number>()
  for (const r of rows) {
    if (r.tipo === 'receita') catReceitaMap.set(r.categoria, (catReceitaMap.get(r.categoria) ?? 0) + Number(r.valor))
    else                      catDespesaMap.set(r.categoria, (catDespesaMap.get(r.categoria) ?? 0) + Number(r.valor))
  }

  return {
    error: null,
    monthly,
    byCategoria: {
      receitas: Array.from(catReceitaMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => ({ categoria: categoria as FluxoCaixaCategoria, valor })),
      despesas: Array.from(catDespesaMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => ({ categoria: categoria as FluxoCaixaCategoria, valor })),
    },
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CriarLancamentoInput = {
  tipo:            FluxoCaixaTipo
  categoria:       FluxoCaixaCategoria
  descricao:       string
  observacao?:     string
  escola_id?:      string
  valor:           number
  data_lancamento: string
  status:          FluxoCaixaStatus
  forma_pagamento: FormaPagamento
  recorrencia:     FluxoCaixaRecorrencia
  percentual?:     number
  base_calculo?:   number
}

export async function criarLancamento(
  input: CriarLancamentoInput
): Promise<{ error: string | null; id?: string }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  if (!input.descricao?.trim())  return { error: 'Descrição é obrigatória.' }
  if (!input.valor || input.valor <= 0) return { error: 'Valor deve ser maior que zero.' }
  if (!input.data_lancamento)    return { error: 'Data é obrigatória.' }

  const admin = createAdminClient()

  // Resolve escola nome cache
  let escola_nome_cache: string | null = null
  if (input.escola_id) {
    const { data: escola } = await admin.from('escolas').select('nome').eq('id', input.escola_id).maybeSingle()
    escola_nome_cache = escola?.nome ?? null
  }

  const userResult = await admin.auth.admin.getUserById(auth.userId)
  const ator_email = userResult.data.user?.email ?? null

  // Se recorrência != unico, gera grupo
  const recorrencia_grupo_id = input.recorrencia !== 'unico'
    ? crypto.randomUUID()
    : null

  // Gera as ocorrências
  const ocorrencias = buildOcorrencias(input, escola_nome_cache, auth.userId, ator_email, recorrencia_grupo_id)

  const { data, error } = await admin
    .from('fluxo_caixa_plataforma')
    .insert(ocorrencias)
    .select('id')

  if (error) {
    console.error('[criarLancamento]', error.message)
    return { error: 'Erro ao salvar lançamento.' }
  }

  return { error: null, id: data?.[0]?.id }
}

function buildOcorrencias(
  input: CriarLancamentoInput,
  escola_nome_cache: string | null,
  ator_id: string,
  ator_email: string | null,
  recorrencia_grupo_id: string | null
) {
  const base = {
    tipo:                input.tipo,
    categoria:           input.categoria,
    descricao:           input.descricao.trim(),
    observacao:          input.observacao?.trim() || null,
    escola_id:           input.escola_id || null,
    escola_nome_cache,
    valor:               input.valor,
    status:              input.status,
    forma_pagamento:     input.forma_pagamento,
    recorrencia:         input.recorrencia,
    recorrencia_grupo_id,
    percentual:          input.percentual ?? null,
    base_calculo:        input.base_calculo ?? null,
    ator_id,
    ator_email,
  }

  if (input.recorrencia === 'unico') {
    return [{ ...base, data_lancamento: input.data_lancamento }]
  }

  const mesesPorCiclo = { mensal: 1, trimestral: 3, anual: 12 }[input.recorrencia] ?? 1
  const quantidadeCiclos = { mensal: 12, trimestral: 4, anual: 3 }[input.recorrencia] ?? 12

  const result = []
  for (let i = 0; i < quantidadeCiclos; i++) {
    const d = new Date(input.data_lancamento + 'T12:00:00Z')
    d.setMonth(d.getMonth() + i * mesesPorCiclo)
    result.push({
      ...base,
      data_lancamento: d.toISOString().slice(0, 10),
      status: i === 0 ? input.status : 'previsto' as FluxoCaixaStatus,
    })
  }
  return result
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function atualizarLancamento(
  id: string,
  input: Partial<CriarLancamentoInput>
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const payload: Record<string, unknown> = {}

  if (input.descricao)       payload.descricao       = input.descricao.trim()
  if (input.observacao != null) payload.observacao   = input.observacao.trim() || null
  if (input.categoria)       payload.categoria       = input.categoria
  if (input.valor != null)   payload.valor           = input.valor
  if (input.data_lancamento) payload.data_lancamento = input.data_lancamento
  if (input.status)          payload.status          = input.status
  if (input.forma_pagamento) payload.forma_pagamento = input.forma_pagamento
  if (input.percentual != null) payload.percentual   = input.percentual
  if (input.base_calculo != null) payload.base_calculo = input.base_calculo

  if (input.escola_id != null) {
    payload.escola_id = input.escola_id || null
    if (input.escola_id) {
      const { data: escola } = await admin.from('escolas').select('nome').eq('id', input.escola_id).maybeSingle()
      payload.escola_nome_cache = escola?.nome ?? null
    } else {
      payload.escola_nome_cache = null
    }
  }

  const { error } = await admin
    .from('fluxo_caixa_plataforma')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('[atualizarLancamento]', error.message)
    return { error: 'Erro ao atualizar lançamento.' }
  }

  return { error: null }
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

export async function deletarLancamento(id: string): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('fluxo_caixa_plataforma')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('[deletarLancamento]', error.message)
    return { error: 'Erro ao remover lançamento.' }
  }

  return { error: null }
}

// ─── Marcar como realizado ────────────────────────────────────────────────────

export async function marcarRealizado(id: string): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('fluxo_caixa_plataforma')
    .update({ status: 'realizado' })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { error: 'Erro ao atualizar status.' }
  return { error: null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeRow(r: Record<string, unknown>): LancamentoRow {
  return {
    id:                r.id as string,
    tipo:              r.tipo as FluxoCaixaTipo,
    categoria:         r.categoria as FluxoCaixaCategoria,
    descricao:         r.descricao as string,
    observacao:        (r.observacao as string | null) ?? null,
    escola_id:         (r.escola_id as string | null) ?? null,
    escola_nome_cache: (r.escola_nome_cache as string | null) ?? null,
    valor:             Number(r.valor),
    data_lancamento:   r.data_lancamento as string,
    status:            r.status as FluxoCaixaStatus,
    forma_pagamento:   r.forma_pagamento as FormaPagamento,
    recorrencia:       r.recorrencia as FluxoCaixaRecorrencia,
    percentual:        r.percentual != null ? Number(r.percentual) : null,
    base_calculo:      r.base_calculo != null ? Number(r.base_calculo) : null,
    ator_email:        (r.ator_email as string | null) ?? null,
    created_at:        r.created_at as string,
  }
}
