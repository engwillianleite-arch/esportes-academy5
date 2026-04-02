'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error: string | null
}

export async function loginWithEmail(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  if (password.length < 8) {
    return { error: 'Senha deve ter no mínimo 8 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Account lockout (Supabase GoTrue returns 423 or 400 with "locked")
    if (error.status === 423 || error.message.toLowerCase().includes('locked')) {
      return { error: 'Conta bloqueada por excesso de tentativas. Verifique seu email para recuperar acesso.' }
    }
    // API-level rate limit (too many requests per second)
    if (error.status === 429 || error.message.toLowerCase().includes('rate')) {
      return { error: 'Muitas tentativas. Aguarde um momento e tente novamente.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Confirme seu email antes de entrar.' }
    }
    // Generic message — never expose raw Supabase error to user
    return { error: 'Email ou senha inválidos.' }
  }

  // IMPORTANT: redirect() throws NEXT_REDIRECT — do NOT wrap in try/catch
  redirect('/')
}

export async function resetPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState & { sent?: boolean }> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''

  if (!email) {
    return { error: 'Informe seu email.' }
  }

  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`

  // Don't reveal whether email exists — always return success (anti-enumeration)
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (resetError) {
    console.error('[auth] resetPasswordForEmail error:', resetError.message)
  }

  return { error: null, sent: true }
}
