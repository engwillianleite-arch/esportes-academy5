'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaContext } from '@/lib/escola-context'
import { listarContextosUsuarioAtual } from '@/lib/usuario-contexto'
import QRCode from 'qrcode'

type ResponsavelContext = {
  userId: string
  email: string | null
  responsavelId: string
  responsavelNome: string
}

type ResponsavelAppContext = ResponsavelContext & {
  escolaId: string
  escolaNome: string | null
}

export async function getResponsavelContext(): Promise<{ error: string } | { ctx: ResponsavelContext }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Usuário não autenticado' }

  const admin = createAdminClient()
  const { data: link } = await admin
    .from('responsavel_usuarios')
    .select('responsavel_id, ativo, deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!link || !link.ativo || link.deleted_at) {
    return { error: 'Usuário não vinculado a responsável' }
  }

  const { data: resp } = await admin
    .from('responsaveis')
    .select('id, nome')
    .eq('id', link.responsavel_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!resp) return { error: 'Responsável não encontrado' }

  return {
    ctx: {
      userId: user.id,
      email: user.email ?? null,
      responsavelId: resp.id,
      responsavelNome: resp.nome,
    },
  }
}

async function listarAtletaIdsDoResponsavel(responsavelId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data: links } = await admin
    .from('atleta_responsaveis')
    .select('atleta_id')
    .eq('responsavel_id', responsavelId)
    .is('deleted_at', null)

  return [...new Set((links ?? []).map((link) => link.atleta_id))]
}

async function listarMatriculasDoResponsavelNaEscola(
  responsavelId: string,
  escolaId: string
): Promise<
  Array<{
    id: string
    atleta_id: string
    escola_id: string
    turma_id: string | null
    status: string
    created_at: string
  }>
> {
  const admin = createAdminClient()
  const atletaIds = await listarAtletaIdsDoResponsavel(responsavelId)
  if (atletaIds.length === 0) return []

  const { data: matriculas } = await admin
    .from('matriculas')
    .select('id, atleta_id, escola_id, turma_id, status, created_at')
    .in('atleta_id', atletaIds)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return matriculas ?? []
}

export async function getResponsavelAppContext(): Promise<
  { error: string } | { ctx: ResponsavelAppContext }
> {
  const rctx = await getResponsavelContext()
  if ('error' in rctx) return rctx

  const escolaContext = await getEscolaContext()
  if (!escolaContext || escolaContext.perfil !== 'responsavel') {
    return { error: 'Contexto de responsável não selecionado.' }
  }

  const contextos = await listarContextosUsuarioAtual()
  if (contextos.error) return { error: contextos.error }

  const contextoAtivo = (contextos.rows ?? []).find(
    (row) =>
      row.escola_id === escolaContext.escolaId && row.tipo_usuario === escolaContext.perfil
  )

  if (!contextoAtivo) {
    return { error: 'Contexto de responsável inválido ou expirado.' }
  }

  return {
    ctx: {
      ...rctx.ctx,
      escolaId: contextoAtivo.escola_id,
      escolaNome: contextoAtivo.escola_nome ?? null,
    },
  }
}

