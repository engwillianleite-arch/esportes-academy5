import { notFound } from 'next/navigation'
import { ClubeShell } from '@/components/competicoes-portais/clube-shell'
import { getCompetitionBySlug, mockAthleteRegistrations } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function ClubeCompetitionRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <ClubeShell title={`Inscricao • ${competition.title}`} description="Mesa mockada de confirmacao da delegacao, com acoes operacionais por atleta e visao mais profissional de gestao.">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Mesa de confirmacao</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Aprovar atletas por status</h2>
            </div>
            <span className="rounded-full bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]">operacao mockada</span>
          </div>
          <div className="mt-6 overflow-hidden rounded-[28px] border border-[#e2e8f0]">
            <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] bg-[#f8fafc] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              <span>Atleta</span><span>Categoria</span><span>Status</span><span>Checklist</span><span>Acao</span>
            </div>
            {mockAthleteRegistrations.map((registration) => (
              <div key={registration.id} className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] items-center gap-3 border-t border-[#e2e8f0] bg-white px-4 py-4 text-sm">
                <div><p className="font-semibold text-[#0f172a]">{registration.athleteName}</p><p className="text-xs text-[#94a3b8]">{registration.amount === 0 ? 'Gratis' : formatBRL(registration.amount)}</p></div>
                <span className="text-[#475569]">{registration.category}</span>
                <span className={registration.status === 'confirmado' ? 'rounded-full bg-[#dcfce7] px-3 py-1 text-center text-xs font-semibold text-[#166534]' : registration.status === 'pagamento_pendente' ? 'rounded-full bg-[#fef3c7] px-3 py-1 text-center text-xs font-semibold text-[#a16207]' : 'rounded-full bg-[#e2e8f0] px-3 py-1 text-center text-xs font-semibold text-[#334155]'}>{registration.status}</span>
                <span className="text-[#475569]">{registration.checklistStatus}</span>
                <div className="flex flex-wrap gap-2"><span className={registration.confirmationAction === 'confirmar' ? 'rounded-full bg-[#14532d] px-3 py-2 text-xs font-semibold text-white' : 'rounded-full border border-[#cbd5e1] px-3 py-2 text-xs font-semibold text-[#334155]'}>{registration.confirmationAction === 'confirmar' ? 'Confirmar' : registration.confirmationAction === 'cobrar' ? 'Cobrar' : 'Revisar'}</span></div>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-6">
          <div className="rounded-[32px] border border-[#dcfce7] bg-[#14532d] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Ferramentas da mesa</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Confirmar inscricao" body="Quando pagamento e checklist estiverem completos." />
              <PillLine title="Cobrar atleta" body="Gera a proxima acao comercial antes da confirmacao." />
              <PillLine title="Revisar documentos" body="Mantem a fila operacional organizada por prioridade." />
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Resumo da rodada</p>
            <div className="mt-4 space-y-3">
              <SummaryRow title="Atletas prontos" value="1" />
              <SummaryRow title="Pagamento pendente" value="1" />
              <SummaryRow title="Documentos pendentes" value="1" />
              <SummaryRow title="Repasse plataforma" value={`${competition.platformSharePct}%`} />
            </div>
          </div>
        </aside>
      </div>
    </ClubeShell>
  )
}
function SummaryRow({ title, value }: { title: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"><span className="font-medium text-[#475569]">{title}</span><span className="font-semibold text-[#0f172a]">{value}</span></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
