'use client'

import { useMemo, useState } from 'react'
import type {
  ChurnSeriesRow,
  CohortRow,
  EscolaPerf,
  MonthlySeries,
  PlanoDist,
  RegionRow,
  RelatoriosKpis,
  StatusSeriesRow,
  TicketSeriesRow,
} from '@/lib/relatorios-actions'

type Tab = 'overview' | 'financeiro' | 'escolas' | 'crescimento'
type Period = 'mes' | 'trimestre' | 'ano'
type SortKey = 'nome' | 'atletas' | 'mensalidade'

const planoStyles: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700 border border-slate-200',
  basic: 'bg-slate-100 text-slate-700 border border-slate-200',
  pro: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  premium: 'bg-blue-100 text-blue-700 border border-blue-200',
  enterprise: 'bg-violet-100 text-violet-700 border border-violet-200',
}

const statusStyles: Record<string, string> = {
  ativa: 'bg-emerald-100 text-emerald-700',
  adimplente: 'bg-emerald-100 text-emerald-700',
  inativa: 'bg-slate-100 text-slate-600',
  atraso: 'bg-amber-100 text-amber-700',
  inadimplente: 'bg-red-100 text-red-700',
  suspenso: 'bg-orange-100 text-orange-700',
  cancelado: 'bg-slate-200 text-slate-700',
  sem_assinatura: 'bg-sky-100 text-sky-700',
}

const tableHead = 'px-4 py-3 font-semibold'

function fmtBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function fmtMes(mes: string) {
  const [year, month] = mes.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function planoLabel(plano: string) {
  return { starter: 'Starter', basic: 'Basic', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }[plano] ?? plano
}

function statusLabel(status: string) {
  return {
    ativa: 'Ativa',
    adimplente: 'Adimplente',
    inativa: 'Inativa',
    atraso: 'Em atraso',
    inadimplente: 'Inadimplente',
    suspenso: 'Suspenso',
    cancelado: 'Cancelado',
    sem_assinatura: 'Sem assinatura',
  }[status] ?? status
}

function exportCsv(escolas: EscolaPerf[]) {
  const rows = [
    ['Escola', 'Plano', 'Estado', 'Atletas', 'Mensalidade', 'Status'],
    ...escolas.map((row) => [row.nome, planoLabel(row.plano), row.estado ?? '', String(row.atletas), String(row.mensalidade), statusLabel(row.status)]),
  ]
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `superadmin-relatorios-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-bold text-slate-950 sm:text-base">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[30px]">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{sub}</p>
    </div>
  )
}

function Bars({ items, color, emptyLabel, formatter }: { items: Array<{ label: string; value: number }>; color: string; emptyLabel: string; formatter?: (value: number) => string }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  if (!items.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">{emptyLabel}</div>
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percent = Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
              <span className="text-xs font-semibold text-slate-500">{formatter ? formatter(item.value) : item.value.toLocaleString('pt-BR')}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FinanceChart({ monthly }: { monthly: MonthlySeries[] }) {
  const max = Math.max(...monthly.flatMap((item) => [item.receita, item.despesa]), 1)
  if (!monthly.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Nenhum lançamento financeiro encontrado.</div>
  return (
    <div>
      <div className="flex h-64 items-end gap-3 overflow-x-auto pb-6">
        {monthly.map((item) => (
          <div key={item.mes} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-52 w-full items-end justify-center gap-1.5">
              <div className="w-5 rounded-t-md bg-indigo-500" style={{ height: `${Math.max((item.receita / max) * 100, item.receita > 0 ? 6 : 0)}%` }} />
              <div className="w-5 rounded-t-md bg-rose-500" style={{ height: `${Math.max((item.despesa / max) * 100, item.despesa > 0 ? 6 : 0)}%` }} />
            </div>
            <span className="text-[11px] font-medium text-slate-500">{fmtMes(item.mes)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />Receita</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Despesa</span>
      </div>
    </div>
  )
}

export default function RelatoriosClient({
  kpis,
  monthly,
  planoDist,
  escolaPerf,
  cohort,
  regions,
  ticketSeries,
  churnSeries,
  statusSeries,
  loadError,
}: {
  kpis: RelatoriosKpis
  monthly: MonthlySeries[]
  planoDist: PlanoDist[]
  escolaPerf: EscolaPerf[]
  cohort: CohortRow[]
  regions: RegionRow[]
  ticketSeries: TicketSeriesRow[]
  churnSeries: ChurnSeriesRow[]
  statusSeries: StatusSeriesRow[]
  loadError: boolean
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<Period>('mes')
  const [sortKey, setSortKey] = useState<SortKey>('atletas')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [planoFilter, setPlanoFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  const filteredMonthly = useMemo(() => (period === 'mes' ? monthly.slice(-1) : period === 'trimestre' ? monthly.slice(-3) : monthly), [monthly, period])
  const estadosDisponiveis = useMemo(() => [...new Set(escolaPerf.map((item) => item.estado).filter((item): item is string => Boolean(item)))].sort(), [escolaPerf])
  const planosDisponiveis = useMemo(() => [...new Set(escolaPerf.map((item) => item.plano))].sort(), [escolaPerf])
  const statusDisponiveis = useMemo(() => [...new Set(escolaPerf.map((item) => item.status))].sort(), [escolaPerf])

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase()
    return escolaPerf.filter((item) => {
      const matchesSearch = !term || item.nome.toLowerCase().includes(term) || (item.estado ?? '').toLowerCase().includes(term)
      return matchesSearch && (estadoFilter === 'todos' || item.estado === estadoFilter) && (planoFilter === 'todos' || item.plano === planoFilter) && (statusFilter === 'todos' || item.status === statusFilter)
    })
  }, [escolaPerf, estadoFilter, planoFilter, search, statusFilter])

  const filteredKpis = useMemo(() => {
    const active = filteredSchools.filter((item) => item.status !== 'inativa' && item.status !== 'cancelado')
    const bad = filteredSchools.filter((item) => item.status === 'inadimplente' || item.status === 'atraso')
    const paying = filteredSchools.filter((item) => item.status === 'adimplente')
    const mrr = paying.reduce((sum, item) => sum + item.mensalidade, 0)
    return {
      totalEscolas: filteredSchools.length,
      escolasAtivas: active.length,
      escolasInadimplentes: bad.length,
      totalAtletas: filteredSchools.reduce((sum, item) => sum + item.atletas, 0),
      mrr,
      ticket: paying.length ? mrr / paying.length : 0,
      retencao: filteredSchools.length ? Math.round((active.length / filteredSchools.length) * 100) : 0,
    }
  }, [filteredSchools])

  const financialSummary = useMemo(() => {
    const receita = filteredMonthly.reduce((sum, item) => sum + item.receita, 0)
    const despesa = filteredMonthly.reduce((sum, item) => sum + item.despesa, 0)
    return { receita, despesa, resultado: receita - despesa, margem: receita > 0 ? Math.round(((receita - despesa) / receita) * 100) : 0 }
  }, [filteredMonthly])

  const sortedSchools = useMemo(() => {
    return [...filteredSchools].sort((a, b) => {
      if (sortKey === 'nome') {
        const diff = a.nome.localeCompare(b.nome)
        return sortDir === 'asc' ? diff : -diff
      }
      const aValue = sortKey === 'atletas' ? a.atletas : a.mensalidade
      const bValue = sortKey === 'atletas' ? b.atletas : b.mensalidade
      return sortDir === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [filteredSchools, sortDir, sortKey])

  const filteredPlanoDist = useMemo(() => {
    const map = new Map<string, { count: number; mrr: number }>()
    for (const escola of filteredSchools) {
      const current = map.get(escola.plano) ?? { count: 0, mrr: 0 }
      current.count += 1
      current.mrr += escola.status === 'adimplente' ? escola.mensalidade : 0
      map.set(escola.plano, current)
    }
    return [...map.entries()].map(([plano, values]) => ({ plano, ...values }))
  }, [filteredSchools])

  const derivedStatus = useMemo(() => {
    if (!search && estadoFilter === 'todos' && planoFilter === 'todos' && statusFilter === 'todos') return statusSeries
    const map = new Map<string, number>()
    for (const escola of filteredSchools) map.set(escola.status, (map.get(escola.status) ?? 0) + 1)
    return [...map.entries()].map(([status, count]) => ({ status, count }))
  }, [estadoFilter, filteredSchools, planoFilter, search, statusFilter, statusSeries])

  const periodLabel = period === 'mes' ? 'Este mês' : period === 'trimestre' ? 'Último trimestre' : 'Últimos 12 meses'
  const receitaSeries = monthly.map((item) => ({ label: fmtMes(item.mes), value: item.receita }))
  const regionSeries = regions.map((item) => ({ label: item.estado, value: item.count }))
  const topSchoolsSeries = [...filteredSchools].sort((a, b) => b.atletas - a.atletas).slice(0, 8).map((item) => ({ label: item.nome, value: item.atletas }))
  const statusSeriesItems = derivedStatus.map((item) => ({ label: statusLabel(item.status), value: item.count }))
  const ticketSeriesItems = ticketSeries.map((item) => ({ label: fmtMes(item.mes), value: item.ticket }))
  const churnSeriesItems = churnSeries.map((item) => ({ label: fmtMes(item.mes), value: item.percentual }))
  const activeFilterCount = [estadoFilter, planoFilter, statusFilter].filter((value) => value !== 'todos').length + (search ? 1 : 0)

  return (
    <div className="space-y-6">
      {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Não conseguimos carregar todos os dados dos relatórios agora. Você pode tentar novamente em instantes.</div> : null}

      <section className="overflow-hidden rounded-[28px] border border-indigo-300/40 bg-[linear-gradient(135deg,#1d4ed8_0%,#4f46e5_50%,#7c3aed_100%)] px-5 py-6 text-white shadow-[0_18px_50px_rgba(79,70,229,.25)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90"><span className="h-2 w-2 rounded-full bg-emerald-300" />Analytics executivo</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Relatórios do SuperAdmin</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-[15px]">Uma visão unificada de receita, performance das escolas, crescimento da base e saúde operacional da plataforma.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['mes', 'trimestre', 'ano'] as const).map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${period === item ? 'border-white/60 bg-white/20 text-white' : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}>{item === 'mes' ? 'Este mês' : item === 'trimestre' ? 'Último trimestre' : 'Este ano'}</button>)}
            <button type="button" onClick={() => exportCsv(filteredSchools)} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50">Exportar CSV</button>
          </div>
        </div>
      </section>

      <Card
        title="Filtros executivos"
        subtitle="Filtre por estado, plano, status e busca textual para refinar a leitura da carteira."
        action={activeFilterCount ? <button type="button" onClick={() => { setSearch(''); setEstadoFilter('todos'); setPlanoFilter('todos'); setStatusFilter('todos') }} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">Limpar filtros ({activeFilterCount})</button> : null}
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por escola ou estado" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400" />
          <select value={estadoFilter} onChange={(event) => setEstadoFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400"><option value="todos">Todos os estados</option>{estadosDisponiveis.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={planoFilter} onChange={(event) => setPlanoFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400"><option value="todos">Todos os planos</option>{planosDisponiveis.map((item) => <option key={item} value={item}>{planoLabel(item)}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400"><option value="todos">Todos os status</option>{statusDisponiveis.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR" value={fmtBRL(filteredKpis.mrr)} sub="Receita mensal recorrente estimada" accent="#4f46e5" />
        <KpiCard label="Escolas" value={filteredKpis.totalEscolas.toLocaleString('pt-BR')} sub={`${filteredKpis.escolasAtivas} escolas ativas no recorte`} accent="#10b981" />
        <KpiCard label="Atletas" value={filteredKpis.totalAtletas.toLocaleString('pt-BR')} sub={`${filteredKpis.escolasInadimplentes} com risco financeiro`} accent="#f59e0b" />
        <KpiCard label="Retenção" value={`${filteredKpis.retencao}%`} sub={`Ticket médio de ${fmtBRL(filteredKpis.ticket)}`} accent="#8b5cf6" />
      </div>

      <div className="overflow-x-auto"><div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{([
        { id: 'overview', label: 'Visão Geral' },
        { id: 'financeiro', label: 'Financeiro' },
        { id: 'escolas', label: 'Escolas' },
        { id: 'crescimento', label: 'Crescimento' },
      ] as const).map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{item.label}</button>)}</div></div>

      {tab === 'overview' ? <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Receita mensal" subtitle="Evolução da receita realizada nos últimos 12 meses"><Bars items={receitaSeries} formatter={fmtBRL} color="linear-gradient(90deg,#4f46e5,#818cf8)" emptyLabel="Sem receita registrada." /></Card>
        <Card title="Distribuição por plano" subtitle="Composição das escolas ativas por tipo de licenciamento"><Bars items={filteredPlanoDist.map((item) => ({ label: planoLabel(item.plano), value: item.count }))} color="linear-gradient(90deg,#4f46e5,#8b5cf6)" emptyLabel="Sem dados de planos disponíveis." /></Card>
        <Card title="Saúde da carteira" subtitle="Distribuição por status financeiro e operacional"><Bars items={statusSeriesItems} color="linear-gradient(90deg,#0ea5e9,#4f46e5)" emptyLabel="Sem dados de status disponíveis." /></Card>
        <Card title="Escolas por região" subtitle="Distribuição geográfica das escolas ativas"><Bars items={regionSeries} color="linear-gradient(90deg,#0ea5e9,#4f46e5)" emptyLabel="Sem distribuição regional disponível." /></Card>
      </div> : null}

      {tab === 'financeiro' ? <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Receita" value={fmtBRL(financialSummary.receita)} sub="Receita realizada no período" accent="#2563eb" />
          <KpiCard label="Despesa" value={fmtBRL(financialSummary.despesa)} sub="Despesa realizada no período" accent="#ef4444" />
          <KpiCard label="Resultado" value={fmtBRL(financialSummary.resultado)} sub="Receita menos despesa" accent={financialSummary.resultado >= 0 ? '#10b981' : '#ef4444'} />
          <KpiCard label="Margem" value={`${financialSummary.margem}%`} sub={`Recorte: ${periodLabel}`} accent="#8b5cf6" />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Fluxo de caixa" subtitle="Receitas e despesas por mês"><FinanceChart monthly={monthly} /></Card>
          <Card title="Evolução do ticket médio" subtitle="Proxy mensal da receita média por escola pagante atual"><Bars items={ticketSeriesItems} formatter={fmtBRL} color="linear-gradient(90deg,#8b5cf6,#4f46e5)" emptyLabel="Sem dados de ticket médio." /></Card>
        </div>
        <Card title="Detalhamento mensal" subtitle="Visão tabular da série financeira consolidada">
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500"><th className={tableHead}>Mês</th><th className={tableHead}>Receita</th><th className={tableHead}>Despesa</th><th className={tableHead}>Resultado</th><th className={tableHead}>Margem</th></tr></thead><tbody>
            {monthly.length ? monthly.map((item, index) => { const resultado = item.receita - item.despesa; const margem = item.receita > 0 ? Math.round((resultado / item.receita) * 100) : 0; return <tr key={item.mes} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}><td className="px-4 py-3 font-semibold text-slate-800">{fmtMes(item.mes)}</td><td className="px-4 py-3 font-semibold text-indigo-700">{fmtBRL(item.receita)}</td><td className="px-4 py-3 font-semibold text-rose-600">{fmtBRL(item.despesa)}</td><td className={`px-4 py-3 font-semibold ${resultado >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{fmtBRL(resultado)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${margem >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{margem}%</span></td></tr> }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum lançamento financeiro registrado.</td></tr>}
          </tbody></table></div>
        </Card>
      </div> : null}

      {tab === 'escolas' ? <div className="space-y-5">
        <Card title="Performance das escolas" subtitle="Base consolidada com ordenação operacional">
          <div className="mb-4 flex flex-wrap gap-2">{([
            { id: 'nome', label: 'Ordenar por nome' },
            { id: 'atletas', label: 'Ordenar por atletas' },
            { id: 'mensalidade', label: 'Ordenar por mensalidade' },
          ] as const).map((item) => <button key={item.id} type="button" onClick={() => { if (sortKey === item.id) setSortDir((current) => current === 'asc' ? 'desc' : 'asc'); else { setSortKey(item.id); setSortDir(item.id === 'nome' ? 'asc' : 'desc') } }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${sortKey === item.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label} {sortKey === item.id ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button>)}</div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500"><th className={tableHead}>Escola</th><th className={tableHead}>Plano</th><th className={tableHead}>Estado</th><th className={tableHead}>Atletas</th><th className={tableHead}>Mensalidade</th><th className={tableHead}>Status</th></tr></thead><tbody>
            {sortedSchools.length ? sortedSchools.map((escola, index) => <tr key={escola.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f46e5,#0ea5e9)] text-xs font-bold text-white">{escola.nome.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-slate-900">{escola.nome}</p><p className="text-xs text-slate-500">Vencimento: {escola.proximoVenc ?? 'não definido'}</p></div></div></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${planoStyles[escola.plano] ?? planoStyles.starter}`}>{planoLabel(escola.plano)}</span></td><td className="px-4 py-3 text-slate-600">{escola.estado ?? 'N/D'}</td><td className="px-4 py-3 font-semibold text-slate-900">{escola.atletas.toLocaleString('pt-BR')}</td><td className="px-4 py-3 font-semibold text-indigo-700">{fmtBRL(escola.mensalidade)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[escola.status] ?? statusStyles.inativa}`}>{statusLabel(escola.status)}</span></td></tr>) : <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma escola encontrada com esse filtro.</td></tr>}
          </tbody></table></div>
        </Card>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Top escolas por atletas" subtitle="As escolas com maior base ativa"><Bars items={topSchoolsSeries} color="linear-gradient(90deg,#4f46e5,#8b5cf6)" emptyLabel="Sem escolas no recorte atual." /></Card>
          <Card title="Mix de planos" subtitle="Leitura rápida da composição do portfólio"><Bars items={filteredPlanoDist.map((item) => ({ label: planoLabel(item.plano), value: item.count }))} color="linear-gradient(90deg,#10b981,#34d399)" emptyLabel="Sem composição de planos para esse recorte." /></Card>
        </div>
      </div> : null}

      {tab === 'crescimento' ? <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Crescimento acumulado" subtitle="Evolução da base de escolas ao longo do tempo"><Bars items={cohort.map((item) => ({ label: fmtMes(item.mes), value: item.acumulado }))} color="linear-gradient(90deg,#10b981,#34d399)" emptyLabel="Sem dados de crescimento disponíveis." /></Card>
          <Card title="Churn por coorte" subtitle="Proxy atual de desativação/cancelamento por mês de entrada"><Bars items={churnSeriesItems} formatter={(value) => `${value}%`} color="linear-gradient(90deg,#f59e0b,#ef4444)" emptyLabel="Sem dados de churn para mostrar." /></Card>
        </div>
        <Card title="Cohort por mês de cadastro" subtitle="Entradas mensais e composição de planos">
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500"><th className={tableHead}>Mês/Ano</th><th className={tableHead}>Novas escolas</th><th className={tableHead}>Acumulado</th><th className={tableHead}>Planos</th></tr></thead><tbody>
            {cohort.length ? cohort.map((item, index) => <tr key={item.mes} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}><td className="px-4 py-3 font-semibold text-slate-900">{fmtMes(item.mes)}</td><td className="px-4 py-3 font-semibold text-indigo-700">+{item.novas}</td><td className="px-4 py-3 font-semibold text-slate-900">{item.acumulado}</td><td className="px-4 py-3 text-slate-600">{item.planos || 'N/D'}</td></tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Sem dados de crescimento disponíveis.</td></tr>}
          </tbody></table></div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total de escolas" value={kpis.totalEscolas.toLocaleString('pt-BR')} sub="Base histórica consolidada" accent="#4f46e5" />
          <KpiCard label="Escolas ativas" value={kpis.escolasAtivas.toLocaleString('pt-BR')} sub="Operação ativa na plataforma" accent="#10b981" />
          <KpiCard label="Inadimplência" value={kpis.escolasInadimplentes.toLocaleString('pt-BR')} sub="Escolas em atraso ou inadimplência" accent="#ef4444" />
          <KpiCard label="Ticket médio" value={fmtBRL(kpis.ticket_medio)} sub="Receita média por escola adimplente" accent="#f59e0b" />
        </div>
      </div> : null}
    </div>
  )
}
