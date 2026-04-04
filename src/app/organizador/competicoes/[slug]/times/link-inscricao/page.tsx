import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug, mockCompetitionAssets } from '@/lib/mock/competicoes-portais'

export default async function OrganizadorCompetitionRegistrationLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  const assets = mockCompetitionAssets.filter((asset) => asset.competitionSlug === competition.slug)
  const sponsors = assets.filter((asset) => asset.area === 'patrocinador')
  const partners = assets.filter((asset) => asset.area === 'parceiro')
  const publicUrl = `https://esportesacademy.com/competicoes/${competition.slug}`

  return (
    <OrganizadorShell title={`${competition.title} • Link de inscricao`} description="Tela mockada para publicar o site da competicao, copiar o link de inscricao e ativar vitrines comerciais de patrocinadores e parceiros.">
      <div className="space-y-6">
        <section className="rounded-[30px] border border-[#facc15]/35 bg-[#facc15] px-5 py-4 text-sm leading-6 text-[#422006] shadow-sm">
          Compartilhe o link abaixo. Por ele sera possivel acompanhar ou se inscrever no campeonato. Nao sera possivel fazer alteracoes estruturais por esse acesso.
        </section>

        <section className="rounded-[30px] border border-[#dbe7ff] bg-white p-6 shadow-sm">
          <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-[26px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0284c7]">Configuracao do site</p>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-[20px] bg-white px-4 py-4 shadow-sm">
                <span className="font-semibold text-[#0f172a]">Status do site</span>
                <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#166534]">Online</span>
              </div>
              <div className="mt-5 rounded-[20px] border border-[#dbeafe] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#0f172a]">Link do site do seu campeonato</p>
                <div className="mt-3 rounded-[16px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{publicUrl}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="rounded-[14px] bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white">Abrir site</button>
                  <button className="rounded-[14px] border border-[#cbd5e1] px-4 py-3 text-sm font-semibold text-[#334155]">Copiar link</button>
                  <button className="rounded-[14px] bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white">Enviar via WhatsApp</button>
                </div>
              </div>
              <div className="mt-5 rounded-[20px] border border-[#e2e8f0] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#0f172a]">Configuracao de inscricoes</p>
                <div className="mt-4 inline-flex overflow-hidden rounded-full border border-[#e2e8f0] bg-[#f1f5f9]">
                  <span className="px-4 py-2 text-sm font-semibold text-[#64748b]">Abertas</span>
                  <span className="bg-[#f43f5e] px-4 py-2 text-sm font-semibold text-white">Fechadas</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 border-b border-[#dbe7ff] pb-4">
                <a href="#detalhes" className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Detalhes</a>
                <a href="#patrocinadores" className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Patrocinadores</a>
                <a href="#parceiros" className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Parceiros</a>
              </div>

              <section id="detalhes" className="rounded-[28px] border border-[#3b82f6] bg-[#3b82f6] px-5 py-4 text-center text-sm font-semibold text-white">
                Clique aqui e veja o exemplo de um site completo.
              </section>

              <section id="patrocinadores" className="rounded-[30px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Patrocinadores</p>
                    <h3 className="mt-2 text-2xl font-black">Banners comerciais da competicao</h3>
                  </div>
                  <button className="rounded-[14px] border border-white/20 px-4 py-3 text-sm font-semibold text-white">Novo patrocinador</button>
                </div>
                <div className="mt-5 space-y-5">
                  {sponsors.map((asset) => (
                    <AssetCard key={asset.id} title={asset.title} subtitle={asset.subtitle} imageHint={asset.imageHint} targetUrl={asset.targetUrl} />
                  ))}
                </div>
              </section>

              <section id="parceiros" className="rounded-[30px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Parceiros</p>
                    <h3 className="mt-2 text-2xl font-black">Vitrine institucional da competicao</h3>
                  </div>
                  <button className="rounded-[14px] border border-white/20 px-4 py-3 text-sm font-semibold text-white">Novo parceiro</button>
                </div>
                <div className="mt-5 space-y-5">
                  {partners.map((asset) => (
                    <AssetCard key={asset.id} title={asset.title} subtitle={asset.subtitle} imageHint={asset.imageHint} targetUrl={asset.targetUrl} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-[16px] border border-[#cbd5e1] px-4 py-3 text-sm font-semibold text-[#334155]">Voltar aos times</Link>
          <Link href={`/organizador/competicoes/${competition.slug}`} className="rounded-[16px] bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white">Voltar a competicao</Link>
        </section>
      </div>
    </OrganizadorShell>
  )
}

function AssetCard({ title, subtitle, imageHint, targetUrl }: { title: string; subtitle: string; imageHint: string; targetUrl: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-center text-sm text-white/68">Este banner ira aparecer no site e app na area:</p>
      <h4 className="mt-2 text-center text-2xl font-black text-white">{title}</h4>
      <div className="mt-5 flex h-52 items-center justify-center rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,#0b223d_0%,#0f3f67_52%,#22c55e_160%)] p-6 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/62">Preview visual</p>
          <p className="mt-3 text-3xl font-black text-white">Esportes Academy</p>
          <p className="mt-2 text-sm text-white/74">{subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-white/44">{imageHint}</p>
      <button className="mx-auto mt-3 block rounded-[12px] border border-white/20 px-4 py-2 text-xs font-semibold text-white">Escolher imagem</button>
      <label className="mt-5 block border-t border-white/10 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/46">URL ao clicar</span>
        <input defaultValue={targetUrl} className="mt-3 w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
      </label>
    </article>
  )
}
