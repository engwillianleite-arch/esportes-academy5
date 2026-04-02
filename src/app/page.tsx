import { redirect } from 'next/navigation'
import {
  getEscolaContext,
  clearEscolaCookiesOnly,
  selectEscola,
} from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { listarContextosUsuarioAtual, syncUsuarioEscolaTiposAtual } from '@/lib/usuario-contexto'
import { getRouteForPerfil } from '@/lib/perfil-route'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

    if (contextos.length === 0) {
      if (user) {
        const { data: responsavelByEmail } = await supabase
          .from('responsaveis')
          .select('id')
          .eq('email', user.email?.trim().toLowerCase() ?? '')
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle()

        if (responsavelByEmail) redirect('/pais/vincular')
      }

      redirect('/cadastrar-escola')
    }

    if (contextos.length === 1) {
      await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
    }

    redirect('/selecionar-escola')
  }

  const contextosResult = user ? await listarContextosUsuarioAtual() : { rows: [] as never[] }
  const contextos = contextosResult.rows ?? []

  if (contextos.length === 0) {
    if (user) {
      const { data: responsavelByEmail } = await supabase
        .from('responsaveis')
        .select('id')
        .eq('email', user.email?.trim().toLowerCase() ?? '')
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      if (responsavelByEmail) redirect('/pais/vincular')
    }

    redirect('/cadastrar-escola')
  }

  if (contextos.length === 1) {
    await selectEscola(contextos[0].escola_id, contextos[0].tipo_usuario)
  }

  redirect('/selecionar-escola')
}
