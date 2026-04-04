import { redirect } from 'next/navigation'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'
import { carregarConfiguracoesPlataforma } from '@/lib/superadmin-settings-actions'
import { SuperAdminConfiguracoesForm } from '@/components/superadmin/superadmin-configuracoes-form'

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/i)
  return match?.[1] ?? 'nao-configurado'
}

export default async function SuperAdminConfiguracoesPage() {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) redirect('/no-access')

  const settings = await carregarConfiguracoesPlataforma()

  return (
    <SuperAdminConfiguracoesForm
      settings={settings}
      isEditable={auth.perfil === 'super_admin'}
      projectRef={getProjectRef()}
    />
  )
}
