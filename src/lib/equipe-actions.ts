'use server'

import { createClient } from '@/lib/supabase/server'

/** Membros da escola com e-mail (apenas admin_escola — RPC no banco). */
export async function listarMembrosEscolaAdmin(
  escolaId: string
): Promise<{ error: string | null; membros?: { user_id: string; perfil: string; email: string | null }[] }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const { data, error } = await supabase.rpc('listar_membros_escola', {
    p_escola_id: escolaId,
  })

  if (error) {
    console.error('[listarMembrosEscolaAdmin]', error.message)
    return { error: 'Não foi possível carregar a equipe.' }
  }

  return { error: null, membros: data ?? [] }
}
