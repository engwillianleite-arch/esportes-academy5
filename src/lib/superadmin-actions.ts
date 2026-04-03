'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_MODULES } from '@/lib/modulo-access'
import type { ModuloSlug, PerfilPlataforma, PlanoTipo, StatusAssinaturaPlataforma } from '@/types'

type EscolaResumo = {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  plano: PlanoTipo
  ativo: boolean
  created_at: string
}

type EscolaDetalhe = EscolaResumo & {
  telefone: string | null
  cidade: string | null
  estado: string | null
  onboarding_completo: boolean
}

type ModuloTenant = {
  id: string
  modulo_slug: ModuloSlug
  ativo: boolean
  expira_em: string | null
  liberado_em: string | null
}

async function getCurrentUserId(): Promise<{ userId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Usuário não autenticado' }
  return { userId: user.id }
}

export async function assertSuperAdminAccess(
  allowedProfiles: PerfilPlataforma[] = ['super_admin', 'suporte', 'financeiro_interno']
): Promise<{ error: string } | { userId: string; perfil: PerfilPlataforma }> {
  const current = await getCurrentUserId()
  if (!current.userId) return { error: current.error ?? 'Não autenticado' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('plataforma_usuarios')
    .select('perfil, ativo, deleted_at')
    .eq('user_id', current.userId)
    .maybeSingle()

  if (!data || !data.ativo || data.deleted_at) {
    return { error: 'Sem acesso ao portal SuperAdmin' }
  }

  if (!allowedProfiles.includes(data.perfil as PerfilPlataforma)) {
    return { error: 'Sem permissão para esta ação no SuperAdmin' }
  }

  return { userId: current.userId, perfil: data.perfil as PerfilPlataforma }
}

export async function listarEscolasSuperAdmin(params?: {
  q?: string
  plano?: PlanoTipo | 'todos'
  ativo?: 'todos' | 'ativo' | 'inativo'
  page?: number
  pageSize?: number
}): Promise<{ error: string | null; rows?: EscolaResumo[]; total?: number }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, params?.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('escolas')
    .select('id, nome, cnpj, email, plano, ativo, created_at', { count: 'exact' })
    .is('deleted_at', null)

  const q = params?.q?.trim()
  if (q) {
    query = query.or(`nome.ilike.%${q}%,cnpj.ilike.%${q}%,email.ilike.%${q}%`)
  }

  if (params?.plano && params.plano !== 'todos') {
    query = query.eq('plano', params.plano)
  }

  if (params?.ativo === 'ativo') query = query.eq('ativo', true)
  if (params?.ativo === 'inativo') query = query.eq('ativo', false)

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)

  if (error) {
    console.error('[listarEscolasSuperAdmin]', error.message)
    return { error: 'Erro ao carregar escolas.' }
  }

  return { error: null, rows: (data ?? []) as EscolaResumo[], total: count ?? 0 }
}

export async function carregarEscolaDetalheSuperAdmin(
  escolaId: string
): Promise<{
  error: string | null
  escola?: EscolaDetalhe
  modulos?: ModuloTenant[]
  usuariosCount?: number
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: escola, error } = await admin
    .from('escolas')
    .select('id, nome, cnpj, email, telefone, cidade, estado, plano, ativo, onboarding_completo, created_at')
    .eq('id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !escola) return { error: 'Escola não encontrada.' }

  const [{ data: modulos }, { count: usuariosCount }] = await Promise.all([
    admin
      .from('escola_modulos')
      .select('id, modulo_slug, ativo, expira_em, liberado_em')
      .eq('escola_id', escolaId)
      .order('modulo_slug', { ascending: true }),
    admin
      .from('escola_usuarios')
      .select('*', { head: true, count: 'exact' })
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .is('deleted_at', null),
  ])

  return {
    error: null,
    escola: escola as EscolaDetalhe,
    modulos: (modulos ?? []) as ModuloTenant[],
    usuariosCount: usuariosCount ?? 0,
  }
}

