import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import NotificacoesPageClient from '@/components/escola/notificacoes-page-client'

export default async function ComunicacaoNotificacoesPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')

  const hasAccess = ['admin_escola', 'coordenador', 'secretaria', 'marketing'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  return <NotificacoesPageClient escolaId={ctx.escolaId} />
}
