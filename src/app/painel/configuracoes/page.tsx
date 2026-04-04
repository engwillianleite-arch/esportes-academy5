import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesEscolaForm } from '@/components/escola/configuracoes-escola-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configurações — Esportes Academy',
}

export default async function ConfiguracoesPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/')

  const supabase = await createClient()
  const { data: escola, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('id', ctx.escolaId)
    .single()

  if (error || !escola) {
    console.error('[ConfiguracoesPage]', error?.message)
    redirect('/')
  }

  const isAdmin = ctx.perfil === 'admin_escola'

  return <ConfiguracoesEscolaForm escola={escola} isAdmin={isAdmin} />
}
