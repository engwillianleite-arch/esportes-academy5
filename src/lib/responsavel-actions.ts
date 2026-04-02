'use server'

import { createClient } from '@/lib/supabase/server'
import { cleanCpf, validateCpf } from '@/lib/cpf'
import type { Responsavel, AtletaResponsavelWithResponsavel } from '@/types'

// ─── Auth guard ───────────────────────────────────────────────────────────────
// responsaveis / atleta_responsaveis are global tables — no escolaId needed.
// Guard checks: admin_escola, coordenador ou secretaria em alguma escola ativa.

async function assertAdminOrCoordenador(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }
  const { data: membership } = await supabase
    .from('escola_usuarios').select('id')
    .eq('user_id', user.id)
    .in('perfil', ['admin_escola', 'coordenador'])
    .eq('ativo', true).is('deleted_at', null)
    .maybeSingle()
  if (!membership) return { error: 'Sem permissão' }
  return null
}

// ─── Search ───────────────────────────────────────────────────────────────────

function sanitizeIlike(q: string): string {
  return q.replace(/[%_,]/g, '').trim()
}

export async function buscarResponsaveis(
  query: string
): Promise<{ error: string | null; responsaveis?: Responsavel[] }> {
  const authErr = await assertAdminOrCoordenador()
  if (authErr) return authErr

  const q = query.trim()
  if (!q) return { error: null, responsaveis: [] }

  const supabase = await createClient()
  const clean = cleanCpf(q)

  if (clean.length === 11) {
    const { data: exatos, error: e1 } = await supabase
      .from('responsaveis')
      .select('*')
      .eq('cpf', clean)
      .is('deleted_at', null)
      .limit(10)
    if (e1) {
      console.error('[buscarResponsaveis cpf]', e1.message)
      return { error: 'Erro ao buscar responsáveis.' }
    }
    if (exatos && exatos.length > 0) {
      return { error: null, responsaveis: exatos as Responsavel[] }
    }
  }

  const safe = sanitizeIlike(q)
  if (!safe) return { error: null, responsaveis: [] }

  const like = `%${safe}%`
  const orParts = [`nome.ilike.${like}`, `email.ilike.${like}`]
  if (clean.length >= 3 && clean.length < 11) {
    orParts.push(`cpf.ilike.%${clean}%`)
  }

  const { data, error } = await supabase
    .from('responsaveis')
    .select('*')
    .or(orParts.join(','))
    .is('deleted_at', null)
    .limit(10)

  if (error) {
    console.error('[buscarResponsaveis]', error.message)
    return { error: 'Erro ao buscar responsáveis.' }
  }
  return { error: null, responsaveis: (data ?? []) as Responsavel[] }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function criarResponsavel(
  formData: FormData
): Promise<{ error: string | null; responsavel?: Responsavel }> {
  const authErr = await assertAdminOrCoordenador()
  if (authErr) return authErr

  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const telefone = (formData.get('telefone') as string | null)?.trim() || null
  const cpfRaw = (formData.get('cpf') as string | null) ?? ''
  const cpf = cleanCpf(cpfRaw)

  if (!nome) return { error: 'Nome do responsável é obrigatório' }
  if (!email) return { error: 'E-mail do responsável é obrigatório' }
  if (cpf.length !== 11) return { error: 'CPF do responsável é obrigatório (11 dígitos)' }
  if (!validateCpf(cpf)) return { error: 'CPF do responsável inválido' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('responsaveis')
    .insert({ nome, email, telefone, cpf })
    .select('*')
    .single()

  if (error) {
    console.error('[criarResponsavel]', error.message)
    if (error.code === '23505' || error.message.includes('já está cadastrado')) {
      return {
        error:
          'Este CPF já está em uso (como atleta ou outro responsável). Cada pessoa tem um único CPF no sistema.',
      }
    }
    return { error: 'Erro ao criar responsável. Tente novamente.' }
  }
  return { error: null, responsavel: data as Responsavel }
}

// ─── List athlete's guardians ─────────────────────────────────────────────────

export async function listarAtletaResponsaveis(
  atletaId: string
): Promise<{ error: string | null; vinculacoes?: AtletaResponsavelWithResponsavel[] }> {
  const authErr = await assertAdminOrCoordenador()
  if (authErr) return authErr

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atleta_responsaveis')
    .select('*, responsavel:responsaveis(*)')
    .eq('atleta_id', atletaId)
    .is('deleted_at', null)
    .order('created_at')

  if (error) {
    console.error('[listarAtletaResponsaveis]', error.message)
    return { error: 'Erro ao carregar responsáveis.' }
  }
  return { error: null, vinculacoes: (data ?? []) as AtletaResponsavelWithResponsavel[] }
}

// ─── Link guardian to athlete ─────────────────────────────────────────────────

export async function vincularResponsavel(
  atletaId: string,
  responsavelId: string,
  financeiro: boolean
): Promise<{ error: string | null }> {
  const authErr = await assertAdminOrCoordenador()
  if (authErr) return authErr

  const supabase = await createClient()
  const { error } = await supabase
    .from('atleta_responsaveis')
    .insert({ atleta_id: atletaId, responsavel_id: responsavelId, financeiro })

  if (error) {
    if (error.code === '23505') return { error: 'Responsável já vinculado' }
    console.error('[vincularResponsavel]', error.message)
    return { error: 'Erro ao vincular responsável. Tente novamente.' }
  }
  return { error: null }
}

// ─── Update financeiro flag ───────────────────────────────────────────────────
// Two-step: clear all other links first, then set the target.
// No unique partial index on financeiro=true — exclusivity is enforced here.

export async function atualizarFinanceiro(
  atletaId: string,
  responsavelId: string,
  financeiro: boolean
): Promise<{ error: string | null }> {
  const authErr = await assertAdminOrCoordenador()
  if (authErr) return authErr

  const supabase = await createClient()

  if (financeiro) {
    // Clear financeiro on all OTHER links first
    const { error: clearErr } = await supabase
      .from('atleta_responsaveis')
      .update({ financeiro: false })
      .eq('atleta_id', atletaId)
      .neq('responsavel_id', responsavelId)
      .is('deleted_at', null)

    if (clearErr) {
      console.error('[atualizarFinanceiro] clear', clearErr.message)
      return { error: 'Erro ao atualizar responsável financeiro.' }
    }
  }

  const { error } = await supabase
    .from('atleta_responsaveis')
    .update({ financeiro })
    .eq('atleta_id', atletaId)
    .eq('responsavel_id', responsavelId)
    .is('deleted_at', null)

  if (error) {
    console.error('[atualizarFinanceiro]', error.message)
    return { error: 'Erro ao atualizar responsável financeiro.' }
  }
  return { error: null }
}
