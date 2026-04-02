'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  carregarChamada,
  listarTurmasParaChamada,
  salvarPresencaLinha,
  type ChamadaPayload,
} from '@/lib/presenca-actions'
import type { StatusPresenca, Turma } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_OPTS: { value: StatusPresenca; label: string }[] = [
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'justificada', label: 'Falta justificada' },
]

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  escolaId: string
  janelaChamadaH: number
  fusoHorario: string
}

export default function PresencasPageClient({ escolaId, janelaChamadaH, fusoHorario }: Props) {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaId, setTurmaId] = useState<string>('')
  const [dataAula, setDataAula] = useState(hojeISO())
  const [chamada, setChamada] = useState<ChamadaPayload | null>(null)
  const [loadTurmasErr, setLoadTurmasErr] = useState(false)
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [loadingChamada, setLoadingChamada] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingTurmas(true)
      const r = await listarTurmasParaChamada(escolaId)
      if (cancelled) return
      if (r.error) {
        setLoadTurmasErr(true)
        setError(r.error)
      } else {
        setTurmas(r.turmas ?? [])
        if ((r.turmas?.length ?? 0) > 0 && !turmaId) {
          setTurmaId(r.turmas![0].id)
        }
      }
      setLoadingTurmas(false)
    })()
    return () => {
      cancelled = true
    }
  }, [escolaId])

  const recarregarChamada = useCallback(async () => {
    if (!turmaId || !dataAula) {
      setChamada(null)
      return
    }
    setLoadingChamada(true)
    setError(null)
    const r = await carregarChamada(escolaId, turmaId, dataAula)
    setLoadingChamada(false)
    if (r.error) {
      setError(r.error)
      setChamada(null)
      return
    }
    setChamada(r.chamada ?? null)
  }, [escolaId, turmaId, dataAula])

  useEffect(() => {
    void recarregarChamada()
  }, [recarregarChamada])

  async function onStatusChange(matriculaId: string, status: StatusPresenca) {
    if (!chamada?.aulaId || !chamada.podeEditar) return
    setSavingId(matriculaId)
    setError(null)
    const r = await salvarPresencaLinha(escolaId, chamada.aulaId, matriculaId, status)
    setSavingId(null)
    if (r.error) {
      setError(r.error)
      return
    }
    await recarregarChamada()
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Chamada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de presença por turma e data. Janela de edição: até {janelaChamadaH} horas após o fim do
          dia da aula (fuso {fusoHorario}).
        </p>
      </div>

      {loadTurmasErr && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Erro ao carregar turmas.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="turma">Turma</Label>
          <Select
            value={turmaId || undefined}
            onValueChange={(v) => {
              if (v) setTurmaId(v)
            }}
            disabled={loadingTurmas || turmas.length === 0}
          >
            <SelectTrigger id="turma">
              <SelectValue placeholder={loadingTurmas ? 'Carregando…' : 'Selecione'} />
            </SelectTrigger>
            <SelectContent>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-48">
          <Label htmlFor="data_aula">Data da aula</Label>
          <Input
            id="data_aula"
            type="date"
            value={dataAula}
            onChange={(e) => setDataAula(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void recarregarChamada()} disabled={loadingChamada}>
          {loadingChamada ? 'Carregando…' : 'Atualizar'}
        </Button>
      </div>

      {!loadingTurmas && turmas.length === 0 && (
        <p className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Nenhuma turma disponível para chamada. Se você é professor, confira se foi vinculado como
          &quot;Professor (conta)&quot; na turma. Administradores veem todas as turmas.
        </p>
      )}

      {chamada && turmaId && (
        <>
          {!chamada.podeEditar && (
            <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm text-amber-900 dark:text-amber-100">
              {chamada.aulaId
                ? 'Esta data está fora da janela de edição: visualização apenas.'
                : 'Não há aula registrada para esta data e a janela de lançamento já encerrou.'}
            </p>
          )}

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">Atleta</th>
                    <th className="px-4 py-3 font-medium w-56">Presença</th>
                  </tr>
                </thead>
                <tbody>
                  {chamada.linhas.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhuma matrícula ativa nesta turma.
                      </td>
                    </tr>
                  )}
                  {chamada.linhas.map((linha) => {
                    const v = linha.registro?.status ?? undefined
                    const busy = savingId === linha.matricula.id
                    return (
                      <tr key={linha.matricula.id} className="border-b border-border/80">
                        <td className="px-4 py-3">
                          <p className="font-medium">{linha.atleta.nome}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={v}
                            onValueChange={(val) => {
                              if (val && chamada.podeEditar && chamada.aulaId) {
                                void onStatusChange(linha.matricula.id, val as StatusPresenca)
                              }
                            }}
                            disabled={!chamada.podeEditar || !chamada.aulaId || busy}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Definir" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
