import Link from 'next/link'
import EscolaSuperadminClient from '@/components/superadmin/escola-superadmin-client'
import { carregarEscolaDetalheSuperAdmin, listarAssinaturasPlataforma } from '@/lib/superadmin-actions'

export default async function EscolaDetalheSuperadminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [detalhe, assinaturas] = await Promise.all([
    carregarEscolaDetalheSuperAdmin(id),
    listarAssinaturasPlataforma(),
  ])

  if (detalhe.error || !detalhe.escola) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {detalhe.error ?? 'Escola não encontrada.'}
        </p>
        <Link href="/superadmin/escolas" className="mt-4 inline-block text-sm underline underline-offset-2">Voltar</Link>
      </div>
    )
  }

  const assinatura = (assinaturas.rows ?? []).find((a) => a.escola_id === id) ?? null

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <Link href="/superadmin/escolas" className="text-sm underline underline-offset-2">← Voltar para escolas</Link>
      </div>
      <h1 className="text-2xl font-semibold">{detalhe.escola.nome}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Plano: <span className="capitalize">{detalhe.escola.plano}</span> · Status: {detalhe.escola.ativo ? 'Ativa' : 'Inativa'} · Usuários ativos: {detalhe.usuariosCount ?? 0}
      </p>

      <div className="mb-6 grid gap-2 rounded-lg border bg-card p-4 text-sm md:grid-cols-2">
        <p><strong>CNPJ:</strong> {detalhe.escola.cnpj ?? '—'}</p>
        <p><strong>E-mail:</strong> {detalhe.escola.email ?? '—'}</p>
        <p><strong>Telefone:</strong> {detalhe.escola.telefone ?? '—'}</p>
        <p><strong>Cidade/UF:</strong> {detalhe.escola.cidade ?? '—'} / {detalhe.escola.estado ?? '—'}</p>
      </div>

      <EscolaSuperadminClient
        escolaId={id}
        planoAtual={detalhe.escola.plano}
        modulos={(detalhe.modulos ?? []).map((m) => ({
          id: m.id,
          modulo_slug: m.modulo_slug,
          ativo: m.ativo,
          expira_em: m.expira_em,
        }))}
        assinatura={assinatura ? {
          valor_mensal: assinatura.valor_mensal,
          dia_vencimento: assinatura.dia_vencimento,
          status: assinatura.status,
          proximo_vencimento: assinatura.proximo_vencimento,
          referencia_externa: assinatura.referencia_externa,
        } : null}
      />
    </div>
  )
}
