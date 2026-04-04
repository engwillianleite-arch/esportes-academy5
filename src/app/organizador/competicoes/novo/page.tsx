import Link from 'next/link'
import { OrganizadorShell } from '@/components/competicoes-portais/organizador-shell'

export default function OrganizadorCompetitionCreatePage() {
  return (
    <OrganizadorShell title="Criar campeonato" description="Primeira etapa do fluxo de criacao do campeonato. Aqui o organizador define a identidade basica do evento e escolhe se vai trabalhar com categorias. Depois seguimos para a configuracao das categorias e fases.">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[34px] border border-[#dbe7ff] bg-[#111827] p-6 text-white shadow-[0_20px_44px_rgba(15,23,42,.22)] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Novo campeonato</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Crie seu campeonato</h2>
            <p className="mt-3 text-sm leading-6 text-white/68">Fluxo inspirado em plataformas competitivas modernas, mantendo a identidade visual da Esportes Academy.</p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex h-36 w-36 items-center justify-center rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#082f49_0%,#172554_58%,#0ea5e9_160%)] text-center shadow-inner">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Novo</p>
                <p className="mt-2 text-xl font-black text-white">Torneio</p>
              </div>
            </div>
            <button className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white">Escolher imagem</button>
            <p className="text-xs text-white/48">Formato: png ou jpg</p>
          </div>

          <div className="mt-8 grid gap-4">
            <Field label="Nome do campeonato" placeholder="Ex.: Copa Futuro Sub13" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado" placeholder="Selecione" />
              <Field label="Cidade" placeholder="Selecione" />
            </div>
            <Field label="Data de inicio" placeholder="Ex.: 20/06/2026" />
          </div>

          <div className="mt-8 rounded-[28px] border border-[#1d4ed8]/40 bg-[#0f172a] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Possui categorias?</p>
                <p className="mt-1 text-sm text-white/60">Se sim, o proximo passo leva para a configuracao de categorias, times, grupos e fase eliminatoria.</p>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5">
                <span className="bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white">Nao</span>
                <span className="px-5 py-2 text-sm font-semibold text-white/72">Sim</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/organizador/competicoes/copa-futuro-sub13/categorias" className="rounded-[18px] bg-[#16a34a] px-6 py-4 text-center text-base font-black text-white shadow-[0_16px_30px_rgba(34,197,94,.2)]">Criar campeonato</Link>
            <Link href="/organizador" className="rounded-[18px] border border-white/12 px-6 py-4 text-center text-base font-semibold text-white/80">Voltar ao dashboard</Link>
          </div>
        </section>
      </div>
    </OrganizadorShell>
  )
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="block rounded-[22px] border border-white/10 bg-white/8 p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">{label}</span><input placeholder={placeholder} className="mt-3 w-full border-0 bg-transparent p-0 text-base text-white outline-none placeholder:text-white/38" /></label>
}
