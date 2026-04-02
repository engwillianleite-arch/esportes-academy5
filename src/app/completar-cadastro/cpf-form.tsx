'use client'

import { useActionState } from 'react'
import { salvarUsuarioGlobal, type UsuarioGlobalState } from '@/lib/usuario-global'

const initialState: UsuarioGlobalState = { error: null }

type Props = {
  initialName: string
  initialCpf: string
  email: string | null
}

export default function CpfForm({ initialName, initialCpf, email }: Props) {
  const [state, action, isPending] = useActionState(salvarUsuarioGlobal, initialState)

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="nome" className="block text-sm font-medium">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          defaultValue={initialName}
          placeholder="Seu nome completo"
          className="h-10 w-full rounded-md border px-3 text-sm"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cpf" className="block text-sm font-medium">
          CPF
        </label>
        <input
          id="cpf"
          name="cpf"
          defaultValue={initialCpf}
          placeholder="000.000.000-00"
          className="h-10 w-full rounded-md border px-3 text-sm"
          required
          disabled={isPending}
        />
      </div>

      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {email ? `Conta autenticada com ${email}.` : 'Sua conta autenticada será vinculada a esta identidade global.'}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {isPending ? 'Salvando...' : 'Continuar'}
      </button>
    </form>
  )
}
