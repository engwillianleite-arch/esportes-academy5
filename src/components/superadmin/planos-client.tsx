'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  listarAssinaturas,
  atribuirPlano,
  atualizarStatusAssinatura,
  type AssinaturaRow,
  type KpiPlanos,
  type RenovacaoRow,
} from '@/lib/planos-actions'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANOS = ['starter', 'pro', 'premium', 'enterprise'] as const
type Plano = (typeof PLANOS)[number]

const PLAN_CONFIG: Record<Plano, {
  label: string; color: string; bg: string; border: string
  preco_mensal: number; preco_anual: number
  emoji: string; tagline: string
  features: string[]; limite_atletas: string
}> = {
  starter: {
    label: 'Starter', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',
    preco_mensal: 490, preco_anual: 392,
    emoji: '🌱', tagline: 'Para escolas que estão começando',
    features: ['Gestão de atletas', 'Controle financeiro básico', 'Comunicação básica', 'Até 100 atletas'],
    limite_atletas: '100',
  },
  pro: {
    label: 'Pro', color: '#4f46e5', bg: '#eef2ff', border: '#4f46e5',
    preco_mensal: 890, preco_anual: 712,
    emoji: '🚀', tagline: 'Para escolas em crescimento',
    features: ['Tudo do Starter', 'Módulo de saúde', 'Eventos e torneios', 'Treinamentos', 'Relatórios avançados', 'Até 300 atletas'],
    limite_atletas: '300',
  },
  premium: {
    label: 'Premium', color: '#8b5cf6', bg: '#ede9fe', border: '#8b5cf6',
    preco_mensal: 1490, preco_anual: 1192,
    emoji: '⭐', tagline: 'Para escolas estabelecidas',
    features: ['Tudo do Pro', 'Cursos online', 'Competições', 'Metodologia', 'Suporte prioritário', 'Até 800 atletas'],
    limite_atletas: '800',
  },
  enterprise: {
    label: 'Enterprise', color: '#0d9488', bg: '#ccfbf1', border: '#0d9488',
    preco_mensal: 0, preco_anual: 0,
    emoji: '🏆', tagline: 'Para redes e grandes academias',
    features: ['Tudo do Premium', 'Multi-unidades', 'SLA dedicado', 'Onboarding personalizado', 'API access', 'Atletas ilimitados'],
    limite_atletas: 'Ilimitado',
  },
}

const STATUS_LABEL: Record<string, string> = {
  adimplente:      '● Em dia',
  inadimplente:    '● Inadimplente',
  atraso:          '⚠ Em atraso',
  suspenso:        '○ Suspenso',
  cancelado:       '○ Cancelado',
  trial:           '◎ Trial',
  sem_assinatura:  '— Sem assinatura',
  inativa:         '○ Inativa',
}

const STATUS_COLOR: Record<string, string> = {
  adimplente:   'bg-emerald-100 text-emerald-700',
  inadimplente: 'bg-red-100 text-red-700',
  atraso:       'bg-amber-100 text-amber-700',
  suspenso:     'bg-slate-100 text-slate-600',
  cancelado:    'bg-slate-100 text-slate-500',
  trial:        'bg-amber-100 text-amber-700',
  sem_assinatura:'bg-slate-100 text-slate-500',
  inativa:      'bg-slate-100 text-slate-400',
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-BR')
}

