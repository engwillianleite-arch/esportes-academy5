import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getCompetitionBySlug } from '@/lib/mock/competicoes-portais'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function PublicCompetitionRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = getCompetitionBySlug(slug)
  if (!competition) notFound()

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f0fdf4_0%,#eff6ff_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-[#d1fae5] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Image src="/esportes-academy-logo.jpg" alt="Esportes Academy" width={64} height={64} className="rounded-[24px] border border-[#d1fae5] object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#16a34a]">Inscricao compartilhavel</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a]">{competition.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                  Mock do link publico que o clube pode enviar para o atleta ou responsavel quando a inscricao for individual. O acesso real seguira
                  identidade global por CPF e podera registrar a participacao na jornada do atleta.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-[#d1fae5] bg-[#f0fdf4] p-5 text-sm">
              <p className="font-semibold text-[#166534]">Resumo comercial</p>
              <p className="mt-2 text-[#166534]">{competition.pricingModel === 'gratis' ? 'Competicao gratuita' : formatBRL(competition.entryFee)}</p>
              <p className="mt-1 text-[#166534]">Cobranca {competition.chargeMode.replace('_', ' ')}</p>
              <p className="mt-1 text-[#166534]">Plataforma recebe {competition.platformSharePct}%</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[32px] border border-[#dcfce7] bg-[#f8fff9] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#15803d]">Formulario mockado</p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">Confirmar participacao</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nome do atleta" placeholder="Ex.: Lucas Ferreira" />
                <Field label="CPF" placeholder="000.000.000-00" />
                <Field label="Responsavel" placeholder="Ex.: Juliana Ferreira" />
                <Field label="Categoria" placeholder={competition.category} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white">{competition.pricingModel === 'gratis' ? 'Concluir inscricao' : 'Ir para pagamento'}</button>
                <Link href="/clube" className="rounded-full border border-[#bbf7d0] px-5 py-3 text-sm font-semibold text-[#166534]">Voltar ao clube</Link>
              </div>
            </section>

            <aside className="rounded-[32px] border border-[#dbeafe] bg-[#eff6ff] p-6">
              <h3 className="text-lg font-bold text-[#0f172a]">O que esta tela valida</h3>
              <div className="mt-4 grid gap-3 text-sm text-[#475569]">
                <div className="rounded-2xl bg-white px-4 py-3">Competicoes gratis e pagas coexistindo no mesmo ecossistema.</div>
                <div className="rounded-2xl bg-white px-4 py-3">CTA de pagamento quando o clube decide cobrar por atleta.</div>
                <div className="rounded-2xl bg-white px-4 py-3">Participacao futura refletindo na jornada esportiva do atleta.</div>
                <div className="rounded-2xl bg-white px-4 py-3">Base pronta para checkout real em proxima fase.</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block rounded-[24px] border border-[#d1fae5] bg-white p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
      <input placeholder={placeholder} className="mt-3 w-full border-0 bg-transparent p-0 text-sm text-[#0f172a] outline-none" />
    </label>
  )
}
