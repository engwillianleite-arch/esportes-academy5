import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlunoShell } from '@/components/cursos-portais/aluno-shell'
import { getMockCourseBySlug, getRecommendedUpsellCourses } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function AlunoCursoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()
  const upsells = getRecommendedUpsellCourses(slug)

  return (
    <AlunoShell title={course.title} description="Tela mockada de consumo do curso. Ela ajuda a fechar o desenho da jornada do aluno com aulas gratis, destravamento de conteudo, video, materiais, oferta e progresso.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/aluno" className="text-sm font-semibold text-[#0369a1] hover:underline">? Voltar para o campus</Link>
        <Link href={`/aluno/ofertas/${course.slug}`} className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Ver oferta</Link>
        <Link href={`/aluno/checkout/${course.slug}`} className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Ir para checkout</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="overflow-hidden rounded-[28px] border border-[#e2e8f0] bg-[#0f172a] p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Player mockado</p>
                <h2 className="mt-2 text-2xl font-black">{course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'}</h2>
                <p className="mt-2 text-sm text-white/70">Espaco reservado para player, materiais complementares e continuidade da aula.</p>
              </div>
              <div className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{course.videoProvider}</div>
            </div>
            <div className="mt-6 h-64 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,#1e293b,#0f172a)] p-6">
              <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-white/20 text-center text-sm text-white/60">Player de aula mockado com suporte previsto a {course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: course.totalLessons }).slice(0, 6).map((_, index) => {
              const isFree = index < course.freeLessons
              return (
                <div key={index} className="flex flex-col gap-3 rounded-[24px] border border-[#e2e8f0] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#0f172a]">Aula {index + 1} ? Fundamentos aplicados</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${isFree ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#a16207]'}`}>{isFree ? 'Gratis' : 'Premium'}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#64748b]">{isFree ? 'Aula liberada para descoberta e ativacao da oferta.' : 'Aula disponivel apos matricula, assinatura ou compra individual.'}</p>
                  </div>
                  <div className="rounded-full bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#334155]">{isFree ? 'Assistir agora' : 'Bloqueada no mock'}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0ea5e9]">Oferta</p>
            <h2 className="mt-2 text-2xl font-black text-[#0f172a]">{course.price === 0 ? 'Curso gratuito' : formatBRL(course.price)}</h2>
            <p className="mt-2 text-sm text-[#64748b]">{course.subtitle}</p>
            <div className="mt-5 grid gap-3">
              <InfoRow label="Modelo" value={course.accessModel} />
              <InfoRow label="Aulas gratis" value={`${course.freeLessons}`} />
              <InfoRow label="Modulos" value={`${course.totalModules}`} />
              <InfoRow label="Aulas" value={`${course.totalLessons}`} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/aluno/ofertas/${course.slug}`} className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Ver condicoes</Link>
              <Link href={`/aluno/checkout/${course.slug}`} className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Checkout mockado</Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#e2e8f0] bg-gradient-to-br from-[#eff6ff] to-[#e0f2fe] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0369a1]">Progresso mockado</p>
            <p className="mt-3 text-4xl font-black text-[#0f172a]">62%</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70"><div className="h-full w-[62%] rounded-full bg-[#0ea5e9]" /></div>
            <p className="mt-3 text-sm text-[#075985]">Voce concluiu o modulo de entrada e esta pronto para avancar.</p>
          </div>

          <div className="rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f97316]">Upsell mockado</p>
            <h3 className="mt-2 text-xl font-black text-[#0f172a]">Quem compra este curso tambem olha</h3>
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
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm"><span className="text-[#64748b]">{label}</span><span className="font-semibold capitalize text-[#0f172a]">{value}</span></div> }
