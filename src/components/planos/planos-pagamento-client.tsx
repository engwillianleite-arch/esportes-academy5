'use client'

import { useState, useEffect } from 'react'
import {
  criarPlanoPagamento,
  atualizarPlanoPagamento,
  deletarPlanoPagamento,
  duplicarPlanoPagamento,
} from '@/lib/plano-actions'
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
import type { PlanoPagamento, FrequenciaTipo, MetodoPagamento } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCIA_LABELS: Record<FrequenciaTipo, string> = {
  mensal:      'Mensal',
  trimestral:  'Trimestral',
  semestral:   'Semestral',
  anual:       'Anual',
}

const METODO_LABELS: Record<MetodoPagamento, string> = {
  boleto:         'Boleto',
  pix:            'PIX',
  cartao_credito: 'Cartão de crédito',
}

const COLOR_SWATCHES = [
  '#6366f1', // indigo
  '#20c997', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function computeValorLiquido(valor: string, descontoPct: string): number {
  const v = parseFloat(valor) || 0
  const d = parseFloat(descontoPct) || 0
  return parseFloat((v * (1 - d / 100)).toFixed(2))
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanoWithCount = PlanoPagamento & { linked_count: number }

type FormState = {
  nome: string
  frequencia: FrequenciaTipo
  valor: string
  desconto_pct: string
  dia_vencimento: string
  metodo_pagamento: MetodoPagamento
  cor: string
}

function emptyForm(): FormState {
  return {
    nome:             '',
    frequencia:       'mensal',
    valor:            '',
    desconto_pct:     '0',
    dia_vencimento:   '10',
    metodo_pagamento: 'boleto',
    cor:              '#6366f1',
  }
}

function planoToForm(p: PlanoPagamento): FormState {
  return {
    nome:             p.nome,
    frequencia:       p.frequencia as FrequenciaTipo,
    valor:            String(p.valor),
    desconto_pct:     String(p.desconto_pct),
    dia_vencimento:   String(p.dia_vencimento),
    metodo_pagamento: p.metodo_pagamento as MetodoPagamento,
    cor:              p.cor,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlanosPagamentoClient({
  planos,
  escolaId,
  isAdmin,
}: {
  planos: PlanoWithCount[]
  escolaId: string
  isAdmin: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlanoWithCount | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setShowForm(true)
  }

  function openEdit(p: PlanoWithCount) {
    setEditingId(p.id)
    setForm(planoToForm(p))
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('nome', form.nome)
      fd.append('frequencia', form.frequencia)
      fd.append('valor', form.valor)
      fd.append('desconto_pct', form.desconto_pct)
      fd.append('dia_vencimento', form.dia_vencimento)
      fd.append('metodo_pagamento', form.metodo_pagamento)
      fd.append('cor', form.cor)

      const result = editingId
        ? await atualizarPlanoPagamento(escolaId, editingId, fd)
        : await criarPlanoPagamento(escolaId, fd)

      if (result?.error) setError(result.error)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    setError(null)
    try {
      const result = await deletarPlanoPagamento(escolaId, deleteTarget.id)
      if (result?.error) {
        setError(result.error)
      } else {
        setDeleteTarget(null)
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDuplicate(p: PlanoWithCount) {
    if (duplicating) return
    setDuplicating(p.id)
    setError(null)
    try {
      const result = await duplicarPlanoPagamento(escolaId, p.id)
      if (result?.error) setError(result.error)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setDuplicating(null)
    }
  }

  useEffect(() => {
    if (!deleteTarget) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) setDeleteTarget(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [deleteTarget, deleting])

  const valorLiquido = computeValorLiquido(form.valor, form.desconto_pct)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      {isAdmin && !showForm && (
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate}>
            + Novo plano
          </Button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* ── Create / Edit Form ─────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">
            {editingId ? 'Editar plano' : 'Novo plano de pagamento'}
          </h2>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome do plano *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Mensal Padrão"
            />
          </div>

          {/* Frequência + Método */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Frequência</Label>
              <Select value={form.frequencia} onValueChange={v => set('frequencia', v as FrequenciaTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCIA_LABELS) as FrequenciaTipo[]).map(f => (
                    <SelectItem key={f} value={f}>{FREQUENCIA_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Método de pagamento</Label>
              <Select value={form.metodo_pagamento} onValueChange={v => set('metodo_pagamento', v as MetodoPagamento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METODO_LABELS) as MetodoPagamento[]).map(m => (
                    <SelectItem key={m} value={m}>{METODO_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor + Desconto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.valor}
                onChange={e => set('valor', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="desconto_pct">Desconto (%)</Label>
              <Input
                id="desconto_pct"
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="0"
                value={form.desconto_pct}
                onChange={e => set('desconto_pct', e.target.value)}
              />
            </div>
          </div>

          {/* Valor líquido preview */}
          {(parseFloat(form.valor) > 0 || parseFloat(form.desconto_pct) > 0) && (
            <p className="text-sm text-muted-foreground">
              Valor líquido: <span className="font-medium text-foreground">{formatBRL(valorLiquido)}</span>
            </p>
          )}

          {/* Dia de vencimento */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dia_vencimento">Dia de vencimento (1–28) *</Label>
            <Input
              id="dia_vencimento"
              type="number"
              min={1}
              max={28}
              value={form.dia_vencimento}
              onChange={e => set('dia_vencimento', e.target.value)}
              className="w-32"
            />
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-1.5">
            <Label>Cor do plano</Label>
            <div className="flex gap-2">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => set('cor', c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    form.cor === c ? 'scale-125 border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* ── Plans List ─────────────────────────────────────────────────── */}
      {planos.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Nenhum plano cadastrado ainda.
          {isAdmin && (
            <> <button type="button" className="ml-1 underline" onClick={openCreate}>Criar o primeiro plano.</button></>
          )}
        </div>
      )}

      {planos.map(p => (
        <div
          key={p.id}
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
          style={{ borderLeftWidth: 4, borderLeftColor: p.cor }}
        >
          {/* Info */}
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{p.nome}</span>
              <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {FREQUENCIA_LABELS[p.frequencia as FrequenciaTipo]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{formatBRL(p.valor_liquido)}</span>
              {p.desconto_pct > 0 && (
                <span className="text-xs">({p.desconto_pct}% desc.)</span>
              )}
              <span>Dia {p.dia_vencimento}</span>
              <span>{METODO_LABELS[p.metodo_pagamento as MetodoPagamento]}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {p.linked_count} {p.linked_count === 1 ? 'atleta vinculado' : 'atletas vinculados'}
            </p>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={duplicating === p.id}
                onClick={() => handleDuplicate(p)}
              >
                {duplicating === p.id ? '...' : 'Duplicar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEdit(p)}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={p.linked_count > 0}
                onClick={() => setDeleteTarget(p)}
              >
                Excluir
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="mx-4 w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg"
          >
            <h3 id="delete-dialog-title" className="mb-2 text-base font-semibold">Excluir plano</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Tem certeza que deseja excluir o plano{' '}
              <span className="font-medium text-foreground">{deleteTarget.nome}</span>?
              Esta ação não pode ser desfeita.
            </p>
            {deleteTarget.linked_count > 0 && (
              <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Este plano possui {deleteTarget.linked_count}{' '}
                {deleteTarget.linked_count === 1 ? 'atleta vinculado' : 'atletas vinculados'} e
                não pode ser excluído.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={deleting || deleteTarget.linked_count > 0}
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