export async function vincularContaResponsavelPorCpf(
  cpf: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Usuário não autenticado.' }
  const email = (user.email ?? '').trim().toLowerCase()
  if (!email) return { error: 'Conta sem e-mail válido.' }

  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return { error: 'CPF inválido.' }

  const admin = createAdminClient()

  const { data: responsavel } = await admin
    .from('responsaveis')
    .select('id, email')
    .eq('cpf', cleanCpf)
    .is('deleted_at', null)
    .maybeSingle()

  if (!responsavel) {
    return { error: 'Responsável não encontrado. Verifique com a escola.' }
  }

  if (!responsavel.email || responsavel.email.trim().toLowerCase() !== email) {
    return {
      error: 'E-mail da conta não confere com o e-mail cadastrado do responsável na escola.',
    }
  }

  const { error: upsertError } = await admin.from('responsavel_usuarios').upsert(
    {
      responsavel_id: responsavel.id,
      user_id: user.id,
      ativo: true,
      deleted_at: null,
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    console.error('[vincularContaResponsavelPorCpf]', upsertError.message)
    return { error: 'Erro ao vincular conta.' }
  }

  return { error: null }
}

export async function carregarResumoPais(): Promise<{
  error: string | null
  responsavelNome?: string
  escolaAtivaNome?: string | null
  atletas?: Array<{
    atleta_id: string
    nome: string
    data_nascimento: string
    escola_id: string | null
    escola_nome: string | null
    turma_nome: string | null
    matricula_id: string | null
    status_matricula: string | null
  }>
  financeiro?: {
    pendentes: number
    vencidas: number
  }
  notificacoesNaoEnviadas?: number
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }

  const admin = createAdminClient()
  const matriculas = await listarMatriculasDoResponsavelNaEscola(
    rctx.ctx.responsavelId,
    rctx.ctx.escolaId
  )

  const ultimaMatriculaPorAtleta = new Map<
    string,
    { id: string; escola_id: string; turma_id: string | null; status: string }
  >()
  for (const m of matriculas) {
    if (!ultimaMatriculaPorAtleta.has(m.atleta_id)) {
      ultimaMatriculaPorAtleta.set(m.atleta_id, {
        id: m.id,
        escola_id: m.escola_id,
        turma_id: m.turma_id,
        status: m.status,
      })
    }
  }

  const atletaIds = [...ultimaMatriculaPorAtleta.keys()]
  if (atletaIds.length === 0) {
    return {
      error: null,
      responsavelNome: rctx.ctx.responsavelNome,
      escolaAtivaNome: rctx.ctx.escolaNome,
      atletas: [],
      financeiro: { pendentes: 0, vencidas: 0 },
      notificacoesNaoEnviadas: 0,
    }
  }

  const { data: atletas } = await admin
    .from('atletas')
    .select('id, nome, data_nascimento')
    .in('id', atletaIds)
    .is('deleted_at', null)

  const escolaIds = [...new Set([...ultimaMatriculaPorAtleta.values()].map((m) => m.escola_id))]
  const turmaIds = [...new Set([...ultimaMatriculaPorAtleta.values()].map((m) => m.turma_id).filter(Boolean))] as string[]

  const [{ data: escolas }, { data: turmas }] = await Promise.all([
    escolaIds.length > 0 ? admin.from('escolas').select('id, nome').in('id', escolaIds) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    turmaIds.length > 0 ? admin.from('turmas').select('id, nome').in('id', turmaIds).is('deleted_at', null) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ])

  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))
  const turmaMap = new Map((turmas ?? []).map((t) => [t.id, t.nome]))

  const matriculaIds = [...new Set([...ultimaMatriculaPorAtleta.values()].map((v) => v.id))]
  const { data: cobrancas } = matriculaIds.length
    ? await admin
        .from('cobrancas')
        .select('status')
        .in('matricula_id', matriculaIds)
        .is('deleted_at', null)
    : { data: [] as { status: string }[] }

  const financeiro = {
    pendentes: (cobrancas ?? []).filter((c) => c.status === 'pendente').length,
    vencidas: (cobrancas ?? []).filter((c) => c.status === 'vencido').length,
  }

  const { data: entregasFalhas } = await admin
    .from('notificacoes_entregas')
    .select('outbox_id')
    .eq('destinatario_id', rctx.ctx.responsavelId)
    .eq('status', 'failed')

  const failedOutboxIds = [...new Set((entregasFalhas ?? []).map((row) => row.outbox_id))]
  const { data: failedOutbox } = failedOutboxIds.length
    ? await admin
        .from('notificacoes_outbox')
        .select('id')
        .in('id', failedOutboxIds)
        .eq('escola_id', rctx.ctx.escolaId)
    : { data: [] as Array<{ id: string }> }

  return {
    error: null,
    responsavelNome: rctx.ctx.responsavelNome,
    escolaAtivaNome: rctx.ctx.escolaNome,
    atletas: (atletas ?? []).map((a) => {
      const m = ultimaMatriculaPorAtleta.get(a.id)
      return {
        atleta_id: a.id,
        nome: a.nome,
        data_nascimento: a.data_nascimento,
        escola_id: m?.escola_id ?? null,
        escola_nome: m?.escola_id ? escolaMap.get(m.escola_id) ?? null : null,
        turma_nome: m?.turma_id ? turmaMap.get(m.turma_id) ?? null : null,
        matricula_id: m?.id ?? null,
        status_matricula: m?.status ?? null,
      }
    }),
    financeiro,
    notificacoesNaoEnviadas: failedOutbox?.length ?? 0,
  }
}

