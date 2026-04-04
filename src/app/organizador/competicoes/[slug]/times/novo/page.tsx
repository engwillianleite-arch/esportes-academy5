import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionNewTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`${competition.title} • Adicionar time`} description="Tela mockada para criacao manual de equipes dentro da competicao, preservando nosso layout e aproximando a experiencia de ferramentas profissionais do mercado.">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[34px] border border-[#dbe7ff] bg-[#111827] p-8 text-white shadow-[0_20px_44px_rgba(15,23,42,.22)]">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Novo time</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Adicionar time</h2>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 rounded-[30px] border border-white/10 bg-white/5 px-6 py-8">
            <div className="flex h-36 w-36 items-center justify-center rounded-[30px] border border-white/10 bg-white/5 text-4xl font-black text-white/22">EA</div>
            <button className="rounded-[14px] border border-white/30 px-5 py-3 text-sm font-semibold text-white">Escolher imagem</button>
            <p className="text-xs text-white/48">Sugestao: 300px x 300px • Formato png ou jpg</p>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block rounded-[20px] border border-white/10 bg-white/6 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Nome do time</span>
              <input placeholder="Nome do time" className="mt-3 w-full border-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/34" />
            </label>
            <label className="block rounded-[20px] border border-white/10 bg-white/6 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Sigla</span>
              <input placeholder="SIGLA" className="mt-3 w-full border-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/34" />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button className="rounded-[18px] bg-[#16a34a] px-6 py-4 text-base font-black text-white shadow-[0_16px_30px_rgba(34,197,94,.2)]">Adicionar time</button>
            <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-[18px] border border-white/12 px-6 py-4 text-center text-base font-semibold text-white/80">Voltar aos times</Link>
          </div>
        </section>
      </div>
    </OrganizadorShell>
  )
}
