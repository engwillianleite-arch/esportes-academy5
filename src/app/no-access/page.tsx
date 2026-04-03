import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sem acesso — Esportes Academy',
}

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function NoAccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('plataforma_usuarios')
      .select('ativo, deleted_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data?.ativo && !data.deleted_at) {
      redirect('/superadmin')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-semibold">Sem acesso</h1>
        <p className="text-muted-foreground">
          Você não tem acesso a nenhuma escola. Entre em contato com o
          administrador da sua escola para solicitar acesso.
        </p>
        <p className="text-sm text-muted-foreground">
          Problemas?{' '}
          <a
            href="mailto:suporte@esportesacademy.com.br"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Contate o suporte
          </a>
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sair da conta
          </Button>
        </form>
      </div>
    </div>
  )
}
