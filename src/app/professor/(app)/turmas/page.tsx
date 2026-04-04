import Link from 'next/link'
import { listarTurmasProfessor, formatTurmaSchedule } from '@/lib/professor-actions'

export default async function ProfessorTurmasPage() {
  const result = await listarTurmasProfessor()

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
      <section className="rounded-[1.9rem] border border-sky-100 bg-[linear-gradient(135deg,#f4fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Minhas turmas</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Operacao pedagógica por turma</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Visao consolidada das turmas vinculadas ao professor no contexto ativo, com foco em leitura rápida para celular e abertura direta da chamada.
            </p>
          </div>
          <Link href="/professor/chamada" className="rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(14,165,233,.22)]">
            Ir para chamada
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.rows.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            Nenhuma turma vinculada.
          </div>
        )}
        {result.rows.map((turma) => (
          <article key={turma.id} className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,.06)]">
            <div className="bg-[linear-gradient(135deg,#071120_0%,#0ea5e9_180%)] px-5 py-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/90">{turma.modalidade}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{turma.nome}</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Agenda</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{formatTurmaSchedule(turma)}</p>
                <p className="mt-1 text-sm text-slate-500">{turma.local ?? 'Local a definir'}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700">{turma.matriculados} alunos</span>
                <Link href="/professor/chamada" className="text-sm font-bold text-sky-700">Abrir chamada</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
