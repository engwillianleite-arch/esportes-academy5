import Link from 'next/link'
import { ClubeShell } from '@/components/competicoes-portais/clube-shell'
import { mockTeamPosts } from '@/lib/mock/competicoes-portais'

export default function ClubeTeamBlogPage() {
  return (
    <ClubeShell title="Blog da equipe" description="Hub editorial do clube para posts da campanha, comunicacao interna e memoria competitiva dos atletas.">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Narrativa da equipe</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Posts e status editoriais</h2>
            </div>
            <Link href="/clube/equipe/blog/editor" className="rounded-full bg-[#14532d] px-4 py-2 text-sm font-semibold text-white">Editar blog</Link>
          </div>
          <div className="mt-6 space-y-4">
            {mockTeamPosts.map((post) => (
              <article key={post.id} className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#64748b]">{post.publishedAt} • {post.author}</p>
                    <h3 className="mt-2 text-xl font-black text-[#0f172a]">{post.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{post.excerpt}</p>
                  </div>
                  <span className={post.status === 'publicado' ? 'rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]' : 'rounded-full bg-[#fef3c7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a16207]'}>{post.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="space-y-6">
          <div className="rounded-[32px] border border-[#dcfce7] bg-[#14532d] p-6 text-white shadow-sm">
            <h3 className="text-lg font-bold">Uso estrategico do blog</h3>
            <div className="mt-4 grid gap-3">
              <PillLine title="Comunicacao com familias" body="Convocacao, horarios, uniforme e orientacoes praticas." />
              <PillLine title="Valor percebido" body="Transforma a campanha em conteudo e proximidade com a comunidade." />
              <PillLine title="Memoria esportiva" body="Ajuda a compor a futura jornada do atleta na plataforma." />
            </div>
          </div>
          <div className="rounded-[32px] border border-[#dcfce7] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Ferramentas de gestao</p>
            <div className="mt-4 space-y-3">
              <Tool title="Calendario de publicacao" body="Planejar pre-competicao, bastidores e fechamento." />
              <Tool title="Rascunhos de equipe" body="Organizar conteudos antes de subir para a comunidade." />
              <Tool title="Linha editorial por categoria" body="Segmentar comunicacao por campanha e faixa etaria." />
            </div>
          </div>
        </aside>
      </div>
    </ClubeShell>
  )
}
function Tool({ title, body }: { title: string; body: string }) { return <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-4"><p className="font-semibold text-[#0f172a]">{title}</p><p className="mt-1 text-sm text-[#64748b]">{body}</p></div> }
function PillLine({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-white/70">{body}</p></div> }
