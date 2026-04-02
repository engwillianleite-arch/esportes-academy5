'use server'

import { createClient } from '@/lib/supabase/server'
import type { Atleta, Matricula, PerfilUsuario, PresencaRegistro, StatusPresenca, Turma } from '@/types'

const CHAMADA_PERFIS: PerfilUsuario[] = ['admin_escola', 'coordenador', 'secretaria', 'professor']

async function assertChamadaEscola(
  escolaId: string
): Promise<{ error: string } | { perfil: PerfilUsuario; userId: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }

  const { data: row } = await supabase
    .from('escola_usuarios')
    .select('perfil')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!row) return { error: 'Sem acesso a esta escola' }
  const perfil = row.perfil as PerfilUsuario
  if (!CHAMADA_PERFIS.includes(perfil)) return { error: 'Sem permissão para chamada' }

  return { perfil, userId: user.id }
}

/** Turmas ativas visíveis para chamada (professor: só onde é `professor_user_id`). */
export async function listarTurmasParaChamada(
  escolaId: string
): Promise<{ error: string | null; turmas?: Turma[] }> {
  const auth = await assertChamadaEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  let q = supabase
    .from('turmas')
    .select('*')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (auth.perfil === 'professor') {
    q = q.eq('professor_user_id', auth.userId)
  }

  const { data, error } = await q
  if (error) {
    console.error('[listarTurmasParaChamada]', error.message)
    return { error: 'Erro ao carregar turmas.' }
  }
  return { error: null, turmas: (data ?? []) as Turma[] }
}

export type LinhaChamada = {
  matricula: Matricula
  atleta: Atleta
  registro: PresencaRegistro | null
}

export type ChamadaPayload = {
  aulaId: string
  dataAula: string
  podeEditar: boolean
  linhas: LinhaChamada[]
}

/** Carrega ou cria a aula (se dentro da janela) e lista matrículas + presenças. */
export async function carregarChamada(
  escolaId: string,
  turmaId: string,
  dataAula: string
): Promise<{ error: string | null; chamada?: ChamadaPayload }> {
  const auth = await assertChamadaEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: turma, error: turmaErr } = await supabase
    .from('turmas')
    .select('id, escola_id, professor_user_id')
    .eq('id', turmaId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (turmaErr || !turma) return { error: 'Turma não encontrada.' }

  if (auth.perfil === 'professor' && turma.professor_user_id !== auth.userId) {
    return { error: 'Você não é o professor desta turma.' }
  }

  const { data: dentroDaJanela, error: rpcErr } = await supabase.rpc('chamada_pode_editar', {
    p_data: dataAula,
    p_escola_id: escolaId,
  })

  if (rpcErr) {
    console.error('[carregarChamada rpc]', rpcErr.message)
    return { error: 'Erro ao validar janela de chamada.' }
  }

  let aulaId: string | null = null

  const { data: aulaExistente } = await supabase
    .from('aulas')
    .select('id')
    .eq('turma_id', turmaId)
    .eq('data_aula', dataAula)
    .maybeSingle()

  if (aulaExistente) {
    aulaId = aulaExistente.id
  } else if (dentroDaJanela) {
    const { data: criada, error: insErr } = await supabase
      .from('aulas')
      .insert({
        escola_id: escolaId,
        turma_id: turmaId,
        data_aula: dataAula,
      })
      .select('id')
      .single()

    if (insErr) {
      if (insErr.code === '23505') {
        const { data: retry } = await supabase
          .from('aulas')
          .select('id')
          .eq('turma_id', turmaId)
          .eq('data_aula', dataAula)
          .maybeSingle()
        if (retry) aulaId = retry.id
      } else {
        console.error('[carregarChamada insert aula]', insErr.message)
        return { error: 'Erro ao abrir a aula.' }
      }
    } else if (criada) {
      aulaId = criada.id
    }
  }

  const { data: matRows, error: mErr } = await supabase
    .from('matriculas')
    .select('*')
    .eq('escola_id', escolaId)
    .eq('turma_id', turmaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (mErr) {
    console.error('[carregarChamada matriculas]', mErr.message)
    return { error: 'Erro ao carregar matrículas.' }
  }

  const matriculasList = (matRows ?? []) as Matricula[]
  const atletaIds = [...new Set(matriculasList.map((m) => m.atleta_id))]
  let atletaMap = new Map<string, Atleta>()
  if (atletaIds.length > 0) {
    const { data: atletasRows, error: aErr } = await supabase
      .from('atletas')
      .select('*')
      .in('id', atletaIds)
    if (aErr) {
      console.error('[carregarChamada atletas]', aErr.message)
      return { error: 'Erro ao carregar atletas.' }
    }
    atletaMap = new Map((atletasRows as Atleta[]).map((a) => [a.id, a]))
  }

  let presencas: PresencaRegistro[] = []
  if (aulaId) {
    const { data: pr, error: pErr } = await supabase
      .from('presencas_registros')
      .select('*')
      .eq('aula_id', aulaId)

    if (pErr) {
      console.error('[carregarChamada presencas]', pErr.message)
      return { error: 'Erro ao carregar presenças.' }
    }
    presencas = (pr ?? []) as PresencaRegistro[]
  }

  const porMatricula = new Map(presencas.map((p) => [p.matricula_id, p]))

  const linhas: LinhaChamada[] = matriculasList
    .map((m) => {
      const atleta = atletaMap.get(m.atleta_id) ?? null
      return atleta
        ? {
            matricula: m,
            atleta,
            registro: porMatricula.get(m.id) ?? null,
          }
        : null
    })
    .filter((x): x is LinhaChamada => x !== null)

  const podeEditar = !!dentroDaJanela && !!aulaId

  return {
    error: null,
    chamada: {
      aulaId: aulaId ?? '',
      dataAula,
      podeEditar,
      linhas,
    },
  }
}

/** Ajuste quando não há aula ainda (fora da janela): podeEditar false e aula vazia. */
export async function salvarPresencaLinha(
  escolaId: string,
  aulaId: string,
  matriculaId: string,
  status: StatusPresenca
): Promise<{ error: string | null }> {
  const auth = await assertChamadaEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: aula, error: aErr } = await supabase
    .from('aulas')
    .select('id, escola_id, data_aula, turma_id')
    .eq('id', aulaId)
    .maybeSingle()

  if (aErr || !aula) return { error: 'Aula não encontrada.' }
  if (aula.escola_id !== escolaId) return { error: 'Aula inválida.' }

  if (auth.perfil === 'professor') {
    const { data: t } = await supabase
      .from('turmas')
      .select('professor_user_id')
      .eq('id', aula.turma_id)
      .maybeSingle()
    if (!t || t.professor_user_id !== auth.userId) return { error: 'Sem permissão.' }
  }

  const { data: podeEditar, error: rpcErr } = await supabase.rpc('chamada_pode_editar', {
    p_data: aula.data_aula,
    p_escola_id: escolaId,
  })
  if (rpcErr || !podeEditar) {
    return { error: 'Esta data está fora da janela de edição da chamada.' }
  }

  const { error } = await supabase.from('presencas_registros').upsert(
    {
      aula_id: aulaId,
      matricula_id: matriculaId,
      status,
    },
    { onConflict: 'aula_id,matricula_id' }
  )

  if (error) {
    console.error('[salvarPresencaLinha]', error.message)
    return { error: 'Erro ao salvar presença.' }
  }
  return { error: null }
}