export async function atualizarPlanoEscolaSuperAdmin(
  escolaId: string,
  plano: PlanoTipo
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  const { error: updateError } = await admin
    .from('escolas')
    .update({ plano })
    .eq('id', escolaId)

  if (updateError) {
    console.error('[atualizarPlanoEscolaSuperAdmin]', updateError.message)
    return { error: 'Erro ao atualizar plano da escola.' }
  }

  const allSlugs = new Set<ModuloSlug>([
    'administrativo',
    'financeiro',
    'comunicacao_basica',
    'saude',
    'eventos',
    'treinamentos',
    'comunicacao_avancada',
    'relatorios',
    'competicoes',
    'metodologia',
    'cursos',
  ])

  const allowed = new Set<ModuloSlug>(PLAN_MODULES[plano])
  const now = new Date().toISOString()

  for (const slug of allSlugs) {
    const ativo = allowed.has(slug)
    const { error } = await admin.from('escola_modulos').upsert(
      {
        escola_id: escolaId,
        modulo_slug: slug,
        ativo,
        liberado_por: auth.userId,
        liberado_em: now,
        expira_em: null,
      },
      { onConflict: 'escola_id,modulo_slug' }
    )
    if (error) {
      console.error('[atualizarPlanoEscolaSuperAdmin:modulo]', error.message)
      return { error: 'Erro ao sincronizar módulos do plano.' }
    }
  }

  // Audit log (Story 8.2)
  const userResult = await admin.auth.admin.getUserById(auth.userId)
  await registrarAuditoria({
    tipo: 'plano_escola',
    escolaId,
    atorId: auth.userId,
    atorEmail: userResult.data.user?.email ?? null,
    detalhes: { plano_novo: plano },
  })

  return { error: null }
}

export async function atualizarModuloAvulsoSuperAdmin(
  escolaId: string,
  moduloSlug: ModuloSlug,
  ativo: boolean,
  expiraEm: string | null
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('escola_modulos').upsert(
    {
      escola_id: escolaId,
      modulo_slug: moduloSlug,
      ativo,
      expira_em: expiraEm,
      liberado_por: auth.userId,
      liberado_em: new Date().toISOString(),
    },
    { onConflict: 'escola_id,modulo_slug' }
  )

  if (error) {
    console.error('[atualizarModuloAvulsoSuperAdmin]', error.message)
    return { error: 'Erro ao atualizar módulo da escola.' }
  }

  // Audit log (Story 8.2)
  const userResult = await admin.auth.admin.getUserById(auth.userId)
  await registrarAuditoria({
    tipo: 'modulo_escola',
    escolaId,
    atorId: auth.userId,
    atorEmail: userResult.data.user?.email ?? null,
    moduloSlug,
    valorDepois: ativo,
  })

  return { error: null }
}

export async function listarUsuariosInternosPlataforma(): Promise<{
  error: string | null
  rows?: Array<{ id: string; user_id: string; perfil: PerfilPlataforma; ativo: boolean; created_at: string; email: string | null }>
}> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plataforma_usuarios')
    .select('id, user_id, perfil, ativo, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Erro ao carregar usuários internos.' }

  const rows = [] as Array<{ id: string; user_id: string; perfil: PerfilPlataforma; ativo: boolean; created_at: string; email: string | null }>
  for (const r of data ?? []) {
    const userResult = await admin.auth.admin.getUserById(r.user_id)
    rows.push({
      id: r.id,
      user_id: r.user_id,
      perfil: r.perfil as PerfilPlataforma,
      ativo: r.ativo,
      created_at: r.created_at,
      email: userResult.data.user?.email ?? null,
    })
  }

  return { error: null, rows }
}

export async function convidarUsuarioInternoPlataforma(
  email: string,
  perfil: PerfilPlataforma
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) return { error: 'E-mail inválido.' }

  const admin = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const invite = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
    redirectTo: `${appUrl}/superadmin`,
  })

  if (invite.error || !invite.data.user) {
    console.error('[convidarUsuarioInternoPlataforma]', invite.error?.message)
    return { error: 'Erro ao enviar convite.' }
  }

  const { error } = await admin.from('plataforma_usuarios').upsert(
    {
      user_id: invite.data.user.id,
      perfil,
      ativo: true,
      deleted_at: null,
    },
    { onConflict: 'user_id' }
  )

  if (error) return { error: 'Erro ao salvar usuário interno.' }
  return { error: null }
}

