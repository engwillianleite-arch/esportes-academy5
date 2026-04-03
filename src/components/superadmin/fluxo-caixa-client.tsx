'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  listarFluxoCaixa,
  criarLancamento,
  atualizarLancamento,
  deletarLancamento,
  marcarRealizado,
} from '@/lib/fluxo-caixa-actions'
import {
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  CATEGORIA_LABEL,
  FORMA_PAGAMENTO_LABEL,
  type LancamentoRow,
  type FluxoCaixaTipo,
  type FluxoCaixaCategoria,
  type FluxoCaixaStatus,
  type FluxoCaixaRecorrencia,
  type FormaPagamento,
  type KpiFluxo,
  type MonthlyAggregate,
  type CategoriaAggregate,
} from '@/lib/fluxo-caixa-constants'

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<FluxoCaixaStatus, { cls: string; label: string; dot: string }> = {
  realizado: { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Realizado' },
  previsto:  { cls: 'bg-sky-100 text-sky-700',         dot: 'bg-sky-500',     label: 'Previsto'  },
  cancelado: { cls: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-400',   label: 'Cancelado' },
}

const RECORRENCIA_LABEL: Record<FluxoCaixaRecorrencia, string> = {
  unico:      'Único',
  mensal:     'Mensal',
  trimestral: 'Trimestral',
  anual:      'Anual',
}

const PERIODOS = [
  { key: 'semana',   label: 'Semana'   },
  { key: 'mes',      label: 'Mês'      },
  { key: '3meses',   label: '3 meses'  },
  { key: 'semestre', label: 'Semestre' },
  { key: 'ano',      label: 'Ano'      },
  { key: 'custom',   label: '📅 Custom' },
]

function computeDateRange(period: string, customFrom: string, customTo: string) {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt  = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  if (period === 'semana') {
    const from = new Date(today); from.setDate(today.getDate() - 6)
    return { from: fmt(from), to: fmt(today) }
  }
  if (period === 'mes') {
    return { from: `${y}-${pad(m+1)}-01`, to: fmt(new Date(y, m+1, 0)) }
  }
  if (period === '3meses') {
    return { from: fmt(new Date(y, m-2, 1)), to: fmt(new Date(y, m+1, 0)) }
  }
  if (period === 'semestre') {
    return { from: fmt(new Date(y, m-5, 1)), to: fmt(new Date(y, m+1, 0)) }
  }
  if (period === 'ano') {
    return { from: `${y}-01-01`, to: `${y}-12-31` }
  }
  return { from: customFrom, to: customTo }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialRows:    LancamentoRow[]
  initialTotal:   number
  kpi:            KpiFluxo
  monthly:        MonthlyAggregate[]
  byCategoria:    { receitas: CategoriaAggregate[]; despesas: CategoriaAggregate[] }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FluxoCaixaClient({
  initialRows, initialTotal, kpi, monthly, byCategoria,
}: Props) {
  const [rows, setRows]         = useState<LancamentoRow[]>(initialRows)
  const [total, setTotal]       = useState(initialTotal)
  const [isPending, startTx]    = useTransition()
  const [erro, setErro]         = useState<string | null>(null)
  const [msg, setMsg]           = useState<string | null>(null)

  // Filters
  const [period, setPeriod]     = useState('mes')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterCat,  setFilterCat]  = useState<string>('todas')
  const [filterStat, setFilterStat] = useState<string>('todos')
  const [search, setSearch]         = useState('')

  // Drawer
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [editRow, setEditRow]             = useState<LancamentoRow | null>(null)
  const [drawerTipo, setDrawerTipo]       = useState<FluxoCaixaTipo | null>(null)
  const [fCategoria, setFCategoria]       = useState<FluxoCaixaCategoria>('mensalidade_escola')
  const [fDescricao, setFDescricao]       = useState('')
  const [fObservacao, setFObservacao]     = useState('')
  const [fValor, setFValor]               = useState('')
  const [fData, setFData]                 = useState(new Date().toISOString().slice(0, 10))
  const [fStatus, setFStatus]             = useState<FluxoCaixaStatus>('realizado')
  const [fForma, setFForma]               = useState<FormaPagamento>('manual')
  const [fRec, setFRec]                   = useState<FluxoCaixaRecorrencia>('unico')
  const [fParcelas, setFParcelas]         = useState<string>('')
  const [fPercentual, setFPercentual]     = useState('')
  const [fBaseCalculo, setFBaseCalculo]   = useState('')
  const [fEscolaNome, setFEscolaNome]     = useState('')

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Reload data when filters change
  const reload = useCallback(() => {
    const range = computeDateRange(period, customFrom, customTo)
    startTx(async () => {
      const r = await listarFluxoCaixa({
        tipo:        filterTipo !== 'todos'  ? filterTipo as FluxoCaixaTipo : undefined,
        categoria:   filterCat  !== 'todas' ? filterCat  as FluxoCaixaCategoria : undefined,
        status:      filterStat !== 'todos' ? filterStat as FluxoCaixaStatus : undefined,
        data_inicio: range.from || undefined,
        data_fim:    range.to   || undefined,
        q:           search     || undefined,
        pageSize:    200,
      })
      if (r.error) setErro(r.error)
      else { setRows(r.rows ?? []); setTotal(r.total ?? 0) }
    })
  }, [period, customFrom, customTo, filterTipo, filterCat, filterStat, search])

  useEffect(() => { reload() }, [reload])

  // ── Drawer helpers ──
  function openNew(tipo: FluxoCaixaTipo) {
    setEditRow(null)
    setDrawerTipo(tipo)
    setFCategoria(tipo === 'receita' ? 'mensalidade_escola' : 'payroll')
    setFDescricao(''); setFObservacao(''); setFValor(''); setFEscolaNome('')
    setFData(new Date().toISOString().slice(0, 10))
    setFStatus('realizado'); setFForma('manual'); setFRec('unico'); setFParcelas('')
    setFPercentual(''); setFBaseCalculo('')
    setDrawerOpen(true)
  }

  function openEdit(row: LancamentoRow) {
    setEditRow(row)
    setDrawerTipo(row.tipo)
    setFCategoria(row.categoria)
    setFDescricao(row.descricao)
    setFObservacao(row.observacao ?? '')
    setFValor(String(row.valor))
    setFData(row.data_lancamento)
    setFStatus(row.status)
    setFForma(row.forma_pagamento)
    setFRec(row.recorrencia)
    setFPercentual(row.percentual ? String(row.percentual) : '')
    setFBaseCalculo(row.base_calculo ? String(row.base_calculo) : '')
    setFEscolaNome(row.escola_nome_cache ?? '')
    setDrawerOpen(true)
  }

  async function handleSave() {
    if (!drawerTipo) return
    setErro(null); setMsg(null)
    const valor = parseFloat(fValor.replace(',', '.'))
    if (!fDescricao.trim() || isNaN(valor) || valor <= 0) {
      setErro('Preencha descrição e valor válido.')
      return
    }
    startTx(async () => {
      const input = {
        tipo: drawerTipo,
        categoria: fCategoria,
        descricao: fDescricao,
        observacao: fObservacao,
        valor,
        data_lancamento: fData,
        status: fStatus,
        forma_pagamento: fForma,
        recorrencia: fRec,
        parcelas: fParcelas ? parseInt(fParcelas, 10) : undefined,
        percentual: fPercentual ? parseFloat(fPercentual) : undefined,
        base_calculo: fBaseCalculo ? parseFloat(fBaseCalculo) : undefined,
      }
      const r = editRow
        ? await atualizarLancamento(editRow.id, input)
        : await criarLancamento(input)
      if (r.error) { setErro(r.error) }
      else {
        setMsg(editRow ? 'Lançamento atualizado.' : 'Lançamento criado.')
        setDrawerOpen(false)
        reload()
      }
    })
  }

  async function handleDelete(id: string) {
    setErro(null)
    startTx(async () => {
      const r = await deletarLancamento(id)
      if (r.error) setErro(r.error)
      else { setMsg('Lançamento removido.'); setDeleteId(null); reload() }
    })
  }

  async function handleRealizado(id: string) {
    startTx(async () => {
      const r = await marcarRealizado(id)
      if (r.error) setErro(r.error)
      else { setMsg('Marcado como realizado.'); reload() }
    })
  }

  // ── Summary calculations ──
  const realizadas = rows.filter(r => r.status === 'realizado')
  const entradas   = realizadas.filter(r => r.tipo === 'receita').reduce((s, r) => s + r.valor, 0)
  const saidas     = realizadas.filter(r => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0)
  const saldo      = entradas - saidas
  const previstos  = rows.filter(r => r.status === 'previsto').reduce((s, r) =>
    s + (r.tipo === 'receita' ? r.valor : -r.valor), 0)

  const categorias = drawerTipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">💸 Fluxo de Caixa</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Gestão financeira interna da plataforma</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openNew('despesa')}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            + Despesa
          </button>
          <button
            onClick={() => openNew('receita')}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#4f46e5] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]"
          >
            + Receita
          </button>
        </div>
      </div>

      {/* Feedback */}
      {(erro || msg) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {erro ?? msg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Saldo Atual"     value={fmtBRL(kpi.saldo_atual)}     accent="#4f46e5" icon="🏦" />
        <KpiCard label="Entradas (mês)"  value={fmtBRL(kpi.entradas_mes)}    accent="#10b981" icon="📥" />
        <KpiCard label="Saídas (mês)"    value={fmtBRL(kpi.saidas_mes)}      accent="#ef4444" icon="📤" />
        <KpiCard label="Saldo Projetado" value={fmtBRL(kpi.saldo_projetado)} accent="#8b5cf6" icon="🔮" />
        <KpiCard label="MRR Assinaturas" value={fmtBRL(kpi.mrr)}             accent="#0ea5e9" icon="📈" />
      </div>

      {/* MRR banner */}
      <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-sky-900 px-6 py-4">
        <span className="text-3xl">📈</span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">MRR — Receita Mensal Recorrente</p>
          <p className="text-[28px] font-black text-white leading-tight">{fmtBRL(kpi.mrr)}</p>
          <p className="mt-0.5 text-xs text-white/50">ARR Projetado: {fmtBRL(kpi.mrr * 12)}</p>
        </div>
        <div className="hidden flex-col items-end gap-1 text-right sm:flex">
          <p className="text-[11px] text-white/50">Saldo Realizado (período)</p>
          <p className="text-lg font-bold text-white">{fmtBRL(entradas - saidas)}</p>
          <p className="text-[11px] text-white/50">Previstos: {fmtBRL(previstos)}</p>
        </div>
      </div>

      {/* Period chips */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODOS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              period === p.key
                ? 'border-[#4f46e5] bg-[#4f46e5] text-white'
                : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#4f46e5] hover:text-[#4f46e5]'
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="h-8 rounded-lg border border-[#e2e8f0] px-2 text-xs" />
            <span className="text-xs text-[#94a3b8]">até</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="h-8 rounded-lg border border-[#e2e8f0] px-2 text-xs" />
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <span className="text-[13px] text-[#94a3b8]">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar descrição, escola..."
            className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
          <option value="todos">Todos os tipos</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
          <option value="todas">Todas as categorias</option>
          {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={filterStat} onChange={e => setFilterStat(e.target.value)}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
          <option value="todos">Todos os status</option>
          <option value="realizado">Realizado</option>
          <option value="previsto">Previsto</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <span className="text-xs text-[#94a3b8]">{total} lançamento{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Distribuição por categoria */}
      {(byCategoria.receitas.length > 0 || byCategoria.despesas.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CatCard title="Receitas por categoria" items={byCategoria.receitas} color="#10b981" />
          <CatCard title="Despesas por categoria" items={byCategoria.despesas} color="#ef4444" />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-[#0f172a]">Lançamentos</p>
            <p className="text-xs text-[#94a3b8]">
              Entradas: <strong className="text-emerald-600">{fmtBRL(entradas)}</strong>
              {' · '}Saídas: <strong className="text-red-500">{fmtBRL(saidas)}</strong>
              {' · '}Saldo: <strong className={saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}>{fmtBRL(saldo)}</strong>
            </p>
          </div>
          <span className="rounded-full bg-[#4f46e5]/10 px-3 py-1 text-xs font-bold text-[#4f46e5]">{rows.length}</span>
        </div>

        {rows.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 text-sm font-semibold text-[#64748b]">Nenhum lançamento encontrado</p>
            <p className="text-xs text-[#94a3b8]">Ajuste os filtros ou adicione um novo lançamento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Data</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Descrição</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] md:table-cell">Escola / Fonte</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Categoria</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Tipo</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">Valor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const s = STATUS_STYLE[r.status]
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'} ${r.status === 'cancelado' ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-3 text-xs text-[#94a3b8] whitespace-nowrap">{fmtDate(r.data_lancamento)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#0f172a]">{r.descricao}</p>
                        {r.observacao && <p className="text-[11px] text-[#94a3b8]">{r.observacao}</p>}
                        {r.recorrencia !== 'unico' && (
                          <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-px text-[10px] font-semibold text-[#4f46e5]">
                            🔄 {RECORRENCIA_LABEL[r.recorrencia]}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-5 py-3 text-xs text-[#64748b] md:table-cell">
                        {r.escola_nome_cache ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-[#4f46e5]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4f46e5]">
                          {CATEGORIA_LABEL[r.categoria]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {r.tipo === 'receita' ? '▲' : '▼'} {r.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${r.tipo === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {r.tipo === 'despesa' ? '− ' : '+ '}{fmtBRL(r.valor)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'previsto' && (
                            <button
                              onClick={() => handleRealizado(r.id)}
                              disabled={isPending}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                              title="Marcar como realizado"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded-lg bg-[#4f46e5]/10 px-2 py-1 text-[11px] font-semibold text-[#4f46e5] transition hover:bg-[#4f46e5] hover:text-white"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-3">
        <SumItem dot="bg-emerald-500" label="Receitas realizadas" value={fmtBRL(entradas)} cls="text-emerald-700" />
        <SumItem dot="bg-red-500"     label="Despesas realizadas" value={fmtBRL(saidas)}   cls="text-red-600"    />
        <SumItem dot="bg-[#4f46e5]"   label="Saldo do período"    value={fmtBRL(saldo)}    cls={saldo >= 0 ? 'text-emerald-700' : 'text-red-600'} />
        <SumItem dot="bg-sky-500"     label="Previstos"           value={fmtBRL(Math.abs(previstos))} cls="text-sky-700" />
      </div>

      {/* ── DRAWER ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
              <p className="text-[16px] font-bold text-[#0f172a]">
                {editRow ? 'Editar Lançamento' : drawerTipo === 'receita' ? '+ Nova Receita' : '+ Nova Despesa'}
              </p>
              <button onClick={() => setDrawerOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Tipo pills (only for new) */}
              {!editRow && (
                <div className="grid grid-cols-2 gap-3">
                  {(['receita', 'despesa'] as FluxoCaixaTipo[]).map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        setDrawerTipo(t)
                        setFCategoria(t === 'receita' ? 'mensalidade_escola' : 'payroll')
                      }}
                      className={`rounded-2xl border-2 py-4 text-center transition ${
                        drawerTipo === t
                          ? t === 'receita'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-red-400 bg-red-50'
                          : 'border-[#e2e8f0] hover:border-[#4f46e5]'
                      }`}
                    >
                      <div className="text-2xl">{t === 'receita' ? '💰' : '💸'}</div>
                      <div className="mt-1 text-sm font-bold text-[#0f172a] capitalize">{t === 'receita' ? 'Receita' : 'Despesa'}</div>
                      <div className="text-[11px] text-[#94a3b8]">{t === 'receita' ? 'Assinatura, % vendas, setup' : 'Infra, payroll, marketing'}</div>
                    </button>
                  ))}
                </div>
              )}

              {drawerTipo && (
                <>
                  <Field label="Categoria">
                    <select value={fCategoria} onChange={e => setFCategoria(e.target.value as FluxoCaixaCategoria)}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm">
                      {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Descrição">
                    <input value={fDescricao} onChange={e => setFDescricao(e.target.value)}
                      placeholder="Ex: Mensalidade escola ABC — Abril/2026"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                  </Field>

                  {drawerTipo === 'receita' && (
                    <Field label="Escola / Fonte (opcional)">
                      <input value={fEscolaNome} onChange={e => setFEscolaNome(e.target.value)}
                        placeholder="Ex: Academia Curitiba"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                    </Field>
                  )}

                  {fCategoria === 'percentual_vendas' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Percentual (%)">
                        <input value={fPercentual} onChange={e => setFPercentual(e.target.value)}
                          type="number" step="0.01" min="0" max="100" placeholder="Ex: 10"
                          className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                      </Field>
                      <Field label="Base de Cálculo (R$)">
                        <input value={fBaseCalculo} onChange={e => setFBaseCalculo(e.target.value)}
                          type="number" step="0.01" min="0" placeholder="Valor base"
                          className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                      </Field>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Valor (R$)">
                      <input value={fValor} onChange={e => setFValor(e.target.value)}
                        type="number" step="0.01" min="0" placeholder="0,00"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                    </Field>
                    <Field label="Data">
                      <input value={fData} onChange={e => setFData(e.target.value)} type="date"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                    </Field>
                  </div>

                  <Field label="Forma de Pagamento">
                    <select value={fForma} onChange={e => setFForma(e.target.value as FormaPagamento)}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm">
                      {(Object.entries(FORMA_PAGAMENTO_LABEL) as [FormaPagamento, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Status">
                    <div className="grid grid-cols-2 gap-2">
                      {(['realizado', 'previsto'] as FluxoCaixaStatus[]).map(s => (
                        <button key={s} onClick={() => setFStatus(s)}
                          className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                            fStatus === s
                              ? s === 'realizado' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-[#e2e8f0] text-[#64748b]'
                          }`}>
                          {s === 'realizado' ? '✓ Realizado' : '⏳ Previsto'}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {!editRow && (
                    <Field label="Recorrência">
                      <div className="grid grid-cols-4 gap-2">
                        {(['unico', 'mensal', 'trimestral', 'anual'] as FluxoCaixaRecorrencia[]).map(r => (
                          <button key={r} onClick={() => {
                            setFRec(r)
                            // reset parcelas ao padrão ao trocar tipo
                            setFParcelas(r === 'unico' ? '' : r === 'mensal' ? '12' : r === 'trimestral' ? '4' : '3')
                          }}
                            className={`rounded-xl border-2 py-2 text-[11px] font-semibold transition ${
                              fRec === r ? 'border-[#4f46e5] bg-[#4f46e5]/10 text-[#4f46e5]' : 'border-[#e2e8f0] text-[#64748b]'
                            }`}>
                            {RECORRENCIA_LABEL[r]}
                          </button>
                        ))}
                      </div>
                      {fRec !== 'unico' && (
                        <div className="mt-3 flex items-center gap-3">
                          <label className="text-[12px] font-medium text-[#475569] whitespace-nowrap">
                            Nº de parcelas
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={fParcelas}
                            onChange={e => setFParcelas(e.target.value)}
                            className="w-20 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-center text-sm font-semibold"
                          />
                          <p className="text-[11px] text-[#94a3b8]">
                            {fParcelas
                              ? `${fParcelas} ${fRec === 'mensal' ? 'meses' : fRec === 'trimestral' ? 'trimestres' : 'anos'}`
                              : `padrão: ${fRec === 'mensal' ? '12 meses' : fRec === 'trimestral' ? '4 trimestres' : '3 anos'}`
                            }
                          </p>
                        </div>
                      )}
                    </Field>
                  )}

                  <Field label="Observação (opcional)">
                    <textarea value={fObservacao} onChange={e => setFObservacao(e.target.value)}
                      rows={2} placeholder="Notas adicionais..."
                      className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm" />
                  </Field>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-[#f1f5f9] px-5 py-4">
              <button onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending || !drawerTipo}
                className="flex-[2] rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50">
                {isPending ? 'Salvando...' : editRow ? 'Salvar Alterações' : 'Salvar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl bg-white p-7 shadow-2xl" style={{ maxWidth: 380, width: '90%' }}>
            <p className="text-center text-4xl">🗑️</p>
            <p className="mt-3 text-center text-[16px] font-bold text-[#0f172a]">Remover lançamento?</p>
            <p className="mt-1 text-center text-sm text-[#64748b]">Esta ação é irreversível. O registro será arquivado.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div className="h-[3px] flex-1 rounded-full" style={{ background: accent }} />
      </div>
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="mt-0.5 text-[18px] font-bold text-[#0f172a]">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">{label}</label>
      {children}
    </div>
  )
}

function SumItem({ dot, label, value, cls }: { dot: string; label: string; value: string; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-xs text-[#64748b]">{label}:</span>
      <span className={`text-sm font-bold ${cls}`}>{value}</span>
    </div>
  )
}

function CatCard({ title, items, color }: { title: string; items: CategoriaAggregate[]; color: string }) {
  const total = items.reduce((s, i) => s + i.valor, 0)
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-[#0f172a]">{title}</p>
      {items.length === 0
        ? <p className="text-xs text-[#94a3b8]">Sem dados no período</p>
        : items.slice(0, 6).map(item => {
            const pct = total > 0 ? (item.valor / total) * 100 : 0
            return (
              <div key={item.categoria} className="mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748b]">{CATEGORIA_LABEL[item.categoria]}</span>
                  <span className="font-semibold text-[#0f172a]">{fmtBRL(item.valor)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })
      }
    </div>
  )
}
