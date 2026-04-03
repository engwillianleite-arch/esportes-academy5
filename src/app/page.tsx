import { redirect } from 'next/navigation'
import {
  getEscolaContext,
  clearEscolaCookiesOnly,
  selectEscola,
} from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listarContextosUsuarioAtual, syncUsuarioEscolaTiposAtual } from '@/lib/usuario-contexto'
import { getRouteForPerfil } from '@/lib/perfil-route'

async function isSuperAdminUser(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('plataforma_usuarios')
    .select('ativo, deleted_at')
    .eq('user_id', userId)
    .maybeSingle()
  return !!(data?.ativo && !data.deleted_at)
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Super_admin: skip escola context entirely — go straight to /superadmin
  if (user && await isSuperAdminUser(user.id)) {
    redirect('/superadmin')
  }

  if (user) {
    await syncUsuarioEscolaTiposAtual()
  }

  const ctx = await getEscolaContext()

  if (ctx) {
    const contextosResult = await listarContextosUsuarioAtual()
    const contextos = contextosResult.rows ?? []
    const valid = contextos.some(
      (item) => item.escola_id === ctx.escolaId && item.tipo_usuario === ctx.perfil
    )

    if (valid) redirect(getRouteForPerfil(ctx.perfil))

    await clearEscolaCookiesOnly()

    if (contextos.length === 0) redirect('/login')
    if (contextos.length === 1) {
      await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
    }
    redirect('/selecionar-escola')
  }

  // No escola context cookie — resolve from user's contextos
  const contextosResult = user ? await listarContextosUsuarioAtual() : { rows: [] as never[] }
  const contextos = contextosResult.rows ?? []

  if (contextos.length === 0) redirect('/login')

  if (contextos.length === 1) {
    await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
  }

  redirect('/selecionar-escola')
}
