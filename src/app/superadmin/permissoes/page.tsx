import PermissaoMatrizClient from '@/components/superadmin/permissao-matriz-client'
import { listarMatrizPermissoes } from '@/lib/superadmin-actions'

export default async function PermissoesPage() {
  const result = await listarMatrizPermissoes()

  if (result.error || !result.rows) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error ?? 'Erro ao carregar matriz de permissões.'}
        </div>
      </div>
    )
  }

  const totalPermissoes = result.rows.filter((r) => r.ativo).length
  const totalCells      = result.rows.length

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">Matriz de Permissões</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Controle quais perfis acessam cada módulo. Alterações refletem na próxima sessão dos usuários.
          </p>
        </div>
        <div className="flex-shrink-0 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-2 text-center">
          <p className="text-[11px] text-[#94a3b8]">Permissões ativas</p>
          <p className="text-lg font-bold text-[#4f46e5]">{totalPermissoes} / {totalCells}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#4f46e5]/20 bg-[#4f46e5]/5 px-5 py-4">
        <span className="mt-0.5 text-base">🔐</span>
        <div className="text-sm text-[#4338ca]">
          <strong>Como funciona:</strong> Cada célula representa se um perfil de usuário pode acessar um módulo.
          A permissão do <strong>Administrador → Administrativo</strong> é obrigatória e não pode ser removida.
          Alterações são salvas instantaneamente.
        </div>
      </div>

      <PermissaoMatrizClient matrizInicial={result.rows} />
    </div>
  )
}
