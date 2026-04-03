'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const store = await cookies()
  store.delete('ea-escola-id')
  store.delete('ea-perfil')
  redirect('/login')
}
