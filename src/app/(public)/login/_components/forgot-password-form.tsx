'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword, type AuthState } from '../actions'

type Props = {
  onBack: () => void
}

const initialState: AuthState & { sent: boolean } = { error: null, sent: false }

export function ForgotPasswordForm({ onBack }: Props) {
  const [state, action, isPending] = useActionState(resetPassword, initialState)

  if (state.sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📬</div>
        <p className="font-medium">Email de recuperação enviado</p>
        <p className="text-sm text-muted-foreground">
          Se o email informado tiver uma conta, você receberá as instruções em breve.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onBack}>
          Voltar para o login
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <p className="font-medium">Recuperar senha</p>
        <p className="text-sm text-muted-foreground">
          Informe seu email para receber as instruções de recuperação.
        </p>
      </div>

      {state.error && (
        <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Enviando...' : 'Enviar email de recuperação'}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Voltar para o login
      </button>
    </form>
  )
}
