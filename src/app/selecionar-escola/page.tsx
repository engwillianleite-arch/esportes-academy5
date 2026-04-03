import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { selectEscolaFormAction } from '@/lib/escola-context'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecionar perfil — Esportes Academy',
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

export default async function SelecionarEscolaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Super_admin bypass
  const admin = createAdminClient()
  const { data: plataformaRow } = await admin
    .from('plataforma_usuarios')
    .select('ativo, deleted_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (plataformaRow?.ativo && !plataformaRow.deleted_at) redirect('/superadmin')

  // Load contextos via admin to avoid RLS issues
  const { data: contextoRows } = await admin
    .from('usuario_escola_tipos')
    .select('id, escola_id, tipo_usuario, principal')
    .eq('ativo', true)
    .is('deleted_at', null)

  // Filter to current user's contextos
  const { data: usuarioGlobal } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!usuarioGlobal) redirect('/login')

  const { data: userContextoRows } = await admin
    .from('usuario_escola_tipos')
    .select('id, escola_id, tipo_usuario, principal')
    .eq('usuario_id', usuarioGlobal.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('principal', { ascending: false })

  const contextos = userContextoRows ?? []
  if (contextos.length === 0) redirect('/login')

  // Fetch school names
  const escolaIds = [...new Set(contextos.map((c) => c.escola_id))]
  const { data: escolas } = await admin
    .from('escolas')
    .select('id, nome')
    .in('id', escolaIds)

  const escolaMap = new Map((escolas ?? []).map((e) => [e.id, e.nome]))

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Selecionar perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha com qual perfil deseja continuar
          </p>
        </div>

        <div className="space-y-3">
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
                  className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#20c997] text-lg font-bold text-white">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{escolaNome}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{perfilLabel}</p>
                    </div>
                    {ctx.principal && (
                      <span className="shrink-0 rounded-full bg-[#20c997]/15 px-2 py-0.5 text-xs font-medium text-[#0f8f6c]">
                        Principal
                      </span>
                    )}
                  </div>
                </button>
              </form>
            )
          })}
        </div>
      </div>
    </div>
  )
}
