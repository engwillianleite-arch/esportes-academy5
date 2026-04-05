'use server'

import { cleanCpf, validateCpf } from '@/lib/cpf'
import { getAppUrl } from '@/lib/app-url'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'
import type { PlanoTipo } from '@/types'

export type EscolaRow = {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  bairro: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  plano: string
  ativo: boolean
  onboarding_completo: boolean
  modalidades: string[]
  capacidade_padrao: number | null
  created_at: string
  total_atletas?: number
  assinatura_status?: string | null
  proximo_vencimento?: string | null
}

export type CriarEscolaInput = {
  nome: string
  cnpj?: string
  email?: string
  gerente_nome?: string
  gerente_cpf?: string
  telefone?: string
  cidade?: string
  estado?: string
  cep?: string
  bairro?: string
  logradouro?: string
  numero?: string
  complemento?: string
  plano: PlanoTipo
  ativo?: boolean
  modalidades?: string[]
  capacidade_padrao?: number
}

export type AtualizarEscolaInput = Partial<CriarEscolaInput>

function normalizeEmail(email?: string): string | null {
  const clean = email?.trim().toLowerCase() ?? ''
  return clean && clean.includes('@') ? clean : null
}

export async function listarEscolas(params?: {
  q?: string
  plano?: string
  ativo?: 'todos' | 'ativo' | 'inativo'
  page?: number
  pageSize?: number
}): Promise<{
  error: string | null
  rows?: EscolaRow[]
  total?: number
  kpi?: { total: number; ativas: number; trial: number; inativas: number }
}> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, params?.pageSize ?? 20)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('escolas')
    .select(
      'id, nome, cnpj, email, telefone, cidade, estado, cep, bairro, logradouro, numero, complemento, plano, ativo, onboarding_completo, modalidades, capacidade_padrao, created_at',
      { count: 'exact' }
    )
    .is('deleted_at', null)

  const q = params?.q?.trim()
  if (q) query = query.or(`nome.ilike.%${q}%,cnpj.ilike.%${q}%,email.ilike.%${q}%,cidade.ilike.%${q}%`)
  if (params?.plano && params.plano !== 'todos') query = query.eq('plano', params.plano)
  if (params?.ativo === 'ativo') query = query.eq('ativo', true)
  if (params?.ativo === 'inativo') query = query.eq('ativo', false)

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) return { error: 'Erro ao carregar escolas.' }

  const { data: allAtivos } = await admin.from('escolas').select('ativo, plano').is('deleted_at', null)

  const all = allAtivos ?? []
  const kpi = {
    total: all.length,
    ativas: all.filter((e) => e.ativo && e.plano !== 'trial').length,
    trial: all.filter((e) => e.plano === 'trial').length,
    inativas: all.filter((e) => !e.ativo).length,
  }

  const ids = (data ?? []).map((e) => e.id)
  const atletaMap: Record<string, number> = {}
  const assinaturaMap: Record<string, { status: string; proximo_vencimento: string | null }> = {}

  if (ids.length > 0) {
    const [{ data: matriculasData }, { data: assData }] = await Promise.all([
      admin.from('matriculas').select('escola_id').in('escola_id', ids).is('deleted_at', null),
      admin
        .from('assinaturas_plataforma')
        .select('escola_id, status, proximo_vencimento')
        .in('escola_id', ids)
        .is('deleted_at', null),
    ])

    for (const m of matriculasData ?? []) atletaMap[m.escola_id] = (atletaMap[m.escola_id] ?? 0) + 1
    for (const a of assData ?? []) {
      assinaturaMap[a.escola_id] = { status: a.status, proximo_vencimento: a.proximo_vencimento }
    }
  }

  const rows: EscolaRow[] = (data ?? []).map((e) => ({
    ...e,
    modalidades: e.modalidades ?? [],
    total_atletas: atletaMap[e.id] ?? 0,
    assinatura_status: assinaturaMap[e.id]?.status ?? null,
    proximo_vencimento: assinaturaMap[e.id]?.proximo_vencimento ?? null,
  }))

  return { error: null, rows, total: count ?? 0, kpi }
}

