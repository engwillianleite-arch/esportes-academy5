'use client'

import { useState, useEffect, useRef } from 'react'
import { atualizarConfiguracoesEscola, uploadLogoEscola } from '@/lib/settings-actions'
import { testarConexaoAsaas, salvarConfiguracaoAsaas } from '@/lib/asaas-actions'
import { salvarConfiguracoesNotificacoes } from '@/lib/notification-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Escola } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MODALITIES = [
  'Futebol', 'Futsal', 'Natação', 'Basquete', 'Voleibol',
  'Jiu-Jitsu', 'Muay Thai', 'Boxe', 'Atletismo', 'Tênis',
  'Judô', 'Karatê', 'Handebol',
]

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Belem', label: 'Belém (UTC-3)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
]

const JANELA_OPTIONS = [
  { value: '24', label: '24 horas' },
  { value: '48', label: '48 horas (padrão)' },
  { value: '72', label: '72 horas' },
  { value: '96', label: '96 horas' },
  { value: '168', label: '1 semana' },
]

// ─── CNPJ formatting ──────────────────────────────────────────────────────────

function formatCnpj(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'identidade' | 'endereco' | 'configuracoes' | 'integracao' | 'notificacoes'

type FormState = {
  nome: string
  email: string
  telefone: string
  modalidades: string[]
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  janela_chamada_h: string
  capacidade_padrao: string
  limiar_freq_pct: string
  fuso_horario: string
  asaasEnv: string
  asaasToken: string
  asaasWalletId: string
  diasAntecipacao: string
  multaPct: string
  jurosPct: string
  descontoAntecipPct: string
  notifEmail: boolean
  notifPush: boolean
  notifWhatsapp: boolean
  notifSms: boolean
  notifCobrancaLembreteD3: boolean
  notifCobrancaLembreteD1: boolean
  notifCobrancaVencida: boolean
  notifCobrancaConfirmacao: boolean
  notifFrequenciaBaixa: boolean
  notifAusencia: boolean
  notifRelatorioMensal: boolean
  notifAniversarioAtleta: boolean
  checkinCheckoutAtivo: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfiguracoesEscolaForm({
  escola,
  isAdmin,
}: {
  escola: Escola
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<Tab>('identidade')

  function handleTabChange(t: Tab) {
    // P8: clear token on tab switch so it doesn't bleed into other tab's save action
    // P6: clear stale test result on tab switch
    if (t !== tab) {
      setValues(prev => ({ ...prev, asaasToken: '' }))
      setTestResult(null)
    }
    setTab(t)
  }
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cepError, setCepError] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/asaas`)
  }, [])

  const [values, setValues] = useState<FormState>({
    nome: escola.nome ?? '',
    email: escola.email ?? '',
    telefone: escola.telefone ?? '',
    modalidades: escola.modalidades ?? [],
    cep: escola.cep ?? '',
    logradouro: escola.logradouro ?? '',
    numero: escola.numero ?? '',
    complemento: escola.complemento ?? '',
    bairro: escola.bairro ?? '',
    cidade: escola.cidade ?? '',
    estado: escola.estado ?? '',
    janela_chamada_h: String(escola.janela_chamada_h ?? 48),
    capacidade_padrao: escola.capacidade_padrao != null ? String(escola.capacidade_padrao) : '',
    limiar_freq_pct: String(escola.limiar_freq_pct ?? 75),
    fuso_horario: escola.fuso_horario ?? 'America/Sao_Paulo',
    asaasEnv: escola.asaas_env ?? 'sandbox',
    asaasToken: '',
    asaasWalletId: escola.asaas_wallet_id ?? '',
    diasAntecipacao: String(escola.dias_antecipacao ?? 3),
    multaPct: String(escola.multa_pct ?? 2),
    jurosPct: String(escola.juros_pct ?? 1),
    descontoAntecipPct: String(escola.desconto_antecip_pct ?? 0),
    notifEmail: escola.notif_email ?? true,
    notifPush: escola.notif_push ?? true,
    notifWhatsapp: escola.notif_whatsapp ?? false,
    notifSms: escola.notif_sms ?? false,
    notifCobrancaLembreteD3: escola.notif_cobranca_lembrete_d3 ?? true,
    notifCobrancaLembreteD1: escola.notif_cobranca_lembrete_d1 ?? true,
    notifCobrancaVencida: escola.notif_cobranca_vencida ?? true,
    notifCobrancaConfirmacao: escola.notif_cobranca_confirmacao ?? true,
    notifFrequenciaBaixa: escola.notif_frequencia_baixa ?? true,
    notifAusencia: escola.notif_ausencia ?? true,
    notifRelatorioMensal: escola.notif_relatorio_mensal ?? false,
    notifAniversarioAtleta: escola.notif_aniversario_atleta ?? true,
    checkinCheckoutAtivo: escola.checkin_checkout_ativo ?? false,
  })

  // Track dirty state by comparing to original values
  const original = useRef(values)
  const isDirty = JSON.stringify(values) !== JSON.stringify(original.current)

  // beforeunload guard
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function toggleModalidade(mod: string) {
    setValues(prev => ({
      ...prev,
      modalidades: prev.modalidades.includes(mod)
        ? prev.modalidades.filter(m => m !== mod)
        : [...prev.modalidades, mod],
    }))
    setError(null)
  }

  // CEP auto-fill on blur
  async function handleCepBlur() {
    if (cepLoading) return
    const digits = values.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    setCepError(null)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado')
      } else {
        setValues(prev => ({
          ...prev,
          logradouro: data.logradouro ?? prev.logradouro,
          bairro: data.bairro ?? prev.bairro,
          cidade: data.localidade ?? prev.cidade,
          estado: data.uf ?? prev.estado,
        }))
      }
    } catch {
      setCepError('Erro ao consultar CEP. Verifique sua conexão.')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleTestConnection() {
    if (testLoading) return
    if (!values.asaasToken) {
      setTestResult({ success: false, message: 'Insira um token para testar' })
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const fd = new FormData()
      fd.append('token', values.asaasToken)
      fd.append('env', values.asaasEnv)
      const result = await testarConexaoAsaas(escola.id, fd)
      if (result.error) {
        setTestResult({ success: false, message: result.error })
      } else {
        setTestResult({ success: true, message: 'Conexão bem-sucedida' })
      }
    } catch {
      setTestResult({ success: false, message: 'Erro inesperado. Tente novamente.' })
    } finally {
      setTestLoading(false)
    }
  }

  async function handleCopyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl || window.location.origin + '/api/webhooks/asaas')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS or permission denied) — no-op, user can copy manually
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      if (tab === 'integracao') {
        const fd = new FormData()
        fd.append('asaas_env', values.asaasEnv)
        if (values.asaasToken) fd.append('asaas_token', values.asaasToken)
        fd.append('asaas_wallet_id', values.asaasWalletId)
        fd.append('dias_antecipacao', values.diasAntecipacao)
        fd.append('multa_pct', values.multaPct)
        fd.append('juros_pct', values.jurosPct)
        fd.append('desconto_antecip_pct', values.descontoAntecipPct)
        const result = await salvarConfiguracaoAsaas(escola.id, fd)
        // On success the action redirects — only reaches here on error
        if (result.error) setError(result.error)
      } else if (tab === 'notificacoes') {
        const fd = new FormData()
        fd.append('notif_email', String(values.notifEmail))
        fd.append('notif_push', String(values.notifPush))
        fd.append('notif_whatsapp', String(values.notifWhatsapp))
        fd.append('notif_sms', String(values.notifSms))
        fd.append('notif_cobranca_lembrete_d3', String(values.notifCobrancaLembreteD3))
        fd.append('notif_cobranca_lembrete_d1', String(values.notifCobrancaLembreteD1))
        fd.append('notif_cobranca_vencida', String(values.notifCobrancaVencida))
        fd.append('notif_cobranca_confirmacao', String(values.notifCobrancaConfirmacao))
        fd.append('notif_frequencia_baixa', String(values.notifFrequenciaBaixa))
        fd.append('notif_ausencia', String(values.notifAusencia))
        fd.append('notif_relatorio_mensal', String(values.notifRelatorioMensal))
        fd.append('notif_aniversario_atleta', String(values.notifAniversarioAtleta))
        const result = await salvarConfiguracoesNotificacoes(escola.id, fd)
        // On success the action redirects — only reaches here on error
        if (result.error) setError(result.error)
      } else {
        const fd = new FormData()
        fd.append('nome', values.nome)
        fd.append('email', values.email)
        fd.append('telefone', values.telefone)
        values.modalidades.forEach(m => fd.append('modalidades', m))
        fd.append('cep', values.cep)
        fd.append('logradouro', values.logradouro)
        fd.append('numero', values.numero)
        fd.append('complemento', values.complemento)
        fd.append('bairro', values.bairro)
        fd.append('cidade', values.cidade)
        fd.append('estado', values.estado)
        fd.append('janela_chamada_h', values.janela_chamada_h)
        fd.append('capacidade_padrao', values.capacidade_padrao)
        fd.append('limiar_freq_pct', values.limiar_freq_pct)
        fd.append('fuso_horario', values.fuso_horario)
        fd.append('checkin_checkout_ativo', String(values.checkinCheckoutAtivo))
        const result = await atualizarConfiguracoesEscola(escola.id, fd)
        // On success the action redirects — only reaches here on error
        if (result.error) setError(result.error)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploading) return
    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append('logo', file)

    const result = await uploadLogoEscola(escola.id, fd)
    // On success the action redirects — only reaches here on error
    if (result.error) {
      setError(result.error)
      e.target.value = '' // allow re-selecting the same file
      setUploading(false)
    }
  }

  const ro = !isAdmin // read-only flag

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Acesso restrito banner */}
      {!isAdmin && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Acesso restrito — somente administradores podem editar as configurações.
        </div>
      )}

      {/* Tab headers */}
      <div className="flex gap-0 border-b">
        {(['identidade', 'endereco', 'configuracoes', 'integracao', 'notificacoes'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t === 'identidade' ? 'Identidade' : t === 'endereco' ? 'Endereço' : t === 'configuracoes' ? 'Configurações' : t === 'integracao' ? 'Integração' : 'Notificações'}
          </button>
        ))}
      </div>

      {/* ── Tab: Identidade ─────────────────────────────────────────────── */}
      {tab === 'identidade' && (
        <div className="flex flex-col gap-4">
          {/* Logo */}
          <div className="flex flex-col gap-1.5">
            <Label>Logo da escola</Label>
            <div className="flex items-center gap-4">
              {escola.logo_url ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={escola.logo_url} alt="Logo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#20c997] text-2xl font-semibold text-white">
                  {(escola.nome ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              {isAdmin && (
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer text-sm text-primary underline underline-offset-2">
                    {uploading ? 'Enviando...' : 'Alterar logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleLogoChange}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">JPEG, PNG, WebP · máx. 2 MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome da escola *</Label>
            <Input
              id="nome"
              value={values.nome}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('nome', e.target.value)}
            />
          </div>

          {/* CNPJ — always read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formatCnpj(escola.cnpj ?? '')}
              readOnly
              disabled
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={values.telefone}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('telefone', e.target.value)}
            />
          </div>

          {/* Modalidades */}
          <div className="flex flex-col gap-1.5">
            <Label>Modalidades</Label>
            <div className="flex flex-wrap gap-2">
              {MODALITIES.map(mod => {
                const active = values.modalidades.includes(mod)
                return (
                  <button
                    key={mod}
                    type="button"
                    disabled={ro}
                    onClick={() => !ro && toggleModalidade(mod)}
                    className={
                      active
                        ? 'rounded-full border bg-primary px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-70'
                        : 'rounded-full border px-3 py-1 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent'
                    }
                  >
                    {mod}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Endereço ───────────────────────────────────────────────── */}
      {tab === 'endereco' && (
        <div className="flex flex-col gap-4">
          {/* CEP */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cep"
                placeholder="00000-000"
                value={values.cep}
                readOnly={ro}
                disabled={ro}
                maxLength={9}
                onChange={e => set('cep', e.target.value)}
                onBlur={!ro ? handleCepBlur : undefined}
              />
              {cepLoading && (
                <span className="text-xs text-muted-foreground">Buscando...</span>
              )}
            </div>
            {cepError && (
              <p className="text-xs text-destructive">{cepError}</p>
            )}
          </div>

          {/* Logradouro */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              value={values.logradouro}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('logradouro', e.target.value)}
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={values.numero}
                readOnly={ro}
                disabled={ro}
                onChange={e => set('numero', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={values.complemento}
                readOnly={ro}
                disabled={ro}
                onChange={e => set('complemento', e.target.value)}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={values.bairro}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('bairro', e.target.value)}
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={values.cidade}
                readOnly={ro}
                disabled={ro}
                onChange={e => set('cidade', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input
                id="estado"
                maxLength={2}
                placeholder="SP"
                value={values.estado}
                readOnly={ro}
                disabled={ro}
                onChange={e => set('estado', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Configurações ──────────────────────────────────────────── */}
      {tab === 'configuracoes' && (
        <div className="flex flex-col gap-4">
          {/* Janela de chamada */}
          <div className="flex flex-col gap-1.5">
            <Label>Janela para chamada</Label>
            <p className="text-xs text-muted-foreground">
              Período máximo (em horas) no passado em que a chamada pode ser registrada.
            </p>
            {isAdmin ? (
              <Select
                value={values.janela_chamada_h}
                onValueChange={v => { if (v) set('janela_chamada_h', v) }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JANELA_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={JANELA_OPTIONS.find(o => o.value === values.janela_chamada_h)?.label ?? `${values.janela_chamada_h}h`}
                readOnly
                disabled
                className="w-48"
              />
            )}
          </div>

          {/* Capacidade padrão */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="capacidade_padrao">Capacidade padrão de turmas</Label>
            <p className="text-xs text-muted-foreground">Número padrão de alunos por turma (opcional).</p>
            <Input
              id="capacidade_padrao"
              type="number"
              min={1}
              max={9999}
              placeholder="Ex: 20"
              value={values.capacidade_padrao}
              readOnly={ro}
              disabled={ro}
              className="w-48"
              onChange={e => set('capacidade_padrao', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limiar_freq_pct">Limite de alerta de frequência (%)</Label>
            <p className="text-xs text-muted-foreground">
              Atletas com percentual de presença abaixo deste valor são sinalizados na lista.
            </p>
            <Input
              id="limiar_freq_pct"
              type="number"
              min={0}
              max={100}
              value={values.limiar_freq_pct}
              readOnly={ro}
              disabled={ro}
              className="w-48"
              onChange={e => set('limiar_freq_pct', e.target.value)}
            />
          </div>

          {/* Fuso horário */}
          <div className="flex flex-col gap-1.5">
            <Label>Fuso horário</Label>
            {isAdmin ? (
              <Select
                value={values.fuso_horario}
                onValueChange={v => { if (v) set('fuso_horario', v) }}
              >
                <SelectTrigger className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={TIMEZONES.find(tz => tz.value === values.fuso_horario)?.label ?? values.fuso_horario}
                readOnly
                disabled
                className="w-72"
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Check-in / check-out por QR</span>
              <span className="text-xs text-muted-foreground">
                Recurso opcional para registrar entrada e saída de atletas na unidade.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.checkinCheckoutAtivo}
              aria-label="Check-in e check-out"
              disabled={ro}
              onClick={() => !ro && set('checkinCheckoutAtivo', !values.checkinCheckoutAtivo)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                values.checkinCheckoutAtivo ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                values.checkinCheckoutAtivo ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Integração ─────────────────────────────────────────────── */}
      {tab === 'integracao' && (
        <div className="flex flex-col gap-6">
          {/* Ambiente */}
          <div className="flex flex-col gap-1.5">
            <Label>Ambiente</Label>
            <div className="flex overflow-hidden rounded-md border w-fit">
              {(['sandbox', 'producao'] as const).map(env => (
                <button
                  key={env}
                  type="button"
                  disabled={ro}
                  onClick={() => !ro && set('asaasEnv', env)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    values.asaasEnv === env
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {env === 'sandbox' ? 'Sandbox' : 'Produção'}
                </button>
              ))}
            </div>
          </div>

          {/* Token de acesso */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asaas_token">Token de acesso Asaas</Label>
            {escola.asaas_vault_secret_id && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Token configurado ✓
                </span>
                <span className="text-xs text-muted-foreground">Deixe em branco para manter o token atual</span>
              </div>
            )}
            {isAdmin && (
              <Input
                id="asaas_token"
                type="password"
                placeholder={escola.asaas_vault_secret_id ? '••••••••••••••••' : '$aact_...'}
                value={values.asaasToken}
                onChange={e => set('asaasToken', e.target.value)}
              />
            )}
          </div>

          {/* Wallet ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asaas_wallet_id">Wallet ID (opcional)</Label>
            <p className="text-xs text-muted-foreground">Usado em cenários de split de pagamento.</p>
            <Input
              id="asaas_wallet_id"
              value={values.asaasWalletId}
              readOnly={ro}
              disabled={ro}
              onChange={e => set('asaasWalletId', e.target.value)}
            />
          </div>

          {/* Testar conexão */}
          {isAdmin && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={testLoading}
                onClick={handleTestConnection}
                className="w-fit"
              >
                {testLoading ? 'Testando...' : 'Testar Conexão'}
              </Button>
              {testResult && (
                <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                  {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                </p>
              )}
            </div>
          )}

          {/* URL do webhook */}
          <div className="flex flex-col gap-1.5">
            <Label>URL do webhook</Label>
            <p className="text-xs text-muted-foreground">
              Registre esta URL no painel Asaas para receber eventos de pagamento.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs font-mono break-all">
                {webhookUrl || '/api/webhooks/asaas'}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                className="shrink-0"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Preferências de cobrança */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Preferências de cobrança</h3>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dias_antecipacao">Dias de antecipação</Label>
              <p className="text-xs text-muted-foreground">
                Dias antes do vencimento em que a cobrança é gerada (1–30).
              </p>
              <Input
                id="dias_antecipacao"
                type="number"
                min={1}
                max={30}
                value={values.diasAntecipacao}
                readOnly={ro}
                disabled={ro}
                className="w-32"
                onChange={e => set('diasAntecipacao', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="multa_pct">Multa (%)</Label>
                <Input
                  id="multa_pct"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={values.multaPct}
                  readOnly={ro}
                  disabled={ro}
                  onChange={e => set('multaPct', e.target.value)}
                />
                <span className="text-xs text-muted-foreground">0–10%</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="juros_pct">Juros ao mês (%)</Label>
                <Input
                  id="juros_pct"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={values.jurosPct}
                  readOnly={ro}
                  disabled={ro}
                  onChange={e => set('jurosPct', e.target.value)}
                />
                <span className="text-xs text-muted-foreground">0–10%</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desconto_antecip_pct">Desconto antecipação (%)</Label>
                <Input
                  id="desconto_antecip_pct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={values.descontoAntecipPct}
                  readOnly={ro}
                  disabled={ro}
                  onChange={e => set('descontoAntecipPct', e.target.value)}
                />
                <span className="text-xs text-muted-foreground">0–100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Notificações ───────────────────────────────────────────── */}
      {tab === 'notificacoes' && (
        <div className="flex flex-col gap-6">
          {/* Canais de Notificação */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Canais de Notificação</h3>

            {/* Email */}
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Email</span>
                <span className="text-xs text-muted-foreground">Cobranças, confirmações e alertas por e-mail</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.notifEmail}
                aria-label="Email"
                disabled={ro}
                onClick={() => !ro && set('notifEmail', !values.notifEmail)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  values.notifEmail ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  values.notifEmail ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Push</span>
                <span className="text-xs text-muted-foreground">Notificacoes no app Esportes Academy por contexto de usuario</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.notifPush}
                aria-label="Push"
                disabled={ro}
                onClick={() => !ro && set('notifPush', !values.notifPush)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  values.notifPush ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  values.notifPush ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* WhatsApp — locked on Starter plan */}
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">WhatsApp</span>
                  {escola.plano === 'starter' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-700">
                      🔒 Pro
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {escola.plano === 'starter'
                    ? 'Disponível no plano Pro'
                    : 'Mensagens via WhatsApp Business'}
                </span>
              </div>
              {escola.plano === 'starter' ? (
                <span className="text-xs text-muted-foreground">Upgrade necessário</span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.notifWhatsapp}
                  aria-label="WhatsApp"
                  disabled={ro}
                  onClick={() => !ro && set('notifWhatsapp', !values.notifWhatsapp)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    values.notifWhatsapp ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    values.notifWhatsapp ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              )}
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">SMS</span>
                <span className="text-xs text-muted-foreground">Mensagens de texto (operadoras)</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.notifSms}
                aria-label="SMS"
                disabled={ro}
                onClick={() => !ro && set('notifSms', !values.notifSms)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  values.notifSms ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  values.notifSms ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Gatilhos Financeiros */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Gatilhos Financeiros</h3>

            {[
              { key: 'notifCobrancaLembreteD3' as const, label: 'Lembrete D-3', desc: '3 dias antes do vencimento' },
              { key: 'notifCobrancaLembreteD1' as const, label: 'Lembrete D-1', desc: '1 dia antes do vencimento' },
              { key: 'notifCobrancaVencida' as const, label: 'Cobrança vencida', desc: 'Após o dia de vencimento' },
              { key: 'notifCobrancaConfirmacao' as const, label: 'Pagamento confirmado', desc: 'Quando o pagamento é processado' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-md border px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values[key]}
                  aria-label={label}
                  disabled={ro}
                  onClick={() => !ro && set(key, !values[key])}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    values[key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    values[key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Gatilhos Pedagógicos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Gatilhos Pedagógicos</h3>

            {[
              { key: 'notifFrequenciaBaixa' as const, label: 'Frequência baixa', desc: 'Quando aluno atinge abaixo do mínimo' },
              { key: 'notifAusencia' as const, label: 'Ausência', desc: 'Quando aluno falta à aula' },
              { key: 'notifRelatorioMensal' as const, label: 'Relatório mensal', desc: 'Enviado no início de cada mês' },
              { key: 'notifAniversarioAtleta' as const, label: 'Parabéns de aniversário', desc: 'Mensagem automática no dia do aniversário do atleta' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-md border px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values[key]}
                  aria-label={label}
                  disabled={ro}
                  onClick={() => !ro && set(key, !values[key])}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    values[key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    values[key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Sticky save bar — only when dirty and admin */}
      {isDirty && isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t bg-background px-6 py-4">
          <p className="text-sm text-muted-foreground">Você tem alterações não salvas.</p>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      )}
    </form>
  )
}
