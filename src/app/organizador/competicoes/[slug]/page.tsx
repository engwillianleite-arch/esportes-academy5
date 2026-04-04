import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

const standingsColumns = ['Pts.', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', '%']

const roundMatches = [
  { id: 'match-1', home: 'Definir', away: 'Definir', field: 'Campo a definir', hour: '08:30', status: 'Aguardando sorteio' },
  { id: 'match-2', home: 'Definir', away: 'Definir', field: 'Campo a definir', hour: '09:20', status: 'Aguardando sorteio' },
  { id: 'match-3', home: 'Definir', away: 'Definir', field: 'Campo a definir', hour: '10:10', status: 'Aguardando sorteio' },
  { id: 'match-4', home: 'Definir', away: 'Definir', field: 'Campo a definir', hour: '11:00', status: 'Aguardando sorteio' },
]

export default async function OrganizadorCompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  const totalTeams = Math.max(competition.clubCount, 8)
  const configuredGroups = competition.disputeType === 'grupos_e_finais' ? 2 : 1
  const groupLabels = Array.from({ length: configuredGroups }, (_, index) => String.fromCharCode(65 + index))
  const slotsPerGroup = Math.ceil(totalTeams / configuredGroups)

  return (
    <OrganizadorShell title={`${competition.title} • Tabela e sorteio`} description="Tela operacional da competição para estruturar grupos, vagas e sorteio automático dos jogos, mantendo a identidade visual da Esportes Academy com referências funcionais de plataformas competitivas.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#dbe7ff] bg-[linear-gradient(135deg,#071120_0%,#111827_46%,#0ea5e9_160%)] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.pricingModel === 'gratis' ? 'Gratuito' : 'Pago'}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.chargeMode === 'por_clube' ? 'Cobranca por clube' : 'Cobranca por atleta'}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.disputeType}</span>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight">Tabela da fase classificatoria</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/74">
                Os grupos foram criados a partir da configuracao anterior, mas o organizador pode expandir a estrutura, abrir novas vagas e preparar o sorteio automatico da rodada inicial.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}/categorias`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Voltar as categorias</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Times</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/campos`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Campos</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/calendario`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Calendario</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/blog`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Blog da competicao</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/editar`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">Editar competicao</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroMetric label="Times previstos" value={`${totalTeams}`} helper="Base da categoria principal" />
            <HeroMetric label="Grupos iniciais" value={`${configuredGroups}`} helper="Criados pela configuracao" />
            <HeroMetric label="Vagas por grupo" value={`${slotsPerGroup}`} helper="Expansiveis manualmente" />
            <HeroMetric label="Eliminatoria" value="Semi-final" helper="Definida no setup inicial" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-5">
            <div className="rounded-[30px] border border-[#dbe7ff] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Visualizacao da classificacao</p>
                  <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Por grupos</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip label="Tabela oficial" active />
                  <FilterChip label="Times" />
                  <Link href={`/organizador/competicoes/${competition.slug}/atletas`} className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Atletas</Link>
                  <FilterChip label="Estatisticas" />
                </div>
              </div>
            </div>

            {groupLabels.map((groupLabel, groupIndex) => (
              <section key={groupLabel} className="rounded-[30px] border border-[#dbe7ff] bg-[#111827] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,.18)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black">Grupo {groupLabel}</h3>
                      <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0369a1]">{slotsPerGroup} vagas base</span>
                    </div>
                    <p className="mt-2 text-sm text-white/58">Grupo configurado a partir da categoria principal. Novas vagas podem ser abertas e ocupadas depois pelos times.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionPill label="Editar grupo" />
                    <ActionPill label="Excluir grupo" danger />
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
                  <div className="grid grid-cols-[54px_minmax(240px,1.7fr)_repeat(9,minmax(34px,1fr))] gap-2 border-b border-white/10 px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/52">
                    <span>#</span>
                    <span>Time</span>
                    {standingsColumns.map((column) => (
                      <span key={column} className="text-center">{column}</span>
                    ))}
                  </div>

                  {Array.from({ length: slotsPerGroup }).map((_, slotIndex) => {
                    const slotNumber = groupIndex * slotsPerGroup + slotIndex + 1
                    return (
                      <div key={slotNumber} className="grid grid-cols-[54px_minmax(240px,1.7fr)_repeat(9,minmax(34px,1fr))] gap-2 border-b border-white/10 px-4 py-4 text-sm text-white/88 last:border-b-0">
                        <span className="font-semibold">{slotIndex + 1}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[11px] font-black text-white/70">EA</span>
                          <div>
                            <p className="font-semibold">Vaga {slotNumber}</p>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/42">Expandir depois para equipe</p>
                          </div>
                        </div>
                        {standingsColumns.map((column) => (
                          <span key={`${slotNumber}-${column}`} className="text-center text-white/45">-</span>
                        ))}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="rounded-[16px] border border-[#facc15]/55 bg-[#facc15]/10 px-4 py-3 text-sm font-semibold text-[#fde68a]">Nova vaga</button>
                  <button className="rounded-[16px] border border-white/10 px-4 py-3 text-sm font-semibold text-white/80">Substituir time depois</button>
                </div>
              </section>
            ))}

            <section className="flex justify-center">
              <button className="rounded-[20px] bg-[#16a34a] px-6 py-4 text-base font-black text-white shadow-[0_18px_34px_rgba(34,197,94,.24)]">Criar novo grupo</button>
            </section>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-[#dbe7ff] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button className="rounded-[14px] bg-[#0ea5e9] px-4 py-3 text-sm font-semibold text-white">Sortear jogos</button>
                <button className="rounded-[14px] border border-[#cbd5e1] px-4 py-3 text-sm font-semibold text-[#334155]">Ver jogos</button>
              </div>

              <div className="mt-5 rounded-[24px] border border-[#e2e8f0] bg-[#0f172a] p-5 text-white">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <button className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/72">‹</button>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#38bdf8]">Rodada 1</p>
                    <p className="mt-1 text-sm text-white/60">Fase de classificacao</p>
                  </div>
                  <button className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/72">›</button>
                </div>

                <div className="mt-4 space-y-3">
                  {roundMatches.map((match) => (
                    <article key={match.id} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0369a1]">{match.hour}</span>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/44">{match.field}</span>
                      </div>
                      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                        <TeamGhost label={match.home} />
                        <span className="text-lg font-black text-white">X</span>
                        <TeamGhost label={match.away} />
                      </div>
                      <p className="mt-4 text-center text-xs text-white/50">{match.status}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,.18)]">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Sortear jogos</p>
                <h3 className="mt-2 text-3xl font-black">Fase de classificacao</h3>
              </div>

              <div className="mt-5 rounded-[20px] border border-[#facc15]/40 bg-[#facc15] px-4 py-3 text-center text-sm leading-6 text-[#422006]">
                Todos os jogos, datas e horarios desta fase serao apagados e novos confrontos serao sorteados.
              </div>

              <p className="mt-5 text-center text-sm leading-6 text-white/74">O sorteio acontece de acordo com as vagas criadas na tabela. Escolha o formato do sorteio dos jogos atuais.</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <StatTile label="Times" value={`${totalTeams}`} />
                <StatTile label="Grupos" value={`${configuredGroups}`} />
              </div>

              <div className="mt-6 space-y-5">
                <SelectorBlock title="Sistema de jogos" options={['So ida', 'Ida e volta']} active="So ida" />
                <SelectorBlock title="Forma de disputa" options={['Dentro do grupo', 'Chaves cruzadas']} active="Dentro do grupo" />
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 rounded-[16px] border border-white/12 px-4 py-3 text-sm font-semibold text-white/72">Cancelar</button>
                <button className="flex-1 rounded-[16px] bg-[#16a34a] px-4 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(34,197,94,.2)]">Criar jogos</button>
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
  return <span className={active ? 'rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white' : 'rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]'}>{label}</span>
}

function ActionPill({ label, danger = false }: { label: string; danger?: boolean }) {
  return <span className={danger ? 'rounded-full border border-[#ef4444]/35 bg-[#ef4444]/10 px-4 py-2 text-xs font-semibold text-[#fca5a5]' : 'rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/78'}>{label}</span>
}

function TeamGhost({ label }: { label: string }) {
  return (
    <div>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xs font-black text-white/48">EA</div>
      <p className="mt-3 text-sm font-semibold text-white">{label}</p>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-center"><p className="text-sm text-white/58">{label}</p><p className="mt-2 text-4xl font-black text-white">{value}</p></div>
}

function SelectorBlock({ title, options, active }: { title: string; options: string[]; active: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[16px] border border-[#38bdf8]/35 bg-white/5">
        {options.map((option) => (
          <span key={option} className={option === active ? 'bg-[#38bdf8] px-4 py-3 text-center text-sm font-semibold text-white' : 'px-4 py-3 text-center text-sm font-semibold text-white/72'}>{option}</span>
        ))}
      </div>
    </div>
  )
}
