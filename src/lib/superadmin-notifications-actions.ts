'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEventoNotificacaoLabel } from '@/lib/notification-labels'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

export type SuperadminNotificationItem = {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
  type: 'critico' | 'aviso' | 'sucesso' | 'sistema' | 'relatorio'
  group: 'hoje' | 'ontem' | 'semana'
  category: string
  priority: 'Alta' | 'Media' | 'Baixa'
  actions: string[]
}

type EscolaMini = {
  id: string
  nome: string
}

function getGroup(createdAt: string): 'hoje' | 'ontem' | 'semana' {
  const created = new Date(createdAt)
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startYesterday.getDate() - 1)
  const startWeek = new Date(startToday)
  startWeek.setDate(startWeek.getDate() - 7)

  if (created >= startToday) return 'hoje'
  if (created >= startYesterday) return 'ontem'
  return 'semana'
}

function getTimeLabel(createdAt: string): string {
  const created = new Date(createdAt)
  const group = getGroup(createdAt)
  if (group === 'hoje') return `Hoje, ${created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  if (group === 'ontem') return `Ontem, ${created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return created.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildDescription(input: {
  escolaNome?: string
  eventoTipo: string
  status: string
  erro?: string | null
  sent: number
  failed: number
  tentativas: number
}): string {
  const escolaParte = input.escolaNome ? `${input.escolaNome}. ` : ''
  const statusParte = `Status da fila: ${input.status}.`
  const entregasParte =
    input.sent || input.failed
      ? ` Entregas: ${input.sent} enviadas e ${input.failed} falhas.`
      : ''
  const tentativasParte = input.tentativas > 0 ? ` Tentativas: ${input.tentativas}.` : ''
  const erroParte = input.erro ? ` Erro: ${input.erro}.` : ''

  return `${escolaParte}${getEventoNotificacaoLabel(input.eventoTipo)}. ${statusParte}${entregasParte}${tentativasParte}${erroParte}`.trim()
}

function classifyNotification(input: {
  eventoTipo: string
  status: string
  erro?: string | null
  failed: number
}): {
  type: SuperadminNotificationItem['type']
  priority: SuperadminNotificationItem['priority']
  category: string
  actions: string[]
} {
  if (input.status === 'erro' || input.failed > 0 || input.erro) {
    return {
      type: 'critico',
      priority: 'Alta',
      category: 'Operacao',
      actions: ['Ver logs', 'Reprocessar fila'],
    }
  }

  if (input.eventoTipo.includes('cobranca') || input.eventoTipo.includes('check_')) {
    return {
      type: 'aviso',
      priority: 'Media',
      category: 'Financeiro',
      actions: ['Abrir escola', 'Ver detalhes'],
    }
  }

  if (input.eventoTipo === 'comunicado') {
    return {
      type: 'relatorio',
      priority: 'Media',
      category: 'Comunicacao',
      actions: ['Abrir relatorio'],
    }
  }

  return {
    type: 'sucesso',
    priority: 'Baixa',
    category: 'Sistema',
    actions: ['Ver detalhes'],
  }
}

export async function listarNotificacoesSuperAdmin(): Promise<{
  error: string | null
  rows: SuperadminNotificationItem[]
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error, rows: [] }

  const admin = createAdminClient()
  const { data: outbox, error } = await admin
    .from('notificacoes_outbox')
    .select('id, escola_id, evento_tipo, status, created_at, tentativas, erro')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[listarNotificacoesSuperAdmin.outbox]', error.message)
    return { error: 'Erro ao carregar notificacoes do SuperAdmin.', rows: [] }
  }

  const escolaIds = [...new Set((outbox ?? []).map((row) => row.escola_id))]
  const outboxIds = [...new Set((outbox ?? []).map((row) => row.id))]

  const [{ data: escolas }, { data: entregas }] = await Promise.all([
    escolaIds.length
      ? admin.from('escolas').select('id, nome').in('id', escolaIds)
      : Promise.resolve({ data: [] as EscolaMini[] }),
    outboxIds.length
      ? admin.from('notificacoes_entregas').select('outbox_id, status').in('outbox_id', outboxIds)
      : Promise.resolve({ data: [] as { outbox_id: string; status: string }[] }),
  ])

  const escolaMap = new Map((escolas ?? []).map((escola) => [escola.id, escola.nome]))
  const sentMap = new Map<string, number>()
  const failedMap = new Map<string, number>()

  for (const entrega of entregas ?? []) {
    if (entrega.status === 'sent' || entrega.status === 'entregue') {
      sentMap.set(entrega.outbox_id, (sentMap.get(entrega.outbox_id) ?? 0) + 1)
    }
    if (entrega.status === 'failed' || entrega.status === 'falhou') {
      failedMap.set(entrega.outbox_id, (failedMap.get(entrega.outbox_id) ?? 0) + 1)
    }
  }

  const rows: SuperadminNotificationItem[] = (outbox ?? []).map((row) => {
    const sent = sentMap.get(row.id) ?? 0
    const failed = failedMap.get(row.id) ?? 0
    const classification = classifyNotification({
      eventoTipo: row.evento_tipo,
      status: row.status,
      erro: row.erro,
      failed,
    })

    return {
      id: row.id,
      title: getEventoNotificacaoLabel(row.evento_tipo),
      description: buildDescription({
        escolaNome: escolaMap.get(row.escola_id),
        eventoTipo: row.evento_tipo,
        status: row.status,
        erro: row.erro,
        sent,
        failed,
        tentativas: row.tentativas,
      }),
      time: getTimeLabel(row.created_at),
      unread: row.status === 'queued' || row.status === 'pendente' || row.status === 'erro',
      type: classification.type,
      group: getGroup(row.created_at),
      category: classification.category,
      priority: classification.priority,
      actions: classification.actions,
    }
  })

  return { error: null, rows }
}
