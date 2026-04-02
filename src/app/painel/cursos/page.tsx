import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getEscolaContext } from '@/lib/escola-context'
import CursosPageClient from '@/components/cursos/cursos-page-client'

export const metadata: Metadata = {
  title: 'Cursos — Esportes Academy',
}

export default async function CursosPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const hasAccess = ['admin_escola', 'coordenador'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  return <CursosPageClient escolaId={ctx.escolaId} />
}
