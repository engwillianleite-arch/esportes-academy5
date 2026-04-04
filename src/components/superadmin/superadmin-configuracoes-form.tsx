'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { PlataformaConfiguracao } from '@/types'
import {
  salvarConfiguracoesPlataforma,
  type PlataformaConfiguracaoState,
} from '@/lib/superadmin-settings-actions'

const sections = [
  { id: 'plataforma', label: 'Plataforma', icon: '🏢' },
  { id: 'politicas', label: 'Politicas', icon: '📜' },
  { id: 'notificacoes', label: 'Notificacoes', icon: '🔔' },
  { id: 'seguranca', label: 'Seguranca', icon: '🛡️' },
  { id: 'integracoes', label: 'Integracoes', icon: '🔌' },
  { id: 'avancado', label: 'Avancado', icon: '🧰' },
] as const

const initialState: PlataformaConfiguracaoState = { success: false, error: null }

function toneClasses(tone: string) {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'sky':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'indigo':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function SectionCard({
  id,
  eyebrow,
  title,
  description,
  children,
  dark = false,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 overflow-hidden rounded-[24px] border shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] ${
        dark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className={`px-4 py-4 sm:px-7 sm:py-5 ${dark ? 'border-b border-white/10 bg-white/[0.02]' : 'border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.92))]'}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${dark ? 'text-cyan-300' : 'text-indigo-600'}`}>{eyebrow}</p>
        <h2 className={`mt-2 text-lg font-bold sm:text-xl ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
        <p className={`mt-1 max-w-3xl text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
      </div>
      <div className="px-4 py-4 sm:px-7 sm:py-6">{children}</div>
    </section>
  )
}

function ToggleField({
  name,
  title,
  description,
  defaultChecked,
  disabled,
  dark = false,
}: {
  name: string
  title: string
  description: string
  defaultChecked: boolean
  disabled: boolean
  dark?: boolean
}) {
  return (
    <label className={`flex cursor-pointer flex-col gap-3 rounded-[22px] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${dark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-white'} ${disabled ? 'opacity-70' : ''}`}>
      <div>
        <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</p>
        <p className={`mt-1 text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>
      </div>
      <span className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 ${defaultChecked ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}>
        <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="sr-only" />
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </span>
    </label>
  )
}

function TextField({
  name,
  label,
  defaultValue,
  disabled,
  dark = false,
  type = 'text',
}: {
  name: string
  label: string
  defaultValue: string | number
  disabled: boolean
  dark?: boolean
  type?: string
}) {
  return (
    <div>
      <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition ${dark ? 'border border-white/10 bg-black/10 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'} ${disabled ? 'cursor-not-allowed opacity-80' : 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
      />
    </div>
  )
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
  disabled,
}: {
  name: string
  label: string
  defaultValue: string
  options: string[]
  disabled: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition ${disabled ? 'cursor-not-allowed opacity-80' : 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}

function ProviderCard({ name, tag, detail, tone }: { name: string; tag: string; detail: string; tone: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{name}</h3>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(tone)}`}>{tag}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-medium text-slate-500">Status da conexao</span>
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Saudavel
        </span>
      </div>
    </div>
  )
}

export function SuperAdminConfiguracoesForm({
  settings,
  isEditable,
  projectRef,
}: {
  settings: PlataformaConfiguracao
  isEditable: boolean
  projectRef: string
}) {
  const [state, formAction, pending] = useActionState(salvarConfiguracoesPlataforma, initialState)

  return (
    <form action={formAction} className="mx-auto max-w-[1440px] space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#eef2ff_45%,#f8fafc_100%)] p-4 shadow-[0_26px_80px_rgba(79,70,229,0.10)] sm:rounded-[34px] sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] bg-[linear-gradient(180deg,rgba(79,70,229,0.10),rgba(255,255,255,0))] lg:block" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Centro de configuracoes
            </div>
            <h1 className="mt-4 text-[1.9rem] font-bold tracking-tight text-slate-950 sm:text-[2.4rem]">
              Configuracoes do Super Admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Painel mestre para governar politicas, seguranca, integracoes e parametros avancados da plataforma
              Esportes Academy. Agora a tela esta conectada a configuracoes reais do portal.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="#avancado"
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 sm:w-auto"
            >
              Ir para avancado
            </Link>
            <button
              type="submit"
              disabled={!isEditable || pending}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.22)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {pending ? 'Salvando...' : isEditable ? 'Salvar configuracoes' : 'Somente leitura'}
            </button>
          </div>
        </div>

        {(state.error || state.success) && (
          <div className={`relative mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${state.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {state.error ?? 'Configuracoes salvas com sucesso.'}
          </div>
        )}

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[ 
            { label: 'Producao', value: 'Ativa', tone: 'emerald' },
            { label: 'Regiao', value: settings.pais_padrao, tone: 'sky' },
            { label: 'Versao', value: settings.termos_versao, tone: 'indigo' },
            { label: 'Operacao', value: '3 sistemas mapeados', tone: 'amber' },
          ].map((item) => (
            <div key={item.label} className="rounded-[20px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur sm:rounded-[24px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(item.tone)}`}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <span>{section.icon}</span>
            {section.label}
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-[30px] border border-slate-900 bg-[linear-gradient(180deg,#0f172a,#111827)] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.26)]">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Secoes</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Navegacao rapida para os blocos principais da governanca da plataforma.
              </p>
            </div>
            <p className="px-3 pb-3 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Mapa da pagina</p>
            <nav className="space-y-1.5">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/0 px-3 py-3 text-sm font-medium text-white/75 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-base">
                    {section.icon}
                  </span>
                  <span>{section.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-4 sm:space-y-6">
          <SectionCard
            id="plataforma"
            eyebrow="Base da plataforma"
            title="Identidade, contexto e operacao do ecossistema"
            description="Aqui ficam os controles mais amplos da operacao: nome oficial do produto, regras de CPF, portais ativos e defaults da experiencia SuperAdmin."
          >
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField name="nome_publico" label="Nome publico da plataforma" defaultValue={settings.nome_publico} disabled={!isEditable} />
                  <TextField name="slug_institucional" label="Slug institucional" defaultValue={settings.slug_institucional} disabled={!isEditable} />
                  <TextField name="pais_padrao" label="Pais padrao" defaultValue={settings.pais_padrao} disabled={!isEditable} />
                  <TextField name="idioma_padrao" label="Idioma padrao" defaultValue={settings.idioma_padrao} disabled={!isEditable} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Controles essenciais</p>
                  <div className="mt-4 space-y-3">
                    <ToggleField name="cpf_global_obrigatorio" title="CPF obrigatorio para todos os usuarios" description="Mantem a identidade global unica entre Gestao, Cursos e Competicoes." defaultChecked={settings.cpf_global_obrigatorio} disabled={!isEditable} />
                    <ToggleField name="selecao_contexto_obrigatoria" title="Selecao explicita de escola e perfil" description="Forca contexto antes da jornada operacional quando o usuario tiver multiplos vinculos." defaultChecked={settings.selecao_contexto_obrigatoria} disabled={!isEditable} />
                    <ToggleField name="landing_publica_ativa" title="Landing publica institucional" description="Exibe a marca e o fluxo de entrada antes do redirecionamento autenticado." defaultChecked={settings.landing_publica_ativa} disabled={!isEditable} />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-indigo-100 bg-[linear-gradient(180deg,rgba(224,231,255,0.75),rgba(255,255,255,0.98))] p-4 shadow-sm sm:rounded-[28px] sm:p-5">
                <p className="text-sm font-semibold text-slate-950">Portais ativos</p>
                <div className="mt-4 grid gap-3">
                  <PortalChip name="Sistema de Gestao" status="Ativo" tone="indigo" detail="Escolas, responsaveis e professores em producao visual." />
                  <PortalChip name="Sistema de Cursos" status={settings.sandbox_cursos_ativo ? 'Sandbox ativo' : 'Planejado + mockado'} tone="amber" detail="Criador, aluno e governanca comercial ja mapeados." />
                  <PortalChip name="Sistema de Competicoes" status="Mockado" tone="sky" detail="Portal do organizador congelado nesta fase." />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="politicas"
            eyebrow="Governanca"
            title="Termos, politicas e documentos mestres"
            description="A referencia pedia uma area dedicada a politicas. Aqui deixamos o estado editorial e operacional de cada documento sensivel."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <div className="grid gap-4">
                  <SelectField name="termos_status" label="Status dos termos" defaultValue={settings.termos_status} options={['Publicado', 'Em revisao', 'Rascunho']} disabled={!isEditable} />
                  <TextField name="termos_versao" label="Versao dos termos" defaultValue={settings.termos_versao} disabled={!isEditable} />
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <div className="grid gap-4">
                  <SelectField name="politica_privacidade_status" label="Privacidade" defaultValue={settings.politica_privacidade_status} options={['Publicado', 'Em revisao', 'Rascunho']} disabled={!isEditable} />
                  <TextField name="politica_privacidade_versao" label="Versao da privacidade" defaultValue={settings.politica_privacidade_versao} disabled={!isEditable} />
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <div className="grid gap-4">
                  <SelectField name="politica_cookies_status" label="Cookies" defaultValue={settings.politica_cookies_status} options={['Publicado', 'Em revisao', 'Rascunho']} disabled={!isEditable} />
                  <TextField name="politica_cookies_versao" label="Versao de cookies" defaultValue={settings.politica_cookies_versao} disabled={!isEditable} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="notificacoes"
            eyebrow="Comunicacao"
            title="Padroes e automacoes de notificacao"
            description="Concentramos aqui os defaults da plataforma para e-mail, WhatsApp, eventos sensiveis e comunicacoes automaticas como aniversarios e alertas operacionais."
          >
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <ToggleField name="email_alertas_operacionais" title="Enviar alertas operacionais por e-mail" description="Inclui onboarding, cobrancas, convites de contexto e avisos administrativos." defaultChecked={settings.email_alertas_operacionais} disabled={!isEditable} />
                <ToggleField name="notif_checkin_checkout" title="Enviar notificacoes de check-in e check-out" description="Mantem o comportamento padrao para as escolas que ativarem controle de acesso." defaultChecked={settings.notif_checkin_checkout} disabled={!isEditable} />
                <ToggleField name="notif_aniversario_padrao" title="Ativar parabens automatico de aniversario" description="Permite que a escola herde a mensagem padrao, com desligamento local se necessario." defaultChecked={settings.notif_aniversario_padrao} disabled={!isEditable} />
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mensagem padrao institucional</label>
                <textarea
                  name="mensagem_aniversario_template"
                  defaultValue={settings.mensagem_aniversario_template}
                  disabled={!isEditable}
                  rows={8}
                  className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition ${!isEditable ? 'cursor-not-allowed opacity-80' : 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="seguranca"
            eyebrow="Confianca"
            title="Seguranca, acesso e rastreabilidade"
            description="Bloco para controles sensiveis de acesso, politicas de senha, auditoria e saude operacional do ecossistema."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <p className="text-sm font-semibold text-slate-950">Politicas de acesso</p>
                <div className="mt-4 space-y-3">
                  <ToggleField name="exigir_reset_senha_internos" title="Exigir redefinicao de senha para internos" description="Forca ciclo de atualizacao para perfis de alto privilegio." defaultChecked={settings.exigir_reset_senha_internos} disabled={!isEditable} />
                  <ToggleField name="mfa_superadmin" title="MFA para Super Admin" description="Camada adicional para rotas criticas do portal mestre." defaultChecked={settings.mfa_superadmin} disabled={!isEditable} />
                  <ToggleField name="sessao_curta_critica" title="Sessao curta em areas criticas" description="Aplica expiracao acelerada em faturamento e configuracoes avancadas." defaultChecked={settings.sessao_curta_critica} disabled={!isEditable} />
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <p className="text-sm font-semibold text-slate-950">Auditoria e retencao</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TextField name="retencao_logs_dias" label="Retencao de logs (dias)" defaultValue={settings.retencao_logs_dias} disabled={!isEditable} type="number" />
                  <TextField name="exportacao_auditoria_frequencia" label="Exportacao automatica" defaultValue={settings.exportacao_auditoria_frequencia} disabled={!isEditable} />
                  <ToggleField name="alertas_falha_ativos" title="Alertas de falha ativos" description="Dispara alertas quando jobs internos ou integrações apresentarem erro." defaultChecked={settings.alertas_falha_ativos} disabled={!isEditable} />
                  <TextField name="canal_escalonamento" label="Canal de escalonamento" defaultValue={settings.canal_escalonamento} disabled={!isEditable} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="integracoes"
            eyebrow="Ecossistema"
            title="Integracoes e provedores conectados"
            description="Area inspirada na referencia para organizar conectores, providers e pontos de extensao da plataforma."
          >
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <ProviderCard name="Supabase" tag="Core" detail="Autenticacao, banco e storage do ecossistema." tone="indigo" />
                <ProviderCard name="Asaas" tag="Billing" detail="Cobranca SaaS e fluxo financeiro das escolas." tone="emerald" />
                <ProviderCard name="YouTube / Panda" tag="Video" detail="Provedores previstos para o sistema de cursos." tone="amber" />
                <ProviderCard name="WhatsApp" tag="Comunicacao" detail="Canal de alertas, convites e notificacoes operacionais." tone="sky" />
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.86))] p-4 shadow-sm sm:rounded-[26px] sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField name="provider_video_padrao" label="Provider de video padrao" defaultValue={settings.provider_video_padrao} options={['youtube', 'panda']} disabled={!isEditable} />
                  <TextField name="pais_padrao_dummy" label="Project ref ativo" defaultValue={projectRef} disabled type="text" />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="avancado"
            eyebrow="Camada sensivel"
            title="Parametros avancados da plataforma"
            description="Este bloco replica a intencao da aba avancada da sua referencia: separar controles mais tecnicos, sensiveis e de impacto estrutural em um espaco visualmente mais protegido."
            dark
          >
            <div className="rounded-[24px] border border-amber-400/30 bg-amber-400/10 px-4 py-4 sm:rounded-[28px] sm:px-5">
              <p className="text-sm font-semibold text-amber-200">Atencao</p>
              <p className="mt-1 text-sm leading-6 text-amber-100/80">
                Alteracoes nesta area podem afetar autenticacao, jornadas por portal e comportamento multi-tenant da
                plataforma. Mantive a zona restrita apenas como referencia visual nesta etapa.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-sm font-semibold text-white">Feature flags estruturais</p>
                  <div className="mt-4 space-y-3">
                    <ToggleField name="cpf_global_obrigatorio_flag_copy" title="CPF global obrigatorio" description="Replica visual da flag estrutural principal da plataforma." defaultChecked={settings.cpf_global_obrigatorio} disabled dark />
                    <ToggleField name="sandbox_cursos_ativo" title="Modo sandbox de cursos" description="Separa testes comerciais do sistema de cursos em ambientes futuros." defaultChecked={settings.sandbox_cursos_ativo} disabled={!isEditable} dark />
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-sm font-semibold text-white">Parametros tecnicos</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextField name="timeout_jobs_segundos" label="Timeout de jobs" defaultValue={settings.timeout_jobs_segundos} disabled={!isEditable} dark type="number" />
                    <TextField name="retry_jobs_limite" label="Limite de retries" defaultValue={settings.retry_jobs_limite} disabled={!isEditable} dark type="number" />
                    <TextField name="rate_limit_janela_segundos" label="Janela de rate limit" defaultValue={settings.rate_limit_janela_segundos} disabled={!isEditable} dark type="number" />
                    <TextField name="eventos_por_lote" label="Eventos por lote" defaultValue={settings.eventos_por_lote} disabled={!isEditable} dark type="number" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-sm font-semibold text-white">Segredos e referencias</p>
                  <div className="mt-4 space-y-3">
                    <SecretRow label="Project ref" value={projectRef} />
                    <SecretRow label="Webhook interno" value="/api/internal/notificacoes/process" />
                    <SecretRow label="Ambiente de video" value={settings.provider_video_padrao === 'panda' ? 'Panda' : 'YouTube'} />
                  </div>
                </div>

                <div className="rounded-[22px] border border-red-400/25 bg-red-400/10 p-4 sm:rounded-[26px] sm:p-5">
                  <p className="text-sm font-semibold text-red-200">Zona restrita</p>
                  <p className="mt-2 text-sm leading-6 text-red-100/80">
                    Area reservada para reset de caches, reprocessamento de filas e rotinas de manutencao manual.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {['Reprocessar notificacoes pendentes', 'Invalidar caches do SuperAdmin', 'Reindexar contexto usuario-escola-tipo'].map((label) => (
                      <button key={label} type="button" className="rounded-xl border border-red-300/30 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-red-100 transition hover:bg-white/10" disabled>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
  )
}

function PortalChip({
  name,
  status,
  tone,
  detail,
}: {
  name: string
  status: string
  tone: string
  detail: string
}) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">{name}</p>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(tone)}`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  )
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-xs text-slate-200">{value}</p>
    </div>
  )
}


