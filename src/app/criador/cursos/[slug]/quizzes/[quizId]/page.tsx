import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CriadorShell } from '@/components/cursos-portais/criador-shell'
import { getMockCourseBySlug } from '@/lib/mock/cursos-portais'

export default async function CriadorQuizEditorPage({ params }: { params: Promise<{ slug: string; quizId: string }> }) {
  const { slug, quizId } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()

  return (
    <CriadorShell title={`Editor de quiz ? ${course.title}`} description="Mock do editor de quiz. Aqui validamos a linguagem de configuracao de nota minima, tentativas, blocos de perguntas e ligacao do quiz com a jornada da aula.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/criador/cursos/${course.slug}`} className="text-sm font-semibold text-[#9a3412] hover:underline">? Voltar para o curso</Link>
        <span className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#9a3412]">Quiz mockado: {quizId}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Configuracao</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MockField label="Titulo" value="Quiz de consolidacao do modulo" />
              <MockField label="Nota minima" value="70 pontos" />
              <MockField label="Tentativas" value="2 tentativas" />
              <MockField label="Liberacao" value="Apos concluir a aula" />
            </div>
          </div>

          <div className="rounded-[32px] border border-[#eadfcb] bg-[#111827] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Objetivo pedagogico</p>
            <p className="mt-3 text-sm leading-6 text-white/75">Checar entendimento dos conceitos centrais da aula de entrada antes de liberar o modulo seguinte ou incentivar a compra do restante do curso.</p>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Blocos de perguntas</p>
          <div className="mt-4 space-y-4">
            {['Qual objetivo principal da ocupacao de espaco?', 'Quando a metodologia vira linguagem de treino?', 'Qual sinal mostra prontidao para avancar?'].map((question, index) => (
              <div key={question} className="rounded-[24px] border border-[#e5dccd] bg-[#fffaf2] p-5">
                <p className="font-semibold text-[#111827]">Pergunta {index + 1}</p>
                <p className="mt-2 text-sm text-[#6b7280]">{question}</p>
                <p className="mt-3 text-xs text-[#92400e]">4 alternativas mockadas ? 1 correta</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CriadorShell>
  )
}
function MockField({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#faf7f0] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">{label}</p><p className="mt-1 font-semibold text-[#111827]">{value}</p></div> }
