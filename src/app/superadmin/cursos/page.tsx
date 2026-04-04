import Link from 'next/link'
import { mockCourses, mockCreators } from '@/lib/mock/cursos-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function SuperAdminCursosPage() {
  const platformDefaultPct = 25
  const activeCourses = mockCourses.filter((course) => course.status === 'publicado').length
  const freeCourses = mockCourses.filter((course) => course.accessModel === 'gratuito').length
  const hybridCourses = mockCourses.filter((course) => course.accessModel === 'hibrido').length

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f97316]">Cursos ? Governanca</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a]">Portal SuperAdmin de Cursos</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569]">Camada de controle do marketplace educacional da plataforma. Nesta fase, os dados sao mockados para definirmos o MVP de cursos com CPF unico, produtores habilitados, ofertas gratuitas, pagas e hibridas.</p>
        </div>
        <div className="rounded-3xl border border-[#fdba74] bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a3412]">Split padrao da plataforma</p>
          <p className="mt-2 text-4xl font-black text-[#7c2d12]">{platformDefaultPct}%</p>
          <p className="mt-2 text-sm text-[#9a3412]">Campo de governanca global do SuperAdmin. O restante da composicao e distribuido entre criador e escola.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Criadores habilitados" value={mockCreators.length.toString()} helper="Treinadores, escolas e especialistas" />
        <StatCard label="Cursos publicados" value={activeCourses.toString()} helper="Ofertas prontas para o portal do aluno" />
        <StatCard label="Cursos gratuitos" value={freeCourses.toString()} helper="Estrategia de entrada e aquisicao" />
        <StatCard label="Cursos hibridos" value={hybridCourses.toString()} helper="Aulas gratis + restante pago" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">Mapa de ofertas da plataforma</h2>
              <p className="text-sm text-[#64748b]">Referencia Hotmart no essencial: catalogo, modelo comercial, split e governanca central.</p>
            </div>
            <div className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">CPF unico em todos os portais</div>
          </div>

          <div className="mt-5 space-y-4">
            {mockCourses.map((course) => (
              <div key={course.id} className="rounded-3xl border border-[#e2e8f0] bg-[#fcfcfd] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1d4ed8]">{course.accessModel}</span>
                      <span className="rounded-full bg-[#ecfccb] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#4d7c0f]">{course.videoProvider === 'youtube' ? 'YouTube' : 'Panda Video'}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#0f172a]">{course.title}</h3>
                    <p className="mt-1 text-sm text-[#64748b]">{course.subtitle}</p>
                    <p className="mt-3 text-xs text-[#94a3b8]">Criador: {course.creatorName} ? CPF {course.creatorCpf} ? Escola: {course.schoolName}</p>
                  </div>

                  <div className="min-w-[220px] rounded-2xl bg-[#0f172a] p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Composicao mockada</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <SplitBadge label="Plataforma" value={course.platformSharePct} />
                      <SplitBadge label="Criador" value={course.creatorSharePct} />
                      <SplitBadge label="Escola" value={course.schoolSharePct} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <MiniMeta label="Preco" value={course.price == 0 ? 'Gratis' : formatBRL(course.price)} />
                  <MiniMeta label="Aulas gratis" value={`${course.freeLessons}`} />
                  <MiniMeta label="Modulos" value={`${course.totalModules}`} />
                  <MiniMeta label="Aulas" value={`${course.totalLessons}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a]">Produtores habilitados</h2>
            <div className="mt-4 space-y-3">
              {mockCreators.map((creator) => (
                <div key={creator.id} className="rounded-2xl border border-[#e2e8f0] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#0f172a]">{creator.name}</p>
                      <p className="text-xs text-[#64748b]">{creator.type} ? CPF {creator.cpf}</p>
                    </div>
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">{creator.activeCourses} cursos</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#475569]">
                    <p>Escola: {creator.schoolName}</p>
                    <p>Alunos: {creator.students}</p>
                    <p className="col-span-2">GMV mockado: {formatBRL(creator.monthlyGross)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e2e8f0] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white shadow-sm">
            <h2 className="text-lg font-bold">Portais independentes previstos</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li>SuperAdmin controla governanca, modulos e split padrao.</li>
              <li>Criador trabalha catalogo, estrutura, aulas e modelo comercial.</li>
              <li>Aluno consome conteudo, aulas gratuitas, progresso e avaliacoes.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/criador" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">Abrir portal do criador</Link>
              <Link href="/aluno" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Abrir portal do aluno</Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-5 shadow-sm"><p className="text-sm text-[#64748b]">{label}</p><p className="mt-2 text-3xl font-black text-[#0f172a]">{value}</p><p className="mt-2 text-xs text-[#94a3b8]">{helper}</p></div>
}
function SplitBadge({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white/10 px-3 py-2"><p className="text-[10px] uppercase tracking-[0.14em] text-white/60">{label}</p><p className="mt-1 text-lg font-black">{value}%</p></div>
}
function MiniMeta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f8fafc] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-[#94a3b8]">{label}</p><p className="mt-1 font-semibold text-[#0f172a]">{value}</p></div>
}
