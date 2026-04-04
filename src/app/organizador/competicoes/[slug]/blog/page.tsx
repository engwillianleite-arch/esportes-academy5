import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug, mockCompetitionPosts } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`Blog • ${competition.title}`} description="Hub editorial da competicao, com pipeline de postagem, calendario de conteudo e acesso ao editor de blog.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#dbe7ff] bg-[linear-gradient(135deg,#0f172a_0%,#172554_48%,#0ea5e9_150%)] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Blog da competicao</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{competition.competitionBlogTitle}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/74">Linha editorial profissional para regulamento, noticias, destaques, tabela e comunicados oficiais.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}/blog/editor`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">Editar blog</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/editar`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Editar competicao</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Pipeline editorial</p>
                <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Postagens e status</h3>
              </div>
              <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8]">3 frentes ativas</span>
            </div>
            <div className="mt-6 space-y-4">
              {mockCompetitionPosts.map((post) => (
                <article key={post.id} className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm text-[#64748b]">{post.publishedAt} • {post.author}</p>
                      <h4 className="mt-2 text-xl font-black text-[#0f172a]">{post.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[#64748b]">{post.excerpt}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={post.status === 'publicado' ? 'rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]' : post.status === 'agendado' ? 'rounded-full bg-[#e0f2fe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0369a1]' : 'rounded-full bg-[#fef3c7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a16207]'}>{post.status}</span>
                      <span className="rounded-full border border-[#cbd5e1] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">editar</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="space-y-6">
            <div className="rounded-[32px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0284c7]">Ferramentas editoriais</p>
              <h3 className="mt-2 text-2xl font-black text-[#0f172a]">Calendario e blocos de conteudo</h3>
              <div className="mt-5 space-y-3">
                <EditorTool title="Pre-jogo" body="Regulamento, tabela, credenciamento e patrocinadores." />
                <EditorTool title="Cobertura" body="Resultados, MVP da rodada e destaques de confrontos." />
                <EditorTool title="Pos-evento" body="Galeria, pódios, estatisticas e CTA para proxima edicao." />
              </div>
            </div>
            <div className="rounded-[32px] border border-[#dbe7ff] bg-[#0f172a] p-6 text-white shadow-sm">
              <h3 className="text-lg font-bold">Experiencia de gestao</h3>
              <div className="mt-4 grid gap-3">
                <PillLine title="Pipeline visivel" body="Rascunhos, agendados e publicados em uma mesma camada." />
                <PillLine title="Editor desacoplado" body="Ajuste de texto e publicacao sem sair do contexto da competicao." />
                <PillLine title="Operacao + conteudo" body="A mesma equipe consegue alinhar calendario, blog e comunicacao oficial." />
              </div>
            </div>
          </section>
        </div>
      </div>
    </OrganizadorShell>
  )
}
function EditorTool({ title, body }: { title: string; body: string }) { return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><p className="font-semibold text-[#0f172a]">{title}</p><p className="mt-1 text-sm text-[#64748b]">{body}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