export async function listarFinanceiroPais(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  rows?: Array<{
    id: string
    atleta_nome: string
    descricao: string | null
    valor: number
    vencimento: string
    status: string
  }>
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }
  const admin = createAdminClient()
  const mats = await listarMatriculasDoResponsavelNaEscola(rctx.ctx.responsavelId, rctx.ctx.escolaId)
  const atletaIds = [...new Set(mats.map((m) => m.atleta_id))]
  const matIds = mats.map((m) => m.id)
  if (matIds.length === 0) return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, rows: [] }

  const [cobrancasRes, atletasRes] = await Promise.all([
    admin
      .from('cobrancas')
      .select('id, matricula_id, descricao, valor, vencimento, status')
      .in('matricula_id', matIds)
      .is('deleted_at', null)
      .order('vencimento', { ascending: false }),
    admin.from('atletas').select('id, nome').in('id', atletaIds),
  ])

  const nomeByAtleta = new Map((atletasRes.data ?? []).map((a) => [a.id, a.nome]))
  const atletaByMatricula = new Map((mats ?? []).map((m) => [m.id, m.atleta_id]))

  return {
    error: null,
    escolaAtivaNome: rctx.ctx.escolaNome,
    rows: (cobrancasRes.data ?? []).map((c) => ({
      id: c.id,
      atleta_nome: nomeByAtleta.get(atletaByMatricula.get(c.matricula_id ?? '') ?? '') ?? 'Atleta',
      descricao: c.descricao,
      valor: Number(c.valor),
      vencimento: c.vencimento,
      status: c.status,
    })),
  }
}

export async function listarPresencasPais(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  rows?: Array<{
    id: string
    atleta_nome: string
    turma_nome: string
    data_aula: string
    status: string
  }>
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }
  const admin = createAdminClient()
  const mats = await listarMatriculasDoResponsavelNaEscola(rctx.ctx.responsavelId, rctx.ctx.escolaId)
  const atletaIds = [...new Set(mats.map((m) => m.atleta_id))]
  const matIds = mats.map((m) => m.id)
  if (matIds.length === 0) return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, rows: [] }

  const { data: presencas } = await admin
    .from('presencas_registros')
    .select('id, aula_id, matricula_id, status')
    .in('matricula_id', matIds)
    .order('created_at', { ascending: false })
    .limit(200)

  const aulaIds = [...new Set((presencas ?? []).map((p) => p.aula_id))]
  const turmaIds = [...new Set((mats ?? []).map((m) => m.turma_id).filter(Boolean))] as string[]

  const [aulasRes, atletasRes, turmasRes] = await Promise.all([
    aulaIds.length ? admin.from('aulas').select('id, data_aula').in('id', aulaIds) : Promise.resolve({ data: [] as { id: string; data_aula: string }[] }),
    admin.from('atletas').select('id, nome').in('id', atletaIds),
    turmaIds.length ? admin.from('turmas').select('id, nome').in('id', turmaIds) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ])

  const aulaMap = new Map((aulasRes.data ?? []).map((a) => [a.id, a]))
  const atletaMap = new Map((atletasRes.data ?? []).map((a) => [a.id, a.nome]))
  const turmaMap = new Map((turmasRes.data ?? []).map((t) => [t.id, t.nome]))
  const matMap = new Map((mats ?? []).map((m) => [m.id, m]))

  return {
    error: null,
    escolaAtivaNome: rctx.ctx.escolaNome,
    rows: (presencas ?? []).map((p) => {
      const m = matMap.get(p.matricula_id)
      const aula = aulaMap.get(p.aula_id)
      return {
        id: p.id,
        atleta_nome: m ? atletaMap.get(m.atleta_id) ?? 'Atleta' : 'Atleta',
        turma_nome: m?.turma_id ? turmaMap.get(m.turma_id) ?? 'Turma' : 'Sem turma',
        data_aula: aula?.data_aula ?? '',
        status: p.status,
      }
    }),
  }
}

