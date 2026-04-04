import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`Editar • ${competition.title}`} description="Editor mockado da competicao com foco em parametrizacao, comercializacao, publicacao e operacao da disputa.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Editor da competicao</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Parametros operacionais</h2>
            </div>
            <span className="rounded-full bg-[#e0f2fe] px-4 py-2 text-sm font-semibold text-[#0369a1]">mock sem persistencia</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Nome da competicao" value={competition.title} />
            <Field label="Categoria" value={competition.category} />
            <Field label="Esporte" value={competition.sport} />
            <Field label="Local" value={competition.location ?? ''} />
            <Field label="Periodo" value={competition.periodLabel ?? ''} />
            <Field label="Prazo de inscricao" value={competition.registrationDeadline ?? ''} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Tipo de disputa" value={competition.disputeType} />
            <Field label="Modelo comercial" value={competition.pricingModel} />
            <Field label="Cobranca" value={competition.chargeMode} />
          </div>
          <div className="mt-6 rounded-[28px] border border-[#dbeafe] bg-[#f8fbff] p-5">
            <p className="text-sm font-semibold text-[#0f172a]">Estrutura financeira</p>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="Taxa" value={String(competition.entryFee)} />
              <Field label="Plataforma %" value={String(competition.platformSharePct)} />
              <Field label="Organizador %" value={String(competition.organizerSharePct)} />
              <Field label="Clube %" value={String(competition.clubSharePct)} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#dbe7ff] bg-[#0f172a] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Publicacao e qualidade</h3>
            <div className="mt-4 grid gap-3">
              <StatusRow title="Brief comercial" body="Oferta, taxa e split revisados pela operacao" state="ok" />
              <StatusRow title="Jornada de inscricao" body="Convite, inscricao direta e link individual desenhados" state="ok" />
              <StatusRow title="Regulamento oficial" body="Ultima revisao pendente do juridico" state="attention" />
              <StatusRow title="Blog oficial" body="Calendario editorial pronto para publicar" state="ok" />
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Acoes rapidas</p>
            <div className="mt-4 grid gap-3">
              <ActionCard title="Publicar competicao" body="Liberar catalogo e convites para clubes elegiveis." />
              <ActionCard title="Duplicar configuracao" body="Reaproveitar formato e regras em uma nova edicao." />
              <ActionCard title="Abrir blog" body="Editar comunicados, noticias e tabela do evento." />
            </div>
          </div>
        </section>
      </div>
    </OrganizadorShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <label className="block rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span><input defaultValue={value} className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-medium text-[#0f172a] outline-none" /></label>
}
function StatusRow({ title, body, state }: { title: string; body: string; state: 'ok' | 'attention' }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><div className="flex items-center gap-2"><span className={state === 'ok' ? 'h-2.5 w-2.5 rounded-full bg-[#22c55e]' : 'h-2.5 w-2.5 rounded-full bg-[#f59e0b]'} /><p className="font-semibold">{title}</p></div><p className="mt-1 text-sm text-white/70">{body}</p></div>
}
function ActionCard({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><p className="font-semibold text-[#0f172a]">{title}</p><p className="mt-1 text-sm text-[#64748b]">{body}</p></div>
}
