import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

const eliminationOptions = ['Final', 'Semi-final', 'Quartas de Final', 'Oitavas de Final', '16-avos de Final', '32-avos de Final']

export default async function OrganizadorCompetitionCategoriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`Categorias • ${competition.title}`} description="Configuracao das categorias da competicao, com numero de times, grupos e fase eliminatoria definidos pelo organizador.">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[32px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,.22)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,#082f49_0%,#172554_58%,#0ea5e9_160%)]">
                <span className="text-sm font-black text-white">EA CUP</span>
              </div>
              <div>
                <p className="text-sm text-white/60">Inicia em {competition.periodLabel}</p>
                <h2 className="text-3xl font-black">{competition.title}</h2>
                <span className={competition.pricingModel === 'gratis' ? 'mt-2 inline-flex rounded-full bg-[#fb7185] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white' : 'mt-2 inline-flex rounded-full bg-[#facc15] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#713f12]'}>{competition.pricingModel === 'gratis' ? 'Gratuito' : 'Pago'}</span>
              </div>
            </div>
            <Link href={`/organizador/competicoes/${competition.slug}/editar`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80">Editar campeonato</Link>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#fde68a] bg-[#78350f] px-5 py-4 text-sm leading-6 text-[#fef3c7] shadow-sm">
          Voce pode alterar essas informacoes depois de criar o campeonato, inclusive criar novos jogos, rodadas, fases e categorias.
        </section>

        <section className="rounded-[32px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,.22)]">
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Categoria 1</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <Label>Qual o nome da categoria?</Label>
            <Field value="Categoria 1" />

            <Label>Qual categoria?</Label>
            <Select value="Adulto" />

            <Label>Genero</Label>
            <Select value="Masculino" />

            <Label>Modalidade</Label>
            <Select value={competition.sport} helper="Escolha uma modalidade" />

            <Label>Formato</Label>
            <Select value="Grupos e Mata-mata" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CounterCard title="Nº de times" value="64" helper="Planos gratuitos podem ir ate 64 times" />
            <CounterCard title="Nº de grupos" value="2" helper="Definido pelo organizador" />
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Eliminacao de times na fase de mata-mata</p>
            <div className="mt-3 grid gap-2">
              {eliminationOptions.map((option) => (
                <div key={option} className={option === '32-avos de Final' ? 'rounded-[18px] border border-white/15 bg-white/14 px-4 py-3 text-sm font-semibold text-white' : 'rounded-[18px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-white/74'}>
                  {option}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[18px] border border-[#38bdf8]/40 bg-[#1e293b] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#38bdf8]">Selecao atual</p>
              <p className="mt-1 text-lg font-black text-white">Semi-final</p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#facc15]/40 bg-[#facc15] px-5 py-4 text-sm leading-6 text-[#422006] shadow-sm">
          Seu campeonato esta sendo configurado no plano base. A estrutura visual ja considera evolucao futura para mais recursos competitivos.
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-[18px] bg-[#2563eb] px-6 py-4 text-base font-semibold text-white">Adicionar categoria</button>
          <button className="rounded-[18px] bg-[#16a34a] px-6 py-4 text-base font-black text-white shadow-[0_16px_30px_rgba(34,197,94,.2)]">Criar campeonato</button>
        </section>
      </div>
    </OrganizadorShell>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-white/80">{children}</p>
}

function Field({ value }: { value: string }) {
  return <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white">{value}</div>
}

function Select({ value, helper }: { value: string; helper?: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white">
      <div className="flex items-center justify-between gap-3">
        <span>{value}</span>
        <span className="text-white/44">▼</span>
      </div>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </div>
  )
}

function CounterCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return <div className="rounded-[22px] border border-white/10 bg-white/8 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">{title}</p><p className="mt-3 text-3xl font-black text-white">{value}</p><p className="mt-2 text-xs text-white/38">{helper}</p></div>
}