export async function listarNotificacoesPais(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  rows?: Array<{
    id: string
    evento_tipo: string
    mensagem: string | null
    canal: string
    status: string
    created_at: string
  }>
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('notificacoes_entregas')
    .select('id, canal, status, created_at, outbox_id')
    .eq('destinatario_id', rctx.ctx.responsavelId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return { error: 'Erro ao carregar notificações.' }

  const outboxIds = [...new Set((data ?? []).map((d) => d.outbox_id))]
  const { data: outbox } = outboxIds.length
    ? await admin
        .from('notificacoes_outbox')
        .select('id, escola_id, evento_tipo, payload')
        .in('id', outboxIds)
    : {
        data: [] as Array<{
          id: string
          escola_id: string | null
          evento_tipo: string
          payload: Record<string, unknown> | null
        }>,
      }

  const outboxMap = new Map(
    (outbox ?? [])
      .filter((o) => o.escola_id === rctx.ctx.escolaId)
      .map((o) => [o.id, o])
  )

  return {
    error: null,
    escolaAtivaNome: rctx.ctx.escolaNome,
    rows: (data ?? [])
      .filter((d) => outboxMap.has(d.outbox_id))
      .map((d) => ({
        id: d.id,
        evento_tipo: outboxMap.get(d.outbox_id)?.evento_tipo ?? 'evento',
        mensagem:
          typeof outboxMap.get(d.outbox_id)?.payload?.mensagem === 'string'
            ? (outboxMap.get(d.outbox_id)?.payload?.mensagem as string)
            : null,
        canal: d.canal,
        status: d.status,
        created_at: d.created_at,
      })),
  }
}

function randomQrToken(): string {
  return `ea_card_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function listarCarteirinhasPais(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  rows?: Array<{
    carteirinha_id: string
    atleta_id: string
    atleta_nome: string
    data_nascimento: string
    escola_id: string
    escola_nome: string
    turma_nome: string | null
    status_matricula: string
    qr_token: string
    qr_svg: string
  }>
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }

  const admin = createAdminClient()
  const matriculas = await listarMatriculasDoResponsavelNaEscola(
    rctx.ctx.responsavelId,
    rctx.ctx.escolaId
  )
  const atletaIds = [...new Set(matriculas.map((m) => m.atleta_id))]
  if (atletaIds.length === 0) return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, rows: [] }

  const { data: atletas } = await admin
    .from('atletas')
    .select('id, nome, data_nascimento')
    .in('id', atletaIds)
    .is('deleted_at', null)

  const ultimaMatriculaPorAtleta = new Map<
    string,
    { id: string; escola_id: string; turma_id: string | null; status: string }
  >()

  for (const m of matriculas ?? []) {
    if (!ultimaMatriculaPorAtleta.has(m.atleta_id)) {
      ultimaMatriculaPorAtleta.set(m.atleta_id, {
        id: m.id,
        escola_id: m.escola_id,
        turma_id: m.turma_id,
        status: m.status,
      })
    }
  }

  const atletasComMatricula = (atletas ?? []).filter((a) => ultimaMatriculaPorAtleta.has(a.id))
  if (atletasComMatricula.length === 0) {
    return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, rows: [] }
  }

  const escolaIds = [...new Set(atletasComMatricula.map((a) => ultimaMatriculaPorAtleta.get(a.id)!.escola_id))]
  const turmaIds = [
    ...new Set(atletasComMatricula.map((a) => ultimaMatriculaPorAtleta.get(a.id)!.turma_id).filter(Boolean)),
  ] as string[]

  const [{ data: escolas }, { data: turmas }, { data: existentes }] = await Promise.all([
    admin.from('escolas').select('id, nome').in('id', escolaIds),
    turmaIds.length
      ? admin.from('turmas').select('id, nome').in('id', turmaIds).is('deleted_at', null)
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    admin
      .from('atleta_carteirinhas')
      .select('id, atleta_id, escola_id, matricula_id, qr_token, ativo')
      .in('atleta_id', atletasComMatricula.map((a) => a.id))
      .is('deleted_at', null),
  ])

  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))
  const turmaMap = new Map((turmas ?? []).map((t) => [t.id, t.nome]))
  const existenteMap = new Map((existentes ?? []).map((c) => [`${c.atleta_id}:${c.escola_id}`, c]))

  const carteirinhas: Array<{
    id: string
    atleta_id: string
    escola_id: string
    matricula_id: string | null
    qr_token: string
    ativo: boolean
  }> = []

  for (const atleta of atletasComMatricula) {
    const mat = ultimaMatriculaPorAtleta.get(atleta.id)!
    const key = `${atleta.id}:${mat.escola_id}`
    const existente = existenteMap.get(key)

    if (existente) {
      carteirinhas.push(existente)
      continue
    }

    const { data: inserted, error: insertError } = await admin
      .from('atleta_carteirinhas')
      .insert({
        atleta_id: atleta.id,
        escola_id: mat.escola_id,
        matricula_id: mat.id,
        qr_token: randomQrToken(),
        ativo: true,
      })
      .select('id, atleta_id, escola_id, matricula_id, qr_token, ativo')
      .single()

    if (insertError || !inserted) {
      console.error('[listarCarteirinhasPais.insert]', insertError?.message)
      return { error: 'Erro ao preparar carteirinhas dos atletas.' }
    }

    carteirinhas.push(inserted)
  }

  const carteirinhaMap = new Map(carteirinhas.map((c) => [`${c.atleta_id}:${c.escola_id}`, c]))

  const rows = await Promise.all(
    atletasComMatricula.map(async (atleta) => {
      const mat = ultimaMatriculaPorAtleta.get(atleta.id)!
      const card = carteirinhaMap.get(`${atleta.id}:${mat.escola_id}`)
      const qrToken = card?.qr_token ?? randomQrToken()

      const qrSvg = await QRCode.toString(qrToken, {
        type: 'svg',
        margin: 1,
        width: 180,
        color: {
          dark: '#111827',
          light: '#FFFFFF',
        },
      })

      return {
        carteirinha_id: card?.id ?? `${atleta.id}:${mat.escola_id}`,
        atleta_id: atleta.id,
        atleta_nome: atleta.nome,
        data_nascimento: atleta.data_nascimento,
        escola_id: mat.escola_id,
        escola_nome: escolaMap.get(mat.escola_id) ?? 'Escola',
        turma_nome: mat.turma_id ? turmaMap.get(mat.turma_id) ?? null : null,
        status_matricula: mat.status,
        qr_token: qrToken,
        qr_svg: qrSvg,
      }
    })
  )

  return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, rows }
}

export async function listarAcessosPais(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  currentStatus?: Array<{
    atleta_id: string
    atleta_nome: string
    status_atual: 'na_escola' | 'fora_da_escola'
    ultimo_evento: 'check_in' | 'check_out' | null
    ultimo_evento_em: string | null
  }>
  rows?: Array<{
    id: string
    atleta_id: string
    atleta_nome: string
    escola_nome: string
    tipo: 'check_in' | 'check_out'
    created_at: string
  }>
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }

  const admin = createAdminClient()
  const atletaIds = [
    ...new Set(
      (
        await listarMatriculasDoResponsavelNaEscola(rctx.ctx.responsavelId, rctx.ctx.escolaId)
      ).map((matricula) => matricula.atleta_id)
    ),
  ]
  if (atletaIds.length === 0) {
    return { error: null, escolaAtivaNome: rctx.ctx.escolaNome, currentStatus: [], rows: [] }
  }

  const [{ data: atletas }, { data: acessos }] = await Promise.all([
    admin.from('atletas').select('id, nome').in('id', atletaIds),
    admin
      .from('atleta_acessos')
      .select('id, atleta_id, escola_id, tipo, created_at')
      .in('atleta_id', atletaIds)
      .eq('escola_id', rctx.ctx.escolaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const escolaIds = [...new Set((acessos ?? []).map((a) => a.escola_id))]
  const { data: escolas } = escolaIds.length
    ? await admin.from('escolas').select('id, nome').in('id', escolaIds)
    : { data: [] as { id: string; nome: string }[] }

  const atletaMap = new Map((atletas ?? []).map((a) => [a.id, a.nome]))
  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  const currentStatusMap = new Map<
    string,
    {
      atleta_id: string
      atleta_nome: string
      status_atual: 'na_escola' | 'fora_da_escola'
      ultimo_evento: 'check_in' | 'check_out' | null
      ultimo_evento_em: string | null
    }
  >()

  for (const acesso of acessos ?? []) {
    if (!currentStatusMap.has(acesso.atleta_id)) {
      currentStatusMap.set(acesso.atleta_id, {
        atleta_id: acesso.atleta_id,
        atleta_nome: atletaMap.get(acesso.atleta_id) ?? 'Atleta',
        status_atual: acesso.tipo === 'check_in' ? 'na_escola' : 'fora_da_escola',
        ultimo_evento: acesso.tipo as 'check_in' | 'check_out',
        ultimo_evento_em: acesso.created_at,
      })
    }
  }

  for (const atletaId of atletaIds) {
    if (!currentStatusMap.has(atletaId)) {
      currentStatusMap.set(atletaId, {
        atleta_id: atletaId,
        atleta_nome: atletaMap.get(atletaId) ?? 'Atleta',
        status_atual: 'fora_da_escola',
        ultimo_evento: null,
        ultimo_evento_em: null,
      })
    }
  }

  return {
    error: null,
    escolaAtivaNome: rctx.ctx.escolaNome,
    currentStatus: [...currentStatusMap.values()],
    rows: (acessos ?? []).map((a) => ({
      id: a.id,
      atleta_id: a.atleta_id,
      atleta_nome: atletaMap.get(a.atleta_id) ?? 'Atleta',
      escola_nome: escolaMap.get(a.escola_id) ?? 'Escola',
      tipo: a.tipo as 'check_in' | 'check_out',
      created_at: a.created_at,
    })),
  }
}

export async function carregarJornadaGlobalPais(): Promise<{
  error: string | null
  atletas?: Array<{
    atleta_id: string
    atleta_nome: string
    data_nascimento: string
    escolas_count: number
    matriculas_count: number
    presencas_total: number
    presentes_total: number
    ultimo_evento_em: string | null
    timeline: Array<{
      id: string
      data: string
      tipo: 'matricula' | 'acesso' | 'exame' | 'atestado'
      titulo: string
      resumo: string
      escola_nome: string | null
    }>
    modulos_futuros: {
      competicoes: { total: number; status: 'pendente' | 'disponivel_em_breve' }
      exames: { total: number; status: 'pendente' | 'disponivel_em_breve' | 'disponivel' }
      treinos: { total: number; status: 'pendente' | 'disponivel_em_breve' }
    }
  }>
}> {
  const rctx = await getResponsavelContext()
  if ('error' in rctx) return { error: rctx.error }

  const admin = createAdminClient()

  const { data: links } = await admin
    .from('atleta_responsaveis')
    .select('atleta_id')
    .eq('responsavel_id', rctx.ctx.responsavelId)
    .is('deleted_at', null)

  const atletaIds = [...new Set((links ?? []).map((l) => l.atleta_id))]
  if (atletaIds.length === 0) return { error: null, atletas: [] }

  const [{ data: atletas }, { data: matriculas }, { data: acessos }, { data: exames }, { data: atestados }] = await Promise.all([
    admin.from('atletas').select('id, nome, data_nascimento').in('id', atletaIds).is('deleted_at', null),
    admin
      .from('matriculas')
      .select('id, atleta_id, escola_id, turma_id, status, data_inicio, data_fim, created_at')
      .in('atleta_id', atletaIds)
      .is('deleted_at', null)
      .order('data_inicio', { ascending: false }),
    admin
      .from('atleta_acessos')
      .select('id, atleta_id, escola_id, tipo, created_at')
      .in('atleta_id', atletaIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(300),
    admin
      .from('atleta_exames')
      .select('id, atleta_id, escola_id, titulo, tipo_exame, data_exame, resultado_resumido')
      .in('atleta_id', atletaIds)
      .is('deleted_at', null)
      .order('data_exame', { ascending: false })
      .limit(200),
    admin
      .from('atleta_atestados')
      .select('id, atleta_id, escola_id, titulo, observacao, data_emissao, validade_ate')
      .in('atleta_id', atletaIds)
      .is('deleted_at', null)
      .order('data_emissao', { ascending: false })
      .limit(200),
  ])

  const escolaIds = [
    ...new Set(
      (matriculas ?? [])
        .map((m) => m.escola_id)
        .concat((acessos ?? []).map((a) => a.escola_id))
        .concat((exames ?? []).map((e) => e.escola_id))
        .concat((atestados ?? []).map((a) => a.escola_id))
    ),
  ]
  const matIds = (matriculas ?? []).map((m) => m.id)

  const [{ data: escolas }, { data: presencas }] = await Promise.all([
    escolaIds.length ? admin.from('escolas').select('id, nome').in('id', escolaIds) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    matIds.length ? admin.from('presencas_registros').select('matricula_id, status').in('matricula_id', matIds) : Promise.resolve({ data: [] as { matricula_id: string; status: string }[] }),
  ])

  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  const presencaResumo = new Map<string, { total: number; presentes: number }>()
  for (const p of presencas ?? []) {
    const current = presencaResumo.get(p.matricula_id) ?? { total: 0, presentes: 0 }
    current.total += 1
    if (p.status === 'presente') current.presentes += 1
    presencaResumo.set(p.matricula_id, current)
  }

  const atletasResult = (atletas ?? []).map((atleta) => {
    const mats = (matriculas ?? []).filter((m) => m.atleta_id === atleta.id)
    const acessosAtleta = (acessos ?? []).filter((a) => a.atleta_id === atleta.id)
    const examesAtleta = (exames ?? []).filter((e) => e.atleta_id === atleta.id)
    const atestadosAtleta = (atestados ?? []).filter((a) => a.atleta_id === atleta.id)
    const escolaCount = new Set(mats.map((m) => m.escola_id)).size

    const timeline = [
      ...mats.map((m) => ({
        id: `matricula:${m.id}`,
        data: m.data_inicio ?? m.created_at,
        tipo: 'matricula' as const,
        titulo: 'Matrícula registrada',
        resumo: `Status ${m.status}${m.data_fim ? ` • até ${m.data_fim}` : ''}`,
        escola_nome: escolaMap.get(m.escola_id) ?? null,
      })),
      ...acessosAtleta.map((a) => ({
        id: `acesso:${a.id}`,
        data: a.created_at,
        tipo: 'acesso' as const,
        titulo: a.tipo === 'check_in' ? 'Check-in realizado' : 'Check-out realizado',
        resumo: a.tipo === 'check_in' ? 'Entrada registrada na unidade' : 'Saída registrada da unidade',
        escola_nome: escolaMap.get(a.escola_id) ?? null,
      })),
      ...examesAtleta.map((e) => ({
        id: `exame:${e.id}`,
        data: e.data_exame,
        tipo: 'exame' as const,
        titulo: `Exame ${e.tipo_exame}`,
        resumo: e.resultado_resumido ?? e.titulo,
        escola_nome: escolaMap.get(e.escola_id) ?? null,
      })),
      ...atestadosAtleta.map((a) => ({
        id: `atestado:${a.id}`,
        data: a.data_emissao,
        tipo: 'atestado' as const,
        titulo: 'Atestado registrado',
        resumo: a.validade_ate
          ? `${a.titulo} • válido até ${a.validade_ate}`
          : a.titulo,
        escola_nome: escolaMap.get(a.escola_id) ?? null,
      })),
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    const presencasTotal = mats.reduce((acc, m) => acc + (presencaResumo.get(m.id)?.total ?? 0), 0)
    const presentesTotal = mats.reduce((acc, m) => acc + (presencaResumo.get(m.id)?.presentes ?? 0), 0)

    return {
      atleta_id: atleta.id,
      atleta_nome: atleta.nome,
      data_nascimento: atleta.data_nascimento,
      escolas_count: escolaCount,
      matriculas_count: mats.length,
      presencas_total: presencasTotal,
      presentes_total: presentesTotal,
      ultimo_evento_em: timeline[0]?.data ?? null,
      timeline,
      modulos_futuros: {
        competicoes: { total: 0, status: 'disponivel_em_breve' as const },
        exames: {
          total: examesAtleta.length + atestadosAtleta.length,
          status:
            examesAtleta.length + atestadosAtleta.length > 0
              ? ('disponivel' as const)
              : ('disponivel_em_breve' as const),
        },
        treinos: { total: 0, status: 'disponivel_em_breve' as const },
      },
    }
  })

  return { error: null, atletas: atletasResult }
}
