import Link from 'next/link'
import { AlunoShell } from '@/components/cursos-portais/aluno-shell'
import { mockCourses, mockStudentHighlights } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function AlunoPage() {
  const featuredCourses = mockCourses.filter((course) => course.status === 'publicado')

  return (
    <AlunoShell title="Seu campus de aprendizagem" description="Mock inicial do portal do aluno. Aqui planejamos descoberta, continuidade, aulas gratis, progressao, oferta e checkout em uma experiencia independente do portal editorial.">
      <div className="grid gap-4 md:grid-cols-3">
        {mockStudentHighlights.map((item) => (
          <div key={item.title} className="rounded-[28px] border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#64748b]">{item.title}</p>
            <p className="mt-2 text-3xl font-black text-[#0f172a]">{item.value}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">{item.helper}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0ea5e9]">Catalogo do aluno</p>
            <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Explore cursos por modelo de acesso</h2>
          </div>
          <div className="rounded-full bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#0369a1]">CPF unico e contexto habilitado no acesso real</div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {featuredCourses.map((course) => (
            <div key={course.id} className="group rounded-[28px] border border-[#e2e8f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1d4ed8]">{course.accessModel}</span>
                {course.freeLessons > 0 && <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">{course.freeLessons} aulas gratis</span>}
              </div>
              <h3 className="mt-4 text-xl font-black text-[#0f172a] group-hover:text-[#0369a1]">{course.title}</h3>
              <p className="mt-2 text-sm text-[#64748b]">{course.subtitle}</p>
              <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-[#0f172a]">{course.price === 0 ? 'Gratis' : formatBRL(course.price)}</p>
                  <p className="text-[#94a3b8]">{course.totalModules} modulos ? {course.totalLessons} aulas</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/aluno/ofertas/${course.slug}`} className="rounded-full border border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#334155]">Ver oferta</Link>
                  <Link href={`/aluno/cursos/${course.slug}`} className="rounded-full bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white">Abrir curso</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AlunoShell>
  )
}
