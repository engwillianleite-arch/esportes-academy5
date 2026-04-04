'use client'

import { useState, useEffect, useRef } from 'react'
import { atualizarConfiguracoesEscola, uploadLogoEscola } from '@/lib/settings-actions'
import { testarConexaoAsaas, salvarConfiguracaoAsaas } from '@/lib/asaas-actions'
import { salvarConfiguracoesNotificacoes } from '@/lib/notification-actions'
import type { Escola } from '@/types'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#20c997'
const PRIMARY_D = '#17a57a'
const PRIMARY_L = '#e6faf4'
const SECONDARY = '#5bc0eb'
const SEC_L     = '#e8f6fd'
const ACCENT    = '#ffa552'
const ACCENT_L  = '#fff4e8'
const DANGER    = '#ef4444'
const DANGER_L  = '#fee2e2'
const BORDER    = '#e5e7eb'
const BG        = '#f7f9fa'
const TEXT      = '#1b1b1b'
const MUTED     = '#6b7280'
const CARD      = '#ffffff'
const SHADOW    = '0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.05)'
const RADIUS    = '12px'
const RADIUS_SM = '8px'

// ─── Constants ────────────────────────────────────────────────────────────────
const MODALITIES = [
  'Futebol', 'Futsal', 'Natação', 'Basquete', 'Voleibol',
  'Jiu-Jitsu', 'Muay Thai', 'Boxe', 'Atletismo', 'Tênis',
  'Judô', 'Karatê', 'Handebol',
]

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
  { value: 'America/Manaus',    label: 'Manaus (UTC-4)' },
  { value: 'America/Belem',     label: 'Belém (UTC-3)' },
  { value: 'America/Noronha',   label: 'Fernando de Noronha (UTC-2)' },
  { value: 'America/Rio_Branco',label: 'Rio Branco (UTC-5)' },
]

const JANELA_OPTIONS = [
  { value: '24',  label: '24 horas' },
  { value: '48',  label: '48 horas (padrão)' },
  { value: '72',  label: '72 horas' },
  { value: '96',  label: '96 horas' },
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
  nome: string; email: string; telefone: string; modalidades: string[]
  cep: string; logradouro: string; numero: string; complemento: string
  bairro: string; cidade: string; estado: string
  janela_chamada_h: string; capacidade_padrao: string
  limiar_freq_pct: string; fuso_horario: string
  asaasEnv: string; asaasToken: string; asaasWalletId: string
  diasAntecipacao: string; multaPct: string; jurosPct: string; descontoAntecipPct: string
  notifEmail: boolean; notifPush: boolean; notifWhatsapp: boolean; notifSms: boolean
  notifCobrancaLembreteD3: boolean; notifCobrancaLembreteD1: boolean
  notifCobrancaVencida: boolean; notifCobrancaConfirmacao: boolean
  notifFrequenciaBaixa: boolean; notifAusencia: boolean
  notifRelatorioMensal: boolean; notifAniversarioAtleta: boolean
  checkinCheckoutAtivo: boolean
}

// ─── Helper: Toggle switch ────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <label style={{ position: 'relative', display: 'inline-flex', width: 42, height: 24, flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1 }}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ opacity: 0, width: 0, height: 0 }} />
      <span
        onClick={!disabled ? onChange : undefined}
        style={{
          position: 'absolute', inset: 0, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? PRIMARY : BORDER, transition: 'background .2s',
        }}
      >
        <span style={{
          position: 'absolute', left: checked ? 21 : 3, top: 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </span>
    </label>
  )
}

