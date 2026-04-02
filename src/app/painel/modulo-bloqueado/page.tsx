import Link from 'next/link'
import { MODULO_ROUTES } from '@/lib/modulo-access'
import { MODULO_INFO } from '@/lib/modulo-info'
import { Badge } from '@/components/ui/badge'
import type { ModuloSlug } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Módulo bloqueado — Esportes Academy',
}

const VALID_SLUGS = new Set<string>(Object.values(MODULO_ROUTES))

export default async function ModuloBloqueadoPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>
}) {
  const { modulo } = await searchParams
  // Validate against known slugs to prevent content injection via crafted URLs
  const safeModulo = modulo && VALID_SLUGS.has(modulo) ? (modulo as ModuloSlug) : null
  const info = safeModulo ? MODULO_INFO[safeModulo] : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">🔒</div>
      <h1 className="text-2xl font-semibold">{info?.label ?? 'Módulo bloqueado'}</h1>
      {info && (
        <p className="max-w-sm text-muted-foreground">{info.description}</p>
      )}
      {!info && (
        <p className="max-w-sm text-muted-foreground">
          Este módulo não está disponível no plano atual da escola.
        </p>
      )}
      {info && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Disponível no plano</span>
          <Badge variant="secondary" className="capitalize">{info.minPlan}</Badge>
        </div>
      )}
      {safeModulo && (
        <a
          href="mailto:contato@esportesacademy.com.br"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Falar com comercial
        </a>
      )}
      <Link
        href="/painel"
        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
      >
        Voltar ao painel
      </Link>
    </div>
  )
}
