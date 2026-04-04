import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlunoShell } from '@/components/cursos-portais/aluno-shell'
import { getMockCourseBySlug, getMockOffersByCourseSlug, getRecommendedUpsellCourses } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function AlunoCheckoutPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ offer?: string }> }) {
  const { slug } = await params
  const query = (await searchParams) ?? {}
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()
  const offers = getMockOffersByCourseSlug(slug)
  const selectedOffer = offers.find((offer) => offer.id === query.offer) ?? offers[0] ?? null
  const upsells = getRecommendedUpsellCourses(slug)

  return (
    <AlunoShell title={`Checkout de ${course.title}`} description="Mock de checkout do portal do aluno. Aqui definimos hierarquia de resumo, percepcao de valor, CTA principal e pontos de upsell necessarios para o MVP.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/aluno/ofertas/${course.slug}`} className="text-sm font-semibold text-[#0369a1] hover:underline">? Voltar para ofertas</Link>
        <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#0369a1]">Checkout mockado sem pagamento real</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0ea5e9]">Resumo do pedido</p>
            <h2 className="mt-2 text-2xl font-black text-[#0f172a]">{selectedOffer?.title ?? 'Oferta selecionada'}</h2>
            <div className="mt-5 grid gap-3">
              <SummaryRow label="Curso" value={course.title} />
              <SummaryRow label="Modelo" value={selectedOffer?.kind ?? course.accessModel} />
              <SummaryRow label="Preco" value={selectedOffer ? (selectedOffer.price === 0 ? 'Gratis' : formatBRL(selectedOffer.price)) : 'A definir'} />
              <SummaryRow label="Aulas gratis" value={`${course.freeLessons}`} />
            </div>
          </div>

          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0ea5e9]">Dados do aluno</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MockField label="Nome completo" value="Joao Henrique de Souza" />
              <MockField label="CPF" value="***.123.456-**" />
              <MockField label="E-mail" value="joao@exemplo.com" />
              <MockField label="Contexto" value="Responsavel ? Arena Futebol Kids" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#e2e8f0] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">CTA principal</p>
            <p className="mt-3 text-4xl font-black">{selectedOffer?.price === 0 ? 'Liberar acesso' : formatBRL(selectedOffer?.price ?? course.price)}</p>
            <p className="mt-3 text-sm text-white/70">{selectedOffer?.kind === 'gratis' ? 'Fluxo de ativacao imediata para curso gratuito.' : 'Espaco reservado para integracao futura com pagamento e confirmacao da oferta.'}</p>
            <button className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0f172a]">{selectedOffer?.kind === 'gratis' ? 'Comecar agora' : 'Finalizar compra mockada'}</button>
          </div>

          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f97316]">Upsell de checkout</p>
            <div className="mt-4 space-y-3">
              {upsells.map((item) => (
                <Link key={item.id} href={`/aluno/ofertas/${item.slug}`} className="block rounded-[22px] border border-[#e2e8f0] bg-[#fffaf2] p-4 transition hover:shadow-sm">
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
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm"><span className="text-[#64748b]">{label}</span><span className="font-semibold capitalize text-[#0f172a]">{value}</span></div> }
function MockField({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e2e8f0] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#94a3b8]">{label}</p><p className="mt-1 font-semibold text-[#0f172a]">{value}</p></div> }
