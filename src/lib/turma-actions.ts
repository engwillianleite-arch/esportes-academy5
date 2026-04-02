'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { Turma } from '@/types'

type TurmaInsert = Database['public']['Tables']['turmas']['Insert']

async function assertAdminEscola(escolaId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }
  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('perfil', 'admin_escola')
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()
  if (!membership) return { error: 'Sem permissão' }
  return null
}

function parseTurmaForm(formData: FormData) {
  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const modalidade = (formData.get('modalidade') as string | null)?.trim() ?? ''
  const local = (formData.get('local') as string | null)?.trim() || null
  const capacidadeMax = parseInt(formData.get('capacidade_max') as string, 10)
  const idadeMinRaw = (formData.get('idade_min') as string | null)?.trim()
  const idadeMaxRaw = (formData.get('idade_max') as string | null)?.trim()
  const professorNome = (formData.get('professor_nome') as string | null)?.trim() || null
  const professorUserRaw = (formData.get('professor_user_id') as string | null)?.trim()
  const professorUserId =
    professorUserRaw && professorUserRaw !== '' && professorUserRaw !== 'none'
      ? professorUserRaw
      : null
  const diaRaw = (formData.get('dia_semana') as string | null)?.trim()
  const horaInicio = (formData.get('hora_inicio') as string | null)?.trim() || null
  const horaFim = (formData.get('hora_fim') as string | null)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  let idadeMin: number | null = idadeMinRaw ? parseInt(idadeMinRaw, 10) : null
  let idadeMax: number | null = idadeMaxRaw ? parseInt(idadeMaxRaw, 10) : null
  if (idadeMin !== null && isNaN(idadeMin)) idadeMin = null
  if (idadeMax !== null && isNaN(idadeMax)) idadeMax = null
  let dia_semana: number | null = null
  if (diaRaw && diaRaw !== '') {
    const d = parseInt(diaRaw, 10)
    if (!isNaN(d) && d >= 0 && d <= 6) dia_semana = d
  }

  return {
    nome,
    modalidade,
    local,
    capacidadeMax,
    idadeMin,
    idadeMax,
    professorNome,
    professorUserId,
    dia_semana,
    horaInicio: horaInicio && horaInicio.length > 0 ? horaInicio : null,
    horaFim: horaFim && horaFim.length > 0 ? horaFim : null,
    ativo,
  }
}

function validateTurmaFields(p: ReturnType<typeof parseTurmaForm>): string | null {
  if (!p.nome) return 'Nome da turma é obrigatório'
  if (!p.modalidade) return 'Modalidade é obrigatória'
  if (isNaN(p.capacidadeMax) || p.capacidadeMax < 1) return 'Capacidade deve ser pelo menos 1'
  if (p.idadeMin !== null && (p.idadeMin < 0 || p.idadeMin > 120)) return 'Idade mínima inválida'
  if (p.idadeMax !== null && (p.idadeMax < 0 || p.idadeMax > 120)) return 'Idade máxima inválida'
  if (p.idadeMin !== null && p.idadeMax !== null && p.idadeMax < p.idadeMin) {
    return 'Idade máxima deve ser ≥ idade mínima'
  }
  const hi = p.horaInicio
  const hf = p.horaFim
  if ((hi && !hf) || (!hi && hf)) return 'Informe início e fim do horário, ou deixe ambos vazios'
  return null
}

export async function listarTurmasAtivasEscola(
  escolaId: string
): Promise<{ error: string | null; turmas?: Turma[] }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) {
    console.error('[listarTurmasAtivasEscola]', error.message)
    return { error: 'Erro ao carregar turmas.' }
  }
  return { error: null, turmas: (data ?? []) as Turma[] }
}

export async function criarTurma(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const p = parseTurmaForm(formData)
  const ve = validateTurmaFields(p)
  if (ve) return { error: ve }

  const row: TurmaInsert = {
    escola_id: escolaId,
    nome: p.nome,
    modalidade: p.modalidade,
    local: p.local,
    capacidade_max: p.capacidadeMax,
    idade_min: p.idadeMin,
    idade_max: p.idadeMax,
    professor_nome: p.professorNome,
    professor_user_id: p.professorUserId,
    dia_semana: p.dia_semana,
    hora_inicio: p.horaInicio,
    hora_fim: p.horaFim,
    ativo: p.ativo,
  }

  const supabase = await createClient()
  const { error } = await supabase.from('turmas').insert(row)
  if (error) {
    console.error('[criarTurma]', error.message)
    return { error: 'Erro ao criar turma.' }
  }
  redirect('/painel/turmas')
}

export async function atualizarTurma(
  escolaId: string,
  turmaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const p = parseTurmaForm(formData)
  const ve = validateTurmaFields(p)
  if (ve) return { error: ve }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('turmas')
    .update({
      nome: p.nome,
      modalidade: p.modalidade,
      local: p.local,
      capacidade_max: p.capacidadeMax,
      idade_min: p.idadeMin,
      idade_max: p.idadeMax,
      professor_nome: p.professorNome,
      professor_user_id: p.professorUserId,
      dia_semana: p.dia_semana,
      hora_inicio: p.horaInicio,
      hora_fim: p.horaFim,
      ativo: p.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', turmaId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .select('id')

  if (error) {
    console.error('[atualizarTurma]', error.message)
    return { error: 'Erro ao atualizar turma.' }
  }
  if (!updated?.length) return { error: 'Turma não encontrada.' }
  redirect('/painel/turmas')
}

export async function deletarTurma(
  escolaId: string,
  turmaId: string
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const { count } = await supabase
    .from('matriculas')
    .select('*', { count: 'exact', head: true })
    .eq('turma_id', turmaId)
    .eq('escola_id', escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)

  if (count && count > 0) {
    return {
      error: 'Não é possível excluir: há matrículas ativas vinculadas a esta turma.',
    }
  }

  const { data: rows, error } = await supabase
    .from('turmas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', turmaId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .select('id')

  if (error) {
    console.error('[deletarTurma]', error.message)
    return { error: 'Erro ao excluir turma.' }
  }
  if (!rows?.length) return { error: 'Turma não encontrada.' }
  redirect('/painel/turmas')
}
