import { redirect } from 'next/navigation'
import PaisNav from '@/components/pais/pais-nav'
import { getResponsavelAppContext, getResponsavelContext } from '@/lib/pais-actions'

export default async function PaisAppLayout({ children }: { children: React.ReactNode }) {
  const responsavel = await getResponsavelContext()
  if ('error' in responsavel) redirect('/pais/vincular')

  const ctx = await getResponsavelAppContext()
  if ('error' in ctx) redirect('/selecionar-escola')

  return (
    <div className="flex min-h-screen flex-col">
      <PaisNav escolaNome={ctx.ctx.escolaNome} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
