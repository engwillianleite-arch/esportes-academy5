import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClubeShell } from '@/components/competicoes-portais/clube-shell'
import { getCompetitionBySlug, mockAthleteRegistrations, mockTeamPosts } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function ClubeCompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  const registrations = mockAthleteRegistrations.filter((registration) => registration.category === competition.category)
  const confirmedCount = registrations.filter((registration) => registration.status === 'confirmado').length

  return (
    <ClubeShell title={competition.title} description="Mesa de operacao do clube para confirmar atletas, acompanhar pendencias, controlar repasse e publicar o blog da equipe.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#dcfce7] bg-[linear-gradient(135deg,#052e16_0%,#14532d_42%,#16a34a_150%)] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.pricingModel}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.chargeMode}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{competition.disputeType}</span>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight">Central de confirmacao da delegacao</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/74">Ferramentas de gestao para revisar atletas, confirmar inscricoes, cobrar pendentes e manter o blog da equipe alinhado com a campanha.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/clube/competicoes/${competition.slug}/inscricao`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#14532d]">Confirmar atletas</Link>
              <Link href="/clube/equipe/blog" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Blog da equipe</Link>
              <Link href="/clube/equipe/blog/editor" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Editar blog</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroMetric label="Delegacao confirmada" value={`${confirmedCount}/${registrations.length}`} helper="Atletas prontos para subir" />
            <HeroMetric label="Receita prevista" value={formatBRL(registrations.reduce((sum, item) => sum + item.amount, 0))} helper="Cobranca mockada do clube" />
            <HeroMetric label="Prazo da inscricao" value={competition.registrationDeadline ?? 'Definir'} helper="Fechamento operacional" />
            <HeroMetric label="Repasse da plataforma" value={`${competition.platformSharePct}%`} helper="Aplicado em toda transacao" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Mesa de aprovacao</p>
                  <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Atletas, pendencias e acoes</h3>
                </div>
                <span className="rounded-full bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]">clube no controle</span>
              </div>
              <div className="mt-5 space-y-3">
                {registrations.map((registration) => (
                  <div key={registration.id} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="font-semibold text-[#0f172a]">{registration.athleteName}</p>
                        <p className="text-sm text-[#64748b]">{registration.category} • {registration.status} • checklist {registration.checklistStatus}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusChip label={registration.confirmationAction === 'confirmar' ? 'Confirmar inscricao' : registration.confirmationAction === 'cobrar' ? 'Cobrar atleta' : 'Revisar documentos'} tone={registration.confirmationAction === 'confirmar' ? 'green' : registration.confirmationAction === 'cobrar' ? 'amber' : 'slate'} />
                        <span className="rounded-full border border-[#cbd5e1] px-3 py-2 text-xs font-semibold text-[#334155]">{registration.amount === 0 ? 'Gratis' : formatBRL(registration.amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Blog da competicao e da equipe</p>
                  <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Narrativa da campanha</h3>
                </div>
                <Link href="/clube/equipe/blog/editor" className="rounded-full bg-[#14532d] px-4 py-2 text-sm font-semibold text-white">Editar blog</Link>
              </div>
              <div className="mt-5 grid gap-3">
                {mockTeamPosts.map((post) => (
                  <article key={post.id} className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#64748b]">{post.publishedAt} • {post.author}</p>
                        <h4 className="mt-1 text-lg font-bold text-[#0f172a]">{post.title}</h4>
                        <p className="mt-2 text-sm text-[#64748b]">{post.excerpt}</p>
                      </div>
                      <span className={post.status === 'publicado' ? 'rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]' : 'rounded-full bg-[#fef3c7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a16207]'}>{post.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-[#dcfce7] bg-[#14532d] p-6 text-white shadow-sm">
              <h3 className="text-lg font-bold">Gestao visual da operacao</h3>
              <div className="mt-4 grid gap-3">
                <PillLine title="Mesa de confirmacao" body="Aprovar, cobrar ou revisar documentos sem sair do contexto competitivo." />
                <PillLine title="Controle financeiro" body="Visao rapida do que o clube cobra e do que repassa para a plataforma." />
                <PillLine title="Conteudo da equipe" body="Blog tratado como instrumento de relacionamento e memoria esportiva." />
              </div>
            </div>
            <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Reflexo na jornada do atleta</p>
              <div className="mt-4 space-y-3">
                <JourneyPoint title="Participacao competitiva" body="Cada inscricao confirmada pode virar item real da jornada do atleta." />
                <JourneyPoint title="Conquistas e resultados" body="Podios e desempenhos ficam conectados a escola, clube e carreira." />
                <JourneyPoint title="Memoria editorial" body="Blog da equipe complementa a narrativa da campanha no historico global." />
              </div>
            </div>
          </section>
        </div>
      </div>
    </ClubeShell>
  )
}
function HeroMetric({ label, value, helper }: { label: string; value: string; helper: string }) { return <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4"><p className="text-[11px] uppercase tracking-[0.14em] text-white/52">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p><p className="mt-1 text-xs text-white/60">{helper}</p></div> }
function StatusChip({ label, tone }: { label: string; tone: 'green' | 'amber' | 'slate' }) { const classes = tone === 'green' ? 'bg-[#dcfce7] text-[#166534]' : tone === 'amber' ? 'bg-[#fef3c7] text-[#a16207]' : 'bg-[#e2e8f0] text-[#334155]'; return <span className={`rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>{label}</span> }
function JourneyPoint({ title, body }: { title: string; body: string }) { return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><p className="font-semibold text-[#0f172a]">{title}</p><p className="mt-1 text-sm text-[#64748b]">{body}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
