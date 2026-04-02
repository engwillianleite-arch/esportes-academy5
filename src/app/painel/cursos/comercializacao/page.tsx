import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getEscolaContext } from '@/lib/escola-context'
import {
  criarAssinaturaCursoUsuario,
  criarMatriculaCursoUsuario,
  listarComercializacaoCursosEscola,
} from '@/lib/curso-actions'

export const metadata: Metadata = {
  title: 'Cursos · Comercialização',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function CursosComercializacaoPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/selecionar-escola')
  const escolaId = ctx.escolaId

  const hasAccess = ['admin_escola', 'coordenador'].includes(ctx.perfil)
  if (!hasAccess) redirect('/painel/sem-permissao')

  const result = await listarComercializacaoCursosEscola(escolaId)

  if (result.error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error}
        </p>
      </div>
    )
  }

  const comercial = result.rows
  const cursos = result.cursos ?? []
  const usuarios = comercial?.usuarios ?? []
  const assinaturas = comercial?.assinaturas ?? []
  const matriculas = comercial?.matriculas ?? []

  async function actionCriarAssinatura(formData: FormData) {
    'use server'
    await criarAssinaturaCursoUsuario(escolaId, formData)
  }

  async function actionCriarMatricula(formData: FormData) {
    'use server'
    await criarMatriculaCursoUsuario(escolaId, formData)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cursos · Comercialização e progresso</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie assinatura do catálogo, compra individual, matrículas e acompanhe o progresso por usuário.
          </p>
        </div>
        <Link href="/painel/cursos" className="rounded-md border px-4 py-2 text-sm font-medium">
          Voltar para estrutura do módulo
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Usuários elegíveis</p>
          <p className="text-2xl font-semibold">{usuarios.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assinaturas ativas</p>
          <p className="text-2xl font-semibold">{assinaturas.filter((row) => row.status === 'ativa').length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Matrículas ativas</p>
          <p className="text-2xl font-semibold">{matriculas.filter((row) => row.status === 'ativo').length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cursos concluídos</p>
          <p className="text-2xl font-semibold">{matriculas.filter((row) => row.status === 'concluido').length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form action={actionCriarAssinatura} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar assinatura do catálogo</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Usuário
              <select name="user_id" className="h-10 rounded-md border bg-background px-3" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {usuarios.map((usuario) => (
                  <option key={`${usuario.auth_user_id}:${usuario.tipo_usuario}`} value={usuario.auth_user_id}>
                    {usuario.nome} · {usuario.tipo_usuario}{usuario.email ? ` · ${usuario.email}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Título da assinatura
              <input name="titulo" className="h-10 rounded-md border bg-background px-3" placeholder="Assinatura anual de cursos" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Status
              <select name="status" className="h-10 rounded-md border bg-background px-3" defaultValue="ativa">
                <option value="ativa">Ativa</option>
                <option value="suspensa">Suspensa</option>
                <option value="cancelada">Cancelada</option>
                <option value="expirada">Expirada</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Origem
              <select name="origem" className="h-10 rounded-md border bg-background px-3" defaultValue="manual">
                <option value="manual">Manual</option>
                <option value="financeiro">Financeiro</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Início
              <input name="inicio_em" type="date" className="h-10 rounded-md border bg-background px-3" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Fim
              <input name="fim_em" type="date" className="h-10 rounded-md border bg-background px-3" />
            </label>
          </div>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Criar assinatura
          </button>
        </form>

        <form action={actionCriarMatricula} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar matrícula de curso</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Curso
              <select name="curso_id" className="h-10 rounded-md border bg-background px-3" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.titulo} · {curso.modalidade_comercial}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Usuário
              <select name="user_id" className="h-10 rounded-md border bg-background px-3" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {usuarios.map((usuario) => (
                  <option key={`${usuario.auth_user_id}:${usuario.tipo_usuario}`} value={usuario.auth_user_id}>
                    {usuario.nome} · {usuario.tipo_usuario}{usuario.email ? ` · ${usuario.email}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Origem da liberação
              <select name="origem_liberacao" className="h-10 rounded-md border bg-background px-3" defaultValue="manual">
                <option value="manual">Manual</option>
                <option value="compra_individual">Compra individual</option>
                <option value="assinatura">Assinatura</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Status
              <select name="status" className="h-10 rounded-md border bg-background px-3" defaultValue="ativo">
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="suspenso">Suspenso</option>
                <option value="expirado">Expirado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              Assinatura vinculada
              <select name="assinatura_id" className="h-10 rounded-md border bg-background px-3" defaultValue="">
                <option value="">Nenhuma</option>
                {assinaturas.map((assinatura) => (
                  <option key={assinatura.id} value={assinatura.id}>
                    {assinatura.usuario_nome} · {assinatura.titulo ?? 'Assinatura de catálogo'} · {assinatura.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Valor pago
              <input name="valor_pago" type="number" step="0.01" min="0" className="h-10 rounded-md border bg-background px-3" defaultValue="0" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Expira em
              <input name="expira_em" type="datetime-local" className="h-10 rounded-md border bg-background px-3" />
            </label>
          </div>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Criar matrícula
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Assinaturas do módulo</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Usuário</th>
                  <th className="px-3 py-2 font-medium">Plano</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Período</th>
                </tr>
              </thead>
              <tbody>
                {assinaturas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Nenhuma assinatura cadastrada.</td>
                  </tr>
                )}
                {assinaturas.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.usuario_nome}</p>
                      <p className="text-xs text-muted-foreground">{row.usuario_email ?? 'Sem e-mail'}</p>
                    </td>
                    <td className="px-3 py-2">{row.titulo ?? 'Catálogo da escola'}</td>
                    <td className="px-3 py-2 capitalize">{row.status}</td>
                    <td className="px-3 py-2">{formatDate(row.inicio_em)} · {formatDate(row.fim_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Matrículas e progresso</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Curso</th>
                  <th className="px-3 py-2 font-medium">Usuário</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Progresso</th>
                  <th className="px-3 py-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {matriculas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhuma matrícula cadastrada.</td>
                  </tr>
                )}
                {matriculas.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.curso_titulo}</p>
                      <p className="text-xs text-muted-foreground">Última atividade: {formatDateTime(row.ultima_atividade_em)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.usuario_nome}</p>
                      <p className="text-xs text-muted-foreground">{row.usuario_email ?? 'Sem e-mail'}</p>
                    </td>
                    <td className="px-3 py-2 capitalize">{row.origem_liberacao.replace('_', ' ')}</td>
                    <td className="px-3 py-2 capitalize">
                      {row.status}
                      {row.aprovado ? ' · aprovado' : ''}
                    </td>
                    <td className="px-3 py-2">{row.progresso_pct.toFixed(2)}%</td>
                    <td className="px-3 py-2">{formatBRL(row.valor_pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
