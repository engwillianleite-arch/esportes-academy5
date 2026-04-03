import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectEscolaFormAction } from '@/lib/escola-context'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecionar perfil | Esportes Academy',
}

const PERFIL_LABEL: Record<string, string> = {
  admin_escola: 'Administrador',
  coordenador: 'Coordenador',
  professor: 'Professor',
  financeiro: 'Financeiro',
  secretaria: 'Secretaria',
  saude: 'Saúde',
  marketing: 'Marketing',
  responsavel: 'Responsável',
}

function getPerfilAccent(tipoUsuario: string): string {
  if (tipoUsuario === 'responsavel') return 'bg-amber-300 text-[#2d2202]'
  if (tipoUsuario === 'professor') return 'bg-sky-300 text-sky-950'
  return 'bg-emerald-300 text-emerald-950'
}

export default async function SelecionarEscolaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: plataformaRow } = await admin
    .from('plataforma_usuarios')
    .select('ativo, deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (plataformaRow?.ativo && !plataformaRow.deleted_at) redirect('/superadmin')

  const { data: usuarioGlobal } = await admin
    .from('usuarios')
    .select('id, nome')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!usuarioGlobal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Sem acesso</h1>
          <p className="text-sm text-muted-foreground">
            Conta não encontrada na plataforma. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    )
  }

  const { data: userContextoRows } = await admin
    .from('usuario_escola_tipos')
    .select('id, escola_id, tipo_usuario, principal')
    .eq('usuario_id', usuarioGlobal.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('principal', { ascending: false })

  const contextos = userContextoRows ?? []

  const escolaIds = [...new Set(contextos.map((c) => c.escola_id))]
  const { data: escolas } = await admin.from('escolas').select('id, nome').in('id', escolaIds)
  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.16),_transparent_30%),linear-gradient(135deg,#102617_0%,#183224_44%,#f4ecdd_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,9,0.14),rgba(8,13,9,0.38))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:px-14 lg:py-12">
        <section className="flex flex-col justify-between text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/esportes-academy-logo.jpg"
              alt="Logo Esportes Academy"
              width={72}
              height={72}
              className="h-16 w-16 rounded-2xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
              priority
            />
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-white/68">Esportes Academy</p>
              <p className="text-sm font-medium text-white">Escolha o contexto para continuar</p>
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <p className="text-sm uppercase tracking-[0.38em] text-amber-200/90">Seleção de contexto</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Um único acesso para múltiplas jornadas dentro da plataforma.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
              Seu usuário pode atuar em mais de uma escola e com perfis diferentes. Escolha abaixo
              a experiência que deseja abrir agora.
            </p>
          </div>

          <div className="mt-8 hidden overflow-hidden rounded-[2rem] border border-white/14 bg-black/20 shadow-[0_28px_90px_rgba(0,0,0,0.30)] lg:block">
            <Image
              src="/esportes-academy-logo.jpg"
              alt="Marca Esportes Academy"
              width={768}
              height={768}
              className="h-[280px] w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-8 lg:mt-0 lg:pl-10">
          <div className="rounded-[2rem] border border-white/16 bg-white/92 p-6 shadow-[0_28px_90px_rgba(12,18,14,0.28)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Bem-vindo</p>
              <h2 className="mt-2 text-3xl font-semibold text-foreground">
                {usuarioGlobal.nome ?? user.email ?? 'Selecione seu perfil'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escolha a escola e o tipo de acesso para abrir o ambiente correto da plataforma.
              </p>
            </div>

            {contextos.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                Sua conta não está vinculada a nenhuma escola. Entre em contato com o administrador da plataforma.
              </div>
            )}

            <div className="space-y-4">
              {contextos.map((ctx) => {
                const escolaNome = escolaMap.get(ctx.escola_id) ?? '(escola não encontrada)'
                const perfilLabel = PERFIL_LABEL[ctx.tipo_usuario] ?? ctx.tipo_usuario
                const initial = escolaNome.charAt(0).toUpperCase()

                return (
                  <form key={ctx.id} action={selectEscolaFormAction}>
                    <input type="hidden" name="escola_id" value={ctx.escola_id} />
                    <input type="hidden" name="perfil" value={ctx.tipo_usuario} />
                    <button
                      type="submit"
                      className="group w-full rounded-[1.6rem] border border-border/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_rgba(16,40,24,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1ec997,#0f8f6c)] text-lg font-bold text-white shadow-sm">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-foreground">{escolaNome}</p>
                            {ctx.principal && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-900">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{perfilLabel}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getPerfilAccent(ctx.tipo_usuario)}`}
                        >
                          {perfilLabel}
                        </span>
                      </div>
                    </button>
                  </form>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
