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

// ─── Update general settings ──────────────────────────────────────────────────

export async function atualizarConfiguracoesEscola(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const supabase = await createClient()

  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  if (!nome) return { error: 'Nome da escola é obrigatório' }

  const janelaBruta = formData.get('janela_chamada_h')
  const janela = janelaBruta ? parseInt(janelaBruta as string, 10) : 48
  if (isNaN(janela) || janela < 1 || janela > 168) {
    return { error: 'Janela de chamada deve ser entre 1 e 168 horas' }
  }

  const capBruta = formData.get('capacidade_padrao')
  const capacidade = capBruta && (capBruta as string).trim() !== ''
    ? parseInt(capBruta as string, 10)
    : null
  if (capacidade !== null && (isNaN(capacidade) || capacidade < 1)) {
    return { error: 'Capacidade padrão deve ser um número positivo' }
  }

  const limiarBruto = formData.get('limiar_freq_pct')
  const limiarFreq = limiarBruto ? parseInt(limiarBruto as string, 10) : 75
  if (isNaN(limiarFreq) || limiarFreq < 0 || limiarFreq > 100) {
    return { error: 'Limite de alerta de frequência deve ser entre 0 e 100%' }
  }

  const VALID_TIMEZONES = [
    'America/Sao_Paulo', 'America/Manaus', 'America/Belem',
    'America/Noronha', 'America/Rio_Branco',
  ]
  const fusoRaw = (formData.get('fuso_horario') as string | null)?.trim() || 'America/Sao_Paulo'
  if (!VALID_TIMEZONES.includes(fusoRaw)) {
    return { error: 'Fuso horário inválido' }
  }

  const checkinCheckoutAtivo = formData.get('checkin_checkout_ativo') === 'true'

  const modalidades = formData.getAll('modalidades') as string[]

  const { error } = await supabase
    .from('escolas')
    .update({
      nome,
      email: (formData.get('email') as string | null)?.trim() || null,
      telefone: (formData.get('telefone') as string | null)?.trim() || null,
      modalidades,
      // Address
      cep: (formData.get('cep') as string | null)?.replace(/\D/g, '') || null,
      logradouro: (formData.get('logradouro') as string | null)?.trim() || null,
      numero: (formData.get('numero') as string | null)?.trim() || null,
      complemento: (formData.get('complemento') as string | null)?.trim() || null,
      bairro: (formData.get('bairro') as string | null)?.trim() || null,
      cidade: (formData.get('cidade') as string | null)?.trim() || null,
      estado: (formData.get('estado') as string | null)?.trim() || null,
      // Operational
      janela_chamada_h: janela,
      capacidade_padrao: capacidade,
      limiar_freq_pct: limiarFreq,
      fuso_horario: fusoRaw,
      checkin_checkout_ativo: checkinCheckoutAtivo,
    })
    .eq('id', escolaId)

  if (error) {
    console.error('[atualizarConfiguracoesEscola]', error.message)
    return { error: 'Erro ao salvar configurações. Tente novamente.' }
  }

  redirect('/painel/configuracoes')
}

// ─── Upload logo ──────────────────────────────────────────────────────────────

export async function uploadLogoEscola(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null; url?: string }> {
  const authErr = await assertAdminEscola(escolaId)
  if (authErr) return authErr

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }

  const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
  if (file.size > MAX_BYTES) return { error: 'Imagem deve ter no máximo 2 MB' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return { error: 'Formato inválido — use JPEG, PNG, WebP ou GIF' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${escolaId}/logo.${ext}`

  const supabase = await createClient()

  const { error: uploadError } = await supabase.storage
    .from('escola-logos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadLogoEscola] upload', uploadError.message)
    return { error: 'Erro ao enviar imagem. Tente novamente.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('escola-logos')
    .getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('escolas')
    .update({ logo_url: publicUrl })
    .eq('id', escolaId)

  if (updateError) {
    console.error('[uploadLogoEscola] update', updateError.message)
    return { error: 'Imagem enviada, mas falha ao salvar URL. Tente novamente.' }
  }

  redirect('/painel/configuracoes')
}
