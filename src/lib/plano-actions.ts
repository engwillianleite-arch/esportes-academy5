'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FrequenciaTipo, MetodoPagamento } from '@/types'

// ─── Shared ownership guard ───────────────────────────────────────────────────

async function assertAdminEscola(escolaId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('perfil', 'admin_escola')
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão' }
  return null
}

// ─── Parse and compute helpers ────────────────────────────────────────────────

const FREQUENCIA_VALID: FrequenciaTipo[] = ['mensal', 'trimestral', 'semestral', 'anual']
const METODO_VALID: MetodoPagamento[] = ['boleto', 'pix', 'cartao_credito']
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

function parsePlanoFields(formData: FormData) {
  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const frequencia = (formData.get('frequencia') as FrequenciaTipo | null) ?? 'mensal'
  const valor = parseFloat(formData.get('valor') as string)
  const descontoPct = parseFloat(formData.get('desconto_pct') as string)
  const valorLiquido = parseFloat(((valor || 0) * (1 - (descontoPct || 0) / 100)).toFixed(2))
  const diaVencimento = parseInt(formData.get('dia_vencimento') as string, 10)
  const metodoPagamento = (formData.get('metodo_pagamento') as MetodoPagamento | null) ?? 'boleto'
  const rawCor = (formData.get('cor') as string | null)?.trim() ?? ''
  const cor = HEX_COLOR_RE.test(rawCor) ? rawCor : '#6366f1'
  return { nome, frequencia, valor, descontoPct, valorLiquido, diaVencimento, metodoPagamento, cor }
}

function validatePlanoFields({
  nome, frequencia, valor, descontoPct, diaVencimento, metodoPagamento,
}: ReturnType<typeof parsePlanoFields>): string | null {
  if (!nome) return 'Nome do plano é obrigatório'
  if (isNaN(valor) || valor <= 0) return 'Valor deve ser maior que zero'
  if (isNaN(descontoPct) || descontoPct < 0 || descontoPct > 100) return 'Desconto deve estar entre 0 e 100%'
  if (isNaN(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) return 'Dia de vencimento deve estar entre 1 e 28'
  if (!FREQUENCIA_VALID.includes(frequencia)) return 'Frequência inválida'
  if (!METODO_VALID.includes(metodoPagamento)) return 'Método de pagamento inválido'
  return null
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function criarPlanoPagamento(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const fields = parsePlanoFields(formData)
  const validationError = validatePlanoFields(fields)
  if (validationError) return { error: validationError }

  const { nome, frequencia, valor, descontoPct, valorLiquido, diaVencimento, metodoPagamento, cor } = fields

  const supabase = await createClient()
  const { error } = await supabase.from('planos_pagamento').insert({
    escola_id:        escolaId,
    nome,
    frequencia,
    valor,
    desconto_pct:     descontoPct,
    valor_liquido:    valorLiquido,
    dia_vencimento:   diaVencimento,
    metodo_pagamento: metodoPagamento,
    cor,
  })

  if (error) {
    console.error('[criarPlanoPagamento]', error.message)
    return { error: 'Erro ao criar plano. Tente novamente.' }
  }

  redirect('/painel/planos-pagamento')
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function atualizarPlanoPagamento(
  escolaId: string,
  planoId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const fields = parsePlanoFields(formData)
  const validationError = validatePlanoFields(fields)
  if (validationError) return { error: validationError }

  const { nome, frequencia, valor, descontoPct, valorLiquido, diaVencimento, metodoPagamento, cor } = fields

  const supabase = await createClient()
  const { data: updatedRows, error } = await supabase
    .from('planos_pagamento')
    .update({
      nome,
      frequencia,
      valor,
      desconto_pct:     descontoPct,
      valor_liquido:    valorLiquido,
      dia_vencimento:   diaVencimento,
      metodo_pagamento: metodoPagamento,
      cor,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', planoId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .select('id')

  if (error) {
    console.error('[atualizarPlanoPagamento]', error.message)
    return { error: 'Erro ao atualizar plano. Tente novamente.' }
  }
  if (!updatedRows?.length) return { error: 'Plano não encontrado ou sem permissão.' }

  redirect('/painel/planos-pagamento')
}

// ─── Soft delete ──────────────────────────────────────────────────────────────
export async function deletarPlanoPagamento(
  escolaId: string,
  planoId: string
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('matriculas')
    .select('*', { count: 'exact', head: true })
    .eq('plano_id', planoId)
    .eq('escola_id', escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)

  if (countError) {
    console.error('[deletarPlanoPagamento] count', countError.message)
    return { error: 'Erro ao validar vínculos do plano.' }
  }
  if (count && count > 0) {
    return {
      error:
        'Não é possível excluir: existem matrículas ativas vinculadas a este plano.',
    }
  }

  const { data: deletedRows, error } = await supabase
    .from('planos_pagamento')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', planoId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .select('id')

  if (error) {
    console.error('[deletarPlanoPagamento]', error.message)
    return { error: 'Erro ao excluir plano. Tente novamente.' }
  }
  if (!deletedRows?.length) return { error: 'Plano não encontrado ou sem permissão.' }

  redirect('/painel/planos-pagamento')
}

// ─── Duplicate ────────────────────────────────────────────────────────────────

export async function duplicarPlanoPagamento(
  escolaId: string,
  planoId: string
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from('planos_pagamento')
    .select('*')
    .eq('id', planoId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !original) {
    console.error('[duplicarPlanoPagamento] fetch', fetchError?.message)
    return { error: 'Plano não encontrado.' }
  }

  const { error: insertError } = await supabase.from('planos_pagamento').insert({
    escola_id:        original.escola_id,
    nome:             `Cópia de ${original.nome}`,
    frequencia:       original.frequencia,
    valor:            original.valor,
    desconto_pct:     original.desconto_pct,
    valor_liquido:    original.valor_liquido,
    dia_vencimento:   original.dia_vencimento,
    metodo_pagamento: original.metodo_pagamento,
    cor:              original.cor,
  })

  if (insertError) {
    console.error('[duplicarPlanoPagamento] insert', insertError.message)
    return { error: 'Erro ao duplicar plano. Tente novamente.' }
  }

  redirect('/painel/planos-pagamento')
}