export async function atualizarUsuarioInternoPlataforma(
  userId: string,
  params: { ativo?: boolean; perfil?: PerfilPlataforma }
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const updatePayload: Record<string, unknown> = {}
  if (typeof params.ativo === 'boolean') updatePayload.ativo = params.ativo
  if (params.perfil) updatePayload.perfil = params.perfil

  const { error } = await admin.from('plataforma_usuarios').update(updatePayload).eq('user_id', userId)
  if (error) return { error: 'Erro ao atualizar usuário interno.' }
  return { error: null }
}

export async function listarAssinaturasPlataforma(): Promise<{
  error: string | null
  rows?: Array<{
    id: string
    escola_id: string
    escola_nome: string
    valor_mensal: number
    dia_vencimento: number
    status: StatusAssinaturaPlataforma
    proximo_vencimento: string | null
    referencia_externa: string | null
  }>
}> {
  const auth = await assertSuperAdminAccess(['super_admin', 'financeiro_interno'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('assinaturas_plataforma')
    .select('id, escola_id, valor_mensal, dia_vencimento, status, proximo_vencimento, referencia_externa')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return { error: 'Erro ao carregar faturamento da plataforma.' }

  const escolaIds = [...new Set((data ?? []).map((r) => r.escola_id))]
  const { data: escolas } = await admin.from('escolas').select('id, nome').in('id', escolaIds)
  const mapNome = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  return {
    error: null,
    rows: (data ?? []).map((r) => ({
      ...r,
      valor_mensal: Number(r.valor_mensal),
      escola_nome: mapNome.get(r.escola_id) ?? r.escola_id,
      status: r.status as StatusAssinaturaPlataforma,
    })),
  }
}

export async function salvarAssinaturaPlataforma(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin', 'financeiro_interno'])
  if ('error' in auth) return { error: auth.error }

  const valor = Number(((formData.get('valor_mensal') as string | null) ?? '0').replace(',', '.'))
  const dia = Number((formData.get('dia_vencimento') as string | null) ?? '10')
  const status = ((formData.get('status') as string | null) ?? 'adimplente') as StatusAssinaturaPlataforma
  const proximo = (formData.get('proximo_vencimento') as string | null)?.trim() || null
  const ref = (formData.get('referencia_externa') as string | null)?.trim() || null

  if (Number.isNaN(valor) || valor < 0) return { error: 'Valor mensal inválido.' }
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) return { error: 'Dia de vencimento inválido.' }

  const admin = createAdminClient()
  const { error } = await admin.from('assinaturas_plataforma').upsert(
    {
      escola_id: escolaId,
      valor_mensal: valor,
      dia_vencimento: dia,
      status,
      proximo_vencimento: proximo,
      referencia_externa: ref,
      deleted_at: null,
    },
    { onConflict: 'escola_id' }
  )

  if (error) return { error: 'Erro ao salvar assinatura da plataforma.' }
  return { error: null }
}

// ─── Story 8.1: Matriz perfil × módulo editável ───────────────────────────────

export type PermissaoMatrizRow = {
  modulo_slug: string
  perfil: string
  ativo: boolean
}

export async function listarMatrizPermissoes(): Promise<{
  error: string | null
  rows?: PermissaoMatrizRow[]
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('perfil_modulo_acesso')
    .select('modulo_slug, perfil, ativo')
    .order('modulo_slug', { ascending: true })

  if (error) {
    console.error('[listarMatrizPermissoes]', error.message)
    return { error: 'Erro ao carregar matriz de permissões.' }
  }

  return { error: null, rows: (data ?? []) as PermissaoMatrizRow[] }
}

export async function atualizarPermissaoMatriz(
  moduloSlug: string,
  perfil: string,
  ativo: boolean
): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  // Guard: cannot remove admin_escola access to administrativo
  if (moduloSlug === 'administrativo' && perfil === 'admin_escola' && !ativo) {
    return { error: 'Não é permitido remover acesso do admin_escola ao módulo administrativo.' }
  }

  const admin = createAdminClient()

  // Read current value for audit (valor_antes)
  const { data: atual } = await admin
    .from('perfil_modulo_acesso')
    .select('ativo')
    .eq('modulo_slug', moduloSlug)
    .eq('perfil', perfil)
    .maybeSingle()
  const valorAntes = atual?.ativo ?? null

  const { error } = await admin.from('perfil_modulo_acesso').upsert(
    {
      modulo_slug: moduloSlug,
      perfil,
      ativo,
      atualizado_por: auth.userId,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'modulo_slug,perfil' }
  )

  if (error) {
    console.error('[atualizarPermissaoMatriz]', error.message)
    return { error: 'Erro ao atualizar permissão.' }
  }

  // Audit log (fire-and-forget)
  const userResult = await admin.auth.admin.getUserById(auth.userId)
  await registrarAuditoria({
    tipo: 'permissao_matriz',
    escolaId: null,
    atorId: auth.userId,
    atorEmail: userResult.data.user?.email ?? null,
    moduloSlug,
    perfil,
    valorAntes,
    valorDepois: ativo,
  })

  return { error: null }
}

