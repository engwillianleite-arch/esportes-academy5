'use server'

import { createClient } from '@/lib/supabase/server'

export type DashboardKpis = {
  atletasAtivos: number
  turmasAtivas: number
  aulasHoje: number
  aulasComChamada: number
}

export type FinanceiroKpis = {
  receitaMes: number
  cobrancasPendentes: number
  cobrancasVencidas: number
  inadimplentesPct: number
}

export type TopTurma = {
  turmaId: string
  nome: string
  totalMatriculas: number
  capacidade: number | null
  ocupacaoPct: number
}

export type AlertaDashboard = {
  tipo: 'inadimplente' | 'baixa_frequencia' | 'chamada_pendente'
  texto: string
  sub: string
  cor: 'red' | 'orange' | 'blue'
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

// ─── KPIs financeiros do mês atual ───────────────────────────────────────────

export async function carregarFinanceiroKpis(
  escolaId: string
): Promise<{ error: string | null; kpis?: FinanceiroKpis }> {
  const supabase = await createClient()
  const now      = new Date()
  const mesStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const mesEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)

  const { data: cobsMes } = await supabase
    .from('cobrancas')
    .select('valor, status, vencimento')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .gte('vencimento', mesStart)
    .lt('vencimento', mesEnd)

  const todas   = cobsMes ?? []
  const pagas   = todas.filter(c => c.status === 'pago')
  const pend    = todas.filter(c => c.status === 'pendente')
  const venc    = todas.filter(c => c.status === 'vencido')

  const receitaMes        = pagas.reduce((s, c) => s + Number(c.valor ?? 0), 0)
  const cobrancasPendentes = pend.length
  const cobrancasVencidas  = venc.length
  const inadimplentesPct  = todas.length ? Math.round((venc.length / todas.length) * 100) : 0

  return {
    error: null,
    kpis: { receitaMes, cobrancasPendentes, cobrancasVencidas, inadimplentesPct },
  }
}

// ─── Top turmas por ocupação ──────────────────────────────────────────────────

export async function carregarTopTurmas(
  escolaId: string
): Promise<{ error: string | null; turmas?: TopTurma[] }> {
  const supabase = await createClient()

  const [{ data: turmas }, { data: matriculas }] = await Promise.all([
    supabase
      .from('turmas')
      .select('id, nome, capacidade_max')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .is('deleted_at', null),
    supabase
      .from('matriculas')
      .select('turma_id')
      .eq('escola_id', escolaId)
      .eq('status', 'ativa')
      .is('deleted_at', null),
  ])

  const matCount = new Map<string, number>()
  for (const m of matriculas ?? []) {
    if (m.turma_id) matCount.set(m.turma_id, (matCount.get(m.turma_id) ?? 0) + 1)
  }

  const result: TopTurma[] = (turmas ?? []).map(t => {
    const total = matCount.get(t.id) ?? 0
    const cap   = t.capacidade_max ?? null
    return {
      turmaId:        t.id,
      nome:           t.nome,
      totalMatriculas: total,
      capacidade:     cap,
      ocupacaoPct:    cap ? Math.min(100, Math.round((total / cap) * 100)) : 0,
    }
  }).sort((a, b) => b.totalMatriculas - a.totalMatriculas).slice(0, 5)

  return { error: null, turmas: result }
}

// ─── Alertas do dashboard ─────────────────────────────────────────────────────

export async function carregarAlertas(
  escolaId: string
): Promise<{ error: string | null; alertas?: AlertaDashboard[] }> {
  const supabase = await createClient()
  const alertas: AlertaDashboard[] = []

  // Cobranças vencidas
  const { data: vencidas } = await supabase
    .from('cobrancas')
    .select('id')
    .eq('escola_id', escolaId)
    .eq('status', 'vencido')
    .is('deleted_at', null)

  const qVencidas = vencidas?.length ?? 0
  if (qVencidas > 0) {
    alertas.push({
      tipo: 'inadimplente',
      texto: `${qVencidas} cobrança${qVencidas > 1 ? 's' : ''} vencida${qVencidas > 1 ? 's' : ''}`,
      sub: 'Verifique o módulo Financeiro',
      cor: 'red',
    })
  }

  // Chamadas pendentes de hoje
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: turmasAtivas } = await supabase
    .from('turmas')
    .select('id, nome')
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)

  // aulas table has escola_id + data_aula + turma_id
  const { data: aulasHojeData } = await supabase
    .from('aulas')
    .select('turma_id')
    .eq('escola_id', escolaId)
    .eq('data_aula', hoje)

  const turmasComChamada = new Set((aulasHojeData ?? []).map(p => p.turma_id))
  const turmasSemChamada = (turmasAtivas ?? []).filter(t => !turmasComChamada.has(t.id))

  if (turmasSemChamada.length > 0) {
    alertas.push({
      tipo: 'chamada_pendente',
      texto: `${turmasSemChamada.length} turma${turmasSemChamada.length > 1 ? 's' : ''} sem chamada hoje`,
      sub: 'Registre a presença antes do fim do dia',
      cor: 'orange',
    })
  }

  return { error: null, alertas }
}
