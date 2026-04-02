import { redirect } from 'next/navigation'
import { selectEscolaFormAction } from '@/lib/escola-context'
import { listarContextosUsuarioAtual } from '@/lib/usuario-contexto'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecionar contexto — Esportes Academy',
}

function getPerfilLabel(perfil: string): string {
  return perfil.replaceAll('_', ' ')
}

export default async function SelecionarEscolaPage() {
  const result = await listarContextosUsuarioAtual()

  if (result.error) {
    redirect('/no-access')
  }

  const contextos = result.rows ?? []

  if (contextos.length === 0) {
    redirect('/no-access')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Selecionar contexto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha a escola e o tipo de acesso que deseja usar agora
          </p>
        </div>

        <div className="space-y-3">
          {contextos.map((contexto) => (
            <form key={contexto.id} action={selectEscolaFormAction}>
              <input type="hidden" name="escola_id" value={contexto.escola_id} />
              <input type="hidden" name="perfil" value={contexto.tipo_usuario} />
              <button type="submit" className="w-full text-left">
                <Card className="cursor-pointer transition-colors hover:bg-accent focus-within:bg-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#20c997] text-lg font-semibold text-white">
                      {(contexto.escola_nome ?? '?').charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        {contexto.escola_nome ?? '(escola não encontrada)'}
                      </p>
                      <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                        {getPerfilLabel(contexto.tipo_usuario)}
                      </p>
                      {contexto.principal && (
                        <p className="mt-1 text-xs font-medium text-[#0f8f6c]">
                          Contexto principal
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