// ─── Story 8.2: Auditoria de alterações em permissões ─────────────────────────

// Private helper — fire-and-forget, never throws
async function registrarAuditoria(params: {
  tipo: string
  escolaId?: string | null
  atorId: string
  atorEmail?: string | null
  moduloSlug?: string | null
  perfil?: string | null
  valorAntes?: boolean | null
  valorDepois?: boolean | null
  detalhes?: Record<string, unknown> | null
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('auditoria_permissoes').insert({
    tipo: params.tipo,
    escola_id: params.escolaId ?? null,
    ator_id: params.atorId,
    ator_email: params.atorEmail ?? null,
    modulo_slug: params.moduloSlug ?? null,
    perfil: params.perfil ?? null,
    valor_antes: params.valorAntes ?? null,
    valor_depois: params.valorDepois ?? null,
    detalhes: (params.detalhes ?? null) as import('@/types/database').Json | null,
  })
  if (error) console.error('[registrarAuditoria]', error.message)
}

export type AuditoriaRow = {
  id: string
  tipo: string
  escola_id: string | null
  escola_nome: string | null
  ator_email: string | null
  modulo_slug: string | null
  perfil: string | null
  valor_antes: boolean | null
  valor_depois: boolean | null
  detalhes: Record<string, unknown> | null
  criado_em: string
}

export async function listarAuditoriaPermissoes(params?: {
  escola_id?: string
  ator_email?: string
  tipo?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  pageSize?: number
}): Promise<{ error: string | null; rows?: AuditoriaRow[]; total?: number }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, params?.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('auditoria_permissoes')
    .select('id, tipo, escola_id, ator_email, modulo_slug, perfil, valor_antes, valor_depois, detalhes, criado_em', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(from, to)

  if (params?.escola_id) query = query.eq('escola_id', params.escola_id)
  if (params?.ator_email?.trim()) query = query.ilike('ator_email', `%${params.ator_email.trim()}%`)
  if (params?.tipo?.trim()) query = query.eq('tipo', params.tipo.trim())
  if (params?.data_inicio) query = query.gte('criado_em', params.data_inicio)
  if (params?.data_fim) query = query.lte('criado_em', params.data_fim + 'T23:59:59Z')

  const { data, error, count } = await query

  if (error) {
    console.error('[listarAuditoriaPermissoes]', error.message)
    return { error: 'Erro ao carregar auditoria.' }
  }

  // Enrich with escola nome
  const escolaIds = [...new Set((data ?? []).map((r) => r.escola_id).filter(Boolean))] as string[]
  const escolaNomes = new Map<string, string>()
  if (escolaIds.length > 0) {
    const { data: escolas } = await admin.from('escolas').select('id, nome').in('id', escolaIds)
    for (const e of escolas ?? []) escolaNomes.set(e.id, e.nome)
  }

  const rows: AuditoriaRow[] = (data ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo,
    escola_id: r.escola_id,
    escola_nome: r.escola_id ? (escolaNomes.get(r.escola_id) ?? r.escola_id) : null,
    ator_email: r.ator_email,
    modulo_slug: r.modulo_slug,
    perfil: r.perfil,
    valor_antes: r.valor_antes,
    valor_depois: r.valor_depois,
    detalhes: r.detalhes as Record<string, unknown> | null,
    criado_em: r.criado_em,
  }))

  return { error: null, rows, total: count ?? 0 }
}
