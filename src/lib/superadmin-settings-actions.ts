'use server'

import { revalidatePath } from 'next/cache'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlataformaConfiguracao } from '@/types'

export type PlataformaConfiguracaoState = {
  success: boolean
  error: string | null
}

const DEFAULTS: PlataformaConfiguracao = {
  key: 'default',
  nome_publico: 'Esportes Academy',
  slug_institucional: 'esportes-academy',
  pais_padrao: 'Brasil',
  idioma_padrao: 'pt-BR',
  cpf_global_obrigatorio: true,
  selecao_contexto_obrigatoria: true,
  landing_publica_ativa: true,
  termos_status: 'Publicado',
  termos_versao: '1.8',
  politica_privacidade_status: 'Publicado',
  politica_privacidade_versao: '1.8',
  politica_cookies_status: 'Em revisao',
  politica_cookies_versao: '1.0',
  email_alertas_operacionais: true,
  notif_checkin_checkout: true,
  notif_aniversario_padrao: true,
  mensagem_aniversario_template:
    'Ola Atleta [nome do atleta], hoje e um dia muito especial na sua vida, desejamos muitos anos de vida, muita saude paz e prosperidade. Estes sao os votos da [nome da escola].',
  exigir_reset_senha_internos: true,
  mfa_superadmin: true,
  sessao_curta_critica: false,
  retencao_logs_dias: 180,
  exportacao_auditoria_frequencia: 'Semanal',
  alertas_falha_ativos: true,
  canal_escalonamento: 'Suporte interno',
  provider_video_padrao: 'youtube',
  timeout_jobs_segundos: 45,
  retry_jobs_limite: 3,
  rate_limit_janela_segundos: 60,
  eventos_por_lote: 100,
  sandbox_cursos_ativo: false,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

function toBool(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function toInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function carregarConfiguracoesPlataforma(): Promise<PlataformaConfiguracao> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('plataforma_configuracoes')
    .select('*')
    .eq('key', 'default')
    .maybeSingle()

  return data ?? DEFAULTS
}

export async function salvarConfiguracoesPlataforma(
  _prevState: PlataformaConfiguracaoState,
  formData: FormData
): Promise<PlataformaConfiguracaoState> {
  const auth = await assertSuperAdminAccess(['super_admin'])
  if ('error' in auth) return { success: false, error: auth.error }

  const nome_publico = String(formData.get('nome_publico') ?? '').trim()
  const slug_institucional = String(formData.get('slug_institucional') ?? '').trim().toLowerCase()
  const pais_padrao = String(formData.get('pais_padrao') ?? '').trim()
  const idioma_padrao = String(formData.get('idioma_padrao') ?? '').trim()
  const termos_status = String(formData.get('termos_status') ?? '').trim()
  const termos_versao = String(formData.get('termos_versao') ?? '').trim()
  const politica_privacidade_status = String(formData.get('politica_privacidade_status') ?? '').trim()
  const politica_privacidade_versao = String(formData.get('politica_privacidade_versao') ?? '').trim()
  const politica_cookies_status = String(formData.get('politica_cookies_status') ?? '').trim()
  const politica_cookies_versao = String(formData.get('politica_cookies_versao') ?? '').trim()
  const mensagem_aniversario_template = String(formData.get('mensagem_aniversario_template') ?? '').trim()
  const exportacao_auditoria_frequencia = String(formData.get('exportacao_auditoria_frequencia') ?? '').trim()
  const canal_escalonamento = String(formData.get('canal_escalonamento') ?? '').trim()
  const provider_video_padrao = String(formData.get('provider_video_padrao') ?? '').trim()

  if (!nome_publico || !pais_padrao || !idioma_padrao) {
    return { success: false, error: 'Preencha os campos principais da plataforma.' }
  }

  if (!/^[a-z0-9-]+$/.test(slug_institucional)) {
    return { success: false, error: 'Slug institucional deve usar apenas letras minusculas, numeros e hifens.' }
  }

  if (!mensagem_aniversario_template) {
    return { success: false, error: 'A mensagem padrao de aniversario nao pode ficar vazia.' }
  }

  const payload = {
    key: 'default',
    nome_publico,
    slug_institucional,
    pais_padrao,
    idioma_padrao,
    cpf_global_obrigatorio: toBool(formData, 'cpf_global_obrigatorio'),
    selecao_contexto_obrigatoria: toBool(formData, 'selecao_contexto_obrigatoria'),
    landing_publica_ativa: toBool(formData, 'landing_publica_ativa'),
    termos_status,
    termos_versao,
    politica_privacidade_status,
    politica_privacidade_versao,
    politica_cookies_status,
    politica_cookies_versao,
    email_alertas_operacionais: toBool(formData, 'email_alertas_operacionais'),
    notif_checkin_checkout: toBool(formData, 'notif_checkin_checkout'),
    notif_aniversario_padrao: toBool(formData, 'notif_aniversario_padrao'),
    mensagem_aniversario_template,
    exigir_reset_senha_internos: toBool(formData, 'exigir_reset_senha_internos'),
    mfa_superadmin: toBool(formData, 'mfa_superadmin'),
    sessao_curta_critica: toBool(formData, 'sessao_curta_critica'),
    retencao_logs_dias: toInt(formData.get('retencao_logs_dias'), 180),
    exportacao_auditoria_frequencia,
    alertas_falha_ativos: toBool(formData, 'alertas_falha_ativos'),
    canal_escalonamento,
    provider_video_padrao,
    timeout_jobs_segundos: toInt(formData.get('timeout_jobs_segundos'), 45),
    retry_jobs_limite: toInt(formData.get('retry_jobs_limite'), 3),
    rate_limit_janela_segundos: toInt(formData.get('rate_limit_janela_segundos'), 60),
    eventos_por_lote: toInt(formData.get('eventos_por_lote'), 100),
    sandbox_cursos_ativo: toBool(formData, 'sandbox_cursos_ativo'),
  }

  if (payload.retencao_logs_dias < 1 || payload.retencao_logs_dias > 3650) {
    return { success: false, error: 'Retencao de logs deve ficar entre 1 e 3650 dias.' }
  }

  if (payload.timeout_jobs_segundos < 5 || payload.timeout_jobs_segundos > 600) {
    return { success: false, error: 'Timeout de jobs deve ficar entre 5 e 600 segundos.' }
  }

  if (payload.retry_jobs_limite < 0 || payload.retry_jobs_limite > 20) {
    return { success: false, error: 'Limite de retries deve ficar entre 0 e 20.' }
  }

  if (payload.rate_limit_janela_segundos < 1 || payload.rate_limit_janela_segundos > 3600) {
    return { success: false, error: 'Janela de rate limit deve ficar entre 1 e 3600 segundos.' }
  }

  if (payload.eventos_por_lote < 1 || payload.eventos_por_lote > 5000) {
    return { success: false, error: 'Eventos por lote deve ficar entre 1 e 5000.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('plataforma_configuracoes').upsert(payload, { onConflict: 'key' })

  if (error) {
    console.error('[salvarConfiguracoesPlataforma]', error.message)
    return { success: false, error: 'Erro ao salvar configuracoes da plataforma.' }
  }

  revalidatePath('/superadmin/configuracoes')
  return { success: true, error: null }
}
