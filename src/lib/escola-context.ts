'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { listarContextosUsuarioAtual } from '@/lib/usuario-contexto'
import type { PerfilUsuario } from '@/types'
import { getRouteForPerfil } from '@/lib/perfil-route'

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, path: '/' }

export async function getEscolaContext() {
  const store = await cookies()
  const escolaId = store.get('ea-escola-id')?.value
  const perfil = store.get('ea-perfil')?.value as PerfilUsuario | undefined
  if (!escolaId || !perfil) return null
  return { escolaId, perfil }
}

export async function selectEscola(escolaId: string, perfil: PerfilUsuario) {
  const contextos = await listarContextosUsuarioAtual()
  const valid = (contextos.rows ?? []).some(
    (ctx) => ctx.escola_id === escolaId && ctx.tipo_usuario === perfil
  )
  if (!valid) redirect('/selecionar-escola')
  const store = await cookies()
  store.set('ea-escola-id', escolaId, COOKIE_OPTS)
  store.set('ea-perfil', perfil, COOKIE_OPTS)
  redirect(getRouteForPerfil(perfil))
}

export async function selectEscolaFormAction(formData: FormData) {
  const escolaId = formData.get('escola_id') as string
  const perfil = formData.get('perfil') as PerfilUsuario
  await selectEscola(escolaId, perfil)
}

export async function clearEscolaContext() {
  await clearEscolaCookiesOnly()
  redirect('/selecionar-escola')
}

export async function clearEscolaCookiesOnly() {
  const store = await cookies()
  store.delete('ea-escola-id')
  store.delete('ea-perfil')
}
