'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  criarAtestadoSaude,
  criarExameSaude,
  listarAtletasSaude,
  listarRegistrosSaudeEscola,
  type SaudeRegistroRow,
} from '@/lib/saude-actions'
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

type AtletaOption = {
  atleta_id: string
  matricula_id: string
  atleta_nome: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function alertaBadge(status: SaudeRegistroRow['status_alerta']): string {
  switch (status) {
    case 'vencido':
      return 'bg-rose-500/15 text-rose-900 dark:text-rose-200'
    case 'vence_em_breve':
      return 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
    case 'ok':
      return 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function alertaLabel(status: SaudeRegistroRow['status_alerta']): string {
  switch (status) {
    case 'vencido':
      return 'Vencido'
    case 'vence_em_breve':
      return 'Vence em breve'
    case 'ok':
      return 'Vigente'
    default:
      return 'Sem validade'
  }
}

export default function SaudePageClient({ escolaId }: Props) {
  const [rows, setRows] = useState<SaudeRegistroRow[]>([])
  const [atletas, setAtletas] = useState<AtletaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingExame, setSavingExame] = useState(false)
  const [savingAtestado, setSavingAtestado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertas, setAlertas] = useState({
    vencidos: 0,
    proximos: 0,
    exames: 0,
    atestados: 0,
  })

  const [exameAtletaId, setExameAtletaId] = useState('none')
  const [exameTipo, setExameTipo] = useState<'clinico' | 'esportivo' | 'laboratorial'>('clinico')
  const [exameTitulo, setExameTitulo] = useState('')
  const [exameData, setExameData] = useState('')
  const [exameResumo, setExameResumo] = useState('')
  const [exameArquivo, setExameArquivo] = useState('')
  const [exameRecorrente, setExameRecorrente] = useState('false')
  const [exameVencimento, setExameVencimento] = useState('')

  const [atestadoAtletaId, setAtestadoAtletaId] = useState('none')
  const [atestadoTitulo, setAtestadoTitulo] = useState('')
  const [atestadoEmissao, setAtestadoEmissao] = useState('')
  const [atestadoValidade, setAtestadoValidade] = useState('')
  const [atestadoObservacao, setAtestadoObservacao] = useState('')
  const [atestadoArquivo, setAtestadoArquivo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [registrosResult, atletasResult] = await Promise.all([
      listarRegistrosSaudeEscola(escolaId),
      listarAtletasSaude(escolaId),
    ])

    if (registrosResult.error) {
      setError(registrosResult.error)
      setRows([])
    } else {
      setRows(registrosResult.rows ?? [])
      setAlertas(
        registrosResult.alertas ?? {
          vencidos: 0,
          proximos: 0,
          exames: 0,
          atestados: 0,
        }
      )
    }

    if (atletasResult.error) {
      setError(atletasResult.error)
      setAtletas([])
    } else {
      setAtletas(atletasResult.rows ?? [])
    }

    setLoading(false)
  }, [escolaId])

  useEffect(() => {
    void load()
  }, [load])

  function getAtletaOption(atletaId: string): AtletaOption | undefined {
    return atletas.find((row) => row.atleta_id === atletaId)
  }

  async function onCreateExame(e: React.FormEvent) {
    e.preventDefault()
    if (savingExame) return
    setSavingExame(true)
    setError(null)

    const atleta = getAtletaOption(exameAtletaId)
    if (!atleta) {
      setError('Selecione um atleta para o exame.')
      setSavingExame(false)
      return
    }

    const fd = new FormData()
    fd.append('atleta_id', atleta.atleta_id)
    fd.append('matricula_id', atleta.matricula_id)
    fd.append('tipo_exame', exameTipo)
    fd.append('titulo', exameTitulo)
    fd.append('data_exame', exameData)
    fd.append('resultado_resumido', exameResumo)
    fd.append('arquivo_url', exameArquivo)
    fd.append('recorrente', exameRecorrente)
    fd.append('proximo_vencimento', exameVencimento)

    const result = await criarExameSaude(escolaId, fd)
    if (result.error) {
      setError(result.error)
    } else {
      setExameTitulo('')
      setExameData('')
      setExameResumo('')
      setExameArquivo('')
      setExameVencimento('')
      setExameRecorrente('false')
      await load()
    }

    setSavingExame(false)
  }

  async function onCreateAtestado(e: React.FormEvent) {
    e.preventDefault()
    if (savingAtestado) return
    setSavingAtestado(true)
    setError(null)

    const atleta = getAtletaOption(atestadoAtletaId)
    if (!atleta) {
      setError('Selecione um atleta para o atestado.')
      setSavingAtestado(false)
      return
    }

    const fd = new FormData()
    fd.append('atleta_id', atleta.atleta_id)
    fd.append('matricula_id', atleta.matricula_id)
    fd.append('titulo', atestadoTitulo)
    fd.append('data_emissao', atestadoEmissao)
    fd.append('validade_ate', atestadoValidade)
    fd.append('observacao', atestadoObservacao)
    fd.append('arquivo_url', atestadoArquivo)

    const result = await criarAtestadoSaude(escolaId, fd)
    if (result.error) {
      setError(result.error)
    } else {
      setAtestadoTitulo('')
      setAtestadoEmissao('')
      setAtestadoValidade('')
      setAtestadoObservacao('')
      setAtestadoArquivo('')
      await load()
    }

    setSavingAtestado(false)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saúde · Exames e atestados</h1>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Exames registrados</p>
          <p className="text-2xl font-semibold">{alertas.exames}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Atestados registrados</p>
          <p className="text-2xl font-semibold">{alertas.atestados}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencidos</p>
          <p className="text-2xl font-semibold">{alertas.vencidos}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencem em breve</p>
          <p className="text-2xl font-semibold">{alertas.proximos}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={onCreateExame} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Registrar exame</h2>

          <div className="flex flex-col gap-1.5">
            <Label>Atleta</Label>
            <Select value={exameAtletaId} onValueChange={(value) => setExameAtletaId(value ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um atleta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {atletas.map((atleta) => (
                  <SelectItem key={atleta.atleta_id} value={atleta.atleta_id}>
                    {atleta.atleta_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select value={exameTipo} onValueChange={(value) => setExameTipo(value as typeof exameTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinico">Clínico</SelectItem>
                  <SelectItem value="esportivo">Esportivo</SelectItem>
                  <SelectItem value="laboratorial">Laboratorial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exame-data">Data do exame</Label>
              <Input
                id="exame-data"
                type="date"
                value={exameData}
                onChange={(e) => setExameData(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exame-titulo">Título</Label>
            <Input
              id="exame-titulo"
              value={exameTitulo}
              onChange={(e) => setExameTitulo(e.target.value)}
              placeholder="Exame médico anual"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exame-resumo">Resultado resumido</Label>
            <textarea
              id="exame-resumo"
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
              value={exameResumo}
              onChange={(e) => setExameResumo(e.target.value)}
              placeholder="Apto para atividades esportivas, sem restrições..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Recorrente</Label>
              <Select value={exameRecorrente} onValueChange={(value) => setExameRecorrente(value ?? 'false')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Não</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exame-vencimento">Próximo vencimento</Label>
              <Input
                id="exame-vencimento"
                type="date"
                value={exameVencimento}
                onChange={(e) => setExameVencimento(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exame-arquivo">URL do anexo</Label>
            <Input
              id="exame-arquivo"
              value={exameArquivo}
              onChange={(e) => setExameArquivo(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button type="submit" disabled={savingExame}>
            {savingExame ? 'Salvando...' : 'Registrar exame'}
          </Button>
        </form>

        <form onSubmit={onCreateAtestado} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Registrar atestado</h2>

          <div className="flex flex-col gap-1.5">
            <Label>Atleta</Label>
            <Select value={atestadoAtletaId} onValueChange={(value) => setAtestadoAtletaId(value ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um atleta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {atletas.map((atleta) => (
                  <SelectItem key={atleta.atleta_id} value={atleta.atleta_id}>
                    {atleta.atleta_nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="atestado-titulo">Título</Label>
              <Input
                id="atestado-titulo"
                value={atestadoTitulo}
                onChange={(e) => setAtestadoTitulo(e.target.value)}
                placeholder="Atestado de aptidão física"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="atestado-emissao">Data de emissão</Label>
              <Input
                id="atestado-emissao"
                type="date"
                value={atestadoEmissao}
                onChange={(e) => setAtestadoEmissao(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="atestado-validade">Validade até</Label>
              <Input
                id="atestado-validade"
                type="date"
                value={atestadoValidade}
                onChange={(e) => setAtestadoValidade(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="atestado-arquivo">URL do anexo</Label>
              <Input
                id="atestado-arquivo"
                value={atestadoArquivo}
                onChange={(e) => setAtestadoArquivo(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="atestado-observacao">Observação</Label>
            <textarea
              id="atestado-observacao"
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
              value={atestadoObservacao}
              onChange={(e) => setAtestadoObservacao(e.target.value)}
              placeholder="Observações sobre restrições, liberação ou acompanhamento..."
            />
          </div>

          <Button type="submit" disabled={savingAtestado}>
            {savingAtestado ? 'Salvando...' : 'Registrar atestado'}
          </Button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Atleta</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando registros de saúde...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum registro clínico cadastrado.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr key={`${row.tipo_registro}:${row.id}`} className="border-b border-border/80">
                    <td className="px-4 py-3 font-medium">{row.atleta_nome}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.titulo}</p>
                      {row.resumo && (
                        <p className="text-xs text-muted-foreground">{row.resumo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {row.tipo_registro} · {row.categoria}
                    </td>
                    <td className="px-4 py-3">{formatDate(row.data_referencia)}</td>
                    <td className="px-4 py-3">{formatDate(row.validade_ate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${alertaBadge(
                          row.status_alerta
                        )}`}
                      >
                        {alertaLabel(row.status_alerta)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
