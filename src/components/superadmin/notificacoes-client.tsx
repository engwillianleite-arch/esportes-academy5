'use client'

import { useMemo, useState } from 'react'
import type { SuperadminNotificationItem } from '@/lib/superadmin-notifications-actions'

type NotifType = 'critico' | 'aviso' | 'sucesso' | 'sistema' | 'relatorio'
type TimeGroup = 'hoje' | 'ontem' | 'semana'
type Filter = 'todas' | 'nao_lidas' | 'criticas' | 'avisos'
type ClearMode = 'read' | 'old' | 'all'
type DigestMode = 'tempo_real' | 'hourly' | 'daily'

type Preferences = {
  emailCritico: boolean
  resumoDiario: boolean
  alertasComerciais: boolean
  pushInterno: boolean
  digest: DigestMode
  dndStart: string
  dndEnd: string
  retention: string
}

const ITEMS: SuperadminNotificationItem[] = [
  { id: '1', title: 'Falha no webhook do Asaas', description: 'Tres tentativas consecutivas falharam no processamento do webhook financeiro da plataforma.', time: 'Hoje, 09:12', unread: true, type: 'critico', group: 'hoje', category: 'Financeiro', priority: 'Alta', actions: ['Reprocessar fila', 'Ver logs'] },
  { id: '2', title: 'Escola em risco de suspensao', description: 'A unidade Arena Norte entrou em atraso e precisa de acompanhamento do time financeiro interno.', time: 'Hoje, 08:41', unread: true, type: 'aviso', group: 'hoje', category: 'Escolas', priority: 'Alta', actions: ['Abrir escola', 'Notificar financeiro'] },
  { id: '3', title: 'Relatorio mensal consolidado disponivel', description: 'O relatorio executivo do mes foi processado com sucesso e esta pronto para exportacao.', time: 'Hoje, 07:30', unread: true, type: 'relatorio', group: 'hoje', category: 'Analytics', priority: 'Media', actions: ['Abrir relatorio', 'Baixar CSV'] },
  { id: '4', title: 'Novo Super Admin convidado', description: 'Um novo usuario interno foi convidado para atuar no modulo de suporte e permissoes.', time: 'Ontem, 18:25', unread: false, type: 'sistema', group: 'ontem', category: 'Sistema', priority: 'Media', actions: ['Ver usuario'] },
  { id: '5', title: 'Painel de cursos atualizado', description: 'O time concluiu a nova rodada visual do portal de cursos no ambiente administrativo.', time: 'Ontem, 10:11', unread: true, type: 'sucesso', group: 'ontem', category: 'Cursos', priority: 'Baixa', actions: ['Abrir cursos'] },
  { id: '6', title: 'Auditoria detectou alteracao em massa', description: 'Mudancas em permissoes de multiplos modulos foram registradas e precisam de revisao.', time: '3 dias atras', unread: true, type: 'critico', group: 'semana', category: 'Seguranca', priority: 'Alta', actions: ['Abrir auditoria'] },
]

const groupLabels: Record<TimeGroup, string> = { hoje: 'Hoje', ontem: 'Ontem', semana: 'Esta semana' }
const typeLabels: Record<NotifType, string> = { critico: 'Critico', aviso: 'Aviso', sucesso: 'Sucesso', sistema: 'Sistema', relatorio: 'Relatorio' }
const iconLabels: Record<NotifType, string> = { critico: 'CR', aviso: 'AV', sucesso: 'OK', sistema: 'SY', relatorio: 'RL' }
const toneLabels: Record<NotifType, string> = {
  critico: 'bg-red-100 text-red-700',
  aviso: 'bg-amber-100 text-amber-700',
  sucesso: 'bg-emerald-100 text-emerald-700',
  sistema: 'bg-slate-100 text-slate-700',
  relatorio: 'bg-teal-100 text-teal-700',
}

const defaultPreferences: Preferences = {
  emailCritico: true,
  resumoDiario: true,
  alertasComerciais: false,
  pushInterno: true,
  digest: 'tempo_real',
  dndStart: '22:00',
  dndEnd: '08:00',
  retention: '60 dias',
}

