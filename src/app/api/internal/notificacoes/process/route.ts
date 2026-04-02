import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function retryDelayMinutes(tentativas: number): number {
  if (tentativas <= 1) return 1
  if (tentativas <= 3) return 5
  return 15
}

export async function POST() {
  const admin = createAdminClient()

  const { data: outbox, error } = await admin
    .from('notificacoes_outbox')
    .select('id, escola_id, evento_tipo, payload, tentativas')
    .in('status', ['queued', 'failed'])
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[process notificacoes] load outbox', error.message)
    return NextResponse.json({ error: 'load_failed' }, { status: 500 })
  }

  let processed = 0
  for (const evt of outbox ?? []) {
    try {
      await admin
        .from('notificacoes_outbox')
        .update({ status: 'processing', tentativas: (evt.tentativas ?? 0) + 1 })
        .eq('id', evt.id)

      const payload = (evt.payload ?? {}) as Record<string, unknown>
      const matriculaId = (payload.matricula_id as string | undefined) ?? null
      let atletaId = (payload.atleta_id as string | undefined) ?? null

      if (!atletaId && matriculaId) {
        const { data: mat } = await admin
          .from('matriculas')
          .select('atleta_id')
          .eq('id', matriculaId)
          .maybeSingle()
        atletaId = mat?.atleta_id ?? null
      }

      const { data: escola } = await admin
        .from('escolas')
        .select('notif_email, notif_push')
        .eq('id', evt.escola_id)
        .maybeSingle()

      const contatos: Array<{ id: string; email: string | null }> = []

      if (atletaId) {
        const { data: links } = await admin
          .from('atleta_responsaveis')
          .select('responsavel_id, financeiro')
          .eq('atleta_id', atletaId)
          .is('deleted_at', null)

        const preferidos = (links ?? []).filter((l) => l.financeiro)
        const fallback = links ?? []
        const base = preferidos.length > 0 ? preferidos : fallback

        if (base.length > 0) {
          const ids = base.map((b) => b.responsavel_id)
          const { data: responsaveis } = await admin
            .from('responsaveis')
            .select('id, email')
            .in('id', ids)
            .is('deleted_at', null)
          for (const r of responsaveis ?? []) contatos.push({ id: r.id, email: r.email })
        }
      }

      if (contatos.length === 0) {
        await admin.from('notificacoes_outbox').update({ status: 'sent', erro: null }).eq('id', evt.id)
        processed += 1
        continue
      }

      for (const c of contatos) {
        if (escola?.notif_email && c.email) {
          await admin.from('notificacoes_entregas').upsert(
            {
              outbox_id: evt.id,
              escola_id: evt.escola_id,
              canal: 'email',
              destinatario_id: c.id,
              destinatario_contato: c.email,
              status: 'sent',
            },
            { onConflict: 'outbox_id,canal,destinatario_id,destinatario_contato' }
          )
        }

        if (escola?.notif_push) {
          await admin.from('notificacoes_entregas').upsert(
            {
              outbox_id: evt.id,
              escola_id: evt.escola_id,
              canal: 'push',
              destinatario_id: c.id,
              destinatario_contato: c.id,
              status: 'sent',
            },
            { onConflict: 'outbox_id,canal,destinatario_id,destinatario_contato' }
          )
        }
      }

      await admin.from('notificacoes_outbox').update({ status: 'sent', erro: null }).eq('id', evt.id)
      processed += 1
    } catch (e) {
      const tentativas = (evt.tentativas ?? 0) + 1
      const delay = retryDelayMinutes(tentativas)
      const nextRetry = new Date(Date.now() + delay * 60 * 1000).toISOString()
      await admin
        .from('notificacoes_outbox')
        .update({
          status: 'failed',
          erro: e instanceof Error ? e.message : 'process_failed',
          next_retry_at: nextRetry,
        })
        .eq('id', evt.id)
    }
  }

  return NextResponse.json({ ok: true, processed })
}
