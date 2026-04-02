'use client'

import { useEffect, useState, useTransition } from 'react'
import { listarNotificacoesOutboxEscola } from '@/lib/notification-actions'
import { getEventoNotificacaoLabel } from '@/lib/notification-labels'

type Row = {
  id: string
  evento_tipo: string
  mensagem: string | null
  status: string
  tentativas: number
  erro: string | null
  created_at: string
  entregas_sent: number
  entregas_failed: number
}

type Props = { escolaId: string }

const PAGE_SIZE = 20

export default function NotificacoesPageClient({ escolaId }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isPending, startTransition] = useTransition()

  async function load(currentPage: number) {
    const result = await listarNotificacoesOutboxEscola(escolaId, {
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    if (result.error) {
      setError(result.error)
      setRows([])
      setTotal(0)
      return
    }

    setError(null)
    setRows((result.rows ?? []) as Row[])
    setTotal(result.total ?? 0)
  }

  useEffect(() => {
    void load(page)
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function processarFilaAgora() {
    startTransition(async () => {
      const res = await fetch('/api/internal/notificacoes/process', { method: 'POST' })
      if (!res.ok) {
        setError('Falha ao processar fila de notificacoes.')
      }
      await load(page)
    })
  }

  function processarAniversariantesAgora() {
    startTransition(async () => {
      const res = await fetch('/api/internal/notificacoes/aniversariantes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escolaId }),
      })

      if (!res.ok) {
        setError('Falha ao enfileirar aniversariantes do dia.')
      }

      await load(page)
    })
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Central de notificacoes</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={processarAniversariantesAgora}
            disabled={isPending}
            className="h-9 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? 'Processando...' : 'Enfileirar aniversarios'}
          </button>
          <button
            type="button"
            onClick={processarFilaAgora}
            disabled={isPending}
            className="h-9 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? 'Processando...' : 'Processar fila'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="mb-4 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        O envio de aniversarios respeita a configuracao da escola em
        {' '}
        <span className="font-medium">Configuracoes &gt; Notificacoes &gt; Parabens de aniversario</span>.
      </p>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Mensagem</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Entregas</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium">Erro</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Sem eventos na fila.
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-4 py-3">{getEventoNotificacaoLabel(row.evento_tipo)}</td>
                <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
                  {row.mensagem ?? '-'}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  {row.entregas_sent} enviadas / {row.entregas_failed} falhas
                </td>
                <td className="px-4 py-3">
                  {new Date(row.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-xs text-destructive">{row.erro ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Pagina {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Proxima
          </button>
        </div>
      </div>
    </div>
  )
}
