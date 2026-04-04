import Image from 'next/image'
import Link from 'next/link'

export function CriadorShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f7f4ed] text-[#1f2937]">
      <header className="border-b border-[#e5dccd] bg-[#fffaf2]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/esportes-academy-logo.jpg" alt="Esportes Academy" width={48} height={48} className="rounded-2xl border border-[#eadfcb] object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c2410c]">Portal do Criador</p>
                <p className="text-sm text-[#6b7280]">CPF unico, catalogo proprio e operacao editorial independente</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/superadmin/cursos" className="rounded-full border border-[#d6c3a5] px-4 py-2 text-sm font-semibold text-[#7c2d12]">Governanca</Link>
              <Link href="/aluno" className="rounded-full bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white">Ver portal do aluno</Link>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#111827]">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">{description}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
