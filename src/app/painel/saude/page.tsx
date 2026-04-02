import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getEscolaContext } from '@/lib/escola-context'
import SaudePageClient from '@/components/saude/saude-page-client'

export const metadata: Metadata = {
  title: 'Saúde — Esportes Academy',
}

export default async function SaudePage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const hasAccess = ['admin_escola', 'coordenador', 'saude'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  return <SaudePageClient escolaId={ctx.escolaId} />
}
