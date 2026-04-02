'use server'

import { createClient } from '@/lib/supabase/server'
import { MODULO_INFO } from '@/lib/modulo-info'
import { hasModuloAccess } from '@/lib/modulo-access'
import type { ModuloSlug, PerfilUsuario } from '@/types'
import type { ModuloStatusItem } from '@/lib/modulo-info'

export async function getModulosStatus(
  escolaId: string,
  perfil: PerfilUsuario
): Promise<ModuloStatusItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modulos_ativos')
    .select('modulo_slug')
    .eq('escola_id', escolaId)

  if (error) {
    console.error('[getModulosStatus]', error.message)
    throw new Error(error.message)
  }

  const activeSlugs = new Set((data ?? []).map(r => r.modulo_slug as ModuloSlug))

  return (Object.keys(MODULO_INFO) as ModuloSlug[]).map(slug => {
    // administrativo is always active — no plan or permission restriction (ADR decision Story 1.6)
    if (slug === 'administrativo') {
      return { slug, status: 'active' as const }
    }
    if (activeSlugs.has(slug)) {
      return {
        slug,
        status: hasModuloAccess(slug, perfil) ? 'active' as const : 'locked-permission' as const,
      }
    }
    return { slug, status: 'locked-plan' as const }
  })
}
