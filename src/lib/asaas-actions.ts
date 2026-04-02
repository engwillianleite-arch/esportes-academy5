'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

// ─── Test Asaas connection ────────────────────────────────────────────────────

export async function testarConexaoAsaas(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const token = (formData.get('token') as string | null)?.trim() ?? ''
  const env = (formData.get('env') as string | null)?.trim() ?? 'sandbox'

  if (!token) return { error: 'Insira um token para testar' }
  if (!token.startsWith('$aact_')) {
    return { error: 'Token inválido — deve começar com $aact_' }
  }

  const baseUrl = env === 'producao'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

  try {
    const res = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: { 'access_token': token },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const status = res.status
      if (status === 401) return { error: 'Token inválido ou sem permissão' }
      if (status === 403) return { error: 'Acesso negado — verifique as permissões do token' }
      return { error: `Falha na conexão com Asaas (${status})` }
    }

    return { error: null, success: true }
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { error: 'Tempo limite excedido — verifique sua conexão' }
    }
    console.error('[testarConexaoAsaas]', err instanceof Error ? err.message : String(err))
    return { error: 'Erro ao conectar com Asaas. Tente novamente.' }
  }
}

// ─── Save Asaas configuration ─────────────────────────────────────────────────

export async function salvarConfiguracaoAsaas(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const env = (formData.get('asaas_env') as string | null)?.trim() || 'sandbox'
  if (!['sandbox', 'producao'].includes(env)) {
    return { error: 'Ambiente inválido' }
  }

  const token = (formData.get('asaas_token') as string | null)?.trim() ?? ''
  const walletId = (formData.get('asaas_wallet_id') as string | null)?.trim() || null

  // Numeric billing prefs
  const diasRaw = formData.get('dias_antecipacao')
  const dias = diasRaw ? parseInt(diasRaw as string, 10) : 3
  if (isNaN(dias) || dias < 1 || dias > 30) {
    return { error: 'Dias de antecipação deve ser entre 1 e 30' }
  }

  const multaRaw = formData.get('multa_pct')
  const multa = multaRaw ? parseFloat(multaRaw as string) : 2
  if (isNaN(multa) || multa < 0 || multa > 10) {
    return { error: 'Multa deve ser entre 0% e 10%' }
  }

  const jurosRaw = formData.get('juros_pct')
  const juros = jurosRaw ? parseFloat(jurosRaw as string) : 1
  if (isNaN(juros) || juros < 0 || juros > 10) {
    return { error: 'Juros deve ser entre 0% e 10%' }
  }

  const descontoRaw = formData.get('desconto_antecip_pct')
  const desconto = descontoRaw ? parseFloat(descontoRaw as string) : 0
  if (isNaN(desconto) || desconto < 0 || desconto > 100) {
    return { error: 'Desconto deve ser entre 0% e 100%' }
  }

  // Save token to Vault if provided; get back the vault secret id for the final UPDATE
  let vaultSecretId: string | null = null
  if (token) {
    if (!token.startsWith('$aact_')) {
      return { error: 'Token inválido — deve começar com $aact_' }
    }
    const { data: secretId, error: vaultError } = await supabase.rpc('salvar_asaas_token', {
      p_escola_id: escolaId,
      p_token: token,
    })
    if (vaultError) {
      console.error('[salvarConfiguracaoAsaas] vault', vaultError.message)
      return { error: 'Erro ao salvar token. Tente novamente.' }
    }
    vaultSecretId = secretId
  }

  // Single UPDATE: all Asaas config fields + vault secret id (if token was updated)
  const updatePayload: Record<string, unknown> = {
    asaas_env: env,
    asaas_wallet_id: walletId,
    dias_antecipacao: dias,
    multa_pct: multa,
    juros_pct: juros,
    desconto_antecip_pct: desconto,
  }
  if (vaultSecretId !== null) {
    updatePayload.asaas_vault_secret_id = vaultSecretId
  }

  const { error } = await supabase
    .from('escolas')
    .update(updatePayload)
    .eq('id', escolaId)

  if (error) {
    console.error('[salvarConfiguracaoAsaas]', error.message)
    return { error: 'Erro ao salvar configurações. Tente novamente.' }
  }

  redirect('/painel/configuracoes')
}
