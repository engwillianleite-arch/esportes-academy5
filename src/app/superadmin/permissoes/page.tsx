import PermissaoMatrizClient from '@/components/superadmin/permissao-matriz-client'
import { listarMatrizPermissoes } from '@/lib/superadmin-actions'

export default async function PermissoesPage() {
  const result = await listarMatrizPermissoes()

  if (result.error || !result.rows) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error ?? 'Erro ao carregar matriz de permissões.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Matriz de Permissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle quais perfis podem acessar cada módulo. Alterações refletem na próxima sessão dos usuários.
        </p>
      </div>

      <PermissaoMatrizClient matrizInicial={result.rows} />
    </div>
  )
}
