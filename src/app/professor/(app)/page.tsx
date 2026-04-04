import Link from 'next/link'
import { carregarResumoProfessor, formatTurmaSchedule } from '@/lib/professor-actions'

export default async function ProfessorHomePage() {
  const result = await carregarResumoProfessor()

  if ('error' in result) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.36),_transparent_28%),linear-gradient(135deg,#071120_0%,#10243f_45%,#f5fbff_130%)] p-6 shadow-[0_28px_70px_rgba(15,23,42,.18)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/90">Jornada do professor</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Ola, {result.professorNome}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
              Sua operacao do dia esta pronta em <span className="font-semibold text-white">{result.escolaNome}</span>.
              Abra chamada, acompanhe suas turmas e mantenha a rotina de aula organizada em poucos toques.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/professor/chamada" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_14px_30px_rgba(255,255,255,.18)]">
                Abrir chamada
              </Link>
              <Link href="/professor/turmas" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                Ver minhas turmas
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard title="Turmas" value={`${result.turmas.length}`} accent="text-sky-300" />
            <MetricCard title="Aulas hoje" value={`${result.aulasHoje.length}`} accent="text-cyan-200" />
            <MetricCard title="Alunos ativos" value={`${result.totalAlunos}`} accent="text-amber-200" />
            <MetricCard title="Alertas essenciais" value={`${result.alertasEssenciais}`} accent="text-rose-200" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Agenda do dia</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Suas aulas de hoje</h2>
            </div>
            <Link href="/professor/chamada" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Operar chamada
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {result.aulasHoje.length === 0 && (
              <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Nenhuma aula vinculada para hoje.
              </div>
            )}
            {result.aulasHoje.map((turma) => (
              <article key={turma.id} className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{turma.nome}</p>
                    <p className="mt-1 text-sm text-slate-500">{turma.modalidade} • {formatTurmaSchedule(turma)}</p>
                    <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {turma.local ?? 'Local a definir'} • {turma.matriculados} alunos
                    </p>
                  </div>
                  <Link href="/professor/chamada" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(14,165,233,.22)]">
                    Fazer chamada
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Atalhos</p>
            <div className="mt-4 grid gap-3">
              <QuickLink href="/professor/chamada" title="Fazer chamada" body="Abra a operacao rapida das suas turmas e registre presencas." />
              <QuickLink href="/professor/turmas" title="Ver minhas turmas" body="Acesse horarios, modalidades, locais e volume de alunos." />
              <QuickLink href="/selecionar-escola" title="Trocar contexto" body="Alterne para outra escola ou para outro perfil do mesmo usuario." />
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-sky-100 bg-[linear-gradient(135deg,#f5fbff_0%,#eef8ff_42%,#ffffff_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Alertas essenciais do atleta</p>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-5xl font-black tracking-tight text-slate-950">{result.alertasEssenciais}</p>
              <p className="pb-2 text-sm font-medium text-slate-500">itens pedem atencao</p>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Contagem resumida de atletas das suas turmas com exames ou atestados proximos do vencimento.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">{title}</p>
      <p className={`mt-2 text-4xl font-black tracking-tight ${accent}`}>{value}</p>
    </div>
  )
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 transition-all hover:border-sky-200 hover:bg-sky-50">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </Link>
  )
}
