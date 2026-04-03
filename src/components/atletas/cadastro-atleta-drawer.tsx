'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { formatCpf, validateCpf, cleanCpf } from '@/lib/cpf'
import { lookupAtletaCpf, registrarAtleta } from '@/lib/atleta-actions'
import {
  buscarResponsaveis,
  criarResponsavel,
  listarAtletaResponsaveis,
  vincularResponsavel,
  atualizarFinanceiro,
} from '@/lib/responsavel-actions'
import { listarPlanosParaMatricula, criarMatricula } from '@/lib/matricula-actions'
import { listarTurmasAtivasEscola } from '@/lib/turma-actions'
import type {
  Atleta,
  Responsavel,
  AtletaResponsavelWithResponsavel,
  PlanoPagamento,
  Turma,
  FrequenciaTipo,
  MetodoPagamento,
} from '@/types'

type Step = 'cpf' | 'formulario' | 'confirmacao' | 'responsavel' | 'matricula' | 'sucesso'

type FormaMatricula = MetodoPagamento | 'qualquer'

type Props = {
  escolaId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export default function CadastroAtletaDrawer({ escolaId, open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('cpf')
  const [cpfInput, setCpfInput] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    status: 'novo' | 'existe' | 'mesma_escola'
    atleta?: Partial<Atleta>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // ── Step: responsavel ───────────────────────────────────────────────────────
  const [atletaId, setAtletaId] = useState<string | null>(null)
  const [vinculacoes, setVinculacoes] = useState<AtletaResponsavelWithResponsavel[]>([])
  const [responsavelQuery, setResponsavelQuery] = useState('')
  const [responsavelResults, setResponsavelResults] = useState<Responsavel[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [updatingFinanceiro, setUpdatingFinanceiro] = useState<string | null>(null)
  const [novoResponsavelCpf, setNovoResponsavelCpf] = useState('')

  const [planosMatricula, setPlanosMatricula] = useState<PlanoPagamento[]>([])
  const [turmasMatricula, setTurmasMatricula] = useState<Turma[]>([])
  const [matriculaSaving, setMatriculaSaving] = useState(false)
  const [matriculaForm, setMatriculaForm] = useState({
    data_inicio: '',
    data_fim: '',
    tipo_periodo: 'mensal' as FrequenciaTipo | 'personalizado',
    plano_id: '',
    turma_id: '',
    valor: '',
    desconto_pct: '0',
    desconto_motivo: '',
    dia_vencimento: '10',
    forma_pagamento: 'qualquer' as FormaMatricula,
    gerar_auto: true,
  })

  useEffect(() => {
    if (step !== 'matricula' || !open) return
    let cancelled = false
    void listarPlanosParaMatricula(escolaId).then((r) => {
      if (!cancelled && !r.error) setPlanosMatricula(r.planos ?? [])
    })
    void listarTurmasAtivasEscola(escolaId).then((r) => {
      if (!cancelled && !r.error) setTurmasMatricula(r.turmas ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [step, open, escolaId])

  useEffect(() => {
    if (step !== 'matricula') return
    setMatriculaForm((prev) => ({
      ...prev,
      data_inicio: prev.data_inicio || new Date().toISOString().slice(0, 10),
    }))
  }, [step])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setStep('cpf')
      setLookupResult(null)
      setCpfInput('')
      setError(null)
      setSaving(false)
      formRef.current?.reset()
      setAtletaId(null)
      setVinculacoes([])
      setResponsavelQuery('')
      setResponsavelResults([])
      setNovoResponsavelCpf('')
      setShowCreateForm(false)
      setPlanosMatricula([])
      setTurmasMatricula([])
      setMatriculaForm({
        data_inicio: '',
        data_fim: '',
        tipo_periodo: 'mensal',
        plano_id: '',
        turma_id: '',
        valor: '',
        desconto_pct: '0',
        desconto_motivo: '',
        dia_vencimento: '10',
        forma_pagamento: 'qualquer',
        gerar_auto: true,
      })
    }
    onOpenChange(isOpen)
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpfInput(formatCpf(e.target.value))
    setError(null)
  }

  async function handleCpfLookup() {
    setError(null)
    if (!validateCpf(cpfInput)) {
      setError('CPF inválido. Verifique os dígitos.')
      return
    }
    setSaving(true)
    try {
      const result = await lookupAtletaCpf(escolaId, cpfInput)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.status === 'mesma_escola') {
        setLookupResult({ status: 'mesma_escola', atleta: result.atleta })
        return
      }
      setLookupResult({ status: result.status!, atleta: result.atleta })
      setStep(result.status === 'novo' ? 'formulario' : 'confirmacao')
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegistrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('cpf', cleanCpf(cpfInput))
    setSaving(true)
    try {
      const result = await registrarAtleta(escolaId, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      await enterResponsavelStep(result.atleta_id!)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmarMatricula() {
    const id = lookupResult?.atleta?.id
    if (!id) return
    await enterResponsavelStep(id)
  }

  function aplicarTemplatePlano(planoId: string) {
    if (!planoId) {
      setMatriculaForm((m) => ({ ...m, plano_id: '' }))
      return
    }
    const p = planosMatricula.find((x) => x.id === planoId)
    if (!p) return
    setMatriculaForm((m) => ({
      ...m,
      plano_id: planoId,
      valor: String(p.valor),
      desconto_pct: String(p.desconto_pct),
      dia_vencimento: String(p.dia_vencimento),
      forma_pagamento: p.metodo_pagamento as FormaMatricula,
      tipo_periodo: p.frequencia as FrequenciaTipo,
    }))
  }

  async function handleFinalizarMatricula(e: React.FormEvent) {
    e.preventDefault()
    if (!atletaId) return
    setError(null)
    setMatriculaSaving(true)
    try {
      const fd = new FormData()
      fd.set('data_inicio', matriculaForm.data_inicio)
      if (matriculaForm.data_fim.trim()) fd.set('data_fim', matriculaForm.data_fim.trim())
      fd.set('tipo_periodo', matriculaForm.tipo_periodo)
      if (matriculaForm.plano_id) fd.set('plano_id', matriculaForm.plano_id)
      if (matriculaForm.turma_id) fd.set('turma_id', matriculaForm.turma_id)
      fd.set('valor', matriculaForm.valor)
      fd.set('desconto_pct', matriculaForm.desconto_pct)
      if (matriculaForm.desconto_motivo.trim()) {
        fd.set('desconto_motivo', matriculaForm.desconto_motivo.trim())
      }
      fd.set('dia_vencimento', matriculaForm.dia_vencimento)
      fd.set('forma_pagamento', matriculaForm.forma_pagamento)
      fd.set('gerar_auto', matriculaForm.gerar_auto ? 'true' : 'false')
      const result = await criarMatricula(escolaId, atletaId, fd)
      if (result.error) {
        setError(result.error)
        return
      }
      setStep('sucesso')
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setMatriculaSaving(false)
    }
  }

  // ── responsavel step helpers ─────────────────────────────────────────────────

  async function enterResponsavelStep(id: string) {
    setAtletaId(id)
    setStep('responsavel')
    const result = await listarAtletaResponsaveis(id)
    if (result.error) setError(result.error)
    else setVinculacoes(result.vinculacoes ?? [])
  }

  async function handleBuscarResponsaveis() {
    setError(null)
    setSearchLoading(true)
    try {
      const result = await buscarResponsaveis(responsavelQuery)
      if (result.error) { setError(result.error); return }
      setResponsavelResults(result.responsaveis ?? [])
      if ((result.responsaveis ?? []).length === 0) setShowCreateForm(true)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleVincular(responsavel: Responsavel) {
    if (!atletaId || linkingId) return
    setLinkingId(responsavel.id)
    setError(null)
    try {
      // First guardian becomes financial by default
      const isFirst = vinculacoes.length === 0
      const result = await vincularResponsavel(atletaId, responsavel.id, isFirst)
      if (result.error) { setError(result.error); return }
      const listResult = await listarAtletaResponsaveis(atletaId)
      if (!listResult.error) setVinculacoes(listResult.vinculacoes ?? [])
      setResponsavelResults([])
      setResponsavelQuery('')
      setShowCreateForm(false)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLinkingId(null)
    }
  }

  async function handleCriarEVincular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!atletaId || saving) return
    setError(null)
    if (!validateCpf(novoResponsavelCpf)) {
      setError('Informe um CPF de responsável válido.')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const criarResult = await criarResponsavel(formData)
      if (criarResult.error) { setError(criarResult.error); return }
      if (!criarResult.responsavel) { setError('Erro ao criar responsável. Tente novamente.'); return }
      const isFirst = vinculacoes.length === 0
      const vincularResult = await vincularResponsavel(atletaId, criarResult.responsavel.id, isFirst)
      if (vincularResult.error) { setError(vincularResult.error); return }
      const listResult = await listarAtletaResponsaveis(atletaId)
      if (!listResult.error) setVinculacoes(listResult.vinculacoes ?? [])
      setShowCreateForm(false)
      setResponsavelQuery('')
      setNovoResponsavelCpf('')
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetFinanceiro(responsavelId: string) {
    if (!atletaId || updatingFinanceiro) return
    setUpdatingFinanceiro(responsavelId)
    setError(null)
    try {
      const result = await atualizarFinanceiro(atletaId, responsavelId, true)
      if (result.error) { setError(result.error); return }
      const listResult = await listarAtletaResponsaveis(atletaId)
      if (!listResult.error) setVinculacoes(listResult.vinculacoes ?? [])
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setUpdatingFinanceiro(null)
    }
  }

  const hasFinanceiro = vinculacoes.some(v => v.financeiro)

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {step === 'cpf' && 'Novo atleta'}
            {step === 'formulario' && 'Cadastrar atleta'}
            {step === 'confirmacao' && 'Atleta encontrado'}
            {step === 'responsavel' && 'Responsável financeiro'}
            {step === 'matricula' && 'Plano e matrícula'}
            {step === 'sucesso' && 'Registro concluído'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 overflow-y-auto max-h-[60vh]">
          {/* ── Step 1: CPF lookup ──────────────────────────────────────── */}
          {step === 'cpf' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="cpf-input" className="block text-sm font-medium mb-1">
                  CPF do atleta
                </label>
                <input
                  id="cpf-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={handleCpfChange}
                  maxLength={14}
                  disabled={lookupResult?.status === 'mesma_escola'}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>
              {lookupResult?.status === 'mesma_escola' && lookupResult.atleta?.nome && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">Matrícula já ativa nesta escola</p>
                  <p className="text-sm text-muted-foreground">
                    O atleta <span className="font-medium text-foreground">{lookupResult.atleta.nome}</span> já possui
                    matrícula ativa aqui. Não é possível criar outra.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* ── Step 2a: Full registration form ─────────────────────────── */}
          {step === 'formulario' && (
            <form id="form-registro" ref={formRef} onSubmit={handleRegistrar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">CPF</label>
                <p className="text-sm text-muted-foreground">{cpfInput}</p>
              </div>
              <div>
                <label htmlFor="nome" className="block text-sm font-medium mb-1">
                  Nome completo <span className="text-destructive">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium mb-1">
                  Data de nascimento <span className="text-destructive">*</span>
                </label>
                <input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <fieldset>
                <legend className="block text-sm font-medium mb-1">
                  Sexo <span className="text-destructive">*</span>
                </legend>
                <div className="flex gap-4">
                  {(['M', 'F', 'outro'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="sexo" value={s} required />
                      {s === 'M' ? 'Masculino' : s === 'F' ? 'Feminino' : 'Outro'}
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          )}

          {/* ── Step 2b: Existing athlete confirmation ───────────────────── */}
          {step === 'confirmacao' && !lookupResult?.atleta && (
            <p className="text-sm text-destructive">
              Erro ao carregar dados do atleta. Feche e tente novamente.
            </p>
          )}
          {step === 'confirmacao' && lookupResult?.atleta && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este CPF já está cadastrado no sistema. Confirme os dados para matricular o atleta nesta escola.
              </p>
              <div className="rounded-md border p-4 space-y-2 text-sm">
                <div>
                  <span className="font-medium">Nome:</span>{' '}
                  {lookupResult.atleta.nome}
                </div>
                {lookupResult.atleta.data_nascimento && (
                  <div>
                    <span className="font-medium">Nascimento:</span>{' '}
                    {formatDateDisplay(lookupResult.atleta.data_nascimento)}
                  </div>
                )}
                {lookupResult.atleta.sexo && (
                  <div>
                    <span className="font-medium">Sexo:</span>{' '}
                    {lookupResult.atleta.sexo === 'M'
                      ? 'Masculino'
                      : lookupResult.atleta.sexo === 'F'
                      ? 'Feminino'
                      : 'Outro'}
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* ── Step 3: Guardian linkage ──────────────────────────────────── */}
          {step === 'responsavel' && (
            <div className="space-y-4">
              {/* Already-linked guardians */}
              {vinculacoes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Responsáveis vinculados
                  </p>
                  {vinculacoes.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{v.responsavel.nome}</p>
                        {v.responsavel.email && (
                          <p className="text-xs text-muted-foreground truncate">{v.responsavel.email}</p>
                        )}
                      </div>
                      <label className="flex items-center gap-1.5 shrink-0 ml-3 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="financeiro"
                          value={v.responsavel_id}
                          checked={v.financeiro}
                          disabled={!!updatingFinanceiro}
                          onChange={() => handleSetFinanceiro(v.responsavel_id)}
                        />
                        Financeiro
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Search section */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Buscar responsável existente
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome, e-mail ou CPF"
                    value={responsavelQuery}
                    onChange={(e) => { setResponsavelQuery(e.target.value); setError(null) }}
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarResponsaveis}
                    disabled={searchLoading || !responsavelQuery.trim()}
                    className="px-3 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {searchLoading ? '...' : 'Buscar'}
                  </button>
                </div>

                {/* Search results */}
                {responsavelResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {responsavelResults.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.nome}</p>
                          {r.cpf && (
                            <p className="text-xs text-muted-foreground tabular-nums">CPF {formatCpf(r.cpf)}</p>
                          )}
                          {r.email && (
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVincular(r)}
                          disabled={!!linkingId}
                          className="shrink-0 ml-2 px-2 py-1 rounded border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {linkingId === r.id ? '...' : 'Vincular'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new guardian */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="text-sm text-primary underline"
                >
                  {showCreateForm ? 'Cancelar novo responsável' : '+ Adicionar novo responsável'}
                </button>

                {showCreateForm && (
                  <form onSubmit={handleCriarEVincular} className="mt-3 space-y-3 rounded-md border p-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        CPF <span className="text-destructive">*</span>
                      </label>
                      <input
                        name="cpf"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        value={novoResponsavelCpf}
                        onChange={(e) => {
                          setNovoResponsavelCpf(formatCpf(e.target.value))
                          setError(null)
                        }}
                        maxLength={14}
                        required
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Identificador único da pessoa no sistema (não pode ser o mesmo CPF de um atleta ativo).
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Nome <span className="text-destructive">*</span>
                      </label>
                      <input
                        name="nome"
                        type="text"
                        required
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        E-mail <span className="text-destructive">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Telefone</label>
                      <input
                        name="telefone"
                        type="tel"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Salvando…' : 'Salvar responsável'}
                    </button>
                  </form>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* AC4 guard message */}
              {!hasFinanceiro && (
                <p className="text-sm text-amber-600">
                  É necessário pelo menos um responsável financeiro
                </p>
              )}
            </div>
          )}

          {/* ── Step: Plano e matrícula (Story 3.4) ─────────────────────── */}
          {step === 'matricula' && (
            <form id="form-matricula" onSubmit={handleFinalizarMatricula} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina o contrato e valores. Opcionalmente use um template de plano de pagamento da escola.
              </p>
              <div>
                <label htmlFor="plano-template" className="block text-sm font-medium mb-1">
                  Template de plano (opcional)
                </label>
                <select
                  id="plano-template"
                  value={matriculaForm.plano_id}
                  onChange={(e) => aplicarTemplatePlano(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Preencher manualmente</option>
                  {planosMatricula.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.frequencia}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="turma-matricula" className="block text-sm font-medium mb-1">
                  Turma (opcional)
                </label>
                <select
                  id="turma-matricula"
                  value={matriculaForm.turma_id}
                  onChange={(e) => setMatriculaForm((m) => ({ ...m, turma_id: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">Sem turma neste momento</option>
                  {turmasMatricula.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} — {t.modalidade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="data_inicio" className="block text-sm font-medium mb-1">
                    Início do contrato <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="data_inicio"
                    type="date"
                    required
                    value={matriculaForm.data_inicio}
                    onChange={(e) => setMatriculaForm((m) => ({ ...m, data_inicio: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="data_fim" className="block text-sm font-medium mb-1">
                    Fim (opcional)
                  </label>
                  <input
                    id="data_fim"
                    type="date"
                    value={matriculaForm.data_fim}
                    onChange={(e) => setMatriculaForm((m) => ({ ...m, data_fim: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tipo_periodo" className="block text-sm font-medium mb-1">
                  Tipo de período
                </label>
                <select
                  id="tipo_periodo"
                  value={matriculaForm.tipo_periodo}
                  onChange={(e) =>
                    setMatriculaForm((m) => ({
                      ...m,
                      tipo_periodo: e.target.value as FrequenciaTipo | 'personalizado',
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="valor_mat" className="block text-sm font-medium mb-1">
                    Valor base (R$) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="valor_mat"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={matriculaForm.valor}
                    onChange={(e) => setMatriculaForm((m) => ({ ...m, valor: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="desconto_pct_mat" className="block text-sm font-medium mb-1">
                    Desconto (%)
                  </label>
                  <input
                    id="desconto_pct_mat"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={matriculaForm.desconto_pct}
                    onChange={(e) => setMatriculaForm((m) => ({ ...m, desconto_pct: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="desconto_motivo_mat" className="block text-sm font-medium mb-1">
                  Motivo do desconto (opcional)
                </label>
                <input
                  id="desconto_motivo_mat"
                  type="text"
                  value={matriculaForm.desconto_motivo}
                  onChange={(e) => setMatriculaForm((m) => ({ ...m, desconto_motivo: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Bolsa, irmão, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dia_venc_mat" className="block text-sm font-medium mb-1">
                    Dia de vencimento
                  </label>
                  <input
                    id="dia_venc_mat"
                    type="number"
                    min={1}
                    max={28}
                    required
                    value={matriculaForm.dia_vencimento}
                    onChange={(e) => setMatriculaForm((m) => ({ ...m, dia_vencimento: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="forma_pag_mat" className="block text-sm font-medium mb-1">
                    Forma de pagamento
                  </label>
                  <select
                    id="forma_pag_mat"
                    value={matriculaForm.forma_pagamento}
                    onChange={(e) =>
                      setMatriculaForm((m) => ({
                        ...m,
                        forma_pagamento: e.target.value as FormaMatricula,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="qualquer">Qualquer</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={matriculaForm.gerar_auto}
                  onChange={(e) => setMatriculaForm((m) => ({ ...m, gerar_auto: e.target.checked }))}
                />
                Gerar cobranças automaticamente (quando o módulo financeiro estiver ativo)
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          )}

          {/* ── Step 4: Success ──────────────────────────────────────────── */}
          {step === 'sucesso' && (
            <div className="space-y-2 py-2">
              <p className="text-sm font-medium text-green-700">
                ✓ Matrícula registrada: responsáveis vinculados e contrato salvo.
              </p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {step === 'cpf' && (
            <div className="flex gap-2">
              <DrawerClose asChild>
                <button className="flex-1 border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  Cancelar
                </button>
              </DrawerClose>
              {lookupResult?.status === 'mesma_escola' ? (
                <button
                  type="button"
                  onClick={() => {
                    setLookupResult(null)
                    setCpfInput('')
                    setError(null)
                  }}
                  className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Informar outro CPF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCpfLookup}
                  disabled={saving || cleanCpf(cpfInput).length < 11}
                  className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Buscando…' : 'Buscar'}
                </button>
              )}
            </div>
          )}

          {step === 'formulario' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep('cpf'); setError(null) }}
                className="flex-1 border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                form="form-registro"
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Cadastrar'}
              </button>
            </div>
          )}

          {step === 'confirmacao' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep('cpf'); setError(null) }}
                className="flex-1 border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmarMatricula}
                disabled={saving || !lookupResult?.atleta}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Confirmar matrícula
              </button>
            </div>
          )}

          {step === 'matricula' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep('responsavel')
                }}
                className="flex-1 border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                form="form-matricula"
                disabled={matriculaSaving}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {matriculaSaving ? 'Salvando…' : 'Finalizar matrícula'}
              </button>
            </div>
          )}

          {step === 'responsavel' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep(lookupResult?.status === 'existe' ? 'confirmacao' : 'formulario')
                }}
                className="flex-1 border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasFinanceiro) return
                  setStep('matricula')
                }}
                disabled={!hasFinanceiro}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                title={!hasFinanceiro ? 'É necessário pelo menos um responsável financeiro' : undefined}
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'sucesso' && (
            <DrawerClose asChild>
              <button className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                Fechar
              </button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
