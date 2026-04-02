'use client'

import { useState, useEffect, useCallback } from 'react'
import CadastroAtletaDrawer from './cadastro-atleta-drawer'
import AtletaDetalheSheet from './atleta-detalhe-sheet'
import { listarMatriculasAtletasEscola, type MatriculaAtletaListRow } from '@/lib/atleta-list-actions'
import { frequenciaResumoMatriculas, type FrequenciaResumo } from '@/lib/frequencia-actions'
import { listarTurmasAtivasEscola } from '@/lib/turma-actions'
import { formatCpf } from '@/lib/cpf'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StatusMatricula } from '@/types/database'
import { AlertTriangle } from 'lucide-react'
import type { Turma } from '@/types'

type Props = {
  escolaId: string
  canRegister: boolean
  limiarFreqPct: number
  canViewFrequencia: boolean
}

const STATUS_OPTIONS: { value: 'todos' | StatusMatricula; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'encerrada', label: 'Encerrada' },
]

const STATUS_BADGE: Record<string, string> = {
  ativa: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  suspensa: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  cancelada: 'bg-muted text-muted-foreground',
  encerrada: 'bg-muted text-muted-foreground',
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatStatus(s: string): string {
  const map: Record<string, string> = {
    ativa: 'Ativa',
    suspensa: 'Suspensa',
    cancelada: 'Cancelada',
    encerrada: 'Encerrada',
  }
  return map[s] ?? s
}

const PAGE_SIZE = 15

export default function AtletasPageClient({
  escolaId,
  canRegister,
  limiarFreqPct,
  canViewFrequencia,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusMatricula>('todos')
  const [turmaFilter, setTurmaFilter] = useState<string>('todas')
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<MatriculaAtletaListRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<MatriculaAtletaListRow | null>(null)
  const [freqMap, setFreqMap] = useState<Record<string, FrequenciaResumo>>({})

  useEffect(() => {
    const delay = q.trim() === '' ? 0 : 350
    const t = setTimeout(() => {
      setDebouncedQ(q)
      setPage(1)
    }, delay)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, turmaFilter])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r = await listarTurmasAtivasEscola(escolaId)
      if (cancelled) return
      if (!r.error && r.turmas) {
        setTurmas(r.turmas)
      } else {
        setTurmas([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [escolaId])

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    const result = await listarMatriculasAtletasEscola(escolaId, {
      q: debouncedQ.trim() || undefined,
      status: statusFilter,
      turmaId: turmaFilter,
      page,
      pageSize: PAGE_SIZE,
    })
    if (result.error) {
      setListError(result.error)
      setRows([])
      setTotal(0)
    } else {
      setRows(result.rows ?? [])
      setTotal(result.total ?? 0)
    }
    setLoading(false)
  }, [escolaId, debouncedQ, statusFilter, turmaFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!canViewFrequencia || rows.length === 0) {
      setFreqMap({})
      return
    }
    let cancelled = false
    void (async () => {
      const ids = rows.map((r) => r.matricula_id)
      const r = await frequenciaResumoMatriculas(escolaId, ids)
      if (cancelled) return
      if (!r.error && r.map) setFreqMap(r.map)
      else setFreqMap({})
    })()
    return () => {
      cancelled = true
    }
  }, [canViewFrequencia, escolaId, rows])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const colCount = canViewFrequencia ? 6 : 5

  function openDetail(row: MatriculaAtletaListRow) {
    setDetailRow(row)
    setDetailOpen(true)
  }

  function handleNovoCadastro() {
    setDrawerOpen(true)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold">Atletas</h1>
        {canRegister && (
          <button
            type="button"
            onClick={handleNovoCadastro}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            Novo atleta
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end mb-6">
        <div className="flex-1 min-w-[200px] min-h-[60px]">
          <Label htmlFor="atleta-busca" className="mb-1.5 block">
            Buscar
          </Label>
          <Input
            id="atleta-busca"
            placeholder="Nome, CPF (atleta ou responsável), e-mail…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="w-full md:w-56 min-h-[60px]">
          <Label className="mb-1.5 block">Status da matrícula</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'todos' | StatusMatricula)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-56 min-h-[60px]">
          <Label className="mb-1.5 block">Turma</Label>
          <Select value={turmaFilter} onValueChange={(v) => setTurmaFilter(v ?? 'todas')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="sem_turma">Sem turma</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listError && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {listError}
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Atleta</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">CPF</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Início</th>
                {canViewFrequencia && (
                  <th className="px-4 py-3 font-medium text-right w-28">Freq.</th>
                )}
                <th className="px-4 py-3 font-medium text-right">Valor líquido</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colCount} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="px-4 py-10 text-center text-muted-foreground">
                    {debouncedQ.trim()
                      ? 'Nenhum resultado para esta busca.'
                      : 'Nenhuma matrícula encontrada nesta escola.'}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.matricula_id}
                    className="border-b border-border/80 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => openDetail(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openDetail(row)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="px-4 py-3 font-medium">{row.atleta.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatCpf(row.atleta.cpf)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status] ?? 'bg-muted'}`}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(row.data_inicio)}
                    </td>
                    {canViewFrequencia && (
                      <td className="px-4 py-3 text-right tabular-nums">
                        {(() => {
                          const f = freqMap[row.matricula_id]
                          if (!f || f.total === 0 || f.percentual === null) {
                            return <span className="text-muted-foreground">—</span>
                          }
                          const risk = f.percentual < limiarFreqPct
                          return (
                            <span
                              className={`inline-flex items-center justify-end gap-1 ${
                                risk ? 'font-medium text-amber-800 dark:text-amber-200' : ''
                              }`}
                            >
                              {f.percentual}%
                              {risk && (
                                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                              )}
                            </span>
                          )
                        })()}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatBRL(row.valor_liquido)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-muted-foreground">
          <p>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Clique em uma linha para ver detalhes e responsáveis.
      </p>

      {canRegister && (
        <CadastroAtletaDrawer
          escolaId={escolaId}
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) void load()
          }}
        />
      )}

      <AtletaDetalheSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailRow(null)
        }}
        row={detailRow}
        escolaId={escolaId}
        limiarFreqPct={limiarFreqPct}
        canViewFrequencia={canViewFrequencia}
      />
    </div>
  )
}
