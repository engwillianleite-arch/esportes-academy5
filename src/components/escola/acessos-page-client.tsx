'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { registrarAcessoPorQr } from '@/lib/atleta-acesso-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  escolaId: string
  checkinAtivo: boolean
  presentesAgora: number
  rows: Array<{
    id: string
    atleta_nome: string
    tipo: 'check_in' | 'check_out'
    created_at: string
    operador_nome: string | null
  }>
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

export default function AcessosPageClient({
  escolaId,
  checkinAtivo,
  presentesAgora,
  rows,
}: Props) {
  const router = useRouter()
  const [qrToken, setQrToken] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    startTransition(async () => {
      const result = await registrarAcessoPorQr(escolaId, qrToken)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
        return
      }

      setQrToken('')
      setFeedback({ type: 'success', text: result.message ?? 'Acesso registrado.' })
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Recurso</p>
          <p className="text-2xl font-semibold">{checkinAtivo ? 'Ativo' : 'Desativado'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Presentes agora</p>
          <p className="text-2xl font-semibold">{presentesAgora}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Últimos registros</p>
          <p className="text-2xl font-semibold">{rows.length}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Registrar entrada ou saída</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole ou leia o código da carteirinha para alternar entre check-in e check-out.
        </p>

        {!checkinAtivo && (
          <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
            O recurso está desativado para esta escola. Ative em Configurações para começar a registrar acessos.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="qr-token">Código da carteirinha</Label>
            <Input
              id="qr-token"
              value={qrToken}
              disabled={pending || !checkinAtivo}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="ea_card_..."
            />
          </div>
          <Button type="submit" disabled={pending || !checkinAtivo || !qrToken.trim()}>
            {pending ? 'Registrando...' : 'Registrar acesso'}
          </Button>
        </form>

        {feedback && (
          <p
            className={`mt-3 text-sm ${
              feedback.type === 'error' ? 'text-destructive' : 'text-green-600'
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Atleta</th>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Data / hora</th>
              <th className="px-4 py-3 font-medium">Operador</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum acesso registrado até agora.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/80">
                <td className="px-4 py-3 font-medium">{row.atleta_nome}</td>
                <td className="px-4 py-3">
                  {row.tipo === 'check_in' ? 'Check-in' : 'Check-out'}
                </td>
                <td className="px-4 py-3">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-3">{row.operador_nome ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