type NotificacoesClientProps = {
  initialItems?: SuperadminNotificationItem[]
  loadError?: string | null
}

export default function NotificacoesClient({ initialItems = ITEMS, loadError = null }: NotificacoesClientProps) {
  const [notifications, setNotifications] = useState(initialItems)
  const [filter, setFilter] = useState<Filter>('todas')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailId, setDetailId] = useState<string | null>(initialItems[0]?.id ?? null)
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearMode, setClearMode] = useState<ClearMode>('read')

  const counts = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((item) => item.unread).length,
    critico: notifications.filter((item) => item.type === 'critico').length,
    aviso: notifications.filter((item) => item.type === 'aviso').length,
  }), [notifications])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notifications.filter((item) => {
      const byFilter = filter === 'todas' || (filter === 'nao_lidas' && item.unread) || (filter === 'criticas' && item.type === 'critico') || (filter === 'avisos' && item.type === 'aviso')
      const bySearch = !term || item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
      return byFilter && bySearch
    })
  }, [filter, notifications, search])

  const grouped = useMemo(() => filtered.reduce<Record<TimeGroup, SuperadminNotificationItem[]>>((acc, item) => {
    acc[item.group].push(item)
    return acc
  }, { hoje: [], ontem: [], semana: [] }), [filtered])

  const detail = notifications.find((item) => item.id === detailId) ?? null

  function toggleSelect(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function markRead(id: string) {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))
  }

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
  }

  function deleteOne(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id))
    setSelectedIds((current) => current.filter((item) => item !== id))
    if (detailId === id) setDetailId(null)
  }

  function bulkMarkRead() {
    setNotifications((current) => current.map((item) => selectedIds.includes(item.id) ? { ...item, unread: false } : item))
    setSelectedIds([])
  }

  function bulkDelete() {
    setNotifications((current) => current.filter((item) => !selectedIds.includes(item.id)))
    if (detailId && selectedIds.includes(detailId)) setDetailId(null)
    setSelectedIds([])
  }

  function confirmClear() {
    setNotifications((current) => {
      if (clearMode === 'all') return []
      if (clearMode === 'read') return current.filter((item) => item.unread)
      return current.filter((item) => item.group !== 'semana')
    })
    setSelectedIds([])
    setDetailId(null)
    setClearOpen(false)
  }

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <div className="space-y-6">
        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {loadError}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-indigo-300/40 bg-[linear-gradient(135deg,#1d4ed8_0%,#4f46e5_55%,#7c3aed_100%)] px-5 py-6 text-white shadow-[0_18px_50px_rgba(79,70,229,.22)] sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">Centro de monitoramento</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Notificacoes do SuperAdmin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-[15px]">Consolide alertas criticos, avisos operacionais e eventos estrategicos da plataforma em um unico cockpit.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={markAllRead} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50">Marcar tudo como lido</button>
              <button type="button" onClick={() => setClearOpen(true)} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">Limpar fila</button>
              <button type="button" onClick={() => setPreferencesOpen(true)} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">Ajustar preferencias</button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi icon="NT" tone="bg-indigo-100 text-indigo-700" label="Total" value={counts.total} />
          <Kpi icon="NL" tone="bg-sky-100 text-sky-700" label="Nao lidas" value={counts.unread} />
          <Kpi icon="CR" tone="bg-red-100 text-red-700" label="Criticas" value={counts.critico} />
          <Kpi icon="AV" tone="bg-amber-100 text-amber-700" label="Avisos" value={counts.aviso} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: 'todas', label: 'Todas', count: counts.total },
                    { id: 'nao_lidas', label: 'Nao lidas', count: counts.unread },
                    { id: 'criticas', label: 'Criticas', count: counts.critico },
                    { id: 'avisos', label: 'Avisos', count: counts.aviso },
                  ] as const).map((item) => (
                    <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${filter === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {item.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === item.id ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>{item.count}</span>
                    </button>
                  ))}
                </div>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar notificacao" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 lg:max-w-[240px]" />
              </div>
            </section>

            {selectedIds.length > 0 ? <section className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-indigo-700">{selectedIds.length} notificacoes selecionadas</p><div className="flex gap-2"><button type="button" onClick={bulkMarkRead} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100">Marcar como lidas</button><button type="button" onClick={bulkDelete} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700">Excluir</button></div></section> : null}

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              {filtered.length > 0 ? <div className="space-y-5">{(['hoje', 'ontem', 'semana'] as TimeGroup[]).map((group) => grouped[group].length > 0 ? <div key={group}><div className="mb-3 flex items-center gap-3"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{groupLabels[group]}</span><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-semibold text-slate-400">{grouped[group].length}</span></div><div className="space-y-2">{grouped[group].map((item) => <article key={item.id} className={`flex gap-3 rounded-2xl border p-4 transition ${item.unread ? 'border-blue-200 bg-blue-50/70' : 'border-transparent bg-slate-50 hover:bg-slate-100'} ${detailId === item.id ? 'ring-2 ring-indigo-400' : ''}`} onClick={() => { setDetailId(item.id); if (item.unread) markRead(item.id) }}><button type="button" onClick={(event) => { event.stopPropagation(); toggleSelect(item.id) }} className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${selectedIds.includes(item.id) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>v</button><div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${toneLabels[item.type]}`}>{iconLabels[item.type]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className={`truncate text-sm ${item.unread ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'}`}>{item.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p></div><div className="flex flex-col items-end gap-2"><span className="text-xs text-slate-400">{item.time}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneLabels[item.type]}`}>{typeLabels[item.type]}</span></div></div><div className="mt-3 flex flex-wrap items-center gap-2">{item.unread ? <span className="text-[11px] font-bold text-indigo-600">Nao lida</span> : <span className="text-[11px] text-emerald-600">Lida</span>}<button type="button" onClick={(event) => { event.stopPropagation(); markRead(item.id) }} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100">Marcar lida</button><button type="button" onClick={(event) => { event.stopPropagation(); deleteOne(item.id) }} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50">Excluir</button></div></div></article>)}</div></div> : null)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center"><div className="text-4xl">0</div><h3 className="mt-3 text-sm font-bold text-slate-900">Nenhuma notificacao encontrada</h3><p className="mt-1 text-sm text-slate-500">Tente ajustar os filtros ou aguarde novas notificacoes.</p></div>}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-950">Resumo da fila</h2><p className="mt-1 text-xs text-slate-500">Panorama rapido das categorias monitoradas.</p><div className="mt-4 space-y-3">{[{ label: 'Criticas', value: counts.critico, cls: 'bg-red-500' }, { label: 'Avisos', value: counts.aviso, cls: 'bg-amber-500' }, { label: 'Nao lidas', value: counts.unread, cls: 'bg-indigo-500' }, { label: 'Total', value: counts.total, cls: 'bg-slate-500' }].map((item) => <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${item.cls}`} /><span className="text-sm text-slate-600">{item.label}</span></div><span className="text-sm font-bold text-slate-900">{item.value}</span></div>)}</div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-950">Preferencias rapidas</h2><p className="mt-1 text-xs text-slate-500">Controles operacionais para o portal mestre.</p></div><button type="button" onClick={() => setPreferencesOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">Editar</button></div><div className="mt-4 space-y-4"><Toggle label="Alertas criticos por e-mail" description="Receber incidentes e falhas sensiveis no canal interno." checked={preferences.emailCritico} onChange={(value) => updatePreference('emailCritico', value)} /><Toggle label="Resumo diario" description="Receber um digest com os principais eventos da plataforma." checked={preferences.resumoDiario} onChange={(value) => updatePreference('resumoDiario', value)} /><Toggle label="Alertas comerciais" description="Sinalizar inadimplencia, risco de churn e MRR." checked={preferences.alertasComerciais} onChange={(value) => updatePreference('alertasComerciais', value)} /></div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-950">Detalhes da notificacao</h2><p className="mt-1 text-xs text-slate-500">Selecione um item da lista para ver o contexto completo.</p>{detail ? <div className="mt-4 space-y-4"><div className="flex items-start gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[11px] font-bold ${toneLabels[detail.type]}`}>{iconLabels[detail.type]}</div><div className="min-w-0"><h3 className="text-sm font-bold text-slate-950">{detail.title}</h3><p className="mt-1 text-xs text-slate-500">{detail.time}</p></div></div><div className="flex flex-wrap gap-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneLabels[detail.type]}`}>{typeLabels[detail.type]}</span><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{detail.category}</span></div><div className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2"><Meta label="Data/Hora" value={detail.time} /><Meta label="Prioridade" value={detail.priority} /><Meta label="Categoria" value={detail.category} /><Meta label="Status" value={detail.unread ? 'Nao lida' : 'Lida'} /></div><p className="text-sm leading-6 text-slate-600">{detail.description}</p><div className="space-y-2"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Acoes sugeridas</p>{detail.actions.map((action) => <button key={action} type="button" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">{action}</button>)}</div></div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Nenhuma notificacao selecionada.</div>}</section>
          </aside>
        </div>
      </div>

      {preferencesOpen ? <ModalShell title="Configuracoes de notificacao" subtitle="Defina como e quando deseja ser notificado." onClose={() => setPreferencesOpen(false)}><div className="space-y-5"><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Frequencia do resumo</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[{ value: 'tempo_real', label: 'Tempo real' }, { value: 'hourly', label: 'Hourly digest' }, { value: 'daily', label: 'Daily digest' }].map((option) => <button key={option.value} type="button" onClick={() => updatePreference('digest', option.value as DigestMode)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${preferences.digest === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{option.label}</button>)}</div></div><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Horario de silencio</p><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><input type="time" value={preferences.dndStart} onChange={(event) => updatePreference('dndStart', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400" /><span className="text-center text-sm text-slate-400">ate</span><input type="time" value={preferences.dndEnd} onChange={(event) => updatePreference('dndEnd', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400" /></div></div><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Retencao do historico</p><select value={preferences.retention} onChange={(event) => updatePreference('retention', event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"><option>30 dias</option><option>60 dias</option><option>90 dias</option><option>1 ano</option></select></div><div className="grid gap-4"><Toggle label="Alertas criticos por e-mail" description="Escalar falhas e incidentes sensiveis para o time interno." checked={preferences.emailCritico} onChange={(value) => updatePreference('emailCritico', value)} /><Toggle label="Push interno no portal" description="Exibir alertas em tempo real no cockpit do SuperAdmin." checked={preferences.pushInterno} onChange={(value) => updatePreference('pushInterno', value)} /><Toggle label="Resumo diario" description="Enviar um digest com os principais eventos da operacao." checked={preferences.resumoDiario} onChange={(value) => updatePreference('resumoDiario', value)} /><Toggle label="Alertas comerciais" description="Sinalizar churn, inadimplencia e risco de cancelamento." checked={preferences.alertasComerciais} onChange={(value) => updatePreference('alertasComerciais', value)} /></div><div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPreferencesOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button><button type="button" onClick={() => setPreferencesOpen(false)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Salvar preferencias</button></div></div></ModalShell> : null}
      {clearOpen ? <ModalShell title="Limpar notificacoes" subtitle="Escolha quais notificacoes deseja remover permanentemente." onClose={() => setClearOpen(false)}><div className="space-y-3">{[{ value: 'read', label: 'Apenas as ja lidas' }, { value: 'old', label: 'Mais antigas que 30 dias' }, { value: 'all', label: 'Todas as notificacoes' }].map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><input type="radio" name="clearMode" checked={clearMode === option.value} onChange={() => setClearMode(option.value as ClearMode)} /><span className="text-sm font-medium text-slate-700">{option.label}</span></label>)}</div><div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setClearOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button><button type="button" onClick={confirmClear} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">Limpar notificacoes</button></div></ModalShell> : null}
    </>
  )
}

function Kpi({ icon, tone, label, value }: { icon: string; tone: string; label: string; value: number }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${tone}`}>{icon}</div><div><p className="text-xl font-extrabold text-slate-950">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div></div>
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative mt-1 h-6 w-11 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></button></div>
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>
}

function ModalShell({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-[560px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,.18)] sm:p-6" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50">x</button></div>{children}</div></div>
}
