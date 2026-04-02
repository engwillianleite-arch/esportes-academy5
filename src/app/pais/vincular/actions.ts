'use server'

import { redirect } from 'next/navigation'
import { vincularContaResponsavelPorCpf } from '@/lib/pais-actions'

export type VinculoState = { error: string | null }

export async function vincularResponsavel(
  _prevState: VinculoState,
  formData: FormData
): Promise<VinculoState> {
  const cpf = (formData.get('cpf') as string | null)?.trim() ?? ''
  const r = await vincularContaResponsavelPorCpf(cpf)
  if (r.error) return { error: r.error }
  redirect('/pais')
}
