import { redirect } from 'next/navigation'
import { getEscolaContext } from '@/lib/escola-context'
import { createClient } from '@/lib/supabase/server'
import { PlanosPagamentoClient } from '@/components/planos/planos-pagamento-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos de Pagamento — Esportes Academy',
}

export default async function PlanosPagamentoPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/')

  const supabase = await createClient()
  const { data: planos, error } = await supabase
    .from('planos_pagamento')
    .select('*')
    .eq('escola_id', ctx.escolaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[PlanosPagamentoPage]', error.message)
    return (
      <div className="flex min-h-screen flex-col items-center p-6">
        <div className="w-full max-w-3xl">
          <h1 className="mb-6 text-2xl font-semibold">Planos de Pagamento</h1>
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Erro ao carregar planos de pagamento. Tente recarregar a página.
          </p>
        </div>
      </div>
    )
  }

  const { data: matRows } = await supabase
    .from('matriculas')
    .select('plano_id')
    .eq('escola_id', ctx.escolaId)
    .eq('status', 'ativa')
    .is('deleted_at', null)

  const countByPlano: Record<string, number> = {}
  for (const row of matRows ?? []) {
    if (row.plano_id) {
      countByPlano[row.plano_id] = (countByPlano[row.plano_id] ?? 0) + 1
    }
  }

  const planosWithCount = (planos ?? []).map((p) => ({
    ...p,
    linked_count: countByPlano[p.id] ?? 0,
  }))

  const isAdmin = ctx.perfil === 'admin_escola'

  return (
    <div className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold">Planos de Pagamento</h1>
        <PlanosPagamentoClient
          planos={planosWithCount}
          escolaId={ctx.escolaId}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
