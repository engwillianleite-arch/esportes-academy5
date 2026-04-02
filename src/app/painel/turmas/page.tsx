import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { listarMembrosEscolaAdmin } from '@/lib/equipe-actions'
import TurmasPageClient from '@/components/turmas/turmas-page-client'
import type { Metadata } from 'next'
import type { Turma } from '@/types'

export const metadata: Metadata = {
  title: 'Turmas — Esportes Academy',
}

export default async function TurmasPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const supabase = await createClient()
  const { data: turmas, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('escola_id', ctx.escolaId)
    .is('deleted_at', null)
    .order('nome', { ascending: true })

  if (error) {
    console.error('[TurmasPage]', error.message)
  }

  const { data: mrows } = await supabase
    .from('matriculas')
    .select('turma_id')
    .eq('escola_id', ctx.escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)
    .not('turma_id', 'is', null)

  const ocupacao: Record<string, number> = {}
  for (const m of mrows ?? []) {
    if (m.turma_id) {
      ocupacao[m.turma_id] = (ocupacao[m.turma_id] ?? 0) + 1
    }
  }

  const isAdmin = ctx.perfil === 'admin_escola'

  let membros: { user_id: string; perfil: string; email: string | null }[] | undefined
  if (isAdmin) {
    const m = await listarMembrosEscolaAdmin(ctx.escolaId)
    membros = m.membros
  }

  return (
    <TurmasPageClient
      turmas={(turmas ?? []) as Turma[]}
      ocupacao={ocupacao}
      escolaId={ctx.escolaId}
      isAdmin={isAdmin}
      loadError={!!error}
      membros={membros}
    />
  )
}
