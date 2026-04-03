'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StatusCobranca } from '@/types'

type MatriculaFinanceiroOption = {
  matricula_id: string
  atleta_id: string
  atleta_nome: string
}

export type CobrancaListRow = {
  id: string
  matricula_id: string | null
  valor: number
  vencimento: string
  descricao: string | null
  referencia: string | null
  asaas_charge_id: string | null
  status: StatusCobranca
  data_pagamento: string | null
  created_at: string
  atleta_nome: string | null
}

const FINANCEIRO_PERFIS = ['admin_escola', 'coordenador', 'financeiro'] as const

async function assertFinanceiroEscola(
  escolaId: string
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado' }

  // Super_admin bypass: check plataforma_usuarios first
  const admin = createAdminClient()
  const { data: plataformaUser } = await admin
    .from('plataforma_usuarios')
    .select('perfil, ativo, deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (plataformaUser?.ativo && !plataformaUser.deleted_at) {
    return { ok: true }
  }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .in('perfil', [...FINANCEIRO_PERFIS])
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão para o módulo financeiro' }
  return { ok: true }
}

export async function listarMatriculasParaCobranca(
  escolaId: string
): Promise<{ error: string | null; rows?: MatriculaFinanceiroOption[] }> {
  const auth = await assertFinanceiroEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matriculas')
    .select('id, atleta:atletas!inner(id, nome)')
    .eq('escola_id', escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listarMatriculasParaCobranca]', error.message)
    return { error: 'Erro ao carregar matrículas ativas.' }
  }

  const rows: MatriculaFinanceiroOption[] = []
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const rawA = r.atleta as Record<string, unknown> | Record<string, unknown>[] | null | undefined
    const a = (Array.isArray(rawA) ? rawA[0] : rawA) as Record<string, unknown> | undefined
    if (!a?.id || !a?.nome) continue
    rows.push({
      matricula_id: r.id as string,
      atleta_id: a.id as string,
      atleta_nome: a.nome as string,
    })
  }

  return { error: null, rows }
}

export async function listarCobrancasEscola(
  escolaId: string,
  params?: {
    status?: StatusCobranca | 'todas'
    page?: number
    pageSize?: number
  }
): Promise<{ error: string | null; rows?: CobrancaListRow[]; total?: number }> {
  const auth = await assertFinanceiroEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, params?.pageSize ?? 15))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('cobrancas')
    .select(
      'id, matricula_id, valor, vencimento, descricao, referencia, asaas_charge_id, status, data_pagamento, created_at',
      { count: 'exact' }
    )
    .eq('escola_id', escolaId)
    .is('deleted_at', null)

  if (params?.status && params.status !== 'todas') {
    query = query.eq('status', params.status)
  }

  const { data, error, count } = await query.order('vencimento', { ascending: false }).range(from, to)

  if (error) {
    console.error('[listarCobrancasEscola]', error.message)
    return { error: 'Erro ao carregar cobranças.' }
  }

  const matriculaIds = [...new Set((data ?? []).map((d) => d.matricula_id).filter(Boolean))] as string[]
  const atletaPorMatricula = new Map<string, string>()

  if (matriculaIds.length > 0) {
    const { data: mats } = await supabase
      .from('matriculas')
      .select('id, atleta:atletas!inner(nome)')
      .in('id', matriculaIds)

    for (const row of mats ?? []) {
      const r = row as Record<string, unknown>
      const rawA = r.atleta as Record<string, unknown> | Record<string, unknown>[] | null | undefined
      const a = (Array.isArray(rawA) ? rawA[0] : rawA) as Record<string, unknown> | undefined
      if (r.id && a?.nome) atletaPorMatricula.set(r.id as string, a.nome as string)
    }
  }

  const rows: CobrancaListRow[] = (data ?? []).map((d) => ({
    id: d.id,
    matricula_id: d.matricula_id,
    valor: Number(d.valor),
    vencimento: d.vencimento,
    descricao: d.descricao,
    referencia: d.referencia,
    asaas_charge_id: d.asaas_charge_id,
    status: d.status as StatusCobranca,
    data_pagamento: d.data_pagamento,
    created_at: d.created_at,
    atleta_nome: d.matricula_id ? atletaPorMatricula.get(d.matricula_id) ?? null : null,
  }))

  return { error: null, rows, total: count ?? 0 }
}

export async function criarCobrancaManual(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertFinanceiroEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const matriculaIdRaw = (formData.get('matricula_id') as string | null)?.trim()
  const matriculaId = matriculaIdRaw && matriculaIdRaw !== 'none' ? matriculaIdRaw : null
  const valorRaw = (formData.get('valor') as string | null)?.trim() ?? ''
  const valor = Number(valorRaw.replace(',', '.'))
  const vencimento = (formData.get('vencimento') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const referencia = (formData.get('referencia') as string | null)?.trim() || null
  const asaasChargeId = (formData.get('asaas_charge_id') as string | null)?.trim() || null

  if (!vencimento) return { error: 'Data de vencimento é obrigatória.' }
  if (!valor || Number.isNaN(valor) || valor <= 0) return { error: 'Valor inválido.' }

  const supabase = await createClient()

  const { error } = await supabase.from('cobrancas').insert({
    escola_id: escolaId,
    matricula_id: matriculaId,
    valor,
    vencimento,
    descricao,
    referencia,
    asaas_charge_id: asaasChargeId,
    status: 'pendente',
  })

  if (error) {
    console.error('[criarCobrancaManual]', error.message)
    if (error.code === '23505') {
      return { error: 'ID de cobrança Asaas já vinculado a outra cobrança.' }
    }
    return { error: 'Erro ao criar cobrança.' }
  }

  return { error: null }
}
