'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

type ResetPasswordFormProps = {
  successRedirectTo?: string
  submitLabel?: string
  helperText?: string
  successMessage?: string
}

export default function ResetPasswordForm({
  successRedirectTo = '/',
  submitLabel = 'Salvar senha e continuar',
  helperText = 'Depois de salvar sua senha, o sistema segue para o login e para a continuidade do acesso da sua escola.',
  successMessage = 'Senha definida com sucesso. Estamos continuando seu acesso.',
}: ResetPasswordFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('A confirmação da senha não confere.')
      return
    }

    setIsPending(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      const message = updateError.message.toLowerCase()
      if (message.includes('session')) {
        setError('Seu link expirou ou não está mais válido. Solicite um novo convite ou redefinição de senha.')
      } else {
        setError('Não foi possível salvar sua senha agora. Tente novamente em instantes.')
      }
      setIsPending(false)
      return
    }

    setSuccess(successMessage)
    setIsPending(false)
    router.replace(successRedirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar senha</Label>
        <Input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{helperText}</div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Salvando senha...' : submitLabel}
      </Button>
    </form>
  )
}
