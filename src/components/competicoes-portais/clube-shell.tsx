import Image from 'next/image'
import Link from 'next/link'

export function ClubeShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f9fafb] text-[#0f172a]">
      <header className="border-b border-[#e2e8f0] bg-[linear-gradient(135deg,#052e16_0%,#14532d_42%,#16a34a_120%)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/esportes-academy-logo.jpg" alt="Esportes Academy" width={48} height={48} className="rounded-2xl border border-white/10 object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#bbf7d0]">Portal do Clube</p>
                <p className="text-sm text-white/70">Inscricoes, atletas, repasse e blog da equipe em uma experiencia propria</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/organizador" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Ver organizador</Link>
              <Link href="/inscricao/competicoes/copa-futuro-sub13" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#14532d]">Abrir link publico</Link>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72">{description}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
