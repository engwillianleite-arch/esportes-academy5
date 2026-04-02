import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import AtletasPageClient from '@/components/atletas/atletas-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Atletas — Esportes Academy',
}

export default async function AtletasPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const canRegister =
    ctx.perfil === 'admin_escola' ||
    ctx.perfil === 'coordenador' ||
    ctx.perfil === 'secretaria'

  const canViewFrequencia =
    ctx.perfil === 'admin_escola' ||
    ctx.perfil === 'coordenador' ||
    ctx.perfil === 'secretaria'

  const supabase = await createClient()
  const { data: escolaRow } = await supabase
    .from('escolas')
    .select('limiar_freq_pct')
    .eq('id', ctx.escolaId)
    .maybeSingle()

  const limiarFreqPct = (escolaRow as { limiar_freq_pct?: number } | null)?.limiar_freq_pct ?? 75

  return (
    <AtletasPageClient
      escolaId={ctx.escolaId}
      canRegister={canRegister}
      limiarFreqPct={limiarFreqPct}
      canViewFrequencia={canViewFrequencia}
    />
  )
}
