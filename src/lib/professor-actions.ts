import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import type { Turma } from '@/types'

export type ProfessorTurmaResumo = Turma & {
  matriculados: number
}

function weekdayLabel(diaSemana: number | null): string {
  const labels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  if (diaSemana == null || diaSemana < 0 || diaSemana > 6) return 'Dia flexivel'
  return labels[diaSemana] ?? 'Dia flexivel'
}

export async function getProfessorAppContext(): Promise<
  | { error: string }
  | { ctx: { escolaId: string; escolaNome: string; professorNome: string; userId: string } }
> {
  const escolaContext = await getEscolaContext()
  if (!escolaContext || escolaContext.perfil !== 'professor') {
    return { error: 'Contexto de professor nao encontrado.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuario nao autenticado.' }

  const { data: escola } = await supabase
    .from('escolas')
    .select('nome')
    .eq('id', escolaContext.escolaId)
    .maybeSingle()

  const { data: usuarioGlobal } = await supabase
    .from('usuarios')
    .select('nome')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return {
    ctx: {
      escolaId: escolaContext.escolaId,
      escolaNome: escola?.nome ?? 'Escola ativa',
      professorNome: usuarioGlobal?.nome ?? user.email ?? 'Professor',
      userId: user.id,
    },
  }
}

export async function listarTurmasProfessor(): Promise<
  | { error: string }
  | { rows: ProfessorTurmaResumo[] }
> {
  const context = await getProfessorAppContext()
  if ('error' in context) return context

  const supabase = await createClient()
  const { escolaId, userId } = context.ctx

  const { data: turmas, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('escola_id', escolaId)
    .eq('professor_user_id', userId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true })

  if (error) return { error: 'Erro ao carregar turmas do professor.' }

  const turmaIds = (turmas ?? []).map((turma) => turma.id)
  const { data: matriculas } = turmaIds.length
    ? await supabase
        .from('matriculas')
        .select('id, turma_id')
        .eq('escola_id', escolaId)
        .eq('status', 'ativa')
        .is('deleted_at', null)
        .in('turma_id', turmaIds)
    : { data: [] as Array<{ id: string; turma_id: string | null }> }

  const byTurma = new Map<string, number>()
  for (const row of matriculas ?? []) {
    if (!row.turma_id) continue
    byTurma.set(row.turma_id, (byTurma.get(row.turma_id) ?? 0) + 1)
  }

  return {
    rows: (turmas ?? []).map((turma) => ({
      ...(turma as Turma),
      matriculados: byTurma.get(turma.id) ?? 0,
    })),
  }
}

export async function carregarResumoProfessor(): Promise<
  | { error: string }
  | {
      professorNome: string
      escolaNome: string
      turmas: ProfessorTurmaResumo[]
      aulasHoje: ProfessorTurmaResumo[]
      alertasEssenciais: number
      totalAlunos: number
    }
> {
  const context = await getProfessorAppContext()
  if ('error' in context) return context

  const turmasResult = await listarTurmasProfessor()
  if ('error' in turmasResult) return turmasResult

  const { escolaId, professorNome, escolaNome } = context.ctx
  const turmas = turmasResult.rows
  const totalAlunos = turmas.reduce((sum, turma) => sum + turma.matriculados, 0)

  const today = new Date().getDay()
  const aulasHoje = turmas.filter((turma) => turma.dia_semana === today)

  const turmaIds = turmas.map((turma) => turma.id)
  const supabase = await createClient()
  const { data: matriculas } = turmaIds.length
    ? await supabase
        .from('matriculas')
        .select('atleta_id, turma_id')
        .eq('escola_id', escolaId)
        .eq('status', 'ativa')
        .is('deleted_at', null)
        .in('turma_id', turmaIds)
    : { data: [] as Array<{ atleta_id: string; turma_id: string | null }> }

  const athleteIds = [...new Set((matriculas ?? []).map((row) => row.atleta_id))]
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() + 30)
  const limitIso = limitDate.toISOString().slice(0, 10)

  const [atestadosRes, examesRes] = await Promise.all([
    athleteIds.length
      ? supabase
          .from('atleta_atestados')
          .select('atleta_id, validade_ate')
          .eq('escola_id', escolaId)
          .is('deleted_at', null)
          .in('atleta_id', athleteIds)
          .lte('validade_ate', limitIso)
      : Promise.resolve({ data: [] as Array<{ atleta_id: string; validade_ate: string | null }> }),
    athleteIds.length
      ? supabase
          .from('atleta_exames')
          .select('atleta_id, proximo_vencimento')
          .eq('escola_id', escolaId)
          .is('deleted_at', null)
          .in('atleta_id', athleteIds)
          .lte('proximo_vencimento', limitIso)
      : Promise.resolve({ data: [] as Array<{ atleta_id: string; proximo_vencimento: string | null }> }),
  ])

  const alertAthletes = new Set<string>()
  for (const row of atestadosRes.data ?? []) if (row.atleta_id) alertAthletes.add(row.atleta_id)
  for (const row of examesRes.data ?? []) if (row.atleta_id) alertAthletes.add(row.atleta_id)

  return {
    professorNome,
    escolaNome,
    turmas,
    aulasHoje,
    alertasEssenciais: alertAthletes.size,
    totalAlunos,
  }
}

export function formatTurmaSchedule(turma: ProfessorTurmaResumo): string {
  const base = weekdayLabel(turma.dia_semana)
  if (turma.hora_inicio && turma.hora_fim) return `${base} • ${turma.hora_inicio} - ${turma.hora_fim}`
  if (turma.hora_inicio) return `${base} • ${turma.hora_inicio}`
  return base
}
