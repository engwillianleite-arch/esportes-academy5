'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueEventoNotificacao } from '@/lib/notification-actions'

type EscolaAcessoResumo = {
  escolaId: string
  escolaNome: string
  checkinAtivo: boolean
  presentesAgora: number
  rows: Array<{
    id: string
    atleta_id: string
    atleta_nome: string
    tipo: 'check_in' | 'check_out'
    created_at: string
    operador_nome: string | null
  }>
}

async function assertOperacaoAcessoEscola(escolaId: string): Promise<
  { error: string } | { userId: string; userName: string | null }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Usuário não autenticado.' }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .in('perfil', ['admin_escola', 'coordenador', 'secretaria', 'professor'])
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão para operar acessos nesta escola.' }

  return {
    userId: user.id,
    userName:
      (user.user_metadata?.full_name as string | undefined)
      ?? (user.user_metadata?.name as string | undefined)
      ?? user.email
      ?? null,
  }
}

export async function carregarResumoAcessosEscola(
  escolaId: string
): Promise<{ error: string | null; summary?: EscolaAcessoResumo }> {
  const auth = await assertOperacaoAcessoEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  const { data: escola } = await admin
    .from('escolas')
    .select('id, nome, checkin_checkout_ativo')
    .eq('id', escolaId)
    .maybeSingle()

  if (!escola) return { error: 'Escola não encontrada.' }

  const { data: acessos } = await admin
    .from('atleta_acessos')
    .select('id, atleta_id, tipo, created_at, lido_por_user_id')
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  const atletaIds = [...new Set((acessos ?? []).map((a) => a.atleta_id))]
  const [{ data: atletas }] = await Promise.all([
    atletaIds.length
      ? admin.from('atletas').select('id, nome').in('id', atletaIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ])

  const atletaMap = new Map((atletas ?? []).map((a) => [a.id, a.nome]))

  const lastByAtleta = new Map<string, 'check_in' | 'check_out'>()
  for (const acesso of acessos ?? []) {
    if (!lastByAtleta.has(acesso.atleta_id)) {
      lastByAtleta.set(acesso.atleta_id, acesso.tipo as 'check_in' | 'check_out')
    }
  }

  const presentesAgora = [...lastByAtleta.values()].filter((tipo) => tipo === 'check_in').length

  return {
    error: null,
    summary: {
      escolaId: escola.id,
      escolaNome: escola.nome,
      checkinAtivo: escola.checkin_checkout_ativo,
      presentesAgora,
      rows: (acessos ?? []).map((a) => ({
        id: a.id,
        atleta_id: a.atleta_id,
        atleta_nome: atletaMap.get(a.atleta_id) ?? 'Atleta',
        tipo: a.tipo as 'check_in' | 'check_out',
        created_at: a.created_at,
        operador_nome: null,
      })),
    },
  }
}

export async function registrarAcessoPorQr(
  escolaId: string,
  qrToken: string
): Promise<{ error: string | null; message?: string }> {
  const auth = await assertOperacaoAcessoEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const cleanToken = qrToken.trim()
  if (!cleanToken) return { error: 'Informe um QR token válido.' }

  const { data: escola } = await admin
    .from('escolas')
    .select('id, checkin_checkout_ativo')
    .eq('id', escolaId)
    .maybeSingle()

  if (!escola) return { error: 'Escola não encontrada.' }
  if (!escola.checkin_checkout_ativo) {
    return { error: 'O check-in/check-out está desativado para esta escola.' }
  }

  const { data: card } = await admin
    .from('atleta_carteirinhas')
    .select('id, atleta_id, escola_id, matricula_id, qr_token, ativo')
    .eq('escola_id', escolaId)
    .eq('qr_token', cleanToken)
    .is('deleted_at', null)
    .maybeSingle()

  if (!card || !card.ativo) return { error: 'Carteirinha não encontrada ou inativa.' }

  const [{ data: atleta }, { data: ultimo }] = await Promise.all([
    admin.from('atletas').select('id, nome').eq('id', card.atleta_id).maybeSingle(),
    admin
      .from('atleta_acessos')
      .select('id, tipo')
      .eq('escola_id', escolaId)
      .eq('atleta_id', card.atleta_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const tipo = ultimo?.tipo === 'check_in' ? 'check_out' : 'check_in'

  const { data: inserted, error: insertError } = await admin
    .from('atleta_acessos')
    .insert({
      atleta_id: card.atleta_id,
      escola_id: escolaId,
      matricula_id: card.matricula_id,
      carteirinha_id: card.id,
      tipo,
      lido_por_user_id: auth.userId,
      qr_token_snapshot: card.qr_token,
    })
    .select('id, atleta_id, escola_id, matricula_id, tipo, created_at')
    .single()

  if (insertError || !inserted) {
    console.error('[registrarAcessoPorQr]', insertError.message)
    return { error: 'Erro ao registrar acesso do atleta.' }
  }

  const enqueueResult = await enqueueEventoNotificacao(
    escolaId,
    tipo,
    {
      atleta_id: inserted.atleta_id,
      matricula_id: inserted.matricula_id,
      acesso_id: inserted.id,
      ref_tipo: 'atleta_acesso',
      ref_id: inserted.id,
      tipo_acesso: inserted.tipo,
      ocorrido_em: inserted.created_at,
      qr_token: card.qr_token,
    },
    `atleta_acesso:${inserted.id}:${tipo}`
  )

  if (enqueueResult.error) {
    console.error('[registrarAcessoPorQr.enqueue]', enqueueResult.error)
  }

  return {
    error: null,
    message: `${atleta?.nome ?? 'Atleta'} registrado com ${tipo === 'check_in' ? 'check-in' : 'check-out'}.`,
  }
}
