import Link from 'next/link'
import { ClubeShell } from '@/components/competicoes-portais/clube-shell'
import { mockClubs, mockCompetitions, mockInvites } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ClubePage() {
  const club = mockClubs[0]
  const competitions = mockCompetitions.filter((competition) => ['copa-futuro-sub13', 'liga-performance-sub15'].includes(competition.slug))
  const invites = mockInvites.filter((invite) => invite.clubName === club.name)

  return (
    <ClubeShell title="Painel competitivo do clube" description="Mock do portal do clube para aceitar convites, inscrever atletas, cobrar taxas individuais e manter a narrativa da equipe durante a temporada.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Convites ativos" value={`${club.activeInvites}`} helper="Organizadores aguardando aceite" />
        <StatCard title="Atletas confirmados" value={`${club.confirmedAthletes}`} helper="Inscricoes aptas a entrar na competicao" />
        <StatCard title="Receita projetada" value={formatBRL(club.amountToCollect)} helper="Repasse do clube para atletas no mock" />
        <StatCard title="Blog da equipe" value="2 posts" helper="Comunicacao interna e cobertura" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Agenda competitiva</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Competicoes para decidir agora</h2>
            </div>
            <Link href="/clube/equipe/blog" className="rounded-full border border-[#bbf7d0] px-4 py-2 text-sm font-semibold text-[#166534]">Abrir blog da equipe</Link>
          </div>
          <div className="mt-6 space-y-4">
            {competitions.map((competition) => (
              <Link key={competition.id} href={`/clube/competicoes/${competition.slug}`} className="block rounded-[28px] border border-[#dcfce7] bg-[linear-gradient(180deg,#ffffff_0%,#f7fff8_100%)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]">{competition.pricingModel}</span>
                      <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">{competition.chargeMode}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-[#0f172a]">{competition.title}</h3>
                    <p className="mt-1 text-sm text-[#64748b]">{competition.sport} • {competition.category} • {competition.disputeType}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                    <p className="font-semibold text-[#0f172a]">{competition.entryFee === 0 ? 'Gratis' : formatBRL(competition.entryFee)}</p>
                    <p className="mt-1 text-[#64748b]">{competition.clubCount} clubes</p>
                    <p className="mt-1 text-[#64748b]">{competition.athleteCount} atletas</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Fluxo de entrada</p>
            <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Convite, inscricao direta ou link</h2>
            <div className="mt-5 space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">{invite.competitionSlug}</p>
                  <p className="mt-1 text-sm text-[#64748b]">{invite.status} via {invite.via}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dcfce7] bg-[#14532d] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Jornada do clube no MVP</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Inscrever atletas" body="Selecionar delegacao, categoria e status de pagamento." />
              <PillLine title="Enviar link" body="Compartilhar inscricao individual com CTA de pagamento quando houver taxa." />
              <PillLine title="Cobrar do atleta" body="Repasse proprio do clube com percentual da plataforma aplicado." />
            </div>
          </div>
        </section>
      </div>
    </ClubeShell>
  )
}

function StatCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return <div className="rounded-[28px] border border-[#dcfce7] bg-white p-5 shadow-sm"><p className="text-sm text-[#64748b]">{title}</p><p className="mt-2 text-3xl font-black text-[#0f172a]">{value}</p><p className="mt-2 text-xs text-[#94a3b8]">{helper}</p></div>
}

function PillLine({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div>
}
