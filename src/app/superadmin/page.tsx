import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

async function fetchStats() {
  const admin = createAdminClient()
  const [
    { count: totalEscolas },
    { count: escolasAtivas },
    { data: assinaturas },
    { count: usuariosInternos },
    { count: totalAtletas },
  ] = await Promise.all([
    admin.from('escolas').select('*', { head: true, count: 'exact' }).is('deleted_at', null),
    admin.from('escolas').select('*', { head: true, count: 'exact' }).eq('ativo', true).is('deleted_at', null),
    admin.from('assinaturas_plataforma').select('valor_mensal').is('deleted_at', null).eq('status', 'adimplente'),
    admin.from('plataforma_usuarios').select('*', { head: true, count: 'exact' }).eq('ativo', true).is('deleted_at', null),
    admin.from('atletas').select('*', { head: true, count: 'exact' }).is('deleted_at', null),
  ])

  const mrr = (assinaturas ?? []).reduce((acc, r) => acc + Number(r.valor_mensal ?? 0), 0)

  return {
    totalEscolas: totalEscolas ?? 0,
    escolasAtivas: escolasAtivas ?? 0,
    mrr,
    usuariosInternos: usuariosInternos ?? 0,
    totalAtletas: totalAtletas ?? 0,
  }
}

async function fetchAlerts() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('assinaturas_plataforma')
    .select('escola_id, status')
    .in('status', ['atraso', 'suspenso'])
    .is('deleted_at', null)
    .limit(10)

  if (!data || data.length === 0) return []

  const ids = data.map((r) => r.escola_id)
  const { data: escolas } = await admin.from('escolas').select('id, nome').in('id', ids)
  const map = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  return data.map((r) => ({ escolaNome: map.get(r.escola_id) ?? r.escola_id, status: r.status }))
}

async function fetchRecentAudit() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('auditoria_permissoes')
    .select('id, tipo, ator_email, modulo_slug, criado_em')
    .order('criado_em', { ascending: false })
    .limit(8)
  return data ?? []
}

const TIPO_BADGE: Record<string, { label: string; cls: string }> = {
  permissao_matriz: { label: 'Permissão', cls: 'bg-indigo-100 text-indigo-700' },
  modulo_escola:    { label: 'Módulo',    cls: 'bg-amber-100 text-amber-700' },
  plano_escola:     { label: 'Plano',     cls: 'bg-emerald-100 text-emerald-700' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default async function SuperAdminDashboardPage() {
  const [stats, alerts, audit] = await Promise.all([fetchStats(), fetchAlerts(), fetchRecentAudit()])

  const inativas = stats.totalEscolas - stats.escolasAtivas

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Visão geral da plataforma Esportes Academy</p>
        </div>
        <Link
          href="/superadmin/escolas"
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[#4f46e5] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]"
        >
          Ver escolas →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de Escolas"    value={stats.totalEscolas}         sub={`${stats.escolasAtivas} ativas · ${inativas} inativas`} accent="#4f46e5" />
        <StatCard label="MRR (Adimplentes)"   value={fmtBRL(stats.mrr)}          sub="Receita mensal recorrente"                              accent="#10b981" />
        <StatCard label="Total de Atletas"    value={stats.totalAtletas}         sub="Atletas ativos na plataforma"                           accent="#0ea5e9" />
        <StatCard label="Usuários Internos"   value={stats.usuariosInternos}     sub="Super Admin, Suporte, Financeiro"                       accent="#8b5cf6" />
      </div>

      {/* Two-column grid: Alerts + Recent Audit */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Alerts */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#0f172a]">Alertas de Cobrança</h2>
            <Link href="/superadmin/faturamento" className="text-xs font-medium text-[#4f46e5] hover:underline">
              Ver faturamento
            </Link>
          </div>
          <div className="divide-y divide-[#f1f5f9] px-5">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#64748b]">Nenhum alerta de cobrança ✓</p>
            ) : alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${a.status === 'atraso' ? 'bg-red-500' : 'bg-gray-400'}`} />
                <span className="flex-1 text-sm text-[#0f172a]">{a.escolaNome}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${a.status === 'atraso' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#0f172a]">Atividade Recente</h2>
            <Link href="/superadmin/auditoria" className="text-xs font-medium text-[#4f46e5] hover:underline">
              Ver auditoria
            </Link>
          </div>
          <div className="divide-y divide-[#f1f5f9] px-5">
            {audit.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#64748b]">Sem registros de auditoria.</p>
            ) : audit.map((a) => {
              const badge = TIPO_BADGE[a.tipo] ?? { label: a.tipo, cls: 'bg-slate-100 text-slate-600' }
              return (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="flex-1 truncate text-sm text-[#0f172a]">
                    {a.ator_email ?? '—'}
                    {a.modulo_slug && <span className="text-[#64748b]"> · {a.modulo_slug}</span>}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-[#94a3b8]">{fmtDate(a.criado_em)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[
          { label: 'Escolas',     href: '/superadmin/escolas',     icon: '🏫' },
          { label: 'Usuários',    href: '/superadmin/usuarios',    icon: '👥' },
          { label: 'Faturamento', href: '/superadmin/faturamento', icon: '💳' },
          { label: 'Permissões',  href: '/superadmin/permissoes',  icon: '🔐' },
          { label: 'Auditoria',   href: '/superadmin/auditoria',   icon: '📋' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white p-4 text-center transition hover:border-[#4f46e5]/40 hover:shadow-sm"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-semibold text-[#0f172a]">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub: string; accent: string
}) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-3 h-[3px] w-10 rounded-full" style={{ background: accent }} />
      <p className="text-sm text-[#64748b]">{label}</p>
      <p className="mt-1 text-[26px] font-bold leading-tight text-[#0f172a]">{value}</p>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  )
}
