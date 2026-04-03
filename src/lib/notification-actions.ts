'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Shared ownership guard ───────────────────────────────────────────────────

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

// ─── Save notification settings ──────────────────────────────────────────────

export async function salvarConfiguracoesNotificacoes(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const notifEmail              = formData.get('notif_email') === 'true'
  const notifPush               = formData.get('notif_push') === 'true'
  const notifWhatsapp           = formData.get('notif_whatsapp') === 'true'
  const notifSms                = formData.get('notif_sms') === 'true'
  const notifCobrancaLembreteD3 = formData.get('notif_cobranca_lembrete_d3') === 'true'
  const notifCobrancaLembreteD1 = formData.get('notif_cobranca_lembrete_d1') === 'true'
  const notifCobrancaVencida    = formData.get('notif_cobranca_vencida') === 'true'
  const notifCobrancaConfirmacao = formData.get('notif_cobranca_confirmacao') === 'true'
  const notifFrequenciaBaixa    = formData.get('notif_frequencia_baixa') === 'true'
  const notifAusencia           = formData.get('notif_ausencia') === 'true'
  const notifRelatorioMensal    = formData.get('notif_relatorio_mensal') === 'true'
  const notifAniversarioAtleta  = formData.get('notif_aniversario_atleta') === 'true'

  const { error } = await supabase
    .from('escolas')
    .update({
      notif_email:               notifEmail,
      notif_push:                notifPush,
      notif_whatsapp:            notifWhatsapp,
      notif_sms:                 notifSms,
      notif_cobranca_lembrete_d3: notifCobrancaLembreteD3,
      notif_cobranca_lembrete_d1: notifCobrancaLembreteD1,
      notif_cobranca_vencida:    notifCobrancaVencida,
      notif_cobranca_confirmacao: notifCobrancaConfirmacao,
      notif_frequencia_baixa:    notifFrequenciaBaixa,
      notif_ausencia:            notifAusencia,
      notif_relatorio_mensal:    notifRelatorioMensal,
      notif_aniversario_atleta:  notifAniversarioAtleta,
    })
    .eq('id', escolaId)

  if (error) {
    console.error('[salvarConfiguracoesNotificacoes]', error.message)
    return { error: 'Erro ao salvar notificações. Tente novamente.' }
  }

  redirect('/painel/configuracoes')
}

type EventoNotificacaoTipo =
  | 'cobranca_vencendo_d3'
  | 'cobranca_vencendo_d1'
  | 'cobranca_vencida'
  | 'cobranca_confirmada'
  | 'ausencia'
  | 'frequencia_baixa'
  | 'comunicado'
  | 'check_in'
  | 'check_out'
  | 'aniversario_atleta'

function prefColumnForEvent(evento: EventoNotificacaoTipo): keyof {
  notif_cobranca_lembrete_d3: boolean
  notif_cobranca_lembrete_d1: boolean
  notif_cobranca_vencida: boolean
  notif_cobranca_confirmacao: boolean
  notif_ausencia: boolean
  notif_frequencia_baixa: boolean
  notif_relatorio_mensal: boolean
  notif_aniversario_atleta: boolean
} {
  const map: Record<Exclude<EventoNotificacaoTipo, 'check_in' | 'check_out'>, keyof {
    notif_cobranca_lembrete_d3: boolean
    notif_cobranca_lembrete_d1: boolean
    notif_cobranca_vencida: boolean
    notif_cobranca_confirmacao: boolean
    notif_ausencia: boolean
    notif_frequencia_baixa: boolean
    notif_relatorio_mensal: boolean
    notif_aniversario_atleta: boolean
  }> = {
    cobranca_vencendo_d3: 'notif_cobranca_lembrete_d3',
    cobranca_vencendo_d1: 'notif_cobranca_lembrete_d1',
    cobranca_vencida: 'notif_cobranca_vencida',
    cobranca_confirmada: 'notif_cobranca_confirmacao',
    ausencia: 'notif_ausencia',
    frequencia_baixa: 'notif_frequencia_baixa',
    comunicado: 'notif_relatorio_mensal',
    aniversario_atleta: 'notif_aniversario_atleta',
  }
  return map[evento as Exclude<EventoNotificacaoTipo, 'check_in' | 'check_out'>]
}