export async function buscarEscola(id: string): Promise<{ error: string | null; escola?: EscolaRow }> {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('escolas')
    .select(
      'id, nome, cnpj, email, telefone, cidade, estado, cep, bairro, logradouro, numero, complemento, plano, ativo, onboarding_completo, modalidades, capacidade_padrao, created_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return { error: 'Escola nao encontrada.' }
  return { error: null, escola: { ...data, modalidades: data.modalidades ?? [] } }
}

export async function criarEscola(input: CriarEscolaInput): Promise<{ error: string | null; id?: string }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  if (!input.nome?.trim()) return { error: 'Nome e obrigatorio.' }
  if (!input.plano) return { error: 'Plano e obrigatorio.' }

  const emailGerente = normalizeEmail(input.email)
  if (!emailGerente) return { error: 'E-mail da escola e obrigatorio para enviar os dados de acesso.' }

  const gerenteNome = input.gerente_nome?.trim() ?? ''
  const gerenteCpf = cleanCpf(input.gerente_cpf ?? '')
  if (!gerenteNome) return { error: 'Nome do gerente e obrigatorio.' }
  if (gerenteCpf.length !== 11) return { error: 'CPF do gerente e obrigatorio (11 digitos).' }
  if (!validateCpf(gerenteCpf)) return { error: 'CPF do gerente invalido.' }

  const admin = createAdminClient()
  const { data: cpfExistente } = await admin
    .from('usuarios')
    .select('id')
    .eq('cpf', gerenteCpf)
    .is('deleted_at', null)
    .maybeSingle()

  if (cpfExistente) {
    return { error: 'Este CPF ja esta vinculado a outro usuario. Para este fluxo inicial, crie a escola com um gerente inedito.' }
  }

  const { data, error } = await admin
    .from('escolas')
    .insert({
      nome: input.nome.trim(),
      cnpj: input.cnpj?.trim() || null,
      email: emailGerente,
      telefone: input.telefone?.trim() || null,
      cidade: input.cidade?.trim() || null,
      estado: input.estado?.trim() || null,
      cep: input.cep?.trim() || null,
      bairro: input.bairro?.trim() || null,
      logradouro: input.logradouro?.trim() || null,
      numero: input.numero?.trim() || null,
      complemento: input.complemento?.trim() || null,
      plano: input.plano,
      ativo: input.ativo ?? true,
      modalidades: input.modalidades ?? [],
      capacidade_padrao: input.capacidade_padrao ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[criarEscola]', error.message)
    return { error: 'Erro ao criar escola.' }
  }

  const appUrl = getAppUrl()
  const invite = await admin.auth.admin.inviteUserByEmail(emailGerente, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  })

  if (invite.error || !invite.data.user) {
    await admin.from('escolas').delete().eq('id', data.id)
    console.error('[criarEscola:invite]', invite.error?.message)
    return { error: 'A escola nao foi concluida porque o convite por e-mail falhou.' }
  }

  const invitedUser = invite.data.user

  const { error: escolaUsuarioError } = await admin.from('escola_usuarios').upsert(
    {
      user_id: invitedUser.id,
      escola_id: data.id,
      perfil: 'admin_escola',
      ativo: true,
      deleted_at: null,
    },
    { onConflict: 'user_id,escola_id,perfil' }
  )

  if (escolaUsuarioError) {
    console.error('[criarEscola:escola_usuarios]', escolaUsuarioError.message)
    return { error: 'Escola criada, mas nao foi possivel vincular o gerente a escola.' }
  }

  const { data: usuarioGlobal, error: usuarioGlobalError } = await admin
    .from('usuarios')
    .upsert(
      {
        auth_user_id: invitedUser.id,
        cpf: gerenteCpf,
        nome: gerenteNome,
        email: emailGerente,
        ativo: true,
        deleted_at: null,
      },
      { onConflict: 'auth_user_id' }
    )
    .select('id')
    .single()

  if (usuarioGlobalError || !usuarioGlobal) {
    console.error('[criarEscola:usuarios]', usuarioGlobalError?.message)
    return { error: 'Escola criada, mas nao foi possivel criar a identidade global do gerente.' }
  }

  const { error: contextoError } = await admin.from('usuario_escola_tipos').upsert(
    {
      usuario_id: usuarioGlobal.id,
      escola_id: data.id,
      tipo_usuario: 'admin_escola',
      principal: true,
      origem: 'escola_usuarios',
      ref_id: null,
      ativo: true,
      deleted_at: null,
    },
    { onConflict: 'usuario_id,escola_id,tipo_usuario' }
  )

  if (contextoError) {
    console.error('[criarEscola:usuario_escola_tipos]', contextoError.message)
    return { error: 'Escola criada, mas nao foi possivel preparar o contexto de acesso do gerente.' }
  }

  return { error: null, id: data.id }
}

export async function atualizarEscola(id: string, input: AtualizarEscolaInput): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  if (input.nome !== undefined && !input.nome.trim()) return { error: 'Nome nao pode ser vazio.' }

  const admin = createAdminClient()
  const payload: Record<string, unknown> = {}

  if (input.nome !== undefined) payload.nome = input.nome.trim()
  if (input.cnpj !== undefined) payload.cnpj = input.cnpj?.trim() || null
  if (input.email !== undefined) payload.email = input.email?.trim() || null
  if (input.telefone !== undefined) payload.telefone = input.telefone?.trim() || null
  if (input.cidade !== undefined) payload.cidade = input.cidade?.trim() || null
  if (input.estado !== undefined) payload.estado = input.estado?.trim() || null
  if (input.cep !== undefined) payload.cep = input.cep?.trim() || null
  if (input.bairro !== undefined) payload.bairro = input.bairro?.trim() || null
  if (input.logradouro !== undefined) payload.logradouro = input.logradouro?.trim() || null
  if (input.numero !== undefined) payload.numero = input.numero?.trim() || null
  if (input.complemento !== undefined) payload.complemento = input.complemento?.trim() || null
  if (input.plano !== undefined) payload.plano = input.plano
  if (input.ativo !== undefined) payload.ativo = input.ativo
  if (input.modalidades !== undefined) payload.modalidades = input.modalidades
  if (input.capacidade_padrao !== undefined) payload.capacidade_padrao = input.capacidade_padrao

  const { error } = await admin.from('escolas').update(payload).eq('id', id).is('deleted_at', null)

  if (error) {
    console.error('[atualizarEscola]', error.message)
    return { error: 'Erro ao atualizar escola.' }
  }

  return { error: null }
}

export async function toggleEscolaAtivo(id: string, ativo: boolean): Promise<{ error: string | null }> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('escolas').update({ ativo }).eq('id', id).is('deleted_at', null)

  if (error) return { error: 'Erro ao atualizar status.' }
  return { error: null }
}

