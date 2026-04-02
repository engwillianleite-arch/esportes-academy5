import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import CobrancasPageClient from '@/components/financeiro/cobrancas-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Financeiro — Esportes Academy',
}

export default async function FinanceiroPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const hasAccess = ['admin_escola', 'coordenador', 'financeiro'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  return <CobrancasPageClient escolaId={ctx.escolaId} />
}
