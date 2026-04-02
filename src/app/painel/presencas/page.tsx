import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import PresencasPageClient from '@/components/presencas/presencas-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chamada / Presenças — Esportes Academy',
}

export default async function PresencasPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const supabase = await createClient()
  const { data: escola } = await supabase
    .from('escolas')
    .select('janela_chamada_h, fuso_horario')
    .eq('id', ctx.escolaId)
    .maybeSingle()

  return (
    <PresencasPageClient
      escolaId={ctx.escolaId}
      janelaChamadaH={escola?.janela_chamada_h ?? 48}
      fusoHorario={escola?.fuso_horario ?? 'America/Sao_Paulo'}
    />
  )
}
