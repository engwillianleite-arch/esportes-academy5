import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import {
  carregarDashboardKpis,
  carregarAulasHojeStatus,
  carregarAniversariantesMes,
  carregarFinanceiroKpis,
  carregarTopTurmas,
  carregarAlertas,
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

  // Load escola name for the welcome banner
  const { data: escolaData } = await supabase
    .from('escolas')
    .select('nome, plano')
    .eq('id', ctx.escolaId)
    .maybeSingle()

  const [kpisResult, aulasResult, aniversariantesResult, finResult, topTurmasResult, alertasResult] =
    await Promise.all([
      carregarDashboardKpis(ctx.escolaId),
      carregarAulasHojeStatus(ctx.escolaId, user.id, ctx.perfil),
      carregarAniversariantesMes(ctx.escolaId),
      showFinanceiro ? carregarFinanceiroKpis(ctx.escolaId) : Promise.resolve({ error: null, kpis: undefined }),
      showGroups     ? carregarTopTurmas(ctx.escolaId)      : Promise.resolve({ error: null, turmas: undefined }),
      carregarAlertas(ctx.escolaId),
    ])

  return (
    <DashboardPageClient
      escolaNome={escolaData?.nome ?? 'Escola'}
      escolaPlano={escolaData?.plano ?? 'starter'}
      userName={user.email ?? ''}
      perfil={ctx.perfil}
      kpis={kpisResult.kpis ?? { atletasAtivos: 0, turmasAtivas: 0, aulasHoje: 0, aulasComChamada: 0 }}
      finKpis={finResult.kpis ?? null}
      aulasHoje={aulasResult.aulas ?? []}
      aniversariantesMes={aniversariantesResult.aniversariantes ?? []}
      topTurmas={topTurmasResult.turmas ?? []}
      alertas={alertasResult.alertas ?? []}
      showAthletes={showAthletes}
      showGroups={showGroups}
      showFinanceiro={showFinanceiro}
      showAttendance={showAttendance}
    />
  )
}
