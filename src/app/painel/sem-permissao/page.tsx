import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sem permissão — Esportes Academy',
}

export default function SemPermissaoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">🚫</div>
      <h1 className="text-2xl font-semibold">Sem permissão</h1>
      <p className="max-w-sm text-muted-foreground">
        O seu perfil não tem acesso a este módulo.
      </p>
      <Link
        href="/painel"
        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
      >
        Voltar ao painel
      </Link>
    </div>
  )
}
