import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StatusCobranca } from '@/types'

type AsaasWebhookPayload = {
  event?: string
  payment?: {
    id?: string
    status?: string
    paymentDate?: string | null
    clientPaymentDate?: string | null
  }
}

function mapAsaasStatus(status: string | undefined, event: string | undefined): StatusCobranca | null {
  const s = (status ?? '').toUpperCase()
  const e = (event ?? '').toUpperCase()

  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(s)) return 'pago'
  if (['OVERDUE'].includes(s)) return 'vencido'
  if (['REFUNDED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'CHARGEBACK_REVERSED'].includes(s)) {
    return 'cancelado'
  }
  if (['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(s)) return 'pendente'

  if (e.includes('PAYMENT_RECEIVED') || e.includes('PAYMENT_CONFIRMED')) return 'pago'
  if (e.includes('PAYMENT_OVERDUE')) return 'vencido'
  if (e.includes('PAYMENT_DELETED') || e.includes('PAYMENT_REFUNDED')) return 'cancelado'

  return null
}

export async function POST(request: Request) {
  let payload: AsaasWebhookPayload
  try {
    payload = (await request.json()) as AsaasWebhookPayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const webhookSecret =
    request.headers.get('asaas-access-token') ??
    request.headers.get('x-asaas-access-token') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    ''

  if (!webhookSecret) {
    return NextResponse.json({ error: 'missing_webhook_secret' }, { status: 401 })
  }

  const paymentId = payload.payment?.id
  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: 'missing_payment_id' })
  }

  const mappedStatus = mapAsaasStatus(payload.payment?.status, payload.event)
  if (!mappedStatus) {
    return NextResponse.json({ ok: true, ignored: 'unmapped_status' })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error('[asaas webhook] admin client', e)
    return NextResponse.json({ error: 'server_not_configured' }, { status: 500 })
  }

  const { data: escola, error: escolaErr } = await admin
    .from('escolas')
    .select('id')
    .eq('asaas_webhook_secret', webhookSecret)
    .is('deleted_at', null)
    .maybeSingle()

  if (escolaErr || !escola) {
    return NextResponse.json({ error: 'invalid_webhook_secret' }, { status: 401 })
  }

  const dataPagamento =
    mappedStatus === 'pago'
      ? payload.payment?.paymentDate ?? payload.payment?.clientPaymentDate ?? new Date().toISOString()
      : null

  const { data: updated, error: updateErr } = await admin
    .from('cobrancas')
    .update({
      status: mappedStatus,
      data_pagamento: dataPagamento,
      updated_at: new Date().toISOString(),
    })
    .eq('escola_id', escola.id)
    .eq('asaas_charge_id', paymentId)
    .is('deleted_at', null)
    .select('id, matricula_id')

  if (updateErr) {
    console.error('[asaas webhook] update', updateErr.message)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  if (!updated?.length) {
    return NextResponse.json({ ok: true, ignored: 'charge_not_found' })
  }

  const eventoTipo =
    mappedStatus === 'pago'
      ? 'cobranca_confirmada'
      : mappedStatus === 'vencido'
        ? 'cobranca_vencida'
        : null

  if (eventoTipo) {
    for (const c of updated) {
      await admin.from('notificacoes_outbox').insert({
        escola_id: escola.id,
        evento_tipo: eventoTipo,
        ref_tipo: 'cobranca',
        ref_id: c.id,
        payload: {
          cobranca_id: c.id,
          matricula_id: c.matricula_id,
          status: mappedStatus,
          payment_id: paymentId,
        },
        status: 'queued',
        idempotency_key: `asaas:${paymentId}:${mappedStatus}`,
      })
    }
  }

  return NextResponse.json({ ok: true, updated: updated.length })
}
