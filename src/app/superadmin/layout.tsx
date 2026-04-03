import { redirect } from 'next/navigation'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuperAdminShell } from '@/components/superadmin/superadmin-shell'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) redirect('/no-access')

  const admin = createAdminClient()
  const userResult = await admin.auth.admin.getUserById(auth.userId)
  const authEmail = userResult.data.user?.email ?? ''

  const { data: usuario } = await admin
    .from('usuarios')
    .select('nome')
    .eq('auth_user_id', auth.userId)
    .is('deleted_at', null)
    .maybeSingle()

  const userName = usuario?.nome ?? authEmail ?? 'Admin'

  return (
    <SuperAdminShell perfil={auth.perfil} userName={userName}>
      {children}
    </SuperAdminShell>
  )
}
