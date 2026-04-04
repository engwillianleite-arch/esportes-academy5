import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

const mockFields = [
  { id: 'field-1', name: 'Arena Sul', address: 'Rua das Laranjeiras, 120 • Curitiba', status: 'principal' },
  { id: 'field-2', name: 'Centro Tecnico Norte', address: 'Av. do Atleta, 88 • Curitiba', status: 'apoio' },
]

export default async function OrganizadorCompetitionFieldsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <OrganizadorShell title={`${competition.title} • Campos`} description="Cadastro e organizacao dos campos da competicao, com foco no fluxo operacional do organizador e linguagem visual alinhada ao portal competitivo.">
      <div className="space-y-6">
        <section className="rounded-[34px] border border-[#1f2937] bg-[linear-gradient(135deg,#071120_0%,#111827_48%,#0ea5e9_165%)] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Menu Campos</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Estrutura fisica da competicao</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Defina os campos oficiais usados no calendario, sorteio de jogos e operacao de rodada. A experiencia segue o portal do organizador e aproveita a referencia funcional que voce enviou.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/organizador/competicoes/${competition.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Tabela</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/times`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Times</Link>
              <Link href={`/organizador/competicoes/${competition.slug}/atletas`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Atletas</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[34px] border border-[#1f2937] bg-[#0b1017] p-8 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Novo campo</p>
              <h3 className="mt-3 text-4xl font-black tracking-tight">Criar campo do campeonato</h3>
            </div>

            <div className="mx-auto mt-10 max-w-xl rounded-[30px] border border-white/10 bg-[#1a202a] px-6 py-8 shadow-[0_18px_40px_rgba(0,0,0,.22)]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[26px] border border-white/10 bg-white/5 text-3xl font-black text-white/22">EA</div>
              <div className="mt-8 space-y-4">
                <Field label="Nome do campo" placeholder="Nome do campo" />
                <Field label="Endereco" placeholder="Endereco" textarea />
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button className="rounded-[16px] border border-white/12 px-5 py-3 text-sm font-semibold text-white/72">Cancelar</button>
                <button className="rounded-[16px] bg-[#18c22e] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(24,194,46,.22)]">Confirmar</button>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#1f2937] bg-[#0b1017] p-6 text-white shadow-[0_22px_50px_rgba(2,6,23,.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7dd3fc]">Campos cadastrados</p>
                <h3 className="mt-2 text-2xl font-black">Base operacional da rodada</h3>
              </div>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">{mockFields.length} campos</span>
            </div>

            <div className="mt-6 space-y-4">
              {mockFields.map((field) => (
                <article key={field.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xl font-black text-white">{field.name}</p>
                      <p className="mt-2 text-sm text-white/58">{field.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={field.status === 'principal' ? 'rounded-full bg-[#16a34a]/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#86efac]' : 'rounded-full bg-[#e0f2fe]/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7dd3fc]'}>{field.status === 'principal' ? 'Campo principal' : 'Campo de apoio'}</span>
                      <button className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/80">Editar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-[#38bdf8]/25 bg-[#0f172a] p-5">
              <p className="text-sm font-semibold text-white">Como este modulo conversa com o restante</p>
              <div className="mt-4 grid gap-3">
                <InfoLine title="Tabela e sorteio" body="Os campos entram como opcoes de alocacao para rodada e confrontos." />
                <InfoLine title="Calendario" body="A agenda da competicao pode distribuir horarios por campo e rodada." />
                <InfoLine title="Blog da competicao" body="Cada campo pode ganhar contexto editorial para logistica e orientacoes." />
              </div>
            </div>
          </section>
        </div>
      </div>
    </OrganizadorShell>
  )
}

function Field({ label, placeholder, textarea = false }: { label: string; placeholder: string; textarea?: boolean }) {
  return (
    <label className="block rounded-[20px] border border-white/10 bg-white/6 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">{label}</span>
      {textarea ? (
        <textarea placeholder={placeholder} rows={4} className="mt-3 w-full resize-none border-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/34" />
      ) : (
        <input placeholder={placeholder} className="mt-3 w-full border-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/34" />
      )}
    </label>
  )
}

function InfoLine({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm text-white/68">{body}</p></div>
}
