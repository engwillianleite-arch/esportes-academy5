'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  listarEscolas,
  criarEscola,
  atualizarEscola,
  toggleEscolaAtivo,
  type EscolaRow,
  type CriarEscolaInput,
} from '@/lib/escolas-actions'

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PLANOS = ['starter', 'pro', 'premium', 'enterprise'] as const
type Plano = (typeof PLANOS)[number]

const PLANO_LABEL: Record<Plano, string> = {
  starter:    'Starter',
  pro:        'Pro',
  premium:    'Premium',
  enterprise: 'Enterprise',
}

const PLANO_COLOR: Record<Plano, string> = {
  starter:    'bg-slate-100 text-slate-700',
  pro:        'bg-indigo-100 text-indigo-700',
  premium:    'bg-purple-100 text-purple-700',
  enterprise: 'bg-teal-100 text-teal-700',
}

const ASSINATURA_LABEL: Record<string, string> = {
  adimplente:  'â— Em dia',
  inadimplente:'â— Inadimplente',
  atraso:      'âš  Em atraso',
  suspenso:    'â—‹ Suspenso',
  cancelado:   'â—‹ Cancelado',
}

const ASSINATURA_COLOR: Record<string, string> = {
  adimplente:   'text-emerald-600',
  inadimplente: 'text-red-600',
  atraso:       'text-amber-600',
  suspenso:     'text-slate-500',
  cancelado:    'text-slate-400',
}

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'â€”'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-BR')
}

// â”€â”€â”€ Empty form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function emptyForm(): CriarEscolaInput & { capacidade_str: string; modalidades_str: string } {
  return {
    nome: '', cnpj: '', email: '', gerente_nome: '', gerente_cpf: '', telefone: '',
    cidade: '', estado: '', cep: '', bairro: '',
    logradouro: '', numero: '', complemento: '',
    plano: 'starter', ativo: true,
    modalidades: [], capacidade_padrao: undefined,
    capacidade_str: '', modalidades_str: '',
  }
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Form = ReturnType<typeof emptyForm>
type KpiData = { total: number; ativas: number; trial: number; inativas: number }

interface Props {
  initialRows: EscolaRow[]
  initialTotal: number
  initialKpi: KpiData
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function EscolasClient({ initialRows, initialTotal, initialKpi }: Props) {
  const [rows,  setRows]  = useState<EscolaRow[]>(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [kpi,   setKpi]   = useState<KpiData>(initialKpi)
  const [erro,  setErro]  = useState<string | null>(null)
  const [msg,   setMsg]   = useState<string | null>(null)
  const [isPending, startTx] = useTransition()

  // Filters
  const [search,     setSearch]     = useState('')
  const [filterPlano,setFilterPlano]= useState('todos')
  const [filterAtivo,setFilterAtivo]= useState('todos')

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRow,    setEditRow]    = useState<EscolaRow | null>(null)
  const [form,       setForm]       = useState<Form>(emptyForm())

  // View panel
  const [viewRow,    setViewRow]    = useState<EscolaRow | null>(null)
  const [viewTab,    setViewTab]    = useState<'geral' | 'assinatura'>('geral')

  // Confirm modal
  const [confirmId,   setConfirmId]   = useState<string | null>(null)
  const [confirmAtivo,setConfirmAtivo]= useState(false)

  // Reload
  const reload = useCallback(() => {
    startTx(async () => {
      const r = await listarEscolas({
        q:     search || undefined,
        plano: filterPlano !== 'todos' ? filterPlano : undefined,
        ativo: filterAtivo as 'todos' | 'ativo' | 'inativo',
        pageSize: 100,
      })
      if (r.error) { setErro(r.error); return }
      setRows(r.rows ?? [])
      setTotal(r.total ?? 0)
      if (r.kpi) setKpi(r.kpi)
    })
  }, [search, filterPlano, filterAtivo])

  useEffect(() => { reload() }, [reload])

  // â”€â”€ Drawer helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function openCreate() {
    setEditRow(null)
    setForm(emptyForm())
    setDrawerOpen(true)
  }

