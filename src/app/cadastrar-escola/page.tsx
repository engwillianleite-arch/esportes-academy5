import { redirect } from 'next/navigation'
import { listarContextosUsuarioAtual } from '@/lib/usuario-contexto'
import { RegistrationWizard } from '@/components/escola/registration-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cadastrar escola — Esportes Academy',
}

export default async function CadastrarEscolaPage() {
  const result = await listarContextosUsuarioAtual()
  if ((result.rows ?? []).length > 0) redirect('/selecionar-escola')

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <RegistrationWizard />
      </div>
    </div>
  )
}
