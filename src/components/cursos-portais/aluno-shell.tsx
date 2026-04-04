import Image from 'next/image'
import Link from 'next/link'

export function AlunoShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#fff3d6,transparent_28%),linear-gradient(180deg,#fffef9_0%,#f8fafc_100%)] text-[#0f172a]">
      <header className="border-b border-[#e2e8f0] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/esportes-academy-logo.jpg" alt="Esportes Academy" width={48} height={48} className="rounded-2xl border border-[#e2e8f0] object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0ea5e9]">Portal do Aluno</p>
                <p className="text-sm text-[#64748b]">Aprendizagem, continuidade e consumo por CPF/contexto habilitado</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/criador" className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155]">Ver portal do criador</Link>
              <Link href="/superadmin/cursos" className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">Ver governanca</Link>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">{description}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
