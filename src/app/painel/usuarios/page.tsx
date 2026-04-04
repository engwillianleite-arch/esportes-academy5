import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { listarMembrosEscola } from '@/lib/equipe-actions'
import UsuariosPageClient from '@/components/escola/usuarios-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usuários — Esportes Academy',
}

export default async function UsuariosPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const hasAccess = ['admin_escola'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const result = await listarMembrosEscola(ctx.escolaId)

  return (
    <UsuariosPageClient
      escolaId={ctx.escolaId}
      currentUserId={user.id}
      currentPerfil={ctx.perfil}
      initialMembros={result.membros ?? []}
    />
  )
}