  function openEdit(row: EscolaRow) {
    setEditRow(row)
    setForm({
      nome:           row.nome,
      cnpj:           row.cnpj ?? '',
      email:          row.email ?? '',
      gerente_nome:   '',
      gerente_cpf:    '',
      telefone:       row.telefone ?? '',
      cidade:         row.cidade ?? '',
      estado:         row.estado ?? '',
      cep:            row.cep ?? '',
      bairro:         row.bairro ?? '',
      logradouro:     row.logradouro ?? '',
      numero:         row.numero ?? '',
      complemento:    row.complemento ?? '',
      plano:          row.plano as Plano,
      ativo:          row.ativo,
      modalidades:    row.modalidades ?? [],
      capacidade_padrao: row.capacidade_padrao ?? undefined,
      capacidade_str: row.capacidade_padrao ? String(row.capacidade_padrao) : '',
      modalidades_str:(row.modalidades ?? []).join(', '),
    })
    setViewRow(null)
    setDrawerOpen(true)
  }

  function f(key: keyof Form, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    if (!form.nome.trim()) { setErro('Nome da escola e obrigatorio.'); return }
    if (!editRow && !form.gerente_nome?.trim()) { setErro('Nome do gerente e obrigatorio.'); return }
    if (!editRow && !(form.gerente_cpf ?? '').trim()) { setErro('CPF do gerente e obrigatorio.'); return }
    setErro(null); setMsg(null)

    const modalidades = form.modalidades_str
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const capacidade_padrao = form.capacidade_str ? parseInt(form.capacidade_str, 10) : undefined

    startTx(async () => {
      const input: CriarEscolaInput = {
        nome: form.nome, cnpj: form.cnpj, email: form.email,
        gerente_nome: form.gerente_nome,
        gerente_cpf: form.gerente_cpf,
        telefone: form.telefone, cidade: form.cidade, estado: form.estado,
        cep: form.cep, bairro: form.bairro, logradouro: form.logradouro,
        numero: form.numero, complemento: form.complemento,
        plano: form.plano as Plano, ativo: form.ativo as boolean,
        modalidades, capacidade_padrao,
      }

      const r = editRow
        ? await atualizarEscola(editRow.id, input)
        : await criarEscola(input)

      if (r.error) { setErro(r.error); return }
      setMsg(editRow ? 'Escola atualizada com sucesso.' : 'Escola criada com sucesso. O convite de acesso foi enviado para o e-mail da escola.')
      setDrawerOpen(false)
      reload()
    })
  }

