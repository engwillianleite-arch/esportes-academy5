'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MembroEscola = {
  id: string
  user_id: string
  perfil: string
  ativo: boolean
  created_at: string
  nome: string | null
  email: string | null
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function assertAdminEscola(escolaId: string): Promise<{ error: string } | { userId: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const admin = createAdminClient()
  const { data: plat } = await admin
    .from('plataforma_usuarios')
    .select('perfil, ativo, deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (plat?.ativo && !plat.deleted_at) return { userId: user.id }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .in('perfil', ['admin_escola'])
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão: apenas admin_escola pode gerenciar a equipe.' }
  return { userId: user.id }
}

// ─── Listar membros ───────────────────────────────────────────────────────────

export async function listarMembrosEscola(
  escolaId: string
): Promise<{ error: string | null; membros?: MembroEscola[] }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const admin = createAdminClient()
  const { data: eu, error } = await admin
    .from('escola_usuarios')
    .select('id, user_id, perfil, ativo, created_at')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) return { error: 'Erro ao carregar membros.' }

  const userIds = (eu ?? []).map(m => m.user_id)
  let urows: Array<{ auth_user_id: string; nome: string; email: string | null }> = []
  if (userIds.length) {
    const { data } = await admin.from('usuarios').select('auth_user_id, nome, email').in('auth_user_id', userIds)
    urows = data ?? []
  }

  const uMap = new Map(urows.map(u => [u.auth_user_id, u]))

  const membros: MembroEscola[] = (eu ?? []).map(m => ({
    id:         m.id,
    user_id:    m.user_id,
    perfil:     m.perfil,
    ativo:      m.ativo,
    created_at: m.created_at,
    nome:       uMap.get(m.user_id)?.nome ?? null,
    email:      uMap.get(m.user_id)?.email ?? null,
  }))

  return { error: null, membros }
}

/** Backward-compat alias used by turmas page */
export async function listarMembrosEscolaAdmin(
  escolaId: string
): Promise<{ error: string | null; membros?: { user_id: string; perfil: string; email: string | null }[] }> {
  const r = await listarMembrosEscola(escolaId)
  return { error: r.error, membros: r.membros?.map(m => ({ user_id: m.user_id, perfil: m.perfil, email: m.email })) }
}

// ─── Atualizar perfil ─────────────────────────────────────────────────────────

export async function atualizarPerfilMembro(
  escolaId: string,
  membroId: string,
  perfil: string
): Promise<{ error: string | null }> {
  const auth = await assertAdminEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('escola_usuarios')
    .update({ perfil })
    .eq('id', membroId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)

  if (error) return { error: 'Erro ao atualizar perfil.' }
  return { error: null }
}

// ─── Suspender / reativar membro ─────────────────────────────────────────────

export async function toggleMembroAtivo(
  escolaId: string,
  membroId: string,
  ativo: boolean
): Promise<{ error: string | null }> {
  const auth = await assertAdminEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('escola_usuarios')
    .update({ ativo })
    .eq('id', membroId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)

  if (error) return { error: 'Erro ao atualizar status.' }
  return { error: null }
}

// ─── Remover membro ───────────────────────────────────────────────────────────

export async function removerMembro(
  escolaId: string,
  membroId: string
): Promise<{ error: string | null }> {
  const auth = await assertAdminEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('escola_usuarios')
    .update({ deleted_at: new Date().toISOString(), ativo: false })
    .eq('id', membroId)
    .eq('escola_id', escolaId)

  if (error) return { error: 'Erro ao remover membro.' }
  return { error: null }
}

// ─── Convidar / adicionar por e-mail ─────────────────────────────────────────

export async function convidarMembroEscola(
  escolaId: string,
  email: string,
  perfil: string
): Promise<{ error: string | null; message?: string }> {
  const auth = await assertAdminEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const emailTrim = email.trim().toLowerCase()
  if (!emailTrim) return { error: 'E-mail inválido.' }

  const admin = createAdminClient()

  const { data: urow } = await admin
    .from('usuarios')
    .select('auth_user_id, nome')
    .eq('email', emailTrim)
    .is('deleted_at', null)
    .maybeSingle()

  if (!urow) {
    return { error: 'Usuário não encontrado. Ele precisa ter uma conta ativa na plataforma.' }
  }

  const { data: existing } = await admin
    .from('escola_usuarios')
    .select('id, ativo, deleted_at')
    .eq('escola_id', escolaId)
    .eq('user_id', urow.auth_user_id)
    .maybeSingle()

  if (existing && !existing.deleted_at && existing.ativo) {
    return { error: 'Este usuário já é membro ativo desta escola.' }
  }

  if (existing) {
    const { error } = await admin
      .from('escola_usuarios')
      .update({ ativo: true, deleted_at: null, perfil })
      .eq('id', existing.id)
    if (error) return { error: 'Erro ao reativar membro.' }
    return { error: null, message: `${urow.nome ?? emailTrim} foi reativado com o perfil ${perfil}.` }
  }

  const { error } = await admin
    .from('escola_usuarios')
    .insert({ escola_id: escolaId, user_id: urow.auth_user_id, perfil, ativo: true })
  if (error) return { error: 'Erro ao adicionar membro.' }

  return { error: null, message: `${urow.nome ?? emailTrim} adicionado com o perfil ${perfil}.` }
}