// ─── Helper: Section card ─────────────────────────────────────────────────────
function SCard({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: RADIUS, marginBottom: 16, overflow: 'hidden', boxShadow: SHADOW }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: TEXT }}>{title}</div>
        {subtitle && <span style={{ fontSize: 12, color: MUTED }}>{subtitle}</span>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

// ─── Helper: Toggle row ───────────────────────────────────────────────────────
function ToggleRow({ label, desc, checked, onChange, disabled, badge }: {
  label: string; desc: string; checked: boolean; onChange: () => void; disabled?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{label}</strong>
          {badge}
        </div>
        <small style={{ fontSize: 11.5, color: MUTED }}>{desc}</small>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ConfiguracoesEscolaForm({ escola, isAdmin }: { escola: Escola; isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('identidade')
  const [saving, setSaving]             = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [cepError, setCepError]         = useState<string | null>(null)
  const [cepLoading, setCepLoading]     = useState(false)
  const [testLoading, setTestLoading]   = useState(false)
  const [testResult, setTestResult]     = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied]             = useState(false)
  const [webhookUrl, setWebhookUrl]     = useState('')
  const [showToken, setShowToken]       = useState(false)

  useEffect(() => { setWebhookUrl(`${window.location.origin}/api/webhooks/asaas`) }, [])

  function handleTabChange(t: Tab) {
    if (t !== tab) {
      setValues(prev => ({ ...prev, asaasToken: '' }))
      setTestResult(null)
    }
    setTab(t)
  }

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

  const original = useRef(values)
  const isDirty  = JSON.stringify(values) !== JSON.stringify(original.current)

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

  async function handleCepBlur() {
    if (cepLoading) return
    const digits = values.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true); setCepError(null)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
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
    } catch { setCepError('Erro ao consultar CEP.') }
    finally { setCepLoading(false) }
  }

  async function handleTestConnection() {
    if (testLoading) return
    if (!values.asaasToken) { setTestResult({ success: false, message: 'Insira um token para testar' }); return }
    setTestLoading(true); setTestResult(null)
    try {
      const fd = new FormData()
      fd.append('token', values.asaasToken)
      fd.append('env', values.asaasEnv)
      const result = await testarConexaoAsaas(escola.id, fd)
      setTestResult(result.error
        ? { success: false, message: result.error }
        : { success: true, message: 'Conexão bem-sucedida' })
    } catch { setTestResult({ success: false, message: 'Erro inesperado.' }) }
    finally { setTestLoading(false) }
  }

  async function handleCopyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl || window.location.origin + '/api/webhooks/asaas')
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* no-op */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true); setError(null)
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
        if (result.error) setError(result.error)
      } else if (tab === 'notificacoes') {
        const fd = new FormData()
        fd.append('notif_email',                   String(values.notifEmail))
        fd.append('notif_push',                    String(values.notifPush))
        fd.append('notif_whatsapp',                String(values.notifWhatsapp))
        fd.append('notif_sms',                     String(values.notifSms))
        fd.append('notif_cobranca_lembrete_d3',    String(values.notifCobrancaLembreteD3))
        fd.append('notif_cobranca_lembrete_d1',    String(values.notifCobrancaLembreteD1))
        fd.append('notif_cobranca_vencida',        String(values.notifCobrancaVencida))
        fd.append('notif_cobranca_confirmacao',    String(values.notifCobrancaConfirmacao))
        fd.append('notif_frequencia_baixa',        String(values.notifFrequenciaBaixa))
        fd.append('notif_ausencia',                String(values.notifAusencia))
        fd.append('notif_relatorio_mensal',        String(values.notifRelatorioMensal))
        fd.append('notif_aniversario_atleta',      String(values.notifAniversarioAtleta))
        const result = await salvarConfiguracoesNotificacoes(escola.id, fd)
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
        if (result.error) setError(result.error)
      }
    } finally { setSaving(false) }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || uploading) return
    setUploading(true); setError(null)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadLogoEscola(escola.id, fd)
    if (result.error) { setError(result.error); e.target.value = ''; setUploading(false) }
  }

  const ro = !isAdmin

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '9px 12px', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM,
    fontSize: 13.5, fontFamily: 'Inter, system-ui, sans-serif', color: TEXT,
    background: ro ? BG : CARD, outline: 'none', transition: 'border-color .15s', width: '100%',
    cursor: ro ? 'not-allowed' : 'auto',
    ...extra,
  })

  const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: TEXT }
  const hint: React.CSSProperties = { fontSize: 11, color: MUTED }

  function Field({ label, req, hint: h, children }: { label: string; req?: boolean; hint?: string; children: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={lbl}>{label} {req && <span style={{ color: DANGER }}>*</span>}</label>
        {children}
        {h && <span style={hint}>{h}</span>}
      </div>
    )
  }

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'identidade',    icon: '🏫', label: 'Dados da Escola' },
    { id: 'endereco',      icon: '📍', label: 'Endereço' },
    { id: 'integracao',    icon: '💳', label: 'Integração Asaas' },
    { id: 'configuracoes', icon: '🛠️', label: 'Configurações Gerais' },
    { id: 'notificacoes',  icon: '🔔', label: 'Notificações' },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>⚙️ Configurações da Escola</h1>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>Informações, integrações e preferências da sua escola.</p>
        </div>
        {isAdmin && (
          <button
            type="submit" disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: RADIUS_SM, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', background: saving ? '#a7f3d0' : PRIMARY, color: '#fff', boxShadow: `0 2px 8px rgba(32,201,151,.3)`, transition: 'background .15s' }}
          >
            💾 {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: 20, padding: '10px 14px', background: DANGER_L, border: `1px solid #fecaca`, borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
          Acesso restrito — somente administradores podem editar as configurações.
        </div>
      )}

      {/* Settings layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Tab nav (sticky left sidebar) ─────────────────────────────── */}
        <div style={{ width: 200, flexShrink: 0, position: 'sticky', top: 80 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: RADIUS, overflow: 'hidden', boxShadow: SHADOW }}>
            {TABS.map((t, i) => {
              const active = tab === t.id
              return (
                <div key={t.id}>
                  {i > 0 && <div style={{ height: 1, background: BORDER }} />}
                  <button
                    type="button"
                    onClick={() => handleTabChange(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                      fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
                      color: active ? PRIMARY_D : MUTED, background: active ? PRIMARY_L : 'transparent',
                      border: 'none', borderLeft: `3px solid ${active ? PRIMARY : 'transparent'}`,
                      width: '100%', textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = BG; (e.currentTarget as HTMLButtonElement).style.color = TEXT } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = MUTED } }}
                  >
                    <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{t.icon}</span>
                    {t.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── IDENTIDADE ──────────────────────────────────────────────── */}
          {tab === 'identidade' && (
            <>
              <SCard title="🏫 Identidade Visual">
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Logo upload */}
                  <div style={{ flexShrink: 0 }}>
                    <label
                      style={{ display: 'block', border: `2px dashed ${BORDER}`, borderRadius: RADIUS, padding: 24, textAlign: 'center', cursor: isAdmin ? 'pointer' : 'default', transition: 'all .2s', width: 160 }}
                      onMouseEnter={e => { if (isAdmin) { (e.currentTarget as HTMLLabelElement).style.borderColor = PRIMARY; (e.currentTarget as HTMLLabelElement).style.background = PRIMARY_L } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = BORDER; (e.currentTarget as HTMLLabelElement).style.background = 'transparent' }}
                    >
                      {escola.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={escola.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', margin: '0 auto 10px', display: 'block' }} />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 12, background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 32 }}>
                          🏫
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: MUTED }}>
                        <strong style={{ display: 'block', color: TEXT, fontWeight: 600, marginBottom: 3 }}>
                          {uploading ? 'Enviando...' : 'Logotipo da escola'}
                        </strong>
                        {isAdmin && 'Clique para enviar PNG, JPG ou SVG'}
                      </div>
                      {isAdmin && (
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={handleLogoChange} />
                      )}
                    </label>
                  </div>

                  {/* Name / email / tel */}
                  <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Nome da escola" req>
                      <input
                        value={values.nome} readOnly={ro} disabled={ro}
                        onChange={e => set('nome', e.target.value)}
                        style={inp()}
                        onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER}
                      />
                    </Field>
                    <Field label="CNPJ">
                      <input value={formatCnpj(escola.cnpj ?? '')} readOnly disabled style={inp()} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="E-mail de contato">
                        <input type="email" value={values.email} readOnly={ro} disabled={ro}
                          onChange={e => set('email', e.target.value)} style={inp()}
                          onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                          onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                      </Field>
                      <Field label="Telefone">
                        <input value={values.telefone} readOnly={ro} disabled={ro}
                          onChange={e => set('telefone', e.target.value)} style={inp()}
                          onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                          onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                      </Field>
                    </div>
                  </div>
                </div>
              </SCard>

              <SCard title="⚽ Modalidades Ofertadas" subtitle="Afeta filtros e relatórios">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MODALITIES.map(mod => {
                    const active = values.modalidades.includes(mod)
                    return (
                      <button
                        key={mod} type="button" disabled={ro}
                        onClick={() => !ro && toggleModalidade(mod)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                          borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: active ? PRIMARY_L : BG,
                          border: `1px solid ${active ? 'rgba(32,201,151,.35)' : BORDER}`,
                          color: active ? PRIMARY_D : TEXT,
                          cursor: ro ? 'not-allowed' : 'pointer', transition: 'all .15s',
                          opacity: ro ? .6 : 1,
                        }}
                      >
                        {active && <span style={{ fontSize: 10 }}>✓</span>}
                        {mod}
                      </button>
                    )
                  })}
                </div>
              </SCard>
            </>
          )}

          {/* ── ENDEREÇO ────────────────────────────────────────────────── */}
          {tab === 'endereco' && (
            <SCard title="📍 Endereço Principal" subtitle="Usado em boletos, contratos e notas fiscais">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* CEP */}
                <Field label="CEP" req>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={values.cep} readOnly={ro} disabled={ro} maxLength={9}
                      placeholder="00000-000" style={{ ...inp(), maxWidth: 180 }}
                      onChange={e => set('cep', e.target.value)}
                      onBlur={!ro ? handleCepBlur : undefined}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    />
                    {cepLoading && <span style={{ fontSize: 12, color: MUTED }}>Buscando...</span>}
                    {!cepLoading && values.cep.replace(/\D/g,'').length === 8 && !cepError && (
                      <span style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 6, background: PRIMARY_L, color: PRIMARY_D, fontWeight: 600 }}>✓ Localizado</span>
                    )}
                    {cepError && <span style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 6, background: DANGER_L, color: DANGER, fontWeight: 600 }}>{cepError}</span>}
                  </div>
                </Field>

                {/* Logradouro */}
                <Field label="Logradouro" req>
                  <input value={values.logradouro} readOnly={ro} disabled={ro}
                    onChange={e => set('logradouro', e.target.value)} style={inp()}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Número" req>
                    <input value={values.numero} readOnly={ro} disabled={ro} placeholder="Número ou S/N"
                      onChange={e => set('numero', e.target.value)} style={inp()}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>
                  <Field label="Complemento">
                    <input value={values.complemento} readOnly={ro} disabled={ro}
                      onChange={e => set('complemento', e.target.value)} style={inp()}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>
                </div>

                <Field label="Bairro">
                  <input value={values.bairro} readOnly={ro} disabled={ro}
                    onChange={e => set('bairro', e.target.value)} style={inp()}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <Field label="Cidade">
                    <input value={values.cidade} readOnly={ro} disabled={ro}
                      onChange={e => set('cidade', e.target.value)} style={inp()}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>
                  <Field label="Estado (UF)">
                    <input value={values.estado} readOnly={ro} disabled={ro} maxLength={2} placeholder="SP"
                      onChange={e => set('estado', e.target.value.toUpperCase())} style={{ ...inp(), width: 80 }}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>
                </div>
              </div>
            </SCard>
          )}

          {/* ── INTEGRAÇÃO ──────────────────────────────────────────────── */}
          {tab === 'integracao' && (
            <>
              <SCard title="💳 Asaas — Gateway de Pagamento">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Info box */}
                  <div style={{ background: PRIMARY_L, border: `1px solid rgba(32,201,151,.25)`, borderRadius: RADIUS_SM, padding: '12px 14px', fontSize: 12.5, color: '#166534', lineHeight: 1.6 }}>
                    O Asaas é o gateway de pagamento integrado para geração de boletos, PIX e cartão.
                  </div>

                  {/* Ambiente toggle */}
                  <Field label="Ambiente">
                    <div style={{ display: 'flex', overflow: 'hidden', border: `1.5px solid ${BORDER}`, borderRadius: RADIUS_SM, width: 'fit-content' }}>
                      {(['sandbox', 'producao'] as const).map(env => (
                        <button
                          key={env} type="button" disabled={ro}
                          onClick={() => !ro && set('asaasEnv', env)}
                          style={{
                            padding: '7px 18px', fontSize: 12.5, fontWeight: 600, cursor: ro ? 'not-allowed' : 'pointer',
                            color: values.asaasEnv === env ? '#fff' : MUTED,
                            background: values.asaasEnv === env
                              ? (env === 'sandbox' ? ACCENT : PRIMARY)
                              : CARD,
                            border: 'none', transition: 'all .15s', fontFamily: 'inherit',
                          }}
                        >
                          {env === 'sandbox' ? '🧪 Sandbox' : '🚀 Produção'}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Token */}
                  <Field label="Token de acesso Asaas">
                    {escola.asaas_vault_secret_id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: PRIMARY_L, border: `1px solid rgba(32,201,151,.3)`, fontSize: 12, fontWeight: 600, color: PRIMARY_D }}>
                          ✓ Token configurado
                        </span>
                        <span style={{ fontSize: 11, color: MUTED }}>Deixe em branco para manter o atual</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder={escola.asaas_vault_secret_id ? '••••••••••••••••' : '$aact_...'}
                          value={values.asaasToken}
                          onChange={e => set('asaasToken', e.target.value)}
                          style={{ ...inp({ fontFamily: 'Courier New, monospace', fontSize: 12.5, background: '#f8fafc', paddingRight: 42 }) }}
                          onFocus={e => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.background = CARD }}
                          onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#f8fafc' }}
                        />
                        <button type="button" onClick={() => setShowToken(v => !v)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: MUTED }}>
                          {showToken ? '🙈' : '👁'}
                        </button>
                      </div>
                    )}
                  </Field>

                  {/* Wallet ID */}
                  <Field label="Wallet ID" hint="Usado em cenários de split de pagamento (opcional).">
                    <input value={values.asaasWalletId} readOnly={ro} disabled={ro}
                      onChange={e => set('asaasWalletId', e.target.value)} style={inp()}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>

                  {/* Test connection */}
                  {isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        type="button" disabled={testLoading} onClick={handleTestConnection}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 12.5, fontWeight: 600, cursor: testLoading ? 'not-allowed' : 'pointer', color: TEXT, width: 'fit-content', fontFamily: 'inherit' }}
                      >
                        {testLoading ? '⏳ Testando...' : '🔌 Testar Conexão'}
                      </button>
                      {testResult && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: testResult.success ? PRIMARY_L : DANGER_L, color: testResult.success ? PRIMARY_D : DANGER }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: testResult.success ? PRIMARY : DANGER, flexShrink: 0, display: 'inline-block' }} />
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Webhook URL */}
                  <Field label="URL do Webhook" hint="Registre esta URL no painel Asaas para receber eventos de pagamento.">
                    <div style={{ background: '#eff6ff', border: `1px solid rgba(91,192,235,.3)`, borderRadius: RADIUS_SM, padding: 12 }}>
                      <code style={{ display: 'block', fontFamily: 'Courier New, monospace', fontSize: 11.5, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '7px 10px', wordBreak: 'break-all', color: TEXT, marginBottom: 8 }}>
                        {webhookUrl || '/api/webhooks/asaas'}
                      </code>
                      <button
                        type="button" onClick={handleCopyWebhook}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: RADIUS_SM, border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: TEXT, fontFamily: 'inherit' }}
                      >
                        {copied ? '✓ Copiado!' : '📋 Copiar URL'}
                      </button>
                    </div>
                  </Field>
                </div>
              </SCard>

              <SCard title="💰 Preferências de Cobrança">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Dias de antecipação" hint="Dias antes do vencimento em que a cobrança é gerada (1–30).">
                    <input type="number" min={1} max={30} value={values.diasAntecipacao} readOnly={ro} disabled={ro}
                      onChange={e => set('diasAntecipacao', e.target.value)}
                      style={{ ...inp(), maxWidth: 120 }}
                      onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <Field label="Multa (%)" hint="0–10%">
                      <input type="number" min={0} max={10} step={0.1} value={values.multaPct} readOnly={ro} disabled={ro}
                        onChange={e => set('multaPct', e.target.value)} style={inp()}
                        onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                    </Field>
                    <Field label="Juros ao mês (%)" hint="0–10%">
                      <input type="number" min={0} max={10} step={0.1} value={values.jurosPct} readOnly={ro} disabled={ro}
                        onChange={e => set('jurosPct', e.target.value)} style={inp()}
                        onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                    </Field>
                    <Field label="Desconto antecipação (%)" hint="0–100%">
                      <input type="number" min={0} max={100} step={0.1} value={values.descontoAntecipPct} readOnly={ro} disabled={ro}
                        onChange={e => set('descontoAntecipPct', e.target.value)} style={inp()}
                        onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                        onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                    </Field>
                  </div>
                </div>
              </SCard>
            </>
          )}

          {/* ── CONFIGURAÇÕES GERAIS ─────────────────────────────────────── */}
          {tab === 'configuracoes' && (
            <SCard title="🛠️ Configurações Gerais">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <Field label="Janela para chamada" hint="Período máximo (em horas) no passado em que a chamada pode ser registrada.">
                  <select
                    value={values.janela_chamada_h} disabled={ro}
                    onChange={e => set('janela_chamada_h', e.target.value)}
                    style={{ ...inp(), maxWidth: 220, cursor: ro ? 'not-allowed' : 'pointer' }}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER}
                  >
                    {JANELA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>

                <Field label="Capacidade padrão de turmas" hint="Número padrão de alunos por turma (opcional).">
                  <input type="number" min={1} max={9999} placeholder="Ex: 20" value={values.capacidade_padrao} readOnly={ro} disabled={ro}
                    onChange={e => set('capacidade_padrao', e.target.value)}
                    style={{ ...inp(), maxWidth: 150 }}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                </Field>

                <Field label="Limite de alerta de frequência (%)" hint="Atletas com presença abaixo deste valor são sinalizados na lista.">
                  <input type="number" min={0} max={100} value={values.limiar_freq_pct} readOnly={ro} disabled={ro}
                    onChange={e => set('limiar_freq_pct', e.target.value)}
                    style={{ ...inp(), maxWidth: 120 }}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER} />
                </Field>

                <Field label="Fuso horário">
                  <select
                    value={values.fuso_horario} disabled={ro}
                    onChange={e => set('fuso_horario', e.target.value)}
                    style={{ ...inp(), maxWidth: 300, cursor: ro ? 'not-allowed' : 'pointer' }}
                    onFocus={e => { if (!ro) e.currentTarget.style.borderColor = PRIMARY }}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER}
                  >
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: RADIUS_SM }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <strong style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Check-in / check-out por QR</strong>
                    <small style={{ fontSize: 11.5, color: MUTED }}>Recurso opcional para registrar entrada e saída de atletas na unidade.</small>
                  </div>
                  <Toggle checked={values.checkinCheckoutAtivo} onChange={() => !ro && set('checkinCheckoutAtivo', !values.checkinCheckoutAtivo)} disabled={ro} />
                </div>
              </div>
            </SCard>
          )}

          {/* ── NOTIFICAÇÕES ────────────────────────────────────────────── */}
          {tab === 'notificacoes' && (
            <>
              <SCard title="📡 Canais de Notificação">
                <ToggleRow label="E-mail" desc="Cobranças, confirmações e alertas por e-mail"
                  checked={values.notifEmail} onChange={() => !ro && set('notifEmail', !values.notifEmail)} disabled={ro} />
                <ToggleRow label="Push" desc="Notificações no app Esportes Academy"
                  checked={values.notifPush} onChange={() => !ro && set('notifPush', !values.notifPush)} disabled={ro} />
                <ToggleRow
                  label="WhatsApp" desc={escola.plano === 'starter' ? 'Disponível no plano Pro' : 'Mensagens via WhatsApp Business'}
                  checked={values.notifWhatsapp}
                  onChange={() => !ro && escola.plano !== 'starter' && set('notifWhatsapp', !values.notifWhatsapp)}
                  disabled={ro || escola.plano === 'starter'}
                  badge={escola.plano === 'starter' && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: ACCENT_L, color: '#b45309', fontWeight: 700 }}>🔒 Pro</span>
                  )}
                />
                <ToggleRow label="SMS" desc="Mensagens de texto (operadoras)"
                  checked={values.notifSms} onChange={() => !ro && set('notifSms', !values.notifSms)} disabled={ro} />
              </SCard>

              <SCard title="💰 Gatilhos Financeiros">
                {[
                  { key: 'notifCobrancaLembreteD3' as const, label: 'Lembrete D-3',         desc: '3 dias antes do vencimento' },
                  { key: 'notifCobrancaLembreteD1' as const, label: 'Lembrete D-1',         desc: '1 dia antes do vencimento' },
                  { key: 'notifCobrancaVencida'    as const, label: 'Cobrança vencida',      desc: 'Após o dia de vencimento' },
                  { key: 'notifCobrancaConfirmacao' as const, label: 'Pagamento confirmado', desc: 'Quando o pagamento é processado' },
                ].map(({ key, label, desc }) => (
                  <ToggleRow key={key} label={label} desc={desc}
                    checked={values[key]} onChange={() => !ro && set(key, !values[key])} disabled={ro} />
                ))}
              </SCard>

              <SCard title="🎓 Gatilhos Pedagógicos">
                {[
                  { key: 'notifFrequenciaBaixa'    as const, label: 'Frequência baixa',         desc: 'Quando aluno atinge abaixo do mínimo' },
                  { key: 'notifAusencia'            as const, label: 'Ausência',                 desc: 'Quando aluno falta à aula' },
                  { key: 'notifRelatorioMensal'     as const, label: 'Relatório mensal',          desc: 'Enviado no início de cada mês' },
                  { key: 'notifAniversarioAtleta'   as const, label: 'Parabéns de aniversário',  desc: 'Mensagem automática no dia do aniversário do atleta' },
                ].map(({ key, label, desc }) => (
                  <ToggleRow key={key} label={label} desc={desc}
                    checked={values[key]} onChange={() => !ro && set(key, !values[key])} disabled={ro} />
                ))}
              </SCard>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 8, padding: '10px 14px', background: DANGER_L, border: `1px solid #fecaca`, borderRadius: RADIUS_SM, fontSize: 13, color: '#b91c1c' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky save bar ─────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 60, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          pointerEvents: 'all', background: TEXT, color: '#fff', borderRadius: RADIUS,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 10px 24px rgba(0,0,0,.15)',
          transform: isDirty && isAdmin ? 'translateY(0)' : 'translateY(60px)',
          opacity: isDirty && isAdmin ? 1 : 0,
          transition: 'transform .25s, opacity .25s',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>● Você tem alterações não salvas</span>
          <button
            type="submit" disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: RADIUS_SM, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button" onClick={() => { setValues(original.current); setError(null) }}
            style={{ fontSize: 12, fontWeight: 500, background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Descartar
          </button>
        </div>
      </div>
    </form>
  )
}
