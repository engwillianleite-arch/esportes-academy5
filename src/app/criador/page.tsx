import Link from 'next/link'
import { CriadorShell } from '@/components/cursos-portais/criador-shell'
import { mockCourses, mockCreators } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function CriadorPage() {
  const creator = mockCreators[0]
  const courses = mockCourses.filter((course) => course.creatorName === creator.name)

  return (
    <CriadorShell title="Seu estudio de cursos" description="Mock inicial do portal editorial para treinadores, escolas e especialistas. Aqui planejamos catalogo, estrutura, posicionamento comercial e a experiencia independente do criador.">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Perfil ativo</p>
            <h2 className="mt-3 text-2xl font-black text-[#111827]">{creator.name}</h2>
            <p className="mt-1 text-sm text-[#6b7280]">{creator.type} ? CPF {creator.cpf} ? Escola base {creator.schoolName}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Cursos ativos" value={`${creator.activeCourses}`} />
              <Metric label="Alunos" value={`${creator.students}`} />
              <Metric label="GMV mockado" value={formatBRL(creator.monthlyGross)} />
            </div>
          </div>

          <div className="rounded-[32px] border border-[#eadfcb] bg-[#1f2937] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Modelos comerciais previstos no MVP</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Gratuito" body="Curso aberto para ativacao, aquisicao e relacionamento." />
              <PillLine title="Pago individual" body="Oferta direta por curso, com preco fechado." />
              <PillLine title="Assinatura" body="Acesso recorrente ao catalogo elegivel." />
              <PillLine title="Hibrido" body="Aulas gratuitas de entrada com desbloqueio pago do restante." />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#eadfcb] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c2410c]">Catalogo do criador</p>
              <h2 className="mt-2 text-2xl font-black text-[#111827]">Cursos e ofertas mockadas</h2>
            </div>
            <div className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#9a3412]">MVP inspirado no essencial da Hotmart</div>
          </div>

          <div className="mt-6 space-y-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/criador/cursos/${course.slug}`} className="block rounded-[28px] border border-[#e5dccd] bg-[#fffaf2] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]">{course.accessModel}</span>
                      <span className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">{course.videoProvider}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[#111827]">{course.title}</h3>
                    <p className="mt-1 text-sm text-[#6b7280]">{course.subtitle}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-semibold text-[#111827]">{course.price === 0 ? 'Gratis' : formatBRL(course.price)}</p>
                    <p className="mt-1 text-[#6b7280]">{course.freeLessons} aulas gratis</p>
                    <p className="mt-1 text-[#6b7280]">{course.totalModules} modulos</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </CriadorShell>
  )
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#faf7f0] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">{label}</p><p className="mt-1 text-lg font-bold text-[#111827]">{value}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
