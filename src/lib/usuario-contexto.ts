'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PerfilUsuario } from '@/types'

type ContextoAtivo = {
  escola_id: string
  tipo_usuario: PerfilUsuario
  principal: boolean
  origem: string
  ref_id: string | null
}

export type UsuarioContextoRow = ContextoAtivo & {
  id: string
  escola_nome: string | null
}

export async function syncUsuarioEscolaTiposAtual(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado.' }

  const admin = createAdminClient()
  const { data: usuarioGlobal } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!usuarioGlobal) return { error: 'Identidade global não encontrada.' }

  const contextos = new Map<string, ContextoAtivo>()

  const { data: perfisEscola } = await admin
    .from('escola_usuarios')
    .select('id, escola_id, perfil, created_at')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  for (const row of perfisEscola ?? []) {
    const key = `${row.escola_id}:${row.perfil}`
    if (contextos.has(key)) continue
    contextos.set(key, {
      escola_id: row.escola_id,
      tipo_usuario: row.perfil as PerfilUsuario,
      principal: ![...contextos.values()].some((ctx) => ctx.escola_id === row.escola_id),
      origem: 'escola_usuarios',
      ref_id: row.id,
    })
  }

  const { data: responsavelLink } = await admin
    .from('responsavel_usuarios')
    .select('responsavel_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (responsavelLink?.responsavel_id) {
    const { data: atletaLinks } = await admin
      .from('atleta_responsaveis')
      .select('id, atleta_id')
      .eq('responsavel_id', responsavelLink.responsavel_id)
      .is('deleted_at', null)

    const atletaIds = [...new Set((atletaLinks ?? []).map((row) => row.atleta_id))]
    if (atletaIds.length > 0) {
      const { data: matriculas } = await admin
        .from('matriculas')
        .select('id, escola_id, atleta_id, created_at')
        .in('atleta_id', atletaIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      for (const row of matriculas ?? []) {
        const key = `${row.escola_id}:responsavel`
        if (contextos.has(key)) continue
        contextos.set(key, {
          escola_id: row.escola_id,
          tipo_usuario: 'responsavel',
          principal: false,
          origem: 'responsavel_usuarios',
          ref_id: row.id,
        })
      }
    }
  }

  for (const contexto of contextos.values()) {
    const { error } = await admin.from('usuario_escola_tipos').upsert(
      {
        usuario_id: usuarioGlobal.id,
        escola_id: contexto.escola_id,
        tipo_usuario: contexto.tipo_usuario,
        principal: contexto.principal,
        origem: contexto.origem,
        ref_id: contexto.ref_id,
        ativo: true,
        deleted_at: null,
      },
      { onConflict: 'usuario_id,escola_id,tipo_usuario' }
    )

    if (error) {
      console.error('[syncUsuarioEscolaTiposAtual]', error.message)
      return { error: 'Erro ao sincronizar contextos do usuário.' }
    }
  }

  return { error: null }
}

export async function listarContextosUsuarioAtual(): Promise<{
  error: string | null
  rows?: UsuarioContextoRow[]
}> {
  const sync = await syncUsuarioEscolaTiposAtual()
  if (sync.error) return { error: sync.error }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado.' }

  const { data: usuarioGlobal } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!usuarioGlobal) return { error: 'Identidade global não encontrada.' }

  const { data } = await supabase
    .from('usuario_escola_tipos')
    .select('id, escola_id, tipo_usuario, principal, origem, ref_id')
    .eq('usuario_id', usuarioGlobal.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('principal', { ascending: false })
    .order('created_at', { ascending: true })

  const escolaIds = [...new Set((data ?? []).map((row) => row.escola_id))]
  const { data: escolas } = escolaIds.length
    ? await supabase.from('escolas').select('id, nome').in('id', escolaIds)
    : { data: [] as Array<{ id: string; nome: string }> }

  const escolaMap = new Map((escolas ?? []).map((escola) => [escola.id, escola.nome]))

  return {
    error: null,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      escola_id: row.escola_id,
      tipo_usuario: row.tipo_usuario as PerfilUsuario,
      principal: row.principal,
      origem: row.origem ?? 'manual',
      ref_id: row.ref_id ?? null,
      escola_nome: escolaMap.get(row.escola_id) ?? null,
    })),
  }
}