const diasParaVencer = (d: string | null | undefined) => {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
  return diff
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialRows: AssinaturaRow[]
  initialKpi: KpiPlanos
  initialRenovacoes: RenovacaoRow[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanosClient({ initialRows, initialKpi, initialRenovacoes }: Props) {
  const [rows,      setRows]      = useState<AssinaturaRow[]>(initialRows)
  const [kpi,       setKpi]       = useState<KpiPlanos>(initialKpi)
  const [renovacoes,setRenovacoes]= useState<RenovacaoRow[]>(initialRenovacoes)
  const [erro,      setErro]      = useState<string | null>(null)
  const [msg,       setMsg]       = useState<string | null>(null)
  const [isPending, startTx]      = useTransition()

  // Filters
  const [search,      setSearch]      = useState('')
  const [filterPlano, setFilterPlano] = useState('todos')
  const [filterStatus,setFilterStatus]= useState('todos')
  const [activeTab,   setActiveTab]   = useState('todos')

  // Billing toggle
  const [billing, setBilling] = useState<'mensal' | 'anual'>('mensal')

  // View / assign panel
  const [panelRow,  setPanelRow]  = useState<AssinaturaRow | null>(null)
  const [assignOpen,setAssignOpen]= useState(false)
  const [assignEscolaId,  setAssignEscolaId]  = useState('')
  const [assignPlano,     setAssignPlano]      = useState<Plano>('starter')
  const [assignValor,     setAssignValor]      = useState('')
  const [assignDiaVenc,   setAssignDiaVenc]    = useState('5')

  // Status modal
  const [statusModal, setStatusModal] = useState<{ id: string; status: string } | null>(null)

  // Reload
  const reload = useCallback(() => {
    startTx(async () => {
      const r = await listarAssinaturas({
        q:      search || undefined,
        plano:  filterPlano !== 'todos' ? filterPlano : undefined,
        status: activeTab !== 'todos' ? activeTab : filterStatus !== 'todos' ? filterStatus : undefined,
      })
      if (r.error) { setErro(r.error); return }
      setRows(r.rows ?? [])
      if (r.kpi) setKpi(r.kpi)
      if (r.renovacoes) setRenovacoes(r.renovacoes)
    })
  }, [search, filterPlano, filterStatus, activeTab])

  useEffect(() => { reload() }, [reload])

  // ── Assign plan ─────────────────────────────────────────────────────────────

  async function handleAssign() {
    if (!assignEscolaId) { setErro('Selecione uma escola.'); return }
    const valor = parseFloat(assignValor.replace(',', '.'))
    if (isNaN(valor) || valor < 0) { setErro('Valor inválido.'); return }
    setErro(null)
    startTx(async () => {
      const r = await atribuirPlano(assignEscolaId, assignPlano, valor, parseInt(assignDiaVenc, 10) || 5)
      if (r.error) { setErro(r.error); return }
      setMsg('Plano atribuído com sucesso.')
      setAssignOpen(false)
      reload()
    })
  }

  // ── Status update ────────────────────────────────────────────────────────────

  async function handleStatusUpdate() {
    if (!statusModal) return
    startTx(async () => {
      const r = await atualizarStatusAssinatura(
        statusModal.id,
        statusModal.status as Parameters<typeof atualizarStatusAssinatura>[1]
      )
      if (r.error) { setErro(r.error); return }
      setMsg('Status atualizado.')
      setStatusModal(null)
      reload()
    })
  }

  // Filtered rows by tab
  const tabRows = rows.filter(r => {
    if (activeTab === 'todos') return true
    if (activeTab === 'adimplente') return r.status === 'adimplente'
    if (activeTab === 'trial') return r.status === 'trial'
    if (activeTab === 'atraso') return r.status === 'atraso' || r.status === 'inadimplente'
    if (activeTab === 'cancelado') return r.status === 'cancelado' || r.status === 'suspenso'
    return true
  })

  const maxDist = Math.max(...Object.values(kpi.distribuicao).map(d => d.count), 1)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1300px] space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Feedback */}
      {erro && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠ {erro}
          <button className="ml-auto" onClick={() => setErro(null)}>✕</button>
        </div>
      )}
      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ {msg}
          <button className="ml-auto" onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Planos & Licenças</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Gerencie planos, assinaturas e licenças das escolas</p>
        </div>
        <button onClick={() => setAssignOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca]">
          ＋ Atribuir Licença
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard color="blue" icon="💰" label="MRR" value={fmtBRL(kpi.mrr)} sub={`ARR: ${fmtBRL(kpi.arr)}`} />
        <KpiCard color="green" icon="📦" label="Licenças Ativas" value={String(kpi.licencas_ativas)} sub={`${kpi.trial} trial · ${kpi.em_atraso} em atraso`} />
        <KpiCard color="purple" icon="📈" label="Ticket Médio" value={fmtBRL(kpi.ticket_medio)} sub="por escola/mês" />
        <KpiCard color="orange" icon="⚠️" label="Em Atraso" value={String(kpi.em_atraso)} sub={`${kpi.trial} em trial`} />
      </div>

      {/* Plan cards + distribution */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[15px] font-bold text-[#0f172a]">Planos disponíveis</p>
            <p className="text-xs text-[#64748b]">Configure os planos oferecidos às escolas</p>
          </div>
          {/* Billing toggle */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-0.5">
              {(['mensal', 'anual'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${billing === b ? 'bg-[#4f46e5] text-white' : 'text-[#64748b]'}`}>
                  {b === 'mensal' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
            {billing === 'anual' && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">-20% anual</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANOS.map(p => {
            const cfg = PLAN_CONFIG[p]
            const preco = billing === 'mensal' ? cfg.preco_mensal : cfg.preco_anual
            const count = kpi.distribuicao[p]?.count ?? 0
            return (
              <div key={p}
                className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg ${p === 'premium' ? 'border-[#8b5cf6]' : 'border-[#e2e8f0]'}`}>
                {p === 'premium' && (
                  <div className="absolute right-[-26px] top-[14px] rotate-[35deg] bg-[#8b5cf6] px-8 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </div>
                )}
                {/* Stripe */}
                <div className="mb-4 h-1 w-full rounded-full" style={{
                  background: p === 'starter' ? cfg.color
                    : p === 'pro' ? 'linear-gradient(90deg,#4f46e5,#0ea5e9)'
                    : p === 'premium' ? 'linear-gradient(90deg,#8b5cf6,#a855f7)'
                    : 'linear-gradient(90deg,#0d9488,#14b8a6)'
                }} />
                <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="mt-1 min-h-[36px] text-[12px] text-[#64748b]">{cfg.tagline}</p>
                {/* Price */}
                {p === 'enterprise' ? (
                  <p className="my-3 text-[22px] font-extrabold" style={{ color: cfg.color }}>Sob consulta</p>
                ) : (
                  <div className="my-3 flex items-end gap-1">
                    <span className="text-[16px] font-bold text-[#0f172a] leading-[1.8]">R$</span>
                    <span className="text-[34px] font-black text-[#0f172a] leading-none">{preco.toLocaleString('pt-BR')}</span>
                    <span className="text-[12px] text-[#64748b] leading-[2.2]">/mês</span>
                  </div>
                )}
                {billing === 'anual' && p !== 'enterprise' && (
                  <p className="mb-3 -mt-1 text-[11px] text-[#64748b]">
                    Economize <span className="font-semibold text-emerald-600">R${((cfg.preco_mensal - cfg.preco_anual) * 12).toLocaleString('pt-BR')}/ano</span>
                  </p>
                )}
                {/* Stats */}
                <div className="mb-4 flex gap-2">
                  <div className="flex-1 rounded-lg bg-[#f8fafc] py-2 text-center">
                    <p className="text-[16px] font-extrabold text-[#0f172a]">{count}</p>
                    <p className="text-[10px] text-[#94a3b8]">Escolas</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-[#f8fafc] py-2 text-center">
                    <p className="text-[16px] font-extrabold text-[#0f172a]">{cfg.limite_atletas}</p>
                    <p className="text-[10px] text-[#94a3b8]">Atletas</p>
                  </div>
                </div>
                <div className="mb-4 h-px bg-[#f1f5f9]" />
                {/* Features */}
                <ul className="mb-5 flex flex-1 flex-col gap-2">
                  {cfg.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#0f172a]">
                      <span className="mt-0.5 text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { setAssignPlano(p); setAssignValor(String(preco)); setAssignOpen(true) }}
                  className="w-full rounded-xl py-2.5 text-[13px] font-bold transition"
                  style={{ background: p === 'starter' ? '#f1f5f9' : cfg.color, color: p === 'starter' ? '#0f172a' : '#fff' }}>
                  {p === 'enterprise' ? 'Entrar em contato' : 'Atribuir plano'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Distribution + Renovações */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Distribuição */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <p className="mb-1 text-[15px] font-bold text-[#0f172a]">Distribuição por Plano</p>
          <p className="mb-4 text-xs text-[#94a3b8]">Escolas ativas por categoria</p>
          <div className="space-y-3">
            {PLANOS.map(p => {
              const cfg = PLAN_CONFIG[p]
              const d   = kpi.distribuicao[p] ?? { count: 0, mrr: 0 }
              const pct = maxDist > 0 ? (d.count / maxDist) * 100 : 0
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-20 flex-shrink-0 text-[12px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-[#f1f5f9]" style={{ height: 8 }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <span className="w-6 flex-shrink-0 text-right text-[12px] font-bold text-[#0f172a]">{d.count}</span>
                  <span className="w-20 flex-shrink-0 text-right text-[11px] text-[#94a3b8]">{fmtBRL(d.mrr)}/mês</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex gap-3 border-t border-[#f1f5f9] pt-3">
            <div className="flex-1 text-center">
              <p className="text-[18px] font-extrabold text-[#0f172a]">
                {kpi.licencas_ativas ? Math.round((((kpi.distribuicao.pro?.count ?? 0) + (kpi.distribuicao.premium?.count ?? 0) + (kpi.distribuicao.enterprise?.count ?? 0)) / kpi.licencas_ativas) * 100) : 0}%
              </p>
              <p className="text-[11px] text-[#94a3b8]">Pro ou acima</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-[18px] font-extrabold text-[#0f172a]">{fmtBRL(kpi.mrr)}</p>
              <p className="text-[11px] text-[#94a3b8]">MRR total</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-[18px] font-extrabold text-[#0f172a]">{fmtBRL(kpi.arr)}</p>
              <p className="text-[11px] text-[#94a3b8]">ARR atual</p>
            </div>
          </div>
        </div>

        {/* Próximas renovações */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-bold text-[#0f172a]">Próximas Renovações</p>
              <p className="text-xs text-[#94a3b8]">{renovacoes.length} vencimentos nos próximos 30 dias</p>
            </div>
          </div>
          {renovacoes.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#94a3b8]">Nenhuma renovação nos próximos 30 dias.</div>
          ) : (
            <div className="space-y-0">
              {renovacoes.map((r, i) => {
                const dias    = diasParaVencer(r.proximo_vencimento) ?? 0
                const urgente = dias <= 5
                const cfg     = PLAN_CONFIG[r.plano as Plano]
                return (
                  <div key={i} className="flex items-center gap-3 border-b border-[#f1f5f9] py-3 last:border-0">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${urgente ? 'bg-red-500' : dias <= 15 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      {i < renovacoes.length - 1 && <div className="w-px flex-1 bg-[#f1f5f9]" style={{ height: 20 }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#0f172a]">{r.escola_nome}</p>
                      <p className="text-[11px] text-[#94a3b8]">{cfg?.label ?? r.plano}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[12px] font-bold ${urgente ? 'text-red-600' : 'text-[#0f172a]'}`}>
                        {fmtDate(r.proximo_vencimento)}
                      </p>
                      <p className="text-[11px] text-[#94a3b8]">{fmtBRL(r.valor_mensal)}/mês</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {(kpi.em_atraso > 0 || kpi.trial > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpi.em_atraso > 0 && (
            <div className="rounded-xl border-l-4 border-red-400 bg-red-50 p-4">
              <p className="text-[12px] font-bold text-red-600">🚨 Pagamentos em atraso</p>
              <p className="mt-1 text-[12px] text-[#0f172a]">{kpi.em_atraso} escola{kpi.em_atraso !== 1 ? 's' : ''} com cobrança vencida</p>
            </div>
          )}
          {kpi.trial > 0 && (
            <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
              <p className="text-[12px] font-bold text-amber-600">⏳ Trials ativos</p>
              <p className="mt-1 text-[12px] text-[#0f172a]">{kpi.trial} escola{kpi.trial !== 1 ? 's' : ''} em período de trial</p>
            </div>
          )}
        </div>
      )}

      {/* Tabela de assinaturas */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#f1f5f9] px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-[#0f172a]">Assinaturas</p>
            <p className="text-xs text-[#94a3b8]">{tabRows.length} escola{tabRows.length !== 1 ? 's' : ''} · {fmtBRL(kpi.mrr)}/mês</p>
          </div>
          <button onClick={() => setAssignOpen(true)}
            className="rounded-xl bg-[#4f46e5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4338ca]">
            ＋ Atribuir
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] overflow-x-auto">
          {[
            { key: 'todos',       label: 'Todas',       count: rows.length },
            { key: 'adimplente',  label: 'Ativas',      count: rows.filter(r => r.status === 'adimplente').length },
            { key: 'trial',       label: 'Trial',       count: rows.filter(r => r.status === 'trial').length },
            { key: 'atraso',      label: 'Em atraso',   count: rows.filter(r => r.status === 'atraso' || r.status === 'inadimplente').length },
            { key: 'cancelado',   label: 'Canceladas',  count: rows.filter(r => r.status === 'cancelado' || r.status === 'suspenso').length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-medium transition ${
                activeTab === tab.key ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}>
              {tab.label}
              <span className={`rounded-full px-2 py-px text-[10px] font-bold ${activeTab === tab.key ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f5f9] px-5 py-3">
          <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
            <span className="text-[#94a3b8] text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar escola..."
              className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]" />
          </div>
          <select value={filterPlano} onChange={e => setFilterPlano(e.target.value)}
            className="h-9 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
            <option value="todos">Todos os planos</option>
            {PLANOS.map(p => <option key={p} value={p}>{PLAN_CONFIG[p].label}</option>)}
          </select>
          {isPending && <span className="text-xs text-[#94a3b8]">Carregando...</span>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Escola</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Plano</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Valor/mês</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Renovação</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Matrículas</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tabRows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#94a3b8]">
                  <div className="text-4xl mb-2">📦</div>
                  Nenhuma assinatura encontrada.
                </td></tr>
              ) : tabRows.map((r, idx) => {
                const dias    = diasParaVencer(r.proximo_vencimento)
                const urgente = dias !== null && dias <= 5
                const cfg     = PLAN_CONFIG[r.plano as Plano]
                return (
                  <tr key={r.escola_id}
                    onClick={() => setPanelRow(r)}
                    className={`cursor-pointer border-b border-[#f1f5f9] transition hover:bg-[#f8fafc]
                      ${(r.status === 'atraso' || r.status === 'inadimplente') ? 'bg-red-50/40' : ''}
                      ${r.status === 'trial' ? 'bg-amber-50/30' : ''}
                      ${idx % 2 === 0 ? '' : ''}
                    `}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                          style={{ background: cfg?.bg ?? '#f8fafc', color: cfg?.color ?? '#64748b' }}>
                          {r.escola_nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0f172a]">{r.escola_nome}</p>
                          <p className="text-[11px] text-[#94a3b8]">
                            {r.escola_cidade}{r.escola_estado ? `, ${r.escola_estado}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: cfg?.bg ?? '#f8fafc', color: cfg?.color ?? '#64748b' }}>
                        {cfg?.label ?? r.plano}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#0f172a]">
                      {r.valor_mensal > 0 ? fmtBRL(r.valor_mensal) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.proximo_vencimento ? (
                        <span className={`text-sm font-medium ${urgente ? 'text-red-600' : 'text-[#64748b]'}`}>
                          {fmtDate(r.proximo_vencimento)}
                          {dias !== null && dias <= 15 && (
                            <span className={`ml-1.5 text-[11px] font-bold ${urgente ? 'text-red-500' : 'text-amber-500'}`}>
                              ({dias}d)
                            </span>
                          )}
                        </span>
                      ) : <span className="text-[#94a3b8]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#0f172a]">{r.total_matriculas}</td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button title="Ver detalhes" onClick={() => setPanelRow(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm hover:bg-[#f8fafc]">👁</button>
                        <button title="Alterar plano" onClick={() => {
                          setAssignEscolaId(r.escola_id)
                          setAssignPlano((r.plano as Plano) ?? 'starter')
                          setAssignValor(String(r.valor_mensal))
                          setAssignOpen(true)
                        }} className="flex h-7 w-7 items-center justify-center rounded-lg text-sm hover:bg-[#f8fafc]">✏️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ VIEW PANEL ══ */}
      {panelRow && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setPanelRow(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-[210] flex w-full max-w-[540px] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                style={{ background: PLAN_CONFIG[panelRow.plano as Plano]?.bg ?? '#f8fafc', color: PLAN_CONFIG[panelRow.plano as Plano]?.color ?? '#64748b' }}>
                {panelRow.escola_nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#0f172a]">{panelRow.escola_nome}</p>
                <p className="text-xs text-[#64748b]">
                  {PLAN_CONFIG[panelRow.plano as Plano]?.label ?? panelRow.plano} · {STATUS_LABEL[panelRow.status] ?? panelRow.status}
                </p>
              </div>
              <button onClick={() => setPanelRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:border-red-300 hover:bg-red-50 hover:text-red-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Plan banner */}
              <div className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: PLAN_CONFIG[panelRow.plano as Plano]?.bg ?? '#f8fafc' }}>
                <span className="text-3xl">{PLAN_CONFIG[panelRow.plano as Plano]?.emoji ?? '📦'}</span>
                <div className="flex-1">
                  <p className="text-[14px] font-extrabold tracking-wide" style={{ color: PLAN_CONFIG[panelRow.plano as Plano]?.color }}>
                    {PLAN_CONFIG[panelRow.plano as Plano]?.label ?? panelRow.plano}
                  </p>
                  <p className="text-[12px] text-[#64748b]">{PLAN_CONFIG[panelRow.plano as Plano]?.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-black text-[#0f172a]">{panelRow.valor_mensal > 0 ? fmtBRL(panelRow.valor_mensal) : '—'}</p>
                  <p className="text-[11px] text-[#94a3b8]">/mês</p>
                </div>
              </div>

              {/* Info grid */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] border-b border-[#f1f5f9] pb-1.5">Dados da Assinatura</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Status',         value: STATUS_LABEL[panelRow.status] ?? panelRow.status },
                    { label: 'Dia vencimento', value: `Todo dia ${panelRow.dia_vencimento}` },
                    { label: 'Próx. renovação',value: fmtDate(panelRow.proximo_vencimento) },
                    { label: 'Matrículas',     value: String(panelRow.total_matriculas) },
                    { label: 'Ref. Asaas',     value: panelRow.referencia_externa ?? '—' },
                    { label: 'Desde',          value: panelRow.created_at ? fmtDate(panelRow.created_at) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] text-[#94a3b8]">{label}</p>
                      <p className="text-[13px] font-semibold text-[#0f172a]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status update */}
              {panelRow.id !== panelRow.escola_id && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] border-b border-[#f1f5f9] pb-1.5">Alterar Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['adimplente','atraso','inadimplente','suspenso','cancelado'] as const).map(s => (
                      <button key={s} onClick={() => setStatusModal({ id: panelRow.id, status: s })}
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition border ${STATUS_COLOR[s]} border-transparent hover:border-current`}>
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-3 border-t border-[#e2e8f0] px-5 py-4">
              <button onClick={() => setPanelRow(null)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">Fechar</button>
              <button onClick={() => {
                setAssignEscolaId(panelRow.escola_id)
                setAssignPlano((panelRow.plano as Plano) ?? 'starter')
                setAssignValor(String(panelRow.valor_mensal))
                setPanelRow(null)
                setAssignOpen(true)
              }} className="flex-1 rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-white hover:bg-[#4338ca]">
                ✏️ Alterar plano
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ ASSIGN DRAWER ══ */}
      {assignOpen && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setAssignOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-[210] flex w-full max-w-[480px] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-xl">📦</div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#0f172a]">Atribuir / Alterar Licença</p>
                <p className="text-xs text-[#64748b]">Selecione a escola, plano e valor</p>
              </div>
              <button onClick={() => setAssignOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:border-red-300 hover:bg-red-50 hover:text-red-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{erro}</div>}

              {/* Escola */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#0f172a]">Escola <span className="text-red-500">*</span></label>
                <select value={assignEscolaId} onChange={e => setAssignEscolaId(e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#4f46e5]">
                  <option value="">— Selecione a escola —</option>
                  {rows.map(r => (
                    <option key={r.escola_id} value={r.escola_id}>{r.escola_nome}</option>
                  ))}
                </select>
              </div>

              {/* Plan selector */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#0f172a]">Plano <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {PLANOS.map(p => {
                    const cfg = PLAN_CONFIG[p]
                    return (
                      <button key={p} onClick={() => {
                        setAssignPlano(p)
                        if (!assignValor) setAssignValor(String(cfg.preco_mensal))
                      }}
                        className={`rounded-xl border-2 p-3 text-left transition ${assignPlano === p ? 'border-current' : 'border-[#e2e8f0] hover:border-current'}`}
                        style={assignPlano === p ? { borderColor: cfg.color, background: cfg.bg } : {}}>
                        <p className="text-[11px] font-extrabold uppercase" style={{ color: cfg.color }}>{cfg.label}</p>
                        <p className="mt-0.5 text-[16px] font-extrabold text-[#0f172a]">
                          {cfg.preco_mensal ? `R$${cfg.preco_mensal.toLocaleString('pt-BR')}` : 'Customizado'}
                        </p>
                        <p className="text-[10px] text-[#94a3b8]">{cfg.limite_atletas} atletas</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#0f172a]">Valor mensal (R$) <span className="text-red-500">*</span></label>
                  <input type="number" value={assignValor} onChange={e => setAssignValor(e.target.value)}
                    placeholder="890"
                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#4f46e5]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#0f172a]">Dia vencimento</label>
                  <select value={assignDiaVenc} onChange={e => setAssignDiaVenc(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#4f46e5]">
                    {[1,5,10,15,20,25,30].map(d => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-3 border-t border-[#e2e8f0] px-5 py-4">
              <button onClick={() => setAssignOpen(false)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
              <button onClick={handleAssign} disabled={isPending}
                className="flex-1 rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-60">
                {isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ STATUS MODAL ══ */}
      {statusModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-7 shadow-2xl">
            <p className="text-center text-[16px] font-bold text-[#0f172a]">Alterar status da assinatura?</p>
            <p className="mt-2 text-center text-sm text-[#64748b]">
              Novo status: <strong>{STATUS_LABEL[statusModal.status] ?? statusModal.status}</strong>
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setStatusModal(null)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
              <button onClick={handleStatusUpdate} disabled={isPending}
                className="flex-1 rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-60">
                {isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

function KpiCard({ color, icon, label, value, sub }: {
  color: 'blue' | 'green' | 'purple' | 'orange'
  icon: string; label: string; value: string; sub: string
}) {
  const tops: Record<string, string> = {
    blue:   'bg-gradient-to-r from-[#4f46e5] to-[#0ea5e9]',
    green:  'bg-gradient-to-r from-[#10b981] to-[#34d399]',
    purple: 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]',
    orange: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  }
  const bgs: Record<string, string> = {
    blue: '#eef2ff', green: '#d1fae5', purple: '#ede9fe', orange: '#fef3c7',
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${tops[color]}`} />
      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: bgs[color] }}>{icon}</div>
      </div>
      <p className="text-[24px] font-extrabold text-[#0f172a] leading-none">{value}</p>
      <p className="mt-1 text-[12px] font-medium text-[#64748b]">{label}</p>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  )
}
