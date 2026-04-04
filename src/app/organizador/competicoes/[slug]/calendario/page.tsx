import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

const rounds = [
  {
    id: 'r1',
    title: 'Rodada 1',
    date: '18 mai 2026',
    matches: [
      { time: '08:30', field: 'Arena Sul', home: 'Clube Estrela Jovem', away: 'Academia Horizonte', status: 'confirmado' },
      { time: '09:20', field: 'Centro Tecnico Norte', home: 'Vaga 3', away: 'Vaga 4', status: 'pendente' },
    ],
  },
  {
    id: 'r2',
    title: 'Rodada 2',
    date: '19 mai 2026',
    matches: [
      { time: '10:10', field: 'Arena Sul', home: 'Vaga 1', away: 'Vaga 2', status: 'pendente' },
      { time: '11:00', field: 'Centro Tecnico Norte', home: 'Vaga 5', away: 'Vaga 6', status: 'rascunho' },
    ],
  },
] as const

export default async function OrganizadorCompetitionCalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`${competition.title} • Calendario`} description="Planejamento visual das rodadas, confrontos, horarios e campos da competicao em uma visao executiva e operacional.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#1f2937] bg-[linear-gradient(135deg,#071120_0%,#111827_48%,#0ea5e9_165%)] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Menu Calendario</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Agenda da competicao por rodada</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Organize datas, horarios, campos e status de confrontos em uma camada de planejamento ligada a tabela, aos campos e ao sorteio automatico.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Tabela</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/campos`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Campos</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Times</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroMetric label="Rodadas" value="2" helper="Macroagenda publicada" />
            <HeroMetric label="Jogos" value="4" helper="Entre confirmados e pendentes" />
            <HeroMetric label="Campos" value="2" helper="Distribuicao da operacao" />
            <HeroMetric label="Periodo" value={competition.periodLabel ?? 'Planejar'} helper="Janela do evento" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-5">
            {rounds.map((round) => (
              <article key={round.id} className="rounded-[32px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">{round.date}</p>
                    <h3 className="mt-2 text-2xl font-black">{round.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/80">Editar rodada</button>
                    <button className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white">Novo jogo</button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {round.matches.map((match, index) => (
                    <div key={`${round.id}-${index}`} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#7dd3fc]">{match.time} • {match.field}</p>
                          <p className="mt-2 text-lg font-black text-white">{match.home} x {match.away}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill status={match.status} />
                          <button className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/80">Editar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-[#1f2937] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Ferramentas do calendario</p>
              <div className="mt-4 grid gap-3">
                <ToolCard title="Distribuir campos" body="Escolha o campo ideal para cada rodada e proteja horarios nobres." />
                <ToolCard title="Ajustar confrontos" body="Reorganize partidas depois do sorteio ou da entrada de novos times." />
                <ToolCard title="Publicar agenda" body="Leve o calendario para o blog, site da competicao e comunicacao oficial." />
              </div>
            </section>

            <section className="rounded-[32px] border border-[#1f2937] bg-[#111827] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Checklist da agenda</p>
              <div className="mt-4 grid gap-3">
                <ChecklistLine title="Campos vinculados" state="ok" />
                <ChecklistLine title="Horarios conflitantes" state="attention" />
                <ChecklistLine title="Rodada publicada" state="ok" />
                <ChecklistLine title="Comunicacao disparada" state="attention" />
              </div>
            </section>

            <section className="rounded-[32px] border border-[#1f2937] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Atalhos</p>
              <div className="mt-4 grid gap-3">
                <QuickLink href={`/organizador/competicoes/${competition.slug}/campos`} label="Cadastrar campos" />
                <QuickLink href={`/organizador/competicoes/${competition.slug}/blog`} label="Publicar no blog" />
                <QuickLink href={`/organizador/competicoes/${competition.slug}`} label="Voltar a tabela" />
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

function StatusPill({ status }: { status: 'confirmado' | 'pendente' | 'rascunho' }) {
  const classes = status === 'confirmado'
    ? 'bg-[#dcfce7] text-[#166534]'
    : status === 'pendente'
      ? 'bg-[#fef3c7] text-[#a16207]'
      : 'bg-[#e2e8f0] text-[#475569]'
  const label = status === 'confirmado' ? 'Confirmado' : status === 'pendente' ? 'Pendente' : 'Rascunho'
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes}`}>{label}</span>
}

function ToolCard({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><p className="font-semibold text-[#0f172a]">{title}</p><p className="mt-2 text-sm text-[#64748b]">{body}</p></div>
}

function ChecklistLine({ title, state }: { title: string; state: 'ok' | 'attention' }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><span className={state === 'ok' ? 'h-2.5 w-2.5 rounded-full bg-[#22c55e]' : 'h-2.5 w-2.5 rounded-full bg-[#f59e0b]'} /><span className="font-medium text-white/82">{title}</span></div>
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-[18px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#334155]">{label}</Link>
}
