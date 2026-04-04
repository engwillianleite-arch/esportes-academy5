import Link from 'next/link'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { mockCompetitions, mockOrganizers } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function OrganizadorPage() {
  const organizer = mockOrganizers[0]
  const competitions = mockCompetitions.filter((competition) => competition.organizerName === organizer.name)
  const totalTeams = competitions.reduce((sum, competition) => sum + competition.clubCount, 0)
  const totalAthletes = competitions.reduce((sum, competition) => sum + competition.athleteCount, 0)
  const totalGames = 94
  const totalGoals = 252

  return (
    <OrganizadorShell title="Dashboard do organizador" description="Visao inspirada em plataformas competitivas modernas para acompanhar campeonatos, clubes, atletas e operacao comercial, mantendo o layout da Esportes Academy.">
      <div className="space-y-8">
        <section className="rounded-[34px] border border-[#dbe7ff] bg-[linear-gradient(135deg,#071120_0%,#111827_48%,#0ea5e9_160%)] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Cockpit competitivo</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Seja bem-vindo ao seu ecossistema de campeonatos</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/74">
                Acompanhe operacao, criacao de campeonatos, categorias, fases eliminatorias e status comercial com a mesma base de governanca da plataforma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/organizador/competicoes/novo" className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,197,94,.28)]">Criar novo campeonato</Link>
              <span className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white">Mensalidade {formatBRL(organizer.monthlyFee)}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-5 xl:grid-cols-6">
            <DashboardMetric title="Campeonatos" value={`${competitions.length}`} accent="text-[#22c55e]" helper="ativos" />
            <DashboardMetric title="Times" value={`${totalTeams}`} accent="text-[#60a5fa]" helper="banco de times" />
            <DashboardMetric title="Atletas" value={`${totalAthletes}`} accent="text-[#facc15]" helper="mapeados" />
            <DashboardMetric title="Jogos" value={`${totalGames}`} accent="text-[#fb7185]" helper="programados" />
            <DashboardMetric title="Gols" value={`${totalGoals}`} accent="text-[#f59e0b]" helper="estimados" />
            <div className="rounded-[24px] border border-[#22c55e]/40 bg-[#16a34a] p-4 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/72">Plano elite</p>
              <p className="mt-2 text-lg font-black">Operacao premium</p>
              <p className="mt-2 text-xs leading-5 text-white/80">Campeonatos ilimitados, governanca comercial e blogs oficiais.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-[#93c5fd] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8]">Entenda como funciona</span>
          <Link href="/organizador/competicoes/novo" className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-white">Criar campeonato</Link>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {competitions.map((competition) => (
            <article key={competition.id} className="rounded-[30px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">{competition.sport}</p>
                  <h3 className="mt-3 text-2xl font-black">{competition.title}</h3>
                  <p className="mt-2 text-sm text-white/62">{competition.periodLabel} • {competition.location}</p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/72">{competition.status}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1d4ed8]">1 categoria</span>
                <span className={competition.pricingModel === 'gratis' ? 'rounded-full bg-[#fb7185] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white' : 'rounded-full bg-[#facc15] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#713f12]'}>{competition.pricingModel === 'gratis' ? 'Gratuito' : 'Pago'}</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/72">{competition.disputeType}</span>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <MiniData label="Times" value={`${competition.clubCount}`} />
                <MiniData label="Atletas" value={`${competition.athleteCount}`} />
                <MiniData label="Taxa" value={competition.entryFee === 0 ? 'Gratis' : formatBRL(competition.entryFee)} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/organizador/competicoes/${competition.slug}`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0f172a]">Abrir</Link>
                <Link href={`/organizador/competicoes/${competition.slug}/editar`} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white">Editar</Link>
                <Link href={`/organizador/competicoes/${competition.slug}/categorias`} className="rounded-full border border-[#22c55e]/40 bg-[#16a34a]/15 px-4 py-2 text-xs font-semibold text-[#86efac]">Categorias</Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </OrganizadorShell>
  )
}

function DashboardMetric({ title, value, helper, accent }: { title: string; value: string; helper: string; accent: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/6 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/62">{title}</p><p className={`mt-2 text-4xl font-black ${accent}`}>{value}</p><p className="mt-1 text-xs text-white/58">{helper}</p></div>
}

function MiniData({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-white/48">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>
}
