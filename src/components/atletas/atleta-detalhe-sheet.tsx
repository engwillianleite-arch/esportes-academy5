'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { listarAtletaResponsaveis } from '@/lib/responsavel-actions'
import { carregarFrequenciaDetalhe, type FrequenciaDetalhe } from '@/lib/frequencia-actions'
import { formatCpf } from '@/lib/cpf'
import type { AtletaResponsavelWithResponsavel } from '@/types'
import type { MatriculaAtletaListRow } from '@/lib/atleta-list-actions'
import { AlertTriangle } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
  encerrada: 'Encerrada',
}

const TIPO_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  personalizado: 'Personalizado',
}

const PRESENCA_LABEL: Record<string, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  justificada: 'Falta justificada',
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: MatriculaAtletaListRow | null
  escolaId: string
  limiarFreqPct: number
  canViewFrequencia: boolean
}

export default function AtletaDetalheSheet({
  open,
  onOpenChange,
  row,
  escolaId,
  limiarFreqPct,
  canViewFrequencia,
}: Props) {
  const [vinculos, setVinculos] = useState<AtletaResponsavelWithResponsavel[]>([])
  const [loading, setLoading] = useState(false)
  const [freqDetalhe, setFreqDetalhe] = useState<FrequenciaDetalhe | null>(null)
  const [freqLoading, setFreqLoading] = useState(false)
  const [freqError, setFreqError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !row?.atleta.id) {
      setVinculos([])
      return
    }
    let cancelled = false
    setLoading(true)
    void listarAtletaResponsaveis(row.atleta.id).then((r) => {
      if (cancelled) return
      if (!r.error) setVinculos(r.vinculacoes ?? [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, row?.atleta.id])

  useEffect(() => {
    if (!open || !row || !canViewFrequencia) {
      setFreqDetalhe(null)
      setFreqError(null)
      return
    }
    let cancelled = false
    setFreqLoading(true)
    setFreqError(null)
    void carregarFrequenciaDetalhe(escolaId, row.matricula_id).then((r) => {
      if (cancelled) return
      setFreqLoading(false)
      if (r.error) {
        setFreqError(r.error)
        setFreqDetalhe(null)
        return
      }
      setFreqDetalhe(r.detalhe ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [open, row, escolaId, canViewFrequencia])

  if (!row) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalhe do atleta</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto pr-1 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Atleta
            </p>
            <p className="font-medium text-base">{row.atleta.nome}</p>
            <p className="text-muted-foreground">CPF {formatCpf(row.atleta.cpf)}</p>
            <p className="text-muted-foreground">Nasc. {formatDate(row.atleta.data_nascimento)}</p>
          </div>

          {canViewFrequencia && (
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Frequência (chamadas)
              </p>
              {freqLoading && <p className="text-muted-foreground text-sm">Carregando…</p>}
              {freqError && <p className="text-sm text-destructive">{freqError}</p>}
              {!freqLoading && !freqError && freqDetalhe && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {freqDetalhe.resumo.total === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Ainda não há registros de presença para esta matrícula.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm">
                          <span className="font-semibold tabular-nums">
                            {freqDetalhe.resumo.percentual ?? 0}%
                          </span>
                          <span className="text-muted-foreground">
                            {' '}
                            ({freqDetalhe.resumo.presentes} presentes / {freqDetalhe.resumo.total}{' '}
                            chamadas)
                          </span>
                        </p>
                        {freqDetalhe.resumo.percentual !== null &&
                          freqDetalhe.resumo.percentual < limiarFreqPct && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-900 dark:text-amber-100">
                              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                              Abaixo do limiar ({limiarFreqPct}%)
                            </span>
                          )}
                      </>
                    )}
                  </div>
                  {freqDetalhe.historico.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded border border-border/60">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left">
                            <th className="px-2 py-1.5 font-medium">Data</th>
                            <th className="px-2 py-1.5 font-medium">Turma</th>
                            <th className="px-2 py-1.5 font-medium">Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {freqDetalhe.historico.map((h, i) => (
                            <tr key={`${h.data_aula}-${i}`} className="border-b border-border/60">
                              <td className="px-2 py-1.5 tabular-nums">{formatDate(h.data_aula)}</td>
                              <td className="px-2 py-1.5">{h.turma_nome}</td>
                              <td className="px-2 py-1.5">
                                {PRESENCA_LABEL[h.status] ?? h.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Matrícula nesta escola
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{' '}
              {STATUS_LABEL[row.status] ?? row.status}
            </p>
            <p>
              <span className="text-muted-foreground">Período:</span>{' '}
              {TIPO_LABEL[row.tipo_periodo] ?? row.tipo_periodo}
            </p>
            <p>
              <span className="text-muted-foreground">Início:</span> {formatDate(row.data_inicio)}
            </p>
            <p>
              <span className="text-muted-foreground">Valor líquido:</span> {formatBRL(row.valor_liquido)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Responsáveis
            </p>
            {loading && <p className="text-muted-foreground">Carregando…</p>}
            {!loading && vinculos.length === 0 && (
              <p className="text-muted-foreground">Nenhum responsável vinculado.</p>
            )}
            {!loading &&
              vinculos.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 mb-1"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.responsavel.nome}</p>
                    {v.responsavel.cpf && (
                      <p className="text-xs text-muted-foreground tabular-nums">CPF {formatCpf(v.responsavel.cpf)}</p>
                    )}
                    {v.responsavel.email && (
                      <p className="text-xs text-muted-foreground truncate">{v.responsavel.email}</p>
                    )}
                  </div>
                  {v.financeiro && (
                    <span className="text-xs shrink-0 ml-2 rounded bg-primary/10 text-primary px-2 py-0.5">
                      Financeiro
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Fechar
        </Button>
      </SheetContent>
    </Sheet>
  )
}
