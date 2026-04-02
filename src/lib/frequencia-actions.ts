'use server'

import { createClient } from '@/lib/supabase/server'

export type FrequenciaResumo = {
  total: number
  presentes: number
  /** 0–100 ou null se não há registros */
  percentual: number | null
}

export type HistoricoPresencaLinha = {
  data_aula: string
  turma_nome: string
  status: string
}

/** Mapa matricula_id → resumo (lote para lista de atletas). */
export async function frequenciaResumoMatriculas(
  escolaId: string,
  matriculaIds: string[]
): Promise<{ error: string | null; map?: Record<string, FrequenciaResumo> }> {
  if (matriculaIds.length === 0) return { error: null, map: {} }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('frequencia_resumo_matriculas', {
    p_escola_id: escolaId,
    p_matricula_ids: matriculaIds,
  })

  if (error) {
    console.error('[frequenciaResumoMatriculas]', error.message)
    return { error: 'Erro ao carregar frequência.' }
  }

  const map: Record<string, FrequenciaResumo> = {}
  for (const row of data ?? []) {
    const total = Number(row.total)
    const presentes = Number(row.presentes)
    const matId = row.matricula_id as string
    map[matId] = {
      total,
      presentes,
      percentual: total > 0 ? Math.round((100 * presentes) / total) : null,
    }
  }
  return { error: null, map }
}

export type FrequenciaDetalhe = {
  resumo: FrequenciaResumo
  historico: HistoricoPresencaLinha[]
}

export async function carregarFrequenciaDetalhe(
  escolaId: string,
  matriculaId: string
): Promise<{ error: string | null; detalhe?: FrequenciaDetalhe }> {
  const supabase = await createClient()

  const [resumoRpc, histRpc] = await Promise.all([
    supabase.rpc('frequencia_resumo_matriculas', {
      p_escola_id: escolaId,
      p_matricula_ids: [matriculaId],
    }),
    supabase.rpc('historico_presencas_matricula', {
      p_escola_id: escolaId,
      p_matricula_id: matriculaId,
    }),
  ])

  if (resumoRpc.error) {
    console.error('[carregarFrequenciaDetalhe resumo]', resumoRpc.error.message)
    return { error: 'Erro ao carregar frequência.' }
  }
  if (histRpc.error) {
    console.error('[carregarFrequenciaDetalhe hist]', histRpc.error.message)
    return { error: 'Erro ao carregar histórico de presenças.' }
  }

  const r0 = (resumoRpc.data ?? [])[0]
  const total = r0 ? Number(r0.total) : 0
  const presentes = r0 ? Number(r0.presentes) : 0
  const resumo: FrequenciaResumo = {
    total,
    presentes,
    percentual: total > 0 ? Math.round((100 * presentes) / total) : null,
  }

  const historico: HistoricoPresencaLinha[] = (histRpc.data ?? []).map((h) => ({
    data_aula: h.data_aula as string,
    turma_nome: h.turma_nome as string,
    status: h.status as string,
  }))

  return { error: null, detalhe: { resumo, historico } }
}
