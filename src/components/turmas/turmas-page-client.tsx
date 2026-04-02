'use client'

import { useState, useEffect } from 'react'
import type { Turma } from '@/types'
import { criarTurma, atualizarTurma, deletarTurma } from '@/lib/turma-actions'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DIAS_SEMANA: { v: string; label: string }[] = [
  { v: 'none', label: 'Não definido' },
  { v: '0', label: 'Domingo' },
  { v: '1', label: 'Segunda' },
  { v: '2', label: 'Terça' },
  { v: '3', label: 'Quarta' },
  { v: '4', label: 'Quinta' },
  { v: '5', label: 'Sexta' },
  { v: '6', label: 'Sábado' },
]

function formatTime(t: string | null): string {
  if (!t) return '—'
  return t.slice(0, 5)
}

type FormState = {
  nome: string
  modalidade: string
  local: string
  capacidade_max: string
  idade_min: string
  idade_max: string
  professor_nome: string
  professor_user_id: string
  dia_semana: string
  hora_inicio: string
  hora_fim: string
  ativo: boolean
}

function emptyForm(): FormState {
  return {
    nome: '',
    modalidade: '',
    local: '',
    capacidade_max: '20',
    idade_min: '',
    idade_max: '',
    professor_nome: '',
    professor_user_id: 'none',
    dia_semana: 'none',
    hora_inicio: '',
    hora_fim: '',
    ativo: true,
  }
}

function turmaToForm(t: Turma): FormState {
  return {
    nome: t.nome,
    modalidade: t.modalidade,
    local: t.local ?? '',
    capacidade_max: String(t.capacidade_max),
    idade_min: t.idade_min !== null ? String(t.idade_min) : '',
    idade_max: t.idade_max !== null ? String(t.idade_max) : '',
    professor_nome: t.professor_nome ?? '',
    professor_user_id: t.professor_user_id ? t.professor_user_id : 'none',
    dia_semana: t.dia_semana !== null ? String(t.dia_semana) : 'none',
    hora_inicio: t.hora_inicio ? formatTime(t.hora_inicio) : '',
    hora_fim: t.hora_fim ? formatTime(t.hora_fim) : '',
    ativo: t.ativo,
  }
}

type Props = {
  turmas: Turma[]
  ocupacao: Record<string, number>
  escolaId: string
  isAdmin: boolean
  loadError: boolean
  membros?: { user_id: string; perfil: string; email: string | null }[]
}

