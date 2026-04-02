'use server'

import { createClient } from '@/lib/supabase/server'

type TipoExame = 'clinico' | 'esportivo' | 'laboratorial'

type AtletaSaudeOption = {
  atleta_id: string
  matricula_id: string
  atleta_nome: string
}

export type SaudeRegistroRow = {
  id: string
  atleta_id: string
  atleta_nome: string
  tipo_registro: 'exame' | 'atestado'
  categoria: string
  titulo: string
  data_referencia: string
  validade_ate: string | null
  status_alerta: 'ok' | 'vence_em_breve' | 'vencido' | 'sem_validade'
  resumo: string | null
  arquivo_url: string | null
}

const SAUDE_PERFIS = ['admin_escola', 'coordenador', 'saude'] as const

async function assertSaudeEscola(escolaId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado' }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .in('perfil', [...SAUDE_PERFIS])
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão para o módulo saúde' }
  return { ok: true }
}

function getAlertaStatus(validade: string | null): SaudeRegistroRow['status_alerta'] {
  if (!validade) return 'sem_validade'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${validade}T00:00:00`)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return 'vencido'
  if (diffDays <= 15) return 'vence_em_breve'
  return 'ok'
}

export async function listarAtletasSaude(
  escolaId: string
): Promise<{ error: string | null; rows?: AtletaSaudeOption[] }> {
  const auth = await assertSaudeEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matriculas')
    .select('id, atleta:atletas!inner(id, nome)')
    .eq('escola_id', escolaId)
    .in('status', ['ativa', 'suspensa'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listarAtletasSaude]', error.message)
    return { error: 'Erro ao carregar atletas do módulo saúde.' }
  }

  const rows: AtletaSaudeOption[] = []
  const seen = new Set<string>()

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const rawA = r.atleta as Record<string, unknown> | Record<string, unknown>[] | null | undefined
    const atleta = (Array.isArray(rawA) ? rawA[0] : rawA) as Record<string, unknown> | undefined
    if (!r.id || !atleta?.id || !atleta?.nome) continue
    if (seen.has(atleta.id as string)) continue
    seen.add(atleta.id as string)
    rows.push({
      atleta_id: atleta.id as string,
      matricula_id: r.id as string,
      atleta_nome: atleta.nome as string,
    })
  }

  return { error: null, rows }
}

export async function listarRegistrosSaudeEscola(
  escolaId: string
): Promise<{
  error: string | null
  rows?: SaudeRegistroRow[]
  alertas?: {
    vencidos: number
    proximos: number
    exames: number
    atestados: number
  }
}> {
  const auth = await assertSaudeEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const [examesRes, atestadosRes, atletasRes] = await Promise.all([
    supabase
      .from('atleta_exames')
      .select(
        'id, atleta_id, tipo_exame, titulo, data_exame, resultado_resumido, arquivo_url, proximo_vencimento'
      )
      .eq('escola_id', escolaId)
      .is('deleted_at', null)
      .order('data_exame', { ascending: false })
      .limit(100),
    supabase
      .from('atleta_atestados')
      .select('id, atleta_id, titulo, observacao, data_emissao, validade_ate, arquivo_url')
      .eq('escola_id', escolaId)
      .is('deleted_at', null)
      .order('data_emissao', { ascending: false })
      .limit(100),
    supabase.from('atletas').select('id, nome').is('deleted_at', null),
  ])

  if (examesRes.error) {
    console.error('[listarRegistrosSaudeEscola.exames]', examesRes.error.message)
    return { error: 'Erro ao carregar exames.' }
  }

  if (atestadosRes.error) {
    console.error('[listarRegistrosSaudeEscola.atestados]', atestadosRes.error.message)
    return { error: 'Erro ao carregar atestados.' }
  }

  const atletaMap = new Map((atletasRes.data ?? []).map((row) => [row.id, row.nome]))

  const exameRows: SaudeRegistroRow[] = (examesRes.data ?? []).map((row) => ({
    id: row.id,
    atleta_id: row.atleta_id,
    atleta_nome: atletaMap.get(row.atleta_id) ?? 'Atleta',
    tipo_registro: 'exame',
    categoria: row.tipo_exame,
    titulo: row.titulo,
    data_referencia: row.data_exame,
    validade_ate: row.proximo_vencimento,
    status_alerta: getAlertaStatus(row.proximo_vencimento),
    resumo: row.resultado_resumido,
    arquivo_url: row.arquivo_url,
  }))

  const atestadoRows: SaudeRegistroRow[] = (atestadosRes.data ?? []).map((row) => ({
    id: row.id,
    atleta_id: row.atleta_id,
    atleta_nome: atletaMap.get(row.atleta_id) ?? 'Atleta',
    tipo_registro: 'atestado',
    categoria: 'atestado',
    titulo: row.titulo,
    data_referencia: row.data_emissao,
    validade_ate: row.validade_ate,
    status_alerta: getAlertaStatus(row.validade_ate),
    resumo: row.observacao,
    arquivo_url: row.arquivo_url,
  }))

  const rows = [...exameRows, ...atestadoRows].sort(
    (a, b) => new Date(b.data_referencia).getTime() - new Date(a.data_referencia).getTime()
  )

  return {
    error: null,
    rows,
    alertas: {
      vencidos: rows.filter((row) => row.status_alerta === 'vencido').length,
      proximos: rows.filter((row) => row.status_alerta === 'vence_em_breve').length,
      exames: exameRows.length,
      atestados: atestadoRows.length,
    },
  }
}

export async function criarExameSaude(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertSaudeEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const atletaId = (formData.get('atleta_id') as string | null)?.trim() ?? ''
  const matriculaId = (formData.get('matricula_id') as string | null)?.trim() ?? ''
  const tipoExame = ((formData.get('tipo_exame') as string | null)?.trim() ?? '') as TipoExame
  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const dataExame = (formData.get('data_exame') as string | null)?.trim() ?? ''
  const resultadoResumido = (formData.get('resultado_resumido') as string | null)?.trim() || null
  const arquivoUrl = (formData.get('arquivo_url') as string | null)?.trim() || null
  const recorrente = (formData.get('recorrente') as string | null) === 'true'
  const proximoVencimento = (formData.get('proximo_vencimento') as string | null)?.trim() || null

  if (!atletaId || !matriculaId) return { error: 'Selecione um atleta válido.' }
  if (!['clinico', 'esportivo', 'laboratorial'].includes(tipoExame)) {
    return { error: 'Tipo de exame inválido.' }
  }
  if (!titulo) return { error: 'Título do exame é obrigatório.' }
  if (!dataExame) return { error: 'Data do exame é obrigatória.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('atleta_exames').insert({
    atleta_id: atletaId,
    escola_id: escolaId,
    matricula_id: matriculaId,
    tipo_exame: tipoExame,
    titulo,
    data_exame: dataExame,
    resultado_resumido: resultadoResumido,
    arquivo_url: arquivoUrl,
    recorrente,
    proximo_vencimento: proximoVencimento,
    criado_por: user?.id ?? null,
  })

  if (error) {
    console.error('[criarExameSaude]', error.message)
    return { error: 'Erro ao registrar exame.' }
  }

  return { error: null }
}

export async function criarAtestadoSaude(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertSaudeEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const atletaId = (formData.get('atleta_id') as string | null)?.trim() ?? ''
  const matriculaId = (formData.get('matricula_id') as string | null)?.trim() ?? ''
  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const dataEmissao = (formData.get('data_emissao') as string | null)?.trim() ?? ''
  const validadeAte = (formData.get('validade_ate') as string | null)?.trim() || null
  const observacao = (formData.get('observacao') as string | null)?.trim() || null
  const arquivoUrl = (formData.get('arquivo_url') as string | null)?.trim() || null

  if (!atletaId || !matriculaId) return { error: 'Selecione um atleta válido.' }
  if (!titulo) return { error: 'Título do atestado é obrigatório.' }
  if (!dataEmissao) return { error: 'Data de emissão é obrigatória.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('atleta_atestados').insert({
    atleta_id: atletaId,
    escola_id: escolaId,
    matricula_id: matriculaId,
    titulo,
    observacao,
    data_emissao: dataEmissao,
    validade_ate: validadeAte,
    arquivo_url: arquivoUrl,
    criado_por: user?.id ?? null,
  })

  if (error) {
    console.error('[criarAtestadoSaude]', error.message)
    return { error: 'Erro ao registrar atestado.' }
  }

  return { error: null }
}
