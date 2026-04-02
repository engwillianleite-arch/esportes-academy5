'use server'

import { createClient } from '@/lib/supabase/server'
import type { PlanoPagamento } from '@/types'
import type { Database } from '@/types/database'

type MatriculaInsert = Database['public']['Tables']['matriculas']['Insert']

const TIPO_PERIODO = ['mensal', 'trimestral', 'semestral', 'anual', 'personalizado'] as const
const FORMA_PAG = ['boleto', 'pix', 'cartao_credito', 'qualquer'] as const

async function assertCadastroEscola(escolaId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }
  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .in('perfil', ['admin_escola', 'coordenador', 'secretaria'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()
  if (!membership) return { error: 'Sem permissão' }
  return null
}

export async function listarPlanosParaMatricula(
  escolaId: string
): Promise<{ error: string | null; planos?: PlanoPagamento[] }> {
  const authErr = await assertCadastroEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('planos_pagamento')
    .select('*')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .order('nome', { ascending: true })

  if (error) {
    console.error('[listarPlanosParaMatricula]', error.message)
    return { error: 'Erro ao carregar planos.' }
  }
  return { error: null, planos: (data ?? []) as PlanoPagamento[] }
}

export async function criarMatricula(
  escolaId: string,
  atletaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertCadastroEscola(escolaId)
  if (authErr) return authErr

  const dataInicio = (formData.get('data_inicio') as string | null)?.trim() ?? ''
  const dataFimRaw = (formData.get('data_fim') as string | null)?.trim()
  const tipoPeriodo = (formData.get('tipo_periodo') as string | null) ?? 'mensal'
  const planoIdRaw = (formData.get('plano_id') as string | null)?.trim()
  const turmaIdRaw = (formData.get('turma_id') as string | null)?.trim()
  const valor = parseFloat(formData.get('valor') as string)
  const descontoPct = parseFloat(formData.get('desconto_pct') as string)
  const descontoMotivo = (formData.get('desconto_motivo') as string | null)?.trim() || null
  const diaVencimento = parseInt(formData.get('dia_vencimento') as string, 10)
  const formaPagamento = (formData.get('forma_pagamento') as string | null) ?? 'qualquer'
  const gerarAuto = formData.get('gerar_auto') === 'on' || formData.get('gerar_auto') === 'true'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) return { error: 'Data de início inválida' }
  if (!TIPO_PERIODO.includes(tipoPeriodo as (typeof TIPO_PERIODO)[number])) {
    return { error: 'Tipo de período inválido' }
  }
  if (isNaN(valor) || valor <= 0) return { error: 'Valor deve ser maior que zero' }
  if (isNaN(descontoPct) || descontoPct < 0 || descontoPct > 100) return { error: 'Desconto inválido' }
  const valorLiquido = parseFloat((valor * (1 - descontoPct / 100)).toFixed(2))
  if (isNaN(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) {
    return { error: 'Dia de vencimento deve estar entre 1 e 28' }
  }
  if (!FORMA_PAG.includes(formaPagamento as (typeof FORMA_PAG)[number])) {
    return { error: 'Forma de pagamento inválida' }
  }

  let dataFim: string | null = null
  if (dataFimRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFimRaw)) return { error: 'Data fim inválida' }
    dataFim = dataFimRaw
  }

  const planoId = planoIdRaw && planoIdRaw.length > 0 ? planoIdRaw : null
  const turmaId = turmaIdRaw && turmaIdRaw.length > 0 ? turmaIdRaw : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: euRow } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .in('perfil', ['admin_escola', 'coordenador', 'secretaria'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (planoId) {
    const { data: planoOk } = await supabase
      .from('planos_pagamento')
      .select('id')
      .eq('id', planoId)
      .eq('escola_id', escolaId)
      .is('deleted_at', null)
      .maybeSingle()
    if (!planoOk) return { error: 'Plano inválido ou inexistente nesta escola.' }
  }

  if (turmaId) {
    const { data: turma } = await supabase
      .from('turmas')
      .select('id, capacidade_max, ativo')
      .eq('id', turmaId)
      .eq('escola_id', escolaId)
      .is('deleted_at', null)
      .maybeSingle()
    if (!turma || !turma.ativo) {
      return { error: 'Turma inválida ou inativa nesta escola.' }
    }
    const { count } = await supabase
      .from('matriculas')
      .select('*', { count: 'exact', head: true })
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')
      .is('deleted_at', null)
    const cap = turma.capacidade_max as number
    if (count !== null && count >= cap) {
      return { error: 'Esta turma já atingiu a capacidade máxima.' }
    }
  }

  const row: MatriculaInsert = {
    atleta_id:       atletaId,
    escola_id:       escolaId,
    turma_id:        turmaId,
    plano_id:        planoId,
    data_inicio:     dataInicio,
    data_fim:        dataFim,
    tipo_periodo:    tipoPeriodo as MatriculaInsert['tipo_periodo'],
    valor,
    desconto_pct:    descontoPct,
    desconto_motivo: descontoMotivo,
    valor_liquido:   valorLiquido,
    dia_vencimento:  diaVencimento,
    forma_pagamento: formaPagamento as MatriculaInsert['forma_pagamento'],
    gerar_auto:      gerarAuto,
    status:          'ativa',
    criado_por:      euRow?.id ?? null,
  }

  const { error } = await supabase.from('matriculas').insert(row)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este atleta já possui matrícula ativa nesta escola.' }
    }
    console.error('[criarMatricula]', error.message)
    return { error: 'Erro ao criar matrícula. Tente novamente.' }
  }

  return { error: null }
}
