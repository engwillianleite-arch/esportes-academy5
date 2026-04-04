import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug, mockAthleteRegistrations } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function OrganizadorCompetitionAthletesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  const confirmed = mockAthleteRegistrations.filter((registration) => registration.status === 'confirmado').length
  const paymentPending = mockAthleteRegistrations.filter((registration) => registration.status === 'pagamento_pendente').length
  const docsPending = mockAthleteRegistrations.filter((registration) => registration.checklistStatus === 'documentos_pendentes').length

  return (
    <OrganizadorShell title={`${competition.title} • Atletas`} description="Mesa operacional do organizador para acompanhar atletas inscritos, filas de revisão, pagamentos pendentes e validações por clube.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#1f2937] bg-[linear-gradient(135deg,#071120_0%,#111827_45%,#0ea5e9_160%)] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Menu Atletas</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Governanca das inscricoes por atleta</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">Aqui o organizador enxerga a fila completa de atletas da competicao, com status financeiro, checklist documental e prontidao para subir na tabela oficial.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Ver times</Link>
              <Link href={`/clube/competicoes/${competition.slug}/inscricao`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#14532d]">Fluxo do clube</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroMetric label="Atletas mapeados" value={`${mockAthleteRegistrations.length}`} helper="Fila total da competicao" />
            <HeroMetric label="Confirmados" value={`${confirmed}`} helper="Prontos para subir" />
            <HeroMetric label="Pagamento pendente" value={`${paymentPending}`} helper="Dependem de cobranca" />
            <HeroMetric label="Docs pendentes" value={`${docsPending}`} helper="Precisam de revisao" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="rounded-[32px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Fila operacional</p>
                <h3 className="mt-2 text-2xl font-black">Atletas por status e checklist</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="Todos" active />
                <FilterChip label="Confirmados" />
                <FilterChip label="Pagamento" />
                <FilterChip label="Documentos" />
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.95fr_1fr_1fr] bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/54">
                <span>Atleta</span><span>Categoria</span><span>Status</span><span>Checklist</span><span>Acao</span>
              </div>
              {mockAthleteRegistrations.map((registration) => (
                <div key={registration.id} className="grid grid-cols-[1.2fr_0.8fr_0.95fr_1fr_1fr] items-center gap-3 border-t border-white/10 bg-white/5 px-4 py-4 text-sm">
                  <div>
                    <p className="font-semibold text-white">{registration.athleteName}</p>
                    <p className="mt-1 text-xs text-white/42">{registration.clubName} • {formatBRL(registration.amount)}</p>
                  </div>
                  <span className="text-white/72">{registration.category}</span>
                  <StatusPill status={registration.status} />
                  <ChecklistPill status={registration.checklistStatus} />
                  <div className="flex flex-wrap gap-2">
                    <ActionPill action={registration.confirmationAction} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-[#1f2937] bg-[#111827] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Ferramentas do organizador</p>
              <div className="mt-4 grid gap-3">
                <ToolLine title="Revisar documentos" body="Priorize atletas com checklist incompleto antes do chaveamento oficial." />
                <ToolLine title="Cobrar pendentes" body="Empurra a acao comercial para o clube ou para o atleta, conforme o modelo da competicao." />
                <ToolLine title="Confirmar na tabela" body="Atletas confirmados seguem aptos para compor listas, sumulas e jornada esportiva." />
              </div>
            </section>

            <section className="rounded-[32px] border border-[#1f2937] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Resumo da operacao</p>
              <div className="mt-4 space-y-3">
                <SummaryRow title="Atletas prontos" value={`${confirmed}`} />
                <SummaryRow title="Pagamento pendente" value={`${paymentPending}`} />
                <SummaryRow title="Documentos pendentes" value={`${docsPending}`} />
                <SummaryRow title="Repasse plataforma" value={`${competition.platformSharePct}%`} />
              </div>
            </section>

            <section className="rounded-[32px] border border-[#1f2937] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Atalhos</p>
              <div className="mt-4 grid gap-3">
                <QuickLink href={`/organizador/competicoes/${competition.slug}/times`} label="Abrir banco de times" />
                <QuickLink href={`/organizador/competicoes/${competition.slug}/times/link-inscricao`} label="Enviar link de inscricao" />
                <QuickLink href={`/organizador/competicoes/${competition.slug}/blog`} label="Blog da competicao" />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </OrganizadorShell>
  )
}

function HeroMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4"><p className="text-[11px] uppercase tracking-[0.14em] text-white/52">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p><p className="mt-1 text-xs text-white/60">{helper}</p></div>
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return <span className={active ? 'rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white' : 'rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/72'}>{label}</span>
}

function StatusPill({ status }: { status: 'pendente' | 'pagamento_pendente' | 'confirmado' }) {
  const classes = status === 'confirmado'
    ? 'bg-[#16a34a]/18 text-[#86efac] border-[#22c55e]/25'
    : status === 'pagamento_pendente'
      ? 'bg-[#f59e0b]/16 text-[#fde68a] border-[#f59e0b]/30'
      : 'bg-white/8 text-white/62 border-white/10'

  const label = status === 'confirmado' ? 'Confirmado' : status === 'pagamento_pendente' ? 'Pagamento pendente' : 'Pendente'
  return <span className={`inline-flex rounded-full border px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide ${classes}`}>{label}</span>
}

function ChecklistPill({ status }: { status: 'completo' | 'documentos_pendentes' | 'aguardando_pagamento' }) {
  const classes = status === 'completo'
    ? 'bg-[#dcfce7] text-[#166534]'
    : status === 'documentos_pendentes'
      ? 'bg-[#fee2e2] text-[#b91c1c]'
      : 'bg-[#fef3c7] text-[#a16207]'

  const label = status === 'completo' ? 'Completo' : status === 'documentos_pendentes' ? 'Documentos pendentes' : 'Aguardando pagamento'
  return <span className={`inline-flex rounded-full px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-wide ${classes}`}>{label}</span>
}

function ActionPill({ action }: { action: 'confirmar' | 'cobrar' | 'revisar' }) {
  const classes = action === 'confirmar'
    ? 'bg-[#14532d] text-white'
    : action === 'cobrar'
      ? 'border border-white/12 text-white/82'
      : 'border border-[#38bdf8]/30 text-[#7dd3fc]'

  const label = action === 'confirmar' ? 'Confirmar' : action === 'cobrar' ? 'Cobrar' : 'Revisar'
  return <span className={`rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>{label}</span>
}

function ToolLine({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm text-white/68">{body}</p></div>
}

function SummaryRow({ title, value }: { title: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"><span className="font-medium text-[#475569]">{title}</span><span className="font-semibold text-[#0f172a]">{value}</span></div>
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#334155]">{label}</Link>
}
