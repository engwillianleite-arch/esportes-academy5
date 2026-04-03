'use server'

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanCpf, validateCpf } from '@/lib/cpf'

export type UsuarioGlobalState = {
  error: string | null
}

type UsuarioGlobalAtualResult =
  | { error: string; authUser?: never; usuario?: never }
  | {
      error: null
      authUser: User
      usuario: {
        id: string
        auth_user_id: string
        cpf: string
        nome: string
        email: string | null
        ativo: boolean
        deleted_at: string | null
        created_at: string
        updated_at: string
      } | null
    }

export async function getUsuarioGlobalAtual(): Promise<UsuarioGlobalAtualResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Usuário não autenticado' as const }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, cpf, nome, email, ativo, deleted_at, created_at, updated_at')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return {
    error: null,
    authUser: user,
    usuario: usuario ?? null,
  }
}

export async function salvarUsuarioGlobal(
  prevState: UsuarioGlobalState,
  formData: FormData
): Promise<UsuarioGlobalState> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado.' }

  const cpf = cleanCpf((formData.get('cpf') as string | null) ?? '')
  const nome = ((formData.get('nome') as string | null) ?? '').trim()

  if (!nome) return { error: 'Nome completo é obrigatório.' }
  if (cpf.length !== 11) return { error: 'CPF é obrigatório (11 dígitos).' }
  if (!validateCpf(cpf)) return { error: 'CPF inválido.' }

  const { data: existenteCpf } = await supabase
    .from('usuarios')
    .select('id, auth_user_id')
    .eq('cpf', cpf)
    .is('deleted_at', null)
    .maybeSingle()

  if (existenteCpf && existenteCpf.auth_user_id !== user.id) {
    return { error: 'Este CPF já está vinculado a outra identidade global.' }
  }

  const payload = {
    auth_user_id: user.id,
    cpf,
    nome,
    email: user.email?.trim().toLowerCase() ?? null,
    ativo: true,
    deleted_at: null,
  }

  const admin = createAdminClient()
  const { error } = await admin.from('usuarios').upsert(payload, {
    onConflict: 'auth_user_id',
  })

  if (error) {
    console.error('[salvarUsuarioGlobal]', error.message)
    return { error: 'Erro ao salvar identidade global.' }
  }

  redirect('/')
}
