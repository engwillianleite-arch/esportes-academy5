'use server'

import { createClient } from '@/lib/supabase/server'
import { validateCpf } from '@/lib/cpf'
import type { Atleta, SexoTipo } from '@/types'

async function assertAdminOrCoordenador(escolaId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado' }
  const { data: membership } = await supabase
    .from('escola_usuarios').select('id')
    .eq('user_id', user.id).eq('escola_id', escolaId)
    .in('perfil', ['admin_escola', 'coordenador', 'secretaria'])
    .eq('ativo', true).is('deleted_at', null)
    .maybeSingle()
  if (!membership) return { error: 'Sem permissão' }
  return null
}

export async function lookupAtletaCpf(
  escolaId: string,
  cpf: string
): Promise<{
  error: string | null
  status?: 'novo' | 'existe' | 'mesma_escola'
  atleta?: Partial<Atleta>
}> {
  const authErr = await assertAdminOrCoordenador(escolaId)
  if (authErr) return authErr

  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11 || !validateCpf(clean)) return { error: 'CPF inválido' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('buscar_atleta_por_cpf', {
    p_cpf: clean,
    p_escola_id: escolaId,
  })

  if (error) {
    console.error('[lookupAtletaCpf]', error.message)
    return { error: 'Erro ao buscar CPF. Tente novamente.' }
  }

  const row = data?.[0]
  if (!row) return { error: 'Erro inesperado na busca.' }

  if (row.status === 'novo') return { error: null, status: 'novo' }

  if (row.status === 'mesma_escola') {
    return {
      error: null,
      status: 'mesma_escola',
      atleta: {
        id: row.atleta_id ?? undefined,
        nome: row.nome ?? undefined,
        data_nascimento: row.data_nascimento ?? undefined,
        sexo: (row.sexo as Atleta['sexo']) ?? undefined,
        foto_url: row.foto_url ?? null,
      },
    }
  }

  return {
    error: null,
    status: 'existe',
    atleta: {
      id: row.atleta_id ?? undefined,
      nome: row.nome ?? undefined,
      data_nascimento: row.data_nascimento ?? undefined,
      sexo: (row.sexo as Atleta['sexo']) ?? undefined,
      foto_url: row.foto_url ?? null,
    },
  }
}

export async function registrarAtleta(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null; atleta_id?: string }> {
  const authErr = await assertAdminOrCoordenador(escolaId)
  if (authErr) return { ...authErr, atleta_id: undefined }

  const cpf = (formData.get('cpf') as string | null)?.replace(/\D/g, '') ?? ''
  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const dataNascimento = (formData.get('data_nascimento') as string | null) ?? ''
  const sexo = (formData.get('sexo') as string | null) ?? ''

  if (!cpf || cpf.length !== 11 || !validateCpf(cpf)) return { error: 'CPF inválido' }
  if (!nome) return { error: 'Nome é obrigatório' }
  if (!dataNascimento) return { error: 'Data de nascimento é obrigatória' }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dataNascimento)) return { error: 'Data de nascimento inválida' }
  const parsedDate = new Date(dataNascimento + 'T00:00:00')
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 1900 || parsedDate > new Date()) {
    return { error: 'Data de nascimento inválida' }
  }
  if (!['M', 'F', 'outro'].includes(sexo)) return { error: 'Sexo é obrigatório' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atletas')
    .insert({ cpf, nome, data_nascimento: dataNascimento, sexo: sexo as SexoTipo })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'CPF já cadastrado no sistema.' }
    const msg = error.message ?? ''
    if (msg.includes('responsável')) {
      return {
        error:
          'Este CPF já está cadastrado como responsável. Cada pessoa tem um único CPF: use outro documento ou ajuste o cadastro existente.',
      }
    }
    console.error('[registrarAtleta]', error.message)
    return { error: 'Erro ao registrar atleta. Tente novamente.' }
  }

  return { error: null, atleta_id: data.id }
}
