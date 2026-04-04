import { redirect } from 'next/navigation'
import ProfessorNav from '@/components/professor/professor-nav'
import { getProfessorAppContext } from '@/lib/professor-actions'

export default async function ProfessorAppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getProfessorAppContext()
  if ('error' in ctx) redirect('/selecionar-escola')

  return (
    <div className="flex min-h-screen flex-col">
      <ProfessorNav escolaNome={ctx.ctx.escolaNome} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
