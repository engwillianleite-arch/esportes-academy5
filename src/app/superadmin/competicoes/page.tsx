import Link from 'next/link'
import { competitionSuperAdminHighlights, mockCompetitions, mockOrganizers } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function SuperAdminCompeticoesPage() {
  const featuredCompetition = mockCompetitions[0]

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <section className="rounded-[32px] border border-[#bae6fd] bg-[linear-gradient(135deg,#082f49_0%,#0f172a_38%,#0ea5e9_140%)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Sistema de Competicoes</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Governanca central da operacao competitiva</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/76">
              Mock do sistema competitivo da Esportes Academy com referencia visual em plataformas de competicao modernas. O SuperAdmin
              controla mensalidade dos organizadores, percentual da plataforma, saude financeira e governanca de portais independentes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/organizador" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">Abrir portal do organizador</Link>
            <Link href="/clube" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Abrir portal do clube</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {competitionSuperAdminHighlights.map((item) => (
          <div key={item.title} className="rounded-[28px] border border-[#dbeafe] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#64748b]">{item.title}</p>
            <p className="mt-2 text-3xl font-black text-[#0f172a]">{item.value}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-[#dbeafe] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Comercial da plataforma</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Split padrao e politicas de cobranca</h2>
            </div>
            <div className="rounded-full bg-[#e0f2fe] px-4 py-2 text-sm font-semibold text-[#0369a1]">CPF unico continua obrigatorio</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric title="Mensalidade do organizador" value={formatBRL(399)} helper="Faixa inicial do MVP" />
            <Metric title="% padrao da plataforma" value="12%" helper="Aplicado em toda transacao competitiva" />
            <Metric title="Cobranca permitida" value="Clube ou atleta" helper="Definida pelo organizador em cada competicao" />
          </div>
          <div className="mt-6 rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
            <p className="text-sm font-semibold text-[#0f172a]">Competicao em destaque</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-[#0f172a]">{featuredCompetition.title}</h3>
                <p className="mt-1 text-sm text-[#64748b]">{featuredCompetition.pricingModel} • {featuredCompetition.chargeMode} • {featuredCompetition.disputeType}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                <p className="font-semibold text-[#0f172a]">Repasse do MVP</p>
                <p className="mt-1 text-[#64748b]">Plataforma {featuredCompetition.platformSharePct}% • Organizador {featuredCompetition.organizerSharePct}% • Clube {featuredCompetition.clubSharePct}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[#dbeafe] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Organizadores</p>
          <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Onboarding comercial e performance</h2>
          <div className="mt-6 space-y-4">
            {mockOrganizers.map((organizer) => (
              <div key={organizer.id} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">{organizer.name}</h3>
                    <p className="text-sm text-[#64748b]">CPF {organizer.cpf}</p>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]">ativo</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Mensalidade" value={formatBRL(organizer.monthlyFee)} />
                  <MiniMetric label="Take rate" value={`${organizer.platformFeePct}%`} />
                  <MiniMetric label="GMV" value={formatBRL(organizer.grossVolume)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-[24px] border border-[#dbeafe] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#64748b]">{title}</p>
      <p className="mt-2 text-2xl font-black text-[#0f172a]">{value}</p>
      <p className="mt-2 text-xs text-[#94a3b8]">{helper}</p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#94a3b8]">{label}</p><p className="mt-1 text-base font-bold text-[#0f172a]">{value}</p></div>
}
