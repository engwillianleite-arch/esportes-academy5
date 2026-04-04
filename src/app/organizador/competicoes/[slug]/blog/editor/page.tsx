import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionBlogEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`Editor de blog • ${competition.title}`} description="Editor mockado para planejar, escrever e publicar conteudo oficial da competicao.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Editor da postagem</p>
          <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Novo comunicado oficial</h2>
          <div className="mt-6 grid gap-4">
            <Field label="Titulo" value="Tabela oficial da fase de grupos" />
            <Field label="Slug editorial" value="tabela-oficial-fase-de-grupos" />
            <Field label="Autor" value="Equipe Liga Sul" />
            <EditorArea label="Resumo" value="Publicacao com grupos, horarios, orientacoes de chegada e links de credenciamento para as delegacoes." />
            <EditorArea label="Corpo da materia" value="Bloco de texto mockado com estrutura profissional: contexto, orientacoes, chamada de atencao, anexos e proximo passo para clubes e atletas." />
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Publicacao</p>
            <div className="mt-4 space-y-3">
              <Metric title="Canal" value="Blog da competicao" />
              <Metric title="Status" value="Rascunho" />
              <Metric title="Agendamento" value="Hoje, 18:30" />
              <Metric title="CTA" value="Abrir regulamento + tabela" />
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dbe7ff] bg-[#0f172a] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Boas praticas de UX editorial</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Leitura escaneavel" body="Titulos fortes, blocos curtos e CTA claro para a acao seguinte." />
              <PillLine title="Operacao confiavel" body="Status, canal e horario visiveis antes da publicacao." />
              <PillLine title="Consistencia visual" body="Blog tratado como ferramenta de operacao, nao apenas vitrine." />
            </div>
          </div>
        </section>
      </div>
    </OrganizadorShell>
  )
}
function Field({ label, value }: { label: string; value: string }) { return <label className="block rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span><input defaultValue={value} className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-medium text-[#0f172a] outline-none" /></label> }
function EditorArea({ label, value }: { label: string; value: string }) { return <label className="block rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span><textarea defaultValue={value} rows={6} className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-[#0f172a] outline-none" /></label> }
function Metric({ title, value }: { title: string; value: string }) { return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-[#94a3b8]">{title}</p><p className="mt-1 font-semibold text-[#0f172a]">{value}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
