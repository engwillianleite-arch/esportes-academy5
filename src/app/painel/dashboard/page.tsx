import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import {
  carregarDashboardKpis,
  carregarAulasHojeStatus,
  carregarAniversariantesMes,
} from '@/lib/dashboard-actions'
import DashboardPageClient from '@/components/escola/dashboard-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Esportes Academy',
}

export default async function DashboardPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const showAthletes   = ['admin_escola', 'coordenador', 'secretaria'].includes(ctx.perfil)
  const showGroups     = ['admin_escola', 'coordenador', 'secretaria', 'professor'].includes(ctx.perfil)
  const showFinanceiro = ['admin_escola', 'coordenador', 'financeiro'].includes(ctx.perfil)
  const showAttendance = ['admin_escola', 'coordenador', 'secretaria', 'professor'].includes(ctx.perfil)

  const [kpisResult, aulasResult, aniversariantesResult] = await Promise.all([
    carregarDashboardKpis(ctx.escolaId),
    carregarAulasHojeStatus(ctx.escolaId, user.id, ctx.perfil),
    carregarAniversariantesMes(ctx.escolaId),
  ])

  return (
    <DashboardPageClient
      kpis={kpisResult.kpis ?? { atletasAtivos: 0, turmasAtivas: 0, aulasHoje: 0, aulasComChamada: 0 }}
      aulasHoje={aulasResult.aulas ?? []}
      aniversariantesMes={aniversariantesResult.aniversariantes ?? []}
      showAthletes={showAthletes}
      showGroups={showGroups}
      showFinanceiro={showFinanceiro}
      showAttendance={showAttendance}
    />
  )
}
