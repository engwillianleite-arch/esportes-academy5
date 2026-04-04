import Image from 'next/image'
import Link from 'next/link'

export function OrganizadorShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f4f8ff] text-[#0f172a]">
      <header className="border-b border-[#dbe7ff] bg-[linear-gradient(135deg,#071120_0%,#10213e_55%,#0ea5e9_140%)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/esportes-academy-logo.jpg" alt="Esportes Academy" width={48} height={48} className="rounded-2xl border border-white/10 object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Portal do Organizador</p>
                <p className="text-sm text-white/70">Operacao competitiva, convites, cobranca e narrativas da competicao</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/superadmin/competicoes" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">Governanca</Link>
              <Link href="/clube" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]">Ver portal do clube</Link>
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
