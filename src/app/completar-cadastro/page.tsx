import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUsuarioGlobalAtual } from '@/lib/usuario-global'
import CpfForm from './cpf-form'

export default async function CompletarCadastroPage() {
  const result = await getUsuarioGlobalAtual()

  if (result.error || !result.authUser) redirect('/login')
  if (result.usuario) redirect('/')
  const authUser = result.authUser

  const fallbackName =
    (authUser.user_metadata?.full_name as string | undefined)
    ?? (authUser.user_metadata?.name as string | undefined)
    ?? ''

  const fallbackCpf =
    typeof authUser.user_metadata?.cpf === 'string'
      ? authUser.user_metadata.cpf
      : ''

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="inline-flex rounded-full border border-muted-foreground/30 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Etapa opcional
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Complete sua identidade global</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              O Esportes Academy agora usa uma identidade única por CPF. Isso evita duplicidade de contas
              e mantém o mesmo histórico do usuário entre escolas e perfis.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>CPF obrigatório e único para cada pessoa física.</li>
            <li>O e-mail continua sendo usado para autenticação, mas não é mais a chave principal de negócio.</li>
            <li>Se você entrar em novas escolas, sua identidade global continuará a mesma.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <CpfForm
            initialName={fallbackName}
            initialCpf={fallbackCpf}
            email={authUser.email ?? null}
          />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">
              Pular por agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
