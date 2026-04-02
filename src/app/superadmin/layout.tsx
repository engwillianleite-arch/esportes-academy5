import { redirect } from 'next/navigation'
import SuperAdminNav from '@/components/superadmin/superadmin-nav'
import { assertSuperAdminAccess } from '@/lib/superadmin-actions'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await assertSuperAdminAccess()
  if ('error' in auth) redirect('/no-access')

  return (
    <div className="flex min-h-screen flex-col">
      <SuperAdminNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