async function assertComunicacaoEscola(
  escolaId: string
): Promise<{ error: string } | { userId: string }> {
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
    .in('perfil', ['admin_escola', 'coordenador', 'secretaria', 'marketing'])
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão para comunicação nesta escola' }
  return { userId: user.id }
}

export async function enqueueEventoNotificacao(
  escolaId: string,
  eventoTipo: EventoNotificacaoTipo,
  payload: Record<string, unknown>,
  idempotencyKey?: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const usesGeneralChannelPreference =
    eventoTipo === 'check_in' || eventoTipo === 'check_out'
  const prefColumn = usesGeneralChannelPreference ? null : prefColumnForEvent(eventoTipo)
  const { data: escola } = await supabase
    .from('escolas')
    .select(
      'id, notif_email, notif_push, notif_cobranca_lembrete_d3, notif_cobranca_lembrete_d1, notif_cobranca_vencida, notif_cobranca_confirmacao, notif_frequencia_baixa, notif_ausencia, notif_relatorio_mensal, notif_aniversario_atleta'
    )
    .eq('id', escolaId)
    .maybeSingle()

  if (!escola) return { error: 'Escola não encontrada.' }
  const prefEnabled = prefColumn
    ? Boolean((escola as Record<string, unknown>)[prefColumn])
    : Boolean(escola.notif_push || escola.notif_email)
  if (!prefEnabled) return { error: null }

  const { error } = await supabase.from('notificacoes_outbox').insert({
    escola_id: escolaId,
    evento_tipo: eventoTipo,
    ref_tipo: (payload.ref_tipo as string | undefined) ?? null,
    ref_id: (payload.ref_id as string | undefined) ?? null,
    payload,
    status: 'queued',
    idempotency_key: idempotencyKey ?? null,
  })

  if (error && error.code !== '23505') {
    console.error('[enqueueEventoNotificacao]', error.message)
    return { error: 'Erro ao enfileirar evento de notificação.' }
  }

  return { error: null }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function buildMensagemAniversario(atletaNome: string, escolaNome: string): string {
  return `Olá Atleta ${atletaNome}, hoje é um dia muito especial na sua vida, desejamos muitos anos de vida, muita saúde paz e prosperidade, Estes são os votos da ${escolaNome}`
}

export async function enqueueAniversariantesHoje(params?: {
  escolaId?: string
  referenceDate?: string
}): Promise<{
  error: string | null
  queued?: number
}> {
  const admin = createAdminClient()
  const baseDate = params?.referenceDate ? new Date(`${params.referenceDate}T12:00:00`) : new Date()

  if (Number.isNaN(baseDate.getTime())) {
    return { error: 'Data de referência inválida.' }
  }

  const todayMonthDay = `${pad2(baseDate.getMonth() + 1)}-${pad2(baseDate.getDate())}`
  const isoDate = `${baseDate.getFullYear()}-${pad2(baseDate.getMonth() + 1)}-${pad2(baseDate.getDate())}`

  let escolasQuery = admin
    .from('escolas')
    .select('id, nome, notif_email, notif_push, notif_aniversario_atleta')
    .eq('ativo', true)
    .is('deleted_at', null)

  if (params?.escolaId) {
    escolasQuery = escolasQuery.eq('id', params.escolaId)
  }

  const { data: escolas, error: escolasError } = await escolasQuery
  if (escolasError) {
    console.error('[enqueueAniversariantesHoje.escolas]', escolasError.message)
    return { error: 'Erro ao carregar escolas para aniversariantes.' }
  }

  let queued = 0

  for (const escola of escolas ?? []) {
    if (!escola.notif_aniversario_atleta) continue
    if (!escola.notif_email && !escola.notif_push) continue

    const { data: matriculas, error: matsError } = await admin
      .from('matriculas')
      .select('id, atleta_id')
      .eq('escola_id', escola.id)
      .eq('status', 'ativa')
      .is('deleted_at', null)

    if (matsError) {
      console.error('[enqueueAniversariantesHoje.matriculas]', matsError.message)
      continue
    }

    const atletaIds = [...new Set((matriculas ?? []).map((m) => m.atleta_id))]
    if (atletaIds.length === 0) continue

    const { data: atletas, error: atletasError } = await admin
      .from('atletas')
      .select('id, nome, data_nascimento')
      .in('id', atletaIds)
      .is('deleted_at', null)

    if (atletasError) {
      console.error('[enqueueAniversariantesHoje.atletas]', atletasError.message)
      continue
    }

    const matriculaByAtleta = new Map((matriculas ?? []).map((m) => [m.atleta_id, m.id]))
    const aniversariantesHoje = (atletas ?? []).filter((atleta) => atleta.data_nascimento.slice(5, 10) === todayMonthDay)

    for (const atleta of aniversariantesHoje) {
      const mensagem = buildMensagemAniversario(atleta.nome, escola.nome)
      const idempotencyKey = `aniversario_atleta:${escola.id}:${atleta.id}:${isoDate}`
      const result = await enqueueEventoNotificacao(
        escola.id,
        'aniversario_atleta',
        {
          atleta_id: atleta.id,
          matricula_id: matriculaByAtleta.get(atleta.id) ?? null,
          atleta_nome: atleta.nome,
          escola_nome: escola.nome,
          mensagem,
          ref_tipo: 'aniversario_atleta',
          ref_id: `${atleta.id}:${isoDate}`,
        },
        idempotencyKey
      )

      if (!result.error) queued += 1
    }
  }

  return { error: null, queued }
}

export async function listarNotificacoesOutboxEscola(
  escolaId: string,
  params?: { page?: number; pageSize?: number }
): Promise<{
  error: string | null
  rows?: Array<{
    id: string
    evento_tipo: string
    mensagem: string | null
    status: string
    tentativas: number
    erro: string | null
    created_at: string
    entregas_sent: number
    entregas_failed: number
  }>
  total?: number
}> {
  const auth = await assertComunicacaoEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(50, Math.max(10, params?.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('notificacoes_outbox')
    .select('id, evento_tipo, payload, status, tentativas, erro, created_at', { count: 'exact' })
    .eq('escola_id', escolaId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[listarNotificacoesOutboxEscola]', error.message)
    return { error: 'Erro ao carregar histórico de notificações.' }
  }

  const ids = (data ?? []).map((r) => r.id)
  const sentMap = new Map<string, number>()
  const failedMap = new Map<string, number>()
  if (ids.length > 0) {
    const { data: entregas } = await supabase
      .from('notificacoes_entregas')
      .select('outbox_id, status')
      .in('outbox_id', ids)

    for (const e of entregas ?? []) {
      if (e.status === 'sent') sentMap.set(e.outbox_id, (sentMap.get(e.outbox_id) ?? 0) + 1)
      if (e.status === 'failed') failedMap.set(e.outbox_id, (failedMap.get(e.outbox_id) ?? 0) + 1)
    }
  }

  return {
    error: null,
    rows: (data ?? []).map((r) => ({
      id: r.id,
      evento_tipo: r.evento_tipo,
      mensagem: typeof (r.payload as Record<string, unknown> | null)?.mensagem === 'string'
        ? ((r.payload as Record<string, unknown>).mensagem as string)
        : null,
      status: r.status,
      tentativas: r.tentativas,
      erro: r.erro,
      created_at: r.created_at,
      entregas_sent: sentMap.get(r.id) ?? 0,
      entregas_failed: failedMap.get(r.id) ?? 0,
    })),
    total: count ?? 0,
  }
}
