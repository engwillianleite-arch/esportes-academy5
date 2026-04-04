import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlunoShell } from '@/components/cursos-portais/aluno-shell'
import { getMockCourseBySlug, getMockOffersByCourseSlug, getRecommendedUpsellCourses } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function AlunoOfertaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()
  const offers = getMockOffersByCourseSlug(slug)
  const upsells = getRecommendedUpsellCourses(slug)

  return (
    <AlunoShell title={`Oferta de ${course.title}`} description="Mock comercial do portal do aluno. Aqui planejamos como a pessoa compara modelos, entende o que e gratis e escolhe a melhor forma de entrar no curso.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/aluno/cursos/${course.slug}`} className="text-sm font-semibold text-[#0369a1] hover:underline">? Voltar para o curso</Link>
        <Link href={`/aluno/checkout/${course.slug}`} className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Ir para checkout</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0ea5e9]">Comparativo de acesso</p>
          <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Escolha como entrar</h2>
          <div className="mt-6 grid gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className={`rounded-[28px] border p-5 ${offer.recommended ? 'border-[#0ea5e9] bg-[#f0f9ff]' : 'border-[#e2e8f0] bg-[#fcfcfd]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">{offer.kind}</span>
                      {offer.recommended && <span className="rounded-full bg-[#0f172a] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Recomendado</span>}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-[#0f172a]">{offer.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#0f172a]">{offer.price === 0 ? 'Gratis' : formatBRL(offer.price)}</p>
                    {offer.installmentLabel && <p className="text-xs text-[#64748b]">{offer.installmentLabel}</p>}
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-[#475569]">{offer.perks.map((perk) => <li key={perk}>? {perk}</li>)}</ul>
                <div className="mt-5"><Link href={`/aluno/checkout/${course.slug}?offer=${offer.id}`} className="inline-flex rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Escolher esta oferta</Link></div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#e2e8f0] bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Leitura de valor</p>
            <h3 className="mt-2 text-xl font-black text-[#7c2d12]">O que esta sendo validado aqui</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9a3412]">
              <li>? curso gratuito, pago e assinatura na mesma linguagem visual</li>
              <li>? curso hibrido com aulas de entrada abertas</li>
              <li>? CTA claro para checkout mockado</li>
              <li>? espaco para upsell leve sem poluir a aprendizagem</li>
            </ul>
          </div>

          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f97316]">Upsell leve</p>
            <div className="mt-4 space-y-3">
              {upsells.map((item) => (
                <Link key={item.id} href={`/aluno/ofertas/${item.slug}`} className="block rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] p-4 transition hover:shadow-sm">
                  <p className="font-semibold text-[#0f172a]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#64748b]">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AlunoShell>
  )
}
