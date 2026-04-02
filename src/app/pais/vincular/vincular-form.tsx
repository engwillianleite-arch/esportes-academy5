'use client'

import { useActionState } from 'react'
import { vincularResponsavel, type VinculoState } from './actions'

const initialState: VinculoState = { error: null }

export default function VincularResponsavelForm() {
  const [state, action, isPending] = useActionState(vincularResponsavel, initialState)

  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <div>
        <label htmlFor="cpf" className="mb-1 block text-sm">CPF do responsável</label>
        <input
          id="cpf"
          name="cpf"
          placeholder="000.000.000-00"
          className="h-10 w-full rounded-md border px-3 text-sm"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {isPending ? 'Vinculando...' : 'Vincular conta'}
      </button>
      <p className="text-xs text-muted-foreground">
        O e-mail da sua conta precisa ser o mesmo e-mail cadastrado pela escola para este CPF.
      </p>
    </form>
  )
}