export default function TurmasPageClient({
  turmas,
  ocupacao,
  escolaId,
  isAdmin,
  loadError,
  membros,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Turma | null>(null)
  const [deleting, setDeleting] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setShowForm(true)
  }

  function openEdit(t: Turma) {
    setEditingId(t.id)
    setForm(turmaToForm(t))
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
      fd.append('modalidade', form.modalidade)
      fd.append('local', form.local)
      fd.append('capacidade_max', form.capacidade_max)
      fd.append('idade_min', form.idade_min)
      fd.append('idade_max', form.idade_max)
      fd.append('professor_nome', form.professor_nome)
      fd.append('professor_user_id', form.professor_user_id === 'none' ? '' : form.professor_user_id)
      fd.append('dia_semana', form.dia_semana === 'none' ? '' : form.dia_semana)
      fd.append('hora_inicio', form.hora_inicio)
      fd.append('hora_fim', form.hora_fim)
      fd.append('ativo', form.ativo ? 'true' : 'false')

      const result = editingId
        ? await atualizarTurma(escolaId, editingId, fd)
        : await criarTurma(escolaId, fd)

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
      const result = await deletarTurma(escolaId, deleteTarget.id)
      if (result?.error) setError(result.error)
      else setDeleteTarget(null)
    } catch {
      setError('Erro inesperado.')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!deleteTarget) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) setDeleteTarget(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deleteTarget, deleting])

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Turmas</h1>
        {isAdmin && !showForm && (
          <Button type="button" onClick={openCreate}>
            + Nova turma
          </Button>
        )}
      </div>

      {/* Read-only banner for coord / secretaria / professor */}
      {!isAdmin && (
        <p className="mb-4 rounded-md border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
          Apenas o administrador da escola pode criar ou editar turmas.
        </p>
      )}

      {loadError && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Erro ao carregar turmas. Tente recarregar a página.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold">{editingId ? 'Editar turma' : 'Nova turma'}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Sub-12 Manhã" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modalidade">Modalidade *</Label>
              <Input id="modalidade" value={form.modalidade} onChange={(e) => set('modalidade', e.target.value)} placeholder="Futebol, natação…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="local">Local</Label>
              <Input id="local" value={form.local} onChange={(e) => set('local', e.target.value)} placeholder="Quadra 1, piscina…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacidade_max">Capacidade máxima *</Label>
              <Input id="capacidade_max" type="number" min={1} value={form.capacidade_max} onChange={(e) => set('capacidade_max', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="professor_nome">Professor(a) — nome exibido</Label>
              <Input id="professor_nome" value={form.professor_nome} onChange={(e) => set('professor_nome', e.target.value)} />
            </div>
            {isAdmin && membros && membros.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Professor(a) — conta (chamada)</Label>
                <p className="text-xs text-muted-foreground">
                  Vincule o usuário com perfil professor para liberar a chamada só para ele nesta turma.
                </p>
                <Select
                  value={form.professor_user_id || 'none'}
                  onValueChange={(v) => set('professor_user_id', v ?? 'none')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {membros
                      .filter((m) => m.perfil === 'professor')
                      .map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.email ?? m.user_id.slice(0, 8) + '…'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Idade mín. / máx.</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Min"
                  value={form.idade_min}
                  onChange={(e) => set('idade_min', e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Máx"
                  value={form.idade_max}
                  onChange={(e) => set('idade_max', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Dia da semana</Label>
              <Select
                value={form.dia_semana || 'none'}
                onValueChange={(v) => set('dia_semana', v ?? 'none')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d.v} value={d.v}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Horário</Label>
              <div className="flex gap-2 items-center">
                <Input type="time" value={form.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)} />
                <span className="text-muted-foreground">às</span>
                <Input type="time" value={form.hora_fim} onChange={(e) => set('hora_fim', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e) => set('ativo', e.target.checked)}
              />
              <Label htmlFor="ativo" className="cursor-pointer font-normal">
                Turma ativa (visível para novas matrículas)
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Modalidade</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Horário</th>
                <th className="px-4 py-3 font-medium text-right">Ocupação</th>
                <th className="px-4 py-3 font-medium w-28"> </th>
              </tr>
            </thead>
            <tbody>
              {turmas.length === 0 && !loadError && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma turma cadastrada.
                  </td>
                </tr>
              )}
              {turmas.map((t) => {
                const oc = ocupacao[t.id] ?? 0
                const diaLabel =
                  DIAS_SEMANA.find((d) => d.v === String(t.dia_semana ?? 'none'))?.label ?? '—'
                const hora =
                  t.hora_inicio && t.hora_fim
                    ? `${formatTime(t.hora_inicio)} – ${formatTime(t.hora_fim)}`
                    : '—'
                return (
                  <tr key={t.id} className="border-b border-border/80">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.nome}</p>
                      {t.local && <p className="text-xs text-muted-foreground">{t.local}</p>}
                      {!t.ativo && (
                        <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs">Inativa</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.modalidade}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {t.dia_semana !== null ? `${diaLabel} · ${hora}` : hora}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {oc}/{t.capacidade_max}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex gap-1 justify-end">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)}>
                            Editar
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(t)}>
                            Excluir
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Excluir turma?</DialogTitle>
            <DialogDescription>
              A turma será desativada. Não é possível excluir se houver matrículas ativas vinculadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
