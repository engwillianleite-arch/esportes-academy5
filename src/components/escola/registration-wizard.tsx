'use client'

import { useState } from 'react'
import { criarEscola } from '@/lib/escola-actions'
import { PLAN_MODULES } from '@/lib/modulo-access'
import { MODULO_INFO } from '@/lib/modulo-info'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { PlanoTipo } from '@/types'

// ─── Predefined modalities ────────────────────────────────────────────────────

const MODALITIES = [
  'Futebol', 'Futsal', 'Natação', 'Basquete', 'Voleibol',
  'Jiu-Jitsu', 'Muay Thai', 'Boxe', 'Atletismo', 'Tênis',
  'Judô', 'Karatê', 'Handebol',
]

const PLANS: { value: PlanoTipo; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

// ─── CNPJ formatting ──────────────────────────────────────────────────────────

function formatCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

type FormValues = {
  nome: string
  cnpj: string
  email: string
  telefone: string
  plano: PlanoTipo
  modalidades: string[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RegistrationWizard() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    plano: 'starter',
    modalidades: [],
  })

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function toggleModalidade(mod: string) {
    setValues(prev => ({
      ...prev,
      modalidades: prev.modalidades.includes(mod)
        ? prev.modalidades.filter(m => m !== mod)
        : [...prev.modalidades, mod],
    }))
  }

  function validateStep1(): string | null {
    if (!values.nome.trim()) return 'Nome da escola é obrigatório'
    const digits = values.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return 'CNPJ deve ter 14 dígitos'
    if (!values.email.trim() || !values.email.includes('@')) return 'E-mail inválido'
    if (!values.telefone.trim()) return 'Telefone é obrigatório'
    return null
  }

  function handleNext() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    setError(null)
    setStep(s => (s + 1) as Step)
  }

  function handleBack() {
    setError(null)
    setStep(s => (s - 1) as Step)
  }

  async function handleSubmit() {
    if (loading) return
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.append('nome', values.nome)
    fd.append('cnpj', values.cnpj)
    fd.append('email', values.email)
    fd.append('telefone', values.telefone)
    fd.append('plano', values.plano)
    values.modalidades.forEach(m => fd.append('modalidades', m))

    const result = await criarEscola(fd)
    // criarEscola redirects on success — only reaches here on error
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Cadastrar escola</span>
        <span>Passo {step} de 4</span>
      </div>

      {/* Step 1 — Identity */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Dados da escola</h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome da escola *</Label>
            <Input
              id="nome"
              placeholder="Ex: Academia Força Total"
              value={values.nome}
              onChange={e => updateField('nome', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={formatCnpj(values.cnpj)}
              onChange={e => updateField('cnpj', e.target.value.replace(/\D/g, ''))}
              maxLength={18}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail de contato *</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@minhaescola.com.br"
              value={values.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              placeholder="(11) 99999-9999"
              value={values.telefone}
              onChange={e => updateField('telefone', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2 — Plan */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Escolha seu plano</h2>
          <div className="flex flex-col gap-3">
            {PLANS.map(plan => {
              const mods = PLAN_MODULES[plan.value]
              const selected = values.plano === plan.value
              return (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => updateField('plano', plan.value)}
                  className="text-left"
                >
                  <Card className={selected ? 'ring-2 ring-primary' : ''}>
                    <CardHeader className="pb-2">
                      <span className="font-semibold">{plan.label}</span>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {mods.map(s => MODULO_INFO[s].label).join(' · ')}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Modalities */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Modalidades</h2>
            <p className="text-sm text-muted-foreground">Opcional — selecione as modalidades que sua escola oferece.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map(mod => {
              const active = values.modalidades.includes(mod)
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModalidade(mod)}
                  className={
                    active
                      ? 'rounded-full border bg-primary px-3 py-1 text-sm font-medium text-primary-foreground'
                      : 'rounded-full border px-3 py-1 text-sm font-medium text-foreground hover:bg-accent'
                  }
                >
                  {mod}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Confirmar dados</h2>
          <div className="rounded-lg border divide-y text-sm">
            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{values.nome}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">CNPJ</span>
              <span className="font-medium">{formatCnpj(values.cnpj)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium">{values.email}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">{values.telefone}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium capitalize">{values.plano}</span>
            </div>
            {values.modalidades.length > 0 && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Modalidades</span>
                <span className="font-medium text-right">{values.modalidades.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button type="button" onClick={handleNext}>
            Próximo
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar escola'}
          </Button>
        )}
      </div>
    </div>
  )
}
