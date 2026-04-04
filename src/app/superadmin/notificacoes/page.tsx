import type { Metadata } from 'next'
import NotificacoesClient from '@/components/superadmin/notificacoes-client'
import { listarNotificacoesSuperAdmin } from '@/lib/superadmin-notifications-actions'

export const metadata: Metadata = {
  title: 'Notificacoes | Esportes Academy',
}

export default async function SuperadminNotificacoesPage() {
  const result = await listarNotificacoesSuperAdmin()

  return <NotificacoesClient initialItems={result.rows} loadError={result.error} />
}
