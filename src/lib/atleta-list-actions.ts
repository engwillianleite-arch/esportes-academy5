'use server'

import { createClient } from '@/lib/supabase/server'
import { cleanCpf } from '@/lib/cpf'
import type { StatusMatricula } from '@/types/database'

export type MatriculaAtletaListRow = {
  matricula_id: string
  status: StatusMatricula
  valor_liquido: number
  data_inicio: string
  tipo_periodo: string
  atleta: {
    id: string
    nome: string
    cpf: string
    foto_url: string | null
    data_nascimento: string
  }
}

function sanitizeIlike(q: string): string {
  return q.replace(/[%_,]/g, '').trim()
}

/** Resolve atleta IDs por nome/CPF do atleta ou nome, e-mail ou CPF do responsável. */
async function resolveAtletaIdsFromSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string
): Promise<string[]> {
  const raw = sanitizeIlike(q)
  if (!raw) return []

  const like = `%${raw}%`
  const clean = cleanCpf(raw)
  const ids = new Set<string>()

  if (clean.length === 11) {
    const { data: atletaExato } = await supabase
      .from('atletas')
      .select('id')
      .eq('cpf', clean)
      .is('deleted_at', null)
    for (const row of atletaExato ?? []) {
      ids.add(row.id as string)
    }
    const { data: respExato } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('cpf', clean)
      .is('deleted_at', null)
    const respIds = (respExato ?? []).map((r) => r.id as string)
    if (respIds.length > 0) {
      const { data: linksCpf } = await supabase
        .from('atleta_responsaveis')
        .select('atleta_id')
        .in('responsavel_id', respIds)
        .is('deleted_at', null)
      for (const row of linksCpf ?? []) {
        ids.add(row.atleta_id as string)
      }
    }
  }

  const orAtleta = [`nome.ilike.${like}`]
  if (clean.length >= 3) orAtleta.push(`cpf.ilike.%${clean}%`)

  const { data: atletasMatch } = await supabase
    .from('atletas')
    .select('id')
    .or(orAtleta.join(','))
    .is('deleted_at', null)

  for (const row of atletasMatch ?? []) {
    ids.add(row.id as string)
  }

  const orResp = [`nome.ilike.${like}`, `email.ilike.${like}`]
  if (clean.length >= 3 && clean.length <= 11) {
    orResp.push(`cpf.ilike.%${clean}%`)
  }

  const { data: respMatch } = await supabase
    .from('responsaveis')
    .select('id')
    .or(orResp.join(','))
    .is('deleted_at', null)

  const respIds = (respMatch ?? []).map((r) => r.id as string)
  if (respIds.length > 0) {
    const { data: links } = await supabase
      .from('atleta_responsaveis')
      .select('atleta_id')
      .in('responsavel_id', respIds)
      .is('deleted_at', null)

    for (const row of links ?? []) {
      ids.add(row.atleta_id as string)
    }
  }

  return [...ids]
}

export async function listarMatriculasAtletasEscola(
  escolaId: string,
  params: {
    q?: string
    status?: StatusMatricula | 'todos' | ''
    turmaId?: string | 'sem_turma' | 'todas' | ''
    page?: number
    pageSize?: number
  }
): Promise<{ error: string | null; rows?: MatriculaAtletaListRow[]; total?: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 15))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const qRaw = params.q?.trim() ?? ''
  let atletaIds: string[] | null = null
  if (qRaw) {
    atletaIds = await resolveAtletaIdsFromSearch(supabase, qRaw)
    if (atletaIds.length === 0) {
      return { error: null, rows: [], total: 0 }
    }
  }

  let query = supabase
    .from('matriculas')
    .select(
      `
      id,
      status,
      valor_liquido,
      data_inicio,
      tipo_periodo,
      atleta:atletas!inner(id, nome, cpf, foto_url, data_nascimento)
    `,
      { count: 'exact' }
    )
    .eq('escola_id', escolaId)
    .is('deleted_at', null)

  const st = params.status
  if (st && st !== 'todos') {
    query = query.eq('status', st)
  }

  const turmaId = params.turmaId
  if (turmaId && turmaId !== 'todas') {
    if (turmaId === 'sem_turma') {
      query = query.is('turma_id', null)
    } else {
      query = query.eq('turma_id', turmaId)
    }
  }

  if (atletaIds) {
    query = query.in('atleta_id', atletaIds)
  }

  const { data, error, count } = await query
    .order('data_inicio', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[listarMatriculasAtletasEscola]', error.message)
    return { error: 'Erro ao carregar atletas.' }
  }

  const rows: MatriculaAtletaListRow[] = []
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const rawA = r.atleta as Record<string, unknown> | Record<string, unknown>[] | null | undefined
    const a = (Array.isArray(rawA) ? rawA[0] : rawA) as Record<string, unknown> | undefined
    if (!a?.id) continue
    rows.push({
      matricula_id: r.id as string,
      status: r.status as StatusMatricula,
      valor_liquido: Number(r.valor_liquido),
      data_inicio: r.data_inicio as string,
      tipo_periodo: r.tipo_periodo as string,
      atleta: {
        id: a.id as string,
        nome: a.nome as string,
        cpf: a.cpf as string,
        foto_url: (a.foto_url as string | null) ?? null,
        data_nascimento: a.data_nascimento as string,
      },
    })
  }

  return { error: null, rows, total: count ?? 0 }
}
