import { PainelNav } from '@/components/escola/painel-nav'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PainelNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
