import { createClient } from '@/lib/supabase/server'
import type { PerfilUsuario, EscolaUsuarioWithEscola } from '@/types'

/**
 * Returns all active escola profiles for the current authenticated user.
 *
 * RLS policy "escola_usuarios_select_own" automatically filters to auth.uid()
 * and deleted_at IS NULL — no manual user_id filter needed.
 *
 * Throws on DB/network error so callers (Server Components) surface a 500
 * rather than silently redirecting valid users to /no-access.
 *
 * SERVER-SIDE ONLY — call from Server Components or Server Actions, never Client Components.
 */
export async function getUserEscolaProfiles(): Promise<EscolaUsuarioWithEscola[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('escola_usuarios')
    .select('*, escola:escolas(*)')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getUserEscolaProfiles]', error.message)
    throw new Error(error.message)
  }

  // Cast via unknown: the FK relationship exists in DB but isn't declared in
  // Relationships: [] — SDK resolves join type as SelectQueryError at compile time.
  return (data ?? []) as unknown as EscolaUsuarioWithEscola[]
}

/**
 * Updates the profile (perfil) of a user within a school.
 *
 * Only callable by admin_escola — enforced by RLS policy "escola_usuarios_update_admin".
 * If the calling user is not admin_escola in the target school, Supabase returns 0 rows
 * updated (not an error) — the update silently does nothing.
 *
 * SERVER-SIDE ONLY — call from Server Components or Server Actions, never Client Components.
 */
export async function updateEscolaUsuarioPerfil(
  targetUserId: string,
  escolaId: string,
  perfil: PerfilUsuario
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('escola_usuarios')
    .update({ perfil })
    .eq('user_id', targetUserId)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)

  if (error) {
    console.error('[updateEscolaUsuarioPerfil]', error.message)
    return { error: error.message }
  }

  return { error: null }
}
