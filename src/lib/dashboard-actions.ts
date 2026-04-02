'use server'

import { createClient } from '@/lib/supabase/server'

export type DashboardKpis = {
  atletasAtivos: number
  turmasAtivas: number
  aulasHoje: number
  aulasComChamada: number
}

export type AulaHojeStatus = {
  turmaId: string
  turmaNome: string
  matriculasAtivas: number
  registrosPresenca: number
  chamadaFeita: boolean
}

export type AniversarianteMes = {
  atletaId: string
  nome: string
  dataNascimento: string
  diaAniversario: number
  turmaNome: string | null
}

export async function carregarDashboardKpis(
  escolaId: string
): Promise<{ error: string | null; kpis?: DashboardKpis }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('dashboard_kpis_escola', {
    p_escola_id: escolaId,
  })

  if (error) {
    console.error('[carregarDashboardKpis]', error.message)
    return { error: 'Erro ao carregar dados do dashboard.' }
  }

  const row = (data as unknown[])[0] as Record<string, unknown> | undefined
  if (!row) {
    return {
      error: null,
      kpis: { atletasAtivos: 0, turmasAtivas: 0, aulasHoje: 0, aulasComChamada: 0 },
    }
  }

  return {
    error: null,
    kpis: {
      atletasAtivos:   Number(row.atletas_ativos   ?? 0),
      turmasAtivas:    Number(row.turmas_ativas     ?? 0),
      aulasHoje:       Number(row.aulas_hoje        ?? 0),
      aulasComChamada: Number(row.aulas_com_chamada ?? 0),
    },
  }
}

export async function carregarAulasHojeStatus(
  escolaId: string,
  userId: string,
  perfil: string
): Promise<{ error: string | null; aulas?: AulaHojeStatus[] }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('aulas_hoje_status', {
    p_escola_id: escolaId,
    p_user_id:   userId,
    p_perfil:    perfil,
  })

  if (error) {
    console.error('[carregarAulasHojeStatus]', error.message)
    return { error: 'Erro ao carregar aulas de hoje.' }
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  return {
    error: null,
    aulas: rows.map((r) => ({
      turmaId:           r.turma_id as string,
      turmaNome:         r.turma_nome as string,
      matriculasAtivas:  Number(r.matriculas_ativas  ?? 0),
      registrosPresenca: Number(r.registros_presenca ?? 0),
      chamadaFeita:      Boolean(r.chamada_feita),
    })),
  }
}

export async function carregarAniversariantesMes(
  escolaId: string
): Promise<{ error: string | null; aniversariantes?: AniversarianteMes[] }> {
  const supabase = await createClient()
  const currentMonth = new Date().getMonth() + 1

  const { data: matriculas, error } = await supabase
    .from('matriculas')
    .select('id, atleta_id, turma_id, created_at')
    .eq('escola_id', escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[carregarAniversariantesMes]', error.message)
    return { error: 'Erro ao carregar aniversariantes do mês.' }
  }

  const atletaIds = [...new Set((matriculas ?? []).map((row) => row.atleta_id))]
  const turmaIds = [
    ...new Set((matriculas ?? []).map((row) => row.turma_id).filter(Boolean)),
  ] as string[]

  const [{ data: atletas }, { data: turmas }] = await Promise.all([
    atletaIds.length
      ? supabase
          .from('atletas')
          .select('id, nome, data_nascimento')
          .in('id', atletaIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] as Array<{ id: string; nome: string; data_nascimento: string }> }),
    turmaIds.length
      ? supabase.from('turmas').select('id, nome').in('id', turmaIds).is('deleted_at', null)
      : Promise.resolve({ data: [] as Array<{ id: string; nome: string }> }),
  ])

  const atletaMap = new Map((atletas ?? []).map((atleta) => [atleta.id, atleta]))
  const turmaMap = new Map((turmas ?? []).map((turma) => [turma.id, turma.nome]))
  const uniqueByAtleta = new Map<string, AniversarianteMes>()

  for (const row of matriculas ?? []) {
    const atleta = atletaMap.get(row.atleta_id)
    if (!atleta) continue
    if (uniqueByAtleta.has(atleta.id)) continue

    const birthDate = new Date(`${atleta.data_nascimento}T12:00:00`)
    const birthMonth = birthDate.getMonth() + 1
    if (birthMonth !== currentMonth) continue

    uniqueByAtleta.set(atleta.id, {
      atletaId: atleta.id,
      nome: atleta.nome,
      dataNascimento: atleta.data_nascimento,
      diaAniversario: birthDate.getDate(),
      turmaNome: row.turma_id ? turmaMap.get(row.turma_id) ?? null : null,
    })
  }

  return {
    error: null,
    aniversariantes: [...uniqueByAtleta.values()].sort((a, b) => a.diaAniversario - b.diaAniversario),
  }
}
