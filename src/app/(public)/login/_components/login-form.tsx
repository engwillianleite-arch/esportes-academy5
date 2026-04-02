'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithEmail, type AuthState } from '../actions'
import { ForgotPasswordForm } from './forgot-password-form'
import { useSearchParams } from 'next/navigation'

const initialState: AuthState = { error: null }

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginWithEmail, initialState)
  const [showForgot, setShowForgot] = useState(false)
  const searchParams = useSearchParams()
  // Validate against known error codes to prevent attacker-triggered error banners
  const rawError = searchParams.get('error')
  const callbackError = rawError === 'auth_error' ? rawError : null

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />
  }

  return (
    <form action={action} className="space-y-4">
      {(state.error || callbackError) && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error ?? 'Ocorreu um erro na autenticação. Tente novamente.'}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="current-password"
          minLength={8}
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>

      <button
        type="button"
        onClick={() => setShowForgot(true)}
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </button>
    </form>
  )
}
