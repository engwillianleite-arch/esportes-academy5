import { ClubeShell } from '@/components/competicoes-portais/clube-shell'

export default function ClubeTeamBlogEditorPage() {
  return (
    <ClubeShell title="Editor do blog da equipe" description="Editor mockado para o clube escrever comunicados, bastidores e cronicas da campanha competitiva.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Editor da postagem</p>
          <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Novo post para familias e atletas</h2>
          <div className="mt-6 grid gap-4">
            <Field label="Titulo" value="Orientacoes finais para a viagem da delegacao" />
            <Field label="Categoria editorial" value="Operacao da equipe" />
            <Field label="Autor" value="Coordenacao do clube" />
            <EditorArea label="Resumo" value="Comunicado com horario de encontro, uniforme, documentos e check-list dos atletas." />
            <EditorArea label="Corpo" value="Estrutura de texto mockada com blocos curtos, leitura escaneavel e CTA claro para o proximo passo dos responsaveis." />
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Publicacao</p>
            <div className="mt-4 space-y-3">
              <Metric title="Canal" value="Blog da equipe" />
              <Metric title="Status" value="Rascunho" />
              <Metric title="Destino" value="Atletas + responsaveis" />
              <Metric title="CTA" value="Confirmar presenca na viagem" />
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dcfce7] bg-[#14532d] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Boas praticas de UX</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Informacao acionavel" body="Todo post precisa terminar com proximo passo claro." />
              <PillLine title="Tom operacional" body="Menos ruido e mais previsibilidade para equipe e familias." />
              <PillLine title="Leitura mobile" body="Blocos curtos e hierarquia forte para consulta rapida." />
            </div>
          </div>
        </section>
      </div>
    </ClubeShell>
  )
}
function Field({ label, value }: { label: string; value: string }) { return <label className="block rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span><input defaultValue={value} className="mt-3 w-full border-0 bg-transparent p-0 text-sm font-medium text-[#0f172a] outline-none" /></label> }
function EditorArea({ label, value }: { label: string; value: string }) { return <label className="block rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span><textarea defaultValue={value} rows={6} className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-[#0f172a] outline-none" /></label> }
function Metric({ title, value }: { title: string; value: string }) { return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-[#94a3b8]">{title}</p><p className="mt-1 font-semibold text-[#0f172a]">{value}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
