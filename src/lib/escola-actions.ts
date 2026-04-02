'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLAN_MODULES } from '@/lib/modulo-access'
import { selectEscola } from '@/lib/escola-context'
import type { PlanoTipo } from '@/types'

// ─── School Registration ───────────────────────────────────────────────────────

export async function criarEscola(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const cnpj = (formData.get('cnpj') as string | null)?.replace(/\D/g, '') ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const telefone = (formData.get('telefone') as string | null)?.trim() ?? ''
  const plano = (formData.get('plano') as PlanoTipo | null) ?? 'starter'
  const modalidades = formData.getAll('modalidades') as string[]

  if (!nome || !cnpj || !email || !telefone) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }
  if (cnpj.length !== 14) {
    return { error: 'CNPJ inválido — deve ter 14 dígitos' }
  }

  // Single transactional RPC — all 3 inserts (escola, escola_usuarios, escola_modulos)
  // run atomically; any failure rolls back the entire registration.
  const modulos = PLAN_MODULES[plano]
  const { data: escolaId, error: rpcError } = await supabase
    .rpc('criar_escola_completo', {
      p_nome: nome,
      p_cnpj: cnpj,
      p_email: email,
      p_telefone: telefone,
      p_plano: plano,
      p_modalidades: modalidades,
      p_modulos: modulos,
    })

  if (rpcError) {
    if (rpcError.code === '23505') {
      return { error: 'CNPJ já cadastrado na plataforma' }
    }
    console.error('[criarEscola] rpc', rpcError.message)
    return { error: 'Erro ao criar escola. Tente novamente.' }
  }

  // Set session cookies + redirect to /painel — throws NEXT_REDIRECT (never returns below)
  await selectEscola(escolaId as string, 'admin_escola')
  return { error: null } // unreachable — required by TypeScript
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function dismissarOnboarding(escolaId: string): Promise<void> {
  const supabase = await createClient()

  // Verify the calling user is an active admin_escola for this escola
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('perfil', 'admin_escola')
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!membership) return

  const { error } = await supabase
    .from('escolas')
    .update({ onboarding_completo: true })
    .eq('id', escolaId)

  if (error) {
    console.error('[dismissarOnboarding]', error.message)
    return
  }

  redirect('/painel')
}
