'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  criarCobrancaManual,
  listarCobrancasEscola,
  listarMatriculasParaCobranca,
  type CobrancaListRow,
} from '@/lib/cobranca-actions'
import type { StatusCobranca } from '@/types'
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

type Props = {
  escolaId: string
}

type MatriculaOption = {
  matricula_id: string
  atleta_nome: string
}

const STATUS_OPTIONS: { value: 'todas' | StatusCobranca; label: string }[] = [
  { value: 'todas', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const STATUS_BADGE: Record<StatusCobranca, string> = {
  pendente: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  pago: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
  vencido: 'bg-rose-500/15 text-rose-900 dark:text-rose-200',
  cancelado: 'bg-muted text-muted-foreground',
}

const PAGE_SIZE = 15

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toInputDate(v: Date): string {
  const y = v.getFullYear()
  const m = String(v.getMonth() + 1).padStart(2, '0')
  const d = String(v.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CobrancasPageClient({ escolaId }: Props) {
  const [rows, setRows] = useState<CobrancaListRow[]>([])
  const [matriculas, setMatriculas] = useState<MatriculaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'todas' | StatusCobranca>('todas')

  const [matriculaId, setMatriculaId] = useState('none')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(toInputDate(new Date()))
  const [descricao, setDescricao] = useState('')
  const [referencia, setReferencia] = useState('')
  const [asaasChargeId, setAsaasChargeId] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [cobrancasResult, matriculasResult] = await Promise.all([
      listarCobrancasEscola(escolaId, {
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      }),
      listarMatriculasParaCobranca(escolaId),
    ])

    if (cobrancasResult.error) {
      setError(cobrancasResult.error)
      setRows([])
      setTotal(0)
    } else {
      setRows(cobrancasResult.rows ?? [])
      setTotal(cobrancasResult.total ?? 0)
    }

    if (!matriculasResult.error && matriculasResult.rows) {
      setMatriculas(
        matriculasResult.rows.map((r) => ({
          matricula_id: r.matricula_id,
          atleta_nome: r.atleta_nome,
        }))
      )
    }

    setLoading(false)
  }, [escolaId, page, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  async function onCriarCobranca(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)

    const fd = new FormData()
    fd.append('matricula_id', matriculaId)
    fd.append('valor', valor)
    fd.append('vencimento', vencimento)
    fd.append('descricao', descricao)
    fd.append('referencia', referencia)
    fd.append('asaas_charge_id', asaasChargeId)

    const result = await criarCobrancaManual(escolaId, fd)
    if (result.error) {
      setError(result.error)
    } else {
      setValor('')
      setDescricao('')
      setReferencia('')
      setAsaasChargeId('')
      await load()
    }

    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financeiro · Cobranças</h1>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        onSubmit={onCriarCobranca}
        className="mb-6 grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h2 className="text-base font-medium">Gerar cobrança manual</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Matrícula (opcional)</Label>
          <Select value={matriculaId} onValueChange={(v) => setMatriculaId(v ?? 'none')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Cobrança avulsa (sem matrícula)</SelectItem>
              {matriculas.map((m) => (
                <SelectItem key={m.matricula_id} value={m.matricula_id}>
                  {m.atleta_nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vencimento">Vencimento *</Label>
          <Input
            id="vencimento"
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Mensalidade abril/2026"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="referencia">Referência</Label>
          <Input
            id="referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="2026-04"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="asaas-charge">ID cobrança Asaas (opcional)</Label>
          <Input
            id="asaas-charge"
            value={asaasChargeId}
            onChange={(e) => setAsaasChargeId(e.target.value)}
            placeholder="pay_xxxxx"
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Gerando...' : 'Gerar cobrança'}
          </Button>
        </div>
      </form>

      <div className="mb-4 w-full md:w-56">
        <Label className="mb-1.5 block">Filtro por status</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? 'todas') as 'todas' | StatusCobranca)}>
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

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Atleta</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Asaas ID</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma cobrança encontrada.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/80">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.atleta_nome ?? 'Cobrança avulsa'}</p>
                      {row.descricao && <p className="text-xs text-muted-foreground">{row.descricao}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.vencimento)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {row.asaas_charge_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBRL(row.valor)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
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
    </div>
  )
}
