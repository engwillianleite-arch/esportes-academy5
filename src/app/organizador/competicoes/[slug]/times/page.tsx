import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug, mockCompetitionTeams, mockCompetitions } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionTeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  const teams = mockCompetitionTeams.filter((team) => team.competitionSlug === competition.slug)
  const importedTeams = mockCompetitions.filter((item) => item.organizerName === competition.organizerName).reduce((sum, item) => sum + item.clubCount, 0)
  const importedAthletes = mockCompetitions.filter((item) => item.organizerName === competition.organizerName).reduce((sum, item) => sum + item.athleteCount, 0)

  return (
    <OrganizadorShell title={`${competition.title} • Times`} description="Operacao de equipes da competicao, com banco de times, importacao, criacao manual e distribuicao de links de inscricao.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#38bdf8]">Menu Times</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Banco de equipes da competicao</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">Fluxo inspirado nas ferramentas do mercado para organizar inscricoes, reaproveitar equipes e abrir a jornada de cadastro dos atletas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Tabela</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/atletas`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Atletas</Link>
              <ActionButton label="Permissoes dos tecnicos" />
              <ActionButton label="Inscrever" tone="danger" />
              <ActionButton label="Editar" tone="danger" />
              <ActionButton label="Deletar" tone="danger" />
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#22c55e]/45 bg-[#0f2b1a] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-black text-white">Libere as inscricoes online</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Solicite os documentos e as informacoes completas dos times logo no inicio do torneio.</p>
              </div>
              <button className="rounded-[14px] bg-[#2f7d32] px-5 py-3 text-sm font-black text-white">Comprar premium</button>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/organizador/competicoes/${competition.slug}/times/link-inscricao`} className="min-w-[220px] rounded-[14px] bg-[#4aa3df] px-6 py-4 text-center text-base font-black text-white shadow-[0_12px_30px_rgba(74,163,223,.25)]">Importar time</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/times/novo`} className="min-w-[220px] rounded-[14px] bg-[#18c22e] px-6 py-4 text-center text-base font-black text-white shadow-[0_12px_30px_rgba(24,194,46,.25)]">Criar time</Link>
            </div>
            <p className="text-sm text-white/54">Importacao mockada com {importedTeams} times e {importedAthletes} atletas disponiveis no historico do organizador.</p>
          </div>
        </section>

        <section className="rounded-[34px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-[#4aa3df]">
              <span className="text-xl">≣</span>
              <span className="text-sm font-semibold">Filtros</span>
            </div>
            <div className="text-center lg:text-right">
              <p className="text-sm text-white/58">Total</p>
              <p className="text-4xl font-black text-white">{teams.length}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <article key={team.id} className="mx-auto flex min-h-[320px] w-full max-w-[320px] flex-col items-center rounded-[28px] border border-white/8 bg-[#1a202a] px-6 py-7 text-center shadow-[0_18px_40px_rgba(0,0,0,.25)]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl font-black text-white/20">EA</div>
                <h3 className="mt-8 text-4xl font-black tracking-tight text-white">{team.shortName.toLowerCase()}</h3>
                <p className="mt-2 text-sm text-white/42">{team.name}</p>
                <p className="mt-4 text-sm text-white/34">ID: {team.id.replace('team-comp-', '69')}410{team.athleteCount}</p>
                <div className="mt-4"><StatusPill status={team.status} /></div>
                <div className="mt-auto flex w-full items-center justify-center gap-3 pt-8 text-sm text-white/60">
                  <Link href={`/organizador/competicoes/${competition.slug}/times/novo`} className="rounded-[12px] border border-white/10 px-4 py-2 font-semibold text-white/76">Editar</Link>
                  <Link href={`/organizador/competicoes/${competition.slug}/times/link-inscricao`} className="rounded-[12px] border border-[#38bdf8]/25 px-4 py-2 font-semibold text-[#7dd3fc]">Link</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-white/72">
            <button className="rounded-full border border-white/10 px-4 py-2">‹</button>
            <span className="rounded-[10px] bg-[#4aa3df] px-4 py-2 text-sm font-black text-white">1</span>
            <button className="rounded-full border border-white/10 px-4 py-2">›</button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <PromoPanel
            title="Patrocinadores da competicao"
            body="Cadastre banners para tabela, noticias e paginas publicas da competicao."
            href={`/organizador/competicoes/${competition.slug}/times/link-inscricao#patrocinadores`}
            ctaLabel="Configurar patrocinadores"
          />
          <PromoPanel
            title="Parceiros da competicao"
            body="Ative a vitrine de hoteis, transporte, alimentacao e apoiadores do evento."
            href={`/organizador/competicoes/${competition.slug}/times/link-inscricao#parceiros`}
            ctaLabel="Configurar parceiros"
          />
        </section>
      </div>
    </OrganizadorShell>
  )
}

function ActionButton({ label, tone = 'default' }: { label: string; tone?: 'default' | 'danger' }) {
  return <span className={tone === 'danger' ? 'rounded-full border border-[#ef4444]/50 bg-[#ef4444]/10 px-4 py-2 text-xs font-semibold text-[#fb7185]' : 'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white'}>{label}</span>
}

function PromoPanel({ title, body, href, ctaLabel }: { title: string; body: string; href: string; ctaLabel: string }) {
  return <div className="rounded-[30px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#38bdf8]">Site da competicao</p><h3 className="mt-3 text-2xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/62">{body}</p><Link href={href} className="mt-6 inline-flex rounded-[14px] bg-[#111827] px-4 py-3 text-sm font-semibold text-white border border-white/10">{ctaLabel}</Link></div>
}

function StatusPill({ status }: { status: 'vaga' | 'pre_inscrito' | 'confirmado' }) {
  const classes = status === 'confirmado'
    ? 'bg-[#16a34a]/18 text-[#86efac] border-[#22c55e]/25'
    : status === 'pre_inscrito'
      ? 'bg-[#f59e0b]/16 text-[#fde68a] border-[#f59e0b]/30'
      : 'bg-white/8 text-white/62 border-white/10'

  const label = status === 'confirmado' ? 'Confirmado' : status === 'pre_inscrito' ? 'Pre-inscrito' : 'Vaga'
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes}`}>{label}</span>
}
