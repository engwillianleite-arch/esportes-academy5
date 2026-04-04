import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CriadorShell } from '@/components/cursos-portais/criador-shell'
import { getMockCourseBySlug, mockLessonAssets } from '@/lib/mock/cursos-portais'

export default async function CriadorMediaLibraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = getMockCourseBySlug(slug)
  if (!course) notFound()

  return (
    <CriadorShell title={`Biblioteca de midia ? ${course.title}`} description="Mock da biblioteca de midia do criador. Aqui planejamos organizacao por tipo, provider de video e estado editorial dos materiais.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/criador/cursos/${course.slug}`} className="text-sm font-semibold text-[#9a3412] hover:underline">? Voltar para o curso</Link>
        <span className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#9a3412]">Provider principal: {course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Biblioteca editorial</p>
          <div className="mt-4 space-y-3">
            {mockLessonAssets.map((asset) => (
              <div key={asset.id} className="rounded-[24px] border border-[#e5dccd] bg-[#fffaf2] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#111827]">{asset.label}</p>
                    <p className="text-xs text-[#6b7280]">Tipo: {asset.kind}{asset.provider ? ` ? ${asset.provider}` : ''}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">{asset.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#eadfcb] bg-[#111827] p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Providers previstos</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="font-semibold">YouTube</p>
                <p className="mt-1 text-sm text-white/70">Bom para entrada, alcance e materiais abertos.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="font-semibold">Panda Video</p>
                <p className="mt-1 text-sm text-white/70">Bom para ambiente mais controlado e premium.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Leituras de produto</p>
            <ul className="mt-4 space-y-2 text-sm text-[#6b7280]">
              <li>? o criador precisa saber onde cada arquivo entra na aula</li>
              <li>? o estado do material deve ser visivel sem abrir o editor</li>
              <li>? a biblioteca precisa conversar com aula, quiz e oferta</li>
            </ul>
          </div>
        </section>
      </div>
    </CriadorShell>
  )
}
