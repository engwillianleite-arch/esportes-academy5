import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CriadorShell } from '@/components/cursos-portais/criador-shell'
import { getMockCourseBySlug } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function CriadorCursoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()

  return (
    <CriadorShell title={course.title} description="Tela mockada de edicao estrategica do curso. Ela mistura visao editorial, posicionamento comercial e distribuicao de receita para ajudar a fechar o desenho antes da integracao real.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/criador" className="text-sm font-semibold text-[#9a3412] hover:underline">? Voltar para o catalogo do criador</Link>
        <Link href={`/criador/cursos/${course.slug}/aulas/aula-1`} className="rounded-full border border-[#d6c3a5] px-4 py-2 text-sm font-semibold text-[#7c2d12]">Editar aula</Link>
        <Link href={`/criador/cursos/${course.slug}/quizzes/quiz-1`} className="rounded-full border border-[#d6c3a5] px-4 py-2 text-sm font-semibold text-[#7c2d12]">Editar quiz</Link>
        <Link href={`/criador/cursos/${course.slug}/midia`} className="rounded-full bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white">Biblioteca de midia</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-[30px] border border-[#eadfcb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Oferta comercial</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetaCard label="Modelo" value={course.accessModel} />
              <MetaCard label="Preco" value={course.price === 0 ? 'Gratis' : formatBRL(course.price)} />
              <MetaCard label="Aulas gratis" value={`${course.freeLessons}`} />
              <MetaCard label="Provider" value={course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'} />
            </div>
          </div>
          <div className="rounded-[30px] border border-[#eadfcb] bg-[#111827] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Split da oferta</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <SplitCard label="Plataforma" value={course.platformSharePct} />
              <SplitCard label="Criador" value={course.creatorSharePct} />
              <SplitCard label="Escola" value={course.schoolSharePct} />
            </div>
            <p className="mt-4 text-sm text-white/70">No MVP, o split fica visivel e configuravel no desenho do produto. O repasse financeiro real entra depois.</p>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Estrutura do curso</p>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">Mapa editorial mockado</h2>
          <div className="mt-6 space-y-4">
            {Array.from({ length: course.totalModules }).map((_, moduleIndex) => (
              <div key={moduleIndex} className="rounded-[24px] border border-[#e5dccd] bg-[#fffaf2] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Modulo {moduleIndex + 1}</p>
                    <p className="text-sm text-[#6b7280]">{moduleIndex === 0 && course.freeLessons > 0 ? 'Modulo de entrada com aulas gratuitas e posicionamento da oferta.' : 'Modulo premium com conteudo completo, material complementar e avaliacao.'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">{moduleIndex === 0 && course.freeLessons > 0 ? 'Abertura gratuita' : 'Conteudo pago'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CriadorShell>
  )
}
function MetaCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#faf7f0] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">{label}</p><p className="mt-1 font-semibold text-[#111827]">{value}</p></div> }
function SplitCard({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-white/55">{label}</p><p className="mt-1 text-2xl font-black">{value}%</p></div> }