  // â”€â”€ Toggle status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function askToggle(id: string, currentAtivo: boolean) {
    setConfirmId(id)
    setConfirmAtivo(!currentAtivo)
  }

  function confirmToggle() {
    if (!confirmId) return
    startTx(async () => {
      const r = await toggleEscolaAtivo(confirmId, confirmAtivo)
      if (r.error) setErro(r.error)
      else {
        setMsg(confirmAtivo ? 'Escola ativada.' : 'Escola inativada.')
        if (viewRow?.id === confirmId) setViewRow(prev => prev ? { ...prev, ativo: confirmAtivo } : prev)
        reload()
      }
      setConfirmId(null)
    })
  }

  // â”€â”€ Busca CEP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function buscarCep() {
    const cep = form.cep?.replace(/\D/g, '')
    if (!cep || cep.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await res.json()
      if (d.erro) return
      setForm(prev => ({
        ...prev,
        logradouro: d.logradouro ?? prev.logradouro,
        bairro:     d.bairro     ?? prev.bairro,
        cidade:     d.localidade ?? prev.cidade,
        estado:     d.uf         ?? prev.estado,
      }))
    } catch { /* silent */ }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="mx-auto max-w-[1300px] space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* â”€â”€ Feedback â”€â”€ */}
      {erro && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>âš </span> {erro}
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setErro(null)}>âœ•</button>
        </div>
      )}
      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>âœ“</span> {msg}
          <button className="ml-auto text-emerald-400 hover:text-emerald-600" onClick={() => setMsg(null)}>âœ•</button>
        </div>
      )}

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Escolas</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Gerencie as escolas cadastradas na plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
        >
          ï¼‹ Nova Escola
        </button>
      </div>

      {/* â”€â”€ KPI Cards â”€â”€ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon="ðŸ«" label="Total de Escolas" value={kpi.total} bg="#dbeafe" />
        <KpiCard icon="âœ…" label="Ativas"            value={kpi.ativas}   bg="#d1fae5" />
        <KpiCard icon="â³" label="Em Trial"          value={kpi.trial}    bg="#fef3c7" />
        <KpiCard icon="ðŸ”´" label="Inativas"          value={kpi.inativas} bg="#fee2e2" />
      </div>

      {/* â”€â”€ Filters â”€â”€ */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <span className="text-[#94a3b8]">ðŸ”</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nome, CNPJ, e-mail, cidade..."
            className="w-full bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
        </div>
        <select value={filterPlano} onChange={e => setFilterPlano(e.target.value)}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
          <option value="todos">Todos os planos</option>
          {PLANOS.map(p => <option key={p} value={p}>{PLANO_LABEL[p]}</option>)}
        </select>
        <select value={filterAtivo} onChange={e => setFilterAtivo(e.target.value)}
          className="h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
          <option value="todos">Todos os status</option>
          <option value="ativo">SÃ³ ativas</option>
          <option value="inativo">SÃ³ inativas</option>
        </select>
        {isPending && <span className="text-xs text-[#94a3b8]">Carregando...</span>}
      </div>

      {/* â”€â”€ Table â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        {/* Table header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-[#0f172a]">Escolas Cadastradas</p>
            <p className="text-xs text-[#94a3b8]">Mostrando {rows.length} de {total} escola{total !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate}
            className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-xs font-semibold text-[#64748b] transition hover:bg-[#f8fafc]">
            ï¼‹ Nova Escola
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Escola</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Plano</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Atletas</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Assinatura</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">PrÃ³x. Venc.</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Criada em</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-[#94a3b8]">
                    <div className="text-4xl mb-3">ðŸ”</div>
                    Nenhuma escola encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : rows.map((r, idx) => (
                <tr
                  key={r.id}
                  onClick={() => { setViewRow(r); setViewTab('geral') }}
                  className={`cursor-pointer border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}
                >
                  {/* Escola */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5]/10 text-sm font-bold text-[#4f46e5]">
                        {r.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0f172a]">{r.nome}</p>
                        <p className="text-xs text-[#94a3b8]">{r.cidade ? `${r.cidade}${r.estado ? `, ${r.estado}` : ''}` : r.email ?? 'â€”'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Plano */}
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLANO_COLOR[r.plano as Plano] ?? 'bg-slate-100 text-slate-700'}`}>
                      {PLANO_LABEL[r.plano as Plano] ?? r.plano}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.ativo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {r.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  {/* Atletas */}
                  <td className="px-4 py-4 text-sm font-semibold text-[#0f172a]">
                    {r.total_atletas ?? 0}
                    {r.capacidade_padrao ? <span className="ml-1 text-[11px] text-[#94a3b8]">/ {r.capacidade_padrao}</span> : null}
                  </td>
                  {/* Assinatura */}
                  <td className={`px-4 py-4 text-xs font-medium ${ASSINATURA_COLOR[r.assinatura_status ?? ''] ?? 'text-[#94a3b8]'}`}>
                    {r.assinatura_status ? ASSINATURA_LABEL[r.assinatura_status] ?? r.assinatura_status : 'â€”'}
                  </td>
                  {/* PrÃ³x. vencimento */}
                  <td className="px-4 py-4 text-xs text-[#64748b]">{fmtDate(r.proximo_vencimento)}</td>
                  {/* Criada em */}
                  <td className="px-4 py-4 text-xs text-[#64748b]">{fmtDate(r.created_at)}</td>
                  {/* AÃ§Ãµes */}
                  <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <ActionBtn title="Visualizar" onClick={() => { setViewRow(r); setViewTab('geral') }}>ðŸ‘</ActionBtn>
                      <ActionBtn title="Editar" onClick={() => openEdit(r)}>âœï¸</ActionBtn>
                      <ActionBtn title={r.ativo ? 'Inativar' : 'Ativar'} danger={r.ativo} success={!r.ativo} onClick={() => askToggle(r.id, r.ativo)}>
                        {r.ativo ? 'ðŸ”´' : 'ðŸŸ¢'}
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â•â• VIEW PANEL â•â• */}
      {viewRow && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={() => setViewRow(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-[210] flex w-full max-w-[560px] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5]/10 text-xl font-bold text-[#4f46e5]">
                {viewRow.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#0f172a]">{viewRow.nome}</p>
                <p className="text-xs text-[#64748b]">
                  {viewRow.cidade ? `${viewRow.cidade}${viewRow.estado ? `, ${viewRow.estado}` : ''}` : 'Sem localizaÃ§Ã£o'}
                </p>
              </div>
              <button onClick={() => setViewRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] transition hover:border-red-300 hover:bg-red-50 hover:text-red-500">
                âœ•
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-shrink-0 border-b border-[#e2e8f0]">
              {(['geral', 'assinatura'] as const).map(tab => (
                <button key={tab} onClick={() => setViewTab(tab)}
                  className={`px-5 py-3 text-[13px] font-medium transition border-b-2 ${viewTab === tab ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>
                  {tab === 'geral' ? 'Dados Gerais' : 'Assinatura'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {viewTab === 'geral' && (
                <div className="space-y-5">
                  {/* Hero */}
                  <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] p-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#4f46e5]/10 text-3xl font-bold text-[#4f46e5]">
                      {viewRow.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[17px] font-bold text-[#0f172a]">{viewRow.nome}</p>
                      <p className="mt-1 text-xs text-[#64748b]">Desde {fmtDate(viewRow.created_at)}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLANO_COLOR[viewRow.plano as Plano] ?? 'bg-slate-100 text-slate-700'}`}>
                          {PLANO_LABEL[viewRow.plano as Plano] ?? viewRow.plano}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${viewRow.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${viewRow.ativo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {viewRow.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <InfoSection title="IdentificaÃ§Ã£o">
                    <InfoGrid>
                      <InfoItem label="CNPJ" value={viewRow.cnpj ?? 'â€”'} />
                      <InfoItem label="Atletas" value={`${viewRow.total_atletas ?? 0}${viewRow.capacidade_padrao ? ` / ${viewRow.capacidade_padrao}` : ''}`} />
                      <InfoItem label="Modalidades" value={(viewRow.modalidades ?? []).join(', ') || 'â€”'} full />
                    </InfoGrid>
                  </InfoSection>

                  <InfoSection title="Contato">
                    <InfoGrid>
                      <InfoItem label="E-mail" value={viewRow.email ?? 'â€”'} full />
                      <InfoItem label="Telefone" value={viewRow.telefone ?? 'â€”'} />
                    </InfoGrid>
                  </InfoSection>

                  <InfoSection title="EndereÃ§o">
                    <InfoGrid>
                      <InfoItem label="CEP" value={viewRow.cep ?? 'â€”'} />
                      <InfoItem label="Bairro" value={viewRow.bairro ?? 'â€”'} />
                      <InfoItem label="Logradouro" value={[viewRow.logradouro, viewRow.numero, viewRow.complemento].filter(Boolean).join(', ') || 'â€”'} full />
                      <InfoItem label="Cidade" value={viewRow.cidade ?? 'â€”'} />
                      <InfoItem label="Estado" value={viewRow.estado ?? 'â€”'} />
                    </InfoGrid>
                  </InfoSection>
                </div>
              )}

              {viewTab === 'assinatura' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#0369a1]">Status da Assinatura</p>
                    <p className={`text-[15px] font-bold ${ASSINATURA_COLOR[viewRow.assinatura_status ?? ''] ?? 'text-[#94a3b8]'}`}>
                      {viewRow.assinatura_status ? ASSINATURA_LABEL[viewRow.assinatura_status] ?? viewRow.assinatura_status : 'Sem assinatura registrada'}
                    </p>
                    {viewRow.proximo_vencimento && (
                      <p className="mt-1 text-xs text-[#64748b]">PrÃ³x. vencimento: {fmtDate(viewRow.proximo_vencimento)}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8]">Gerencie a assinatura na seÃ§Ã£o Fluxo de Caixa ou diretamente no Asaas.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 gap-3 border-t border-[#e2e8f0] px-5 py-4">
              <button onClick={() => setViewRow(null)}
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#64748b] transition hover:bg-[#f8fafc]">
                Fechar
              </button>
              <button onClick={() => { openEdit(viewRow) }}
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#64748b] transition hover:bg-[#f8fafc]">
                âœï¸ Editar
              </button>
              <button onClick={() => askToggle(viewRow.id, viewRow.ativo)}
                className={`ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${viewRow.ativo ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {viewRow.ativo ? 'ðŸ”´ Inativar' : 'ðŸŸ¢ Ativar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* â•â• DRAWER criar/editar â•â• */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-[210] flex w-full max-w-[560px] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#e2e8f0] px-5 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5]/10 text-xl">ðŸ«</div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#0f172a]">{editRow ? `Editar: ${editRow.nome}` : 'Nova Escola'}</p>
                <p className="text-xs text-[#64748b]">{editRow ? `ID: ${editRow.id}` : 'Preencha os dados da escola'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] transition hover:border-red-300 hover:bg-red-50 hover:text-red-500">
                âœ•
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {erro && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{erro}</div>
              )}

              {/* Dados bÃ¡sicos */}
              <FormSection icon="ðŸ«" title="Dados da Escola">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FLabel required>Nome da Escola</FLabel>
                    <input value={form.nome} onChange={e => f('nome', e.target.value)}
                      placeholder="Ex: Academia Futebol SP"
                      className={FInput} />
                  </div>
                  <div>
                    <FLabel>Plano</FLabel>
                    <select value={form.plano} onChange={e => f('plano', e.target.value)} className={FInput}>
                      {PLANOS.map(p => <option key={p} value={p}>{PLANO_LABEL[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <FLabel>Status</FLabel>
                    <select value={form.ativo ? 'ativo' : 'inativo'} onChange={e => f('ativo', e.target.value === 'ativo')} className={FInput}>
                      <option value="ativo">Ativa</option>
                      <option value="inativo">Inativa</option>
                    </select>
                  </div>
                  <div>
                    <FLabel>Modalidades <span className="ml-1 font-normal text-[#94a3b8]">(separe por vÃ­rgula)</span></FLabel>
                    <input value={form.modalidades_str} onChange={e => f('modalidades_str', e.target.value)}
                      placeholder="Futebol, NataÃ§Ã£o, JudÃ´"
                      className={FInput} />
                  </div>
                  <div>
                    <FLabel>Capacidade MÃ¡x.</FLabel>
                    <input type="number" value={form.capacidade_str} onChange={e => f('capacidade_str', e.target.value)}
                      placeholder="200"
                      className={FInput} />
                  </div>
                </div>
              </FormSection>

              {/* IdentificaÃ§Ã£o */}
              <FormSection icon="ðŸ“‹" title="IdentificaÃ§Ã£o">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FLabel>CNPJ / CPF</FLabel>
                    <input value={form.cnpj ?? ''} onChange={e => f('cnpj', e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className={FInput} />
                  </div>
                </div>
              </FormSection>

              {/* Contato */}
              <FormSection icon="ðŸ“ž" title="Contato">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FLabel required>E-mail</FLabel>
                    <input type="email" value={form.email ?? ''} onChange={e => f('email', e.target.value)}
                      placeholder="contato@escola.com.br"
                      className={FInput} />
                  </div>
                  <div>
                    <FLabel>Telefone</FLabel>
                    <input value={form.telefone ?? ''} onChange={e => f('telefone', e.target.value)}
                      placeholder="(11) 3456-7890"
                      className={FInput} />
                  </div>
                </div>
              </FormSection>

              {!editRow && (
                <FormSection icon="Ger" title="Gerente Inicial">
                  <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-xs text-[#1d4ed8]">
                    O e-mail da escola recebera o convite inicial. Essa pessoa entrara como gerente da unidade e podera finalizar as configuracoes no primeiro acesso.
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FLabel required>Nome do gerente</FLabel>
                      <input
                        value={form.gerente_nome ?? ''}
                        onChange={e => f('gerente_nome', e.target.value)}
                        placeholder="Ex: Mariana Souza"
                        className={FInput}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FLabel required>CPF do gerente</FLabel>
                      <input
                        value={form.gerente_cpf ?? ''}
                        onChange={e => f('gerente_cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        className={FInput}
                      />
                    </div>
                  </div>
                </FormSection>
              )}
              {/* Endereço */}
              <FormSection icon="ðŸ“" title="EndereÃ§o">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FLabel>CEP</FLabel>
                    <div className="flex gap-2">
                      <input value={form.cep ?? ''} onChange={e => f('cep', e.target.value)}
                        placeholder="00000-000"
                        className={FInput + ' flex-1'} />
                      <button type="button" onClick={buscarCep}
                        className="rounded-xl border border-[#e2e8f0] px-3 text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc]">
                        Buscar
                      </button>
                    </div>
                  </div>
                  <div>
                    <FLabel>Bairro</FLabel>
                    <input value={form.bairro ?? ''} onChange={e => f('bairro', e.target.value)}
                      placeholder="Bela Vista" className={FInput} />
                  </div>
                  <div>
                    <FLabel>Logradouro</FLabel>
                    <input value={form.logradouro ?? ''} onChange={e => f('logradouro', e.target.value)}
                      placeholder="Av. Paulista" className={FInput} />
                  </div>
                  <div>
                    <FLabel>NÃºmero</FLabel>
                    <input value={form.numero ?? ''} onChange={e => f('numero', e.target.value)}
                      placeholder="1500" className={FInput} />
                  </div>
                  <div>
                    <FLabel>Complemento</FLabel>
                    <input value={form.complemento ?? ''} onChange={e => f('complemento', e.target.value)}
                      placeholder="Sala 201" className={FInput} />
                  </div>
                  <div>
                    <FLabel>Cidade</FLabel>
                    <input value={form.cidade ?? ''} onChange={e => f('cidade', e.target.value)}
                      placeholder="SÃ£o Paulo" className={FInput} />
                  </div>
                  <div>
                    <FLabel>Estado</FLabel>
                    <select value={form.estado ?? ''} onChange={e => f('estado', e.target.value)} className={FInput}>
                      <option value="">â€” Selecione â€”</option>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </FormSection>
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 gap-3 border-t border-[#e2e8f0] px-5 py-4">
              <button onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b] transition hover:bg-[#f8fafc]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending}
                className="flex-1 rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-60">
                {isPending ? 'Salvando...' : editRow ? 'Salvar alteraÃ§Ãµes' : 'Criar escola'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* â•â• CONFIRM MODAL â•â• */}
      {confirmId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-2xl">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${confirmAtivo ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {confirmAtivo ? 'ðŸŸ¢' : 'ðŸ”´'}
            </div>
            <p className="text-center text-[16px] font-bold text-[#0f172a]">
              {confirmAtivo ? 'Ativar escola?' : 'Inativar escola?'}
            </p>
            <p className="mt-2 text-center text-sm text-[#64748b]">
              {confirmAtivo
                ? 'A escola terÃ¡ acesso restaurado Ã  plataforma.'
                : 'Esta aÃ§Ã£o irÃ¡ suspender o acesso da escola Ã  plataforma. VocÃª poderÃ¡ reativÃ¡-la a qualquer momento.'}
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]">
                Cancelar
              </button>
              <button onClick={confirmToggle} disabled={isPending}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${confirmAtivo ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {isPending ? 'Aguarde...' : confirmAtivo ? 'Ativar' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FInput = 'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10'

function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-[#0f172a]">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

function FormSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2 border-b border-[#f1f5f9] pb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef2ff] text-[14px]">{icon}</div>
        <p className="text-[13px] font-bold text-[#0f172a]">{title}</p>
      </div>
      {children}
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 border-b border-[#f1f5f9] pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">{title}</p>
      {children}
    </div>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function InfoItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[11px] text-[#94a3b8]">{label}</p>
      <p className="text-[13px] font-semibold text-[#0f172a]">{value || 'â€”'}</p>
    </div>
  )
}

function KpiCard({ icon, label, value, bg }: { icon: string; label: string; value: number; bg: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-[#94a3b8]">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-[#0f172a]">{value}</p>
      </div>
    </div>
  )
}

function ActionBtn({ title, onClick, danger, success, children }: {
  title: string; onClick: () => void
  danger?: boolean; success?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-sm transition
        ${danger  ? 'hover:border-red-200 hover:bg-red-50' : ''}
        ${success ? 'hover:border-emerald-200 hover:bg-emerald-50' : ''}
        ${!danger && !success ? 'hover:border-[#e2e8f0] hover:bg-[#f8fafc]' : ''}
      `}
    >
      {children}
    </button>
  )
}




