import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { EscolaShell } from '@/components/escola/escola-shell'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const store = await cookies()
  const escolaId = store.get('ea-escola-id')?.value
  const perfil   = store.get('ea-perfil')?.value

  if (!escolaId || !perfil) redirect('/')

  const admin = createAdminClient()

  const [{ data: escola }, { data: usuario }] = await Promise.all([
    admin.from('escolas').select('nome').eq('id', escolaId).maybeSingle(),
    admin.from('usuarios').select('nome').eq('auth_user_id', user.id).is('deleted_at', null).maybeSingle(),
  ])

  const escolaNome = escola?.nome ?? 'Escola'
  const userName   = usuario?.nome ?? user.email ?? 'Usuário'

  return (
    <EscolaShell escolaNome={escolaNome} perfil={perfil} userName={userName}>
      {children}
    </EscolaShell>
  )
}
