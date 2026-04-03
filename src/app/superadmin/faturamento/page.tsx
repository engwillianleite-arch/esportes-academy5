import Link from 'next/link'
import { listarAssinaturasPlataforma } from '@/lib/superadmin-actions'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR')

const STATUS_STYLE: Record<string, { cls: string; dot: string; label: string }> = {
  adimplente: { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Adimplente' },
  atraso:     { cls: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     label: 'Em atraso'  },
  suspenso:   { cls: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    label: 'Suspenso'   },
}

export default async function SuperadminFaturamentoPage() {
  const result = await listarAssinaturasPlataforma()
  const rows = result.rows ?? []

  const mrr         = rows.reduce((s, r) => s + r.valor_mensal, 0)
  const adimplentes = rows.filter((r) => r.status === 'adimplente')
  const emAtraso    = rows.filter((r) => r.status === 'atraso')
  const suspensos   = rows.filter((r) => r.status === 'suspenso')
  const mrrRealizado = adimplentes.reduce((s, r) => s + r.valor_mensal, 0)

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Faturamento</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Assinaturas e receita da plataforma</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-3 h-[3px] w-10 rounded-full bg-[#4f46e5]" />
          <p className="text-sm text-[#64748b]">MRR Total</p>
          <p className="mt-1 text-[24px] font-bold text-[#0f172a]">{fmtBRL(mrr)}</p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">{rows.length} assinatura{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-3 h-[3px] w-10 rounded-full bg-[#10b981]" />
          <p className="text-sm text-[#64748b]">Receita Realizada</p>
          <p className="mt-1 text-[24px] font-bold text-[#0f172a]">{fmtBRL(mrrRealizado)}</p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">{adimplentes.length} adimplentes</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-3 h-[3px] w-10 rounded-full bg-[#ef4444]" />
          <p className="text-sm text-[#64748b]">Em Atraso</p>
          <p className="mt-1 text-[24px] font-bold text-[#0f172a]">{emAtraso.length}</p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">
            {fmtBRL(emAtraso.reduce((s, r) => s + r.valor_mensal, 0))} em risco
          </p>
        </div>
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <div className="mb-3 h-[3px] w-10 rounded-full bg-[#94a3b8]" />
          <p className="text-sm text-[#64748b]">Suspensos</p>
          <p className="mt-1 text-[24px] font-bold text-[#0f172a]">{suspensos.length}</p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">
            {fmtBRL(suspensos.reduce((s, r) => s + r.valor_mensal, 0))} suspenso
          </p>
        </div>
      </div>

      {result.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Escola</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Valor Mensal</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Vencimento</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">Próx. Venc.</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#94a3b8]">
                  Nenhum registro de assinatura encontrado.
                </td>
              </tr>
            ) : rows.map((r, idx) => {
              const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.adimplente
              return (
                <tr
                  key={r.id}
                  className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#0f172a]">{r.escola_nome}</p>
                    {r.referencia_externa && (
                      <p className="text-xs text-[#94a3b8]">{r.referencia_externa}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#0f172a]">
                    {fmtBRL(r.valor_mensal)}
                  </td>
                  <td className="px-5 py-4 text-[#64748b]">
                    Dia {r.dia_vencimento}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#64748b]">
                    {r.proximo_vencimento ? fmtDate(r.proximo_vencimento) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/superadmin/escolas/${r.escola_id}`}
                      className="rounded-lg bg-[#4f46e5]/10 px-3 py-1.5 text-xs font-semibold text-[#4f46e5] transition hover:bg-[#4f46e5] hover:text-white"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
