import { redirect } from 'next/navigation'
import { getProfessorAppContext } from '@/lib/professor-actions'
import { createClient } from '@/lib/supabase/server'
import PresencasPageClient from '@/components/presencas/presencas-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chamada do professor - Esportes Academy',
}

export default async function ProfessorChamadaPage() {
  const ctx = await getProfessorAppContext()
  if ('error' in ctx) redirect('/selecionar-escola')

  const supabase = await createClient()
  const { data: escola } = await supabase
    .from('escolas')
    .select('janela_chamada_h, fuso_horario')
    .eq('id', ctx.ctx.escolaId)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <section className="rounded-[1.9rem] border border-sky-100 bg-[linear-gradient(135deg,#f4fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Chamada</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Operacao rapida das presencas</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Registre presencas das suas turmas no contexto de <span className="font-semibold text-slate-900">{ctx.ctx.escolaNome}</span>.
              A tela abaixo continua usando a base operacional ja validada do sistema.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Professor: <span className="font-semibold text-slate-900">{ctx.ctx.professorNome}</span>
          </div>
        </div>
      </section>

      <PresencasPageClient
        escolaId={ctx.ctx.escolaId}
        janelaChamadaH={escola?.janela_chamada_h ?? 48}
        fusoHorario={escola?.fuso_horario ?? 'America/Sao_Paulo'}
      />
    </div>
  )
}
