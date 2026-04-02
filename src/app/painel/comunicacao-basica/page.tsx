import Link from 'next/link'

export default function ComunicacaoBasicaPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-3">Comunicação Básica</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Central de notificações automáticas da escola (push/e-mail).
      </p>
      <Link
        href="/painel/comunicacao-basica/notificacoes"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Abrir central de notificações
      </Link>
    </div>
  )
}
