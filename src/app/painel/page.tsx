import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUserEscolaProfiles } from '@/lib/escola-profile'
import { getEscolaContext, clearEscolaContext, clearEscolaCookiesOnly } from '@/lib/escola-context'
import { getModulosStatus } from '@/lib/escola-modulos'
import { dismissarOnboarding } from '@/lib/escola-actions'
import { ModuloNavItem } from '@/components/escola/modulo-nav-item'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Painel — Esportes Academy',
}

export default async function PainelPage() {
  const ctx = await getEscolaContext()
  if (!ctx) redirect('/')

  const profiles = await getUserEscolaProfiles()
  const activeProfile = profiles.find(p => p.escola_id === ctx.escolaId)

  if (!activeProfile) {
    // Stale cookie — escola no longer in user's active profiles
    await clearEscolaCookiesOnly()
    redirect('/')
  }

  const modulos = await getModulosStatus(ctx.escolaId, ctx.perfil)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {activeProfile.escola?.logo_url ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-full">
            <Image
              src={activeProfile.escola.logo_url}
              alt={activeProfile.escola?.nome ?? ''}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#20c997] text-3xl font-semibold text-white">
            {(activeProfile.escola?.nome ?? '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">
            {activeProfile.escola?.nome ?? '(escola não encontrada)'}
          </h1>
          <p className="mt-1 capitalize text-muted-foreground">
            {ctx.perfil.replaceAll('_', ' ')}
          </p>
        </div>

        <p className="text-muted-foreground">Bem-vindo ao painel da escola.</p>
      </div>

      {profiles.length > 1 && (
        <form action={clearEscolaContext}>
          <Button type="submit" variant="outline">
            Trocar escola
          </Button>
        </form>
      )}

      {!activeProfile.escola?.onboarding_completo && (
        <section className="w-full max-w-2xl rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Bem-vindo! Configure sua escola</h2>
            <form action={dismissarOnboarding.bind(null, ctx.escolaId)}>
              <Button type="submit" variant="ghost" size="sm">Dispensar</Button>
            </form>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground line-through">
              <span>✅</span>
              <span>Escola cadastrada</span>
            </li>
            <li className="flex items-center gap-2">
              <span>⬜</span>
              <Link href="/painel/configuracoes" className="underline underline-offset-2 hover:text-foreground">
                Configurar integração financeira (Asaas)
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span>⬜</span>
              <Link href="/painel/administrativo/usuarios" className="underline underline-offset-2 hover:text-foreground">
                Convidar equipe
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span>⬜</span>
              <Link href="/painel/administrativo" className="underline underline-offset-2 hover:text-foreground">
                Completar dados da escola
              </Link>
            </li>
          </ul>
        </section>
      )}

      <section className="w-full max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">Módulos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {modulos.map(item => (
            <ModuloNavItem key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
