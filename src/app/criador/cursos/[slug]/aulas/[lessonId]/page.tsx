import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CriadorShell } from '@/components/cursos-portais/criador-shell'
import { getMockCourseBySlug, mockLessonAssets } from '@/lib/mock/cursos-portais'

export default async function CriadorLessonEditorPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()

  return (
    <CriadorShell title={`Editor de aula ? ${course.title}`} description="Mock do editor de aula. Aqui estamos planejando fluxo de conteudo, materiais, aula gratuita vs premium e configuracao do player por YouTube ou Panda Video.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/criador/cursos/${course.slug}`} className="text-sm font-semibold text-[#9a3412] hover:underline">? Voltar para o curso</Link>
        <span className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#9a3412]">Aula mockada: {lessonId}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Estrutura da aula</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MockField label="Titulo" value="Fundamentos aplicados de ocupacao de espaco" />
            <MockField label="Status" value="Publicado" />
            <MockField label="Tipo de acesso" value={course.freeLessons > 0 ? 'Aula gratuita de entrada' : 'Aula premium'} />
            <MockField label="Provider de video" value={course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'} />
          </div>
          <div className="mt-5 rounded-[24px] border border-[#e5dccd] bg-[#fffaf2] p-5">
            <p className="text-sm font-semibold text-[#111827]">Resumo editorial</p>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">A aula de abertura apresenta os pilares da metodologia, prepara o aluno para o restante do curso e funciona como principal ponto de ativacao da oferta hibrida.</p>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Materiais vinculados</p>
          <div className="mt-4 space-y-3">
            {mockLessonAssets.map((asset) => (
              <div key={asset.id} className="rounded-[22px] border border-[#e5dccd] bg-[#faf7f0] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#111827]">{asset.label}</p>
                    <p className="text-xs text-[#6b7280]">{asset.kind}{asset.provider ? ` ? ${asset.provider}` : ''}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">{asset.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CriadorShell>
  )
}
function MockField({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#faf7f0] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">{label}</p><p className="mt-1 font-semibold text-[#111827]">{value}</p></div> }
