'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  criarAlternativaQuizCurso,
  criarAulaCurso,
  criarCursoCatalogo,
  criarModuloCurso,
  criarPerguntaQuizCurso,
  criarQuizCurso,
  listarCursosEscola,
  listarEstruturaCursosEscola,
  listarQuizzesCursosEscola,
  responderQuizCurso,
  type CursoCatalogoRow,
  type CursoEstruturaRow,
  type CursoQuizRow,
} from '@/lib/curso-actions'
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

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

const STATUS_BADGE: Record<CursoCatalogoRow['status'], string> = {
  rascunho: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  publicado: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
  arquivado: 'bg-muted text-muted-foreground',
}

export default function CursosPageClient({ escolaId }: Props) {
  const [rows, setRows] = useState<CursoCatalogoRow[]>([])
  const [estrutura, setEstrutura] = useState<CursoEstruturaRow[]>([])
  const [quizzes, setQuizzes] = useState<CursoQuizRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingModulo, setSavingModulo] = useState(false)
  const [savingAula, setSavingAula] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [savingPergunta, setSavingPergunta] = useState(false)
  const [savingAlternativa, setSavingAlternativa] = useState(false)
  const [submittingTentativa, setSubmittingTentativa] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizResultMsg, setQuizResultMsg] = useState<string | null>(null)
  const [resumo, setResumo] = useState({ total: 0, publicados: 0, rascunhos: 0, arquivados: 0, assinatura: 0, individual: 0 })

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('todos')
  const [status, setStatus] = useState('rascunho')
  const [modalidade, setModalidade] = useState('individual')
  const [preco, setPreco] = useState('0')
  const [periodoAcessoDias, setPeriodoAcessoDias] = useState('')
  const [ofertaAtiva, setOfertaAtiva] = useState('true')
  const [interno, setInterno] = useState('false')

  const [cursoSelecionado, setCursoSelecionado] = useState('none')
  const [moduloTitulo, setModuloTitulo] = useState('')
  const [moduloDescricao, setModuloDescricao] = useState('')
  const [moduloOrdem, setModuloOrdem] = useState('1')
  const [moduloPublished, setModuloPublished] = useState('true')

  const [aulaCursoSelecionado, setAulaCursoSelecionado] = useState('none')
  const [aulaModuloSelecionado, setAulaModuloSelecionado] = useState('none')
  const [aulaTitulo, setAulaTitulo] = useState('')
  const [aulaDescricao, setAulaDescricao] = useState('')
  const [aulaOrdem, setAulaOrdem] = useState('1')
  const [aulaVideoUrl, setAulaVideoUrl] = useState('')
  const [aulaPdfUrl, setAulaPdfUrl] = useState('')
  const [aulaTextoConteudo, setAulaTextoConteudo] = useState('')
  const [aulaQuizHabilitado, setAulaQuizHabilitado] = useState('false')
  const [aulaPublished, setAulaPublished] = useState('true')

  const [quizCursoSelecionado, setQuizCursoSelecionado] = useState('none')
  const [quizTipo, setQuizTipo] = useState<'aula' | 'modulo' | 'curso_final'>('curso_final')
  const [quizModuloSelecionado, setQuizModuloSelecionado] = useState('none')
  const [quizAulaSelecionada, setQuizAulaSelecionada] = useState('none')
  const [quizTitulo, setQuizTitulo] = useState('')
  const [quizDescricao, setQuizDescricao] = useState('')
  const [quizNotaMinima, setQuizNotaMinima] = useState('70')
  const [quizTentativasMax, setQuizTentativasMax] = useState('1')
  const [quizPublished, setQuizPublished] = useState('true')

  const [perguntaQuizSelecionado, setPerguntaQuizSelecionado] = useState('none')
  const [perguntaEnunciado, setPerguntaEnunciado] = useState('')
  const [perguntaOrdem, setPerguntaOrdem] = useState('1')

  const [alternativaPerguntaSelecionada, setAlternativaPerguntaSelecionada] = useState('none')
  const [alternativaTexto, setAlternativaTexto] = useState('')
  const [alternativaOrdem, setAlternativaOrdem] = useState('1')
  const [alternativaCorreta, setAlternativaCorreta] = useState('false')

  const [quizTentativaSelecionado, setQuizTentativaSelecionado] = useState('none')
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [catalogoResult, estruturaResult, quizzesResult] = await Promise.all([
      listarCursosEscola(escolaId),
      listarEstruturaCursosEscola(escolaId),
      listarQuizzesCursosEscola(escolaId),
    ])
    if (catalogoResult.error) {
      setError(catalogoResult.error)
      setRows([])
      setResumo({ total: 0, publicados: 0, rascunhos: 0, arquivados: 0, assinatura: 0, individual: 0 })
    } else {
      setRows(catalogoResult.rows ?? [])
      setResumo(catalogoResult.resumo ?? { total: 0, publicados: 0, rascunhos: 0, arquivados: 0, assinatura: 0, individual: 0 })
    }
    if (estruturaResult.error) { setError(estruturaResult.error); setEstrutura([]) } else setEstrutura(estruturaResult.rows ?? [])
    if (quizzesResult.error) { setError(quizzesResult.error); setQuizzes([]) } else setQuizzes(quizzesResult.rows ?? [])
    setLoading(false)
  }, [escolaId])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (cursoSelecionado === 'none' && estrutura.length > 0) setCursoSelecionado(estrutura[0].id)
    if (aulaCursoSelecionado === 'none' && estrutura.length > 0) setAulaCursoSelecionado(estrutura[0].id)
    if (quizCursoSelecionado === 'none' && estrutura.length > 0) setQuizCursoSelecionado(estrutura[0].id)
  }, [estrutura, cursoSelecionado, aulaCursoSelecionado, quizCursoSelecionado])

  const cursoAulaSelecionado = useMemo(() => estrutura.find((curso) => curso.id === aulaCursoSelecionado) ?? null, [estrutura, aulaCursoSelecionado])
  const cursoQuizSelecionado = useMemo(() => estrutura.find((curso) => curso.id === quizCursoSelecionado) ?? null, [estrutura, quizCursoSelecionado])
  const perguntaSelecionada = useMemo(() => quizzes.flatMap((quiz) => quiz.perguntas).find((pergunta) => pergunta.id === alternativaPerguntaSelecionada) ?? null, [quizzes, alternativaPerguntaSelecionada])
  const quizTentativa = useMemo(() => quizzes.find((quiz) => quiz.id === quizTentativaSelecionado) ?? null, [quizzes, quizTentativaSelecionado])

  useEffect(() => {
    const firstModulo = cursoAulaSelecionado?.modulos[0]?.id ?? 'none'
    setAulaModuloSelecionado(firstModulo)
  }, [cursoAulaSelecionado?.id, cursoAulaSelecionado?.modulos])
  useEffect(() => {
    const firstModulo = cursoQuizSelecionado?.modulos[0]?.id ?? 'none'
    setQuizModuloSelecionado(firstModulo)
    const firstAula = cursoQuizSelecionado?.modulos[0]?.aulas[0]?.id ?? 'none'
    setQuizAulaSelecionada(firstAula)
  }, [cursoQuizSelecionado?.id, cursoQuizSelecionado?.modulos])
  useEffect(() => {
    if (perguntaQuizSelecionado === 'none' && quizzes.length > 0) setPerguntaQuizSelecionado(quizzes[0].id)
    if (quizTentativaSelecionado === 'none' && quizzes.length > 0) setQuizTentativaSelecionado(quizzes[0].id)
  }, [quizzes, perguntaQuizSelecionado, quizTentativaSelecionado])
  async function onCreateCurso(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    const fd = new FormData()
    fd.append('titulo', titulo)
    fd.append('descricao', descricao)
    fd.append('publico_alvo', publicoAlvo)
    fd.append('status', status)
    fd.append('modalidade_comercial', modalidade)
    fd.append('preco', preco)
    fd.append('periodo_acesso_dias', periodoAcessoDias)
    fd.append('oferta_ativa', ofertaAtiva)
    fd.append('interno', interno)
    const result = await criarCursoCatalogo(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setTitulo(''); setDescricao(''); setPublicoAlvo('todos'); setStatus('rascunho'); setModalidade('individual'); setPreco('0'); setPeriodoAcessoDias(''); setOfertaAtiva('true'); setInterno('false')
      await load()
    }
    setSaving(false)
  }

  async function onCreateModulo(e: React.FormEvent) {
    e.preventDefault()
    if (savingModulo || cursoSelecionado === 'none') return
    setSavingModulo(true)
    setError(null)
    const fd = new FormData()
    fd.append('curso_id', cursoSelecionado)
    fd.append('titulo', moduloTitulo)
    fd.append('descricao', moduloDescricao)
    fd.append('ordem', moduloOrdem)
    fd.append('published', moduloPublished)
    const result = await criarModuloCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setModuloTitulo(''); setModuloDescricao(''); setModuloOrdem('1'); setModuloPublished('true')
      await load()
    }
    setSavingModulo(false)
  }

  async function onCreateAula(e: React.FormEvent) {
    e.preventDefault()
    if (savingAula || aulaCursoSelecionado === 'none' || aulaModuloSelecionado === 'none') return
    setSavingAula(true)
    setError(null)
    const fd = new FormData()
    fd.append('curso_id', aulaCursoSelecionado)
    fd.append('modulo_id', aulaModuloSelecionado)
    fd.append('titulo', aulaTitulo)
    fd.append('descricao', aulaDescricao)
    fd.append('ordem', aulaOrdem)
    fd.append('video_url', aulaVideoUrl)
    fd.append('pdf_url', aulaPdfUrl)
    fd.append('texto_conteudo', aulaTextoConteudo)
    fd.append('quiz_habilitado', aulaQuizHabilitado)
    fd.append('published', aulaPublished)
    const result = await criarAulaCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setAulaTitulo(''); setAulaDescricao(''); setAulaOrdem('1'); setAulaVideoUrl(''); setAulaPdfUrl(''); setAulaTextoConteudo(''); setAulaQuizHabilitado('false'); setAulaPublished('true')
      await load()
    }
    setSavingAula(false)
  }

  async function onCreateQuiz(e: React.FormEvent) {
    e.preventDefault()
    if (savingQuiz || quizCursoSelecionado === 'none') return
    setSavingQuiz(true)
    setError(null)
    const fd = new FormData()
    fd.append('curso_id', quizCursoSelecionado)
    fd.append('tipo', quizTipo)
    fd.append('modulo_id', quizModuloSelecionado === 'none' ? '' : quizModuloSelecionado)
    fd.append('aula_id', quizAulaSelecionada === 'none' ? '' : quizAulaSelecionada)
    fd.append('titulo', quizTitulo)
    fd.append('descricao', quizDescricao)
    fd.append('nota_minima', quizNotaMinima)
    fd.append('tentativas_max', quizTentativasMax)
    fd.append('published', quizPublished)
    const result = await criarQuizCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setQuizTitulo(''); setQuizDescricao(''); setQuizNotaMinima('70'); setQuizTentativasMax('1'); setQuizPublished('true')
      await load()
    }
    setSavingQuiz(false)
  }

  async function onCreatePergunta(e: React.FormEvent) {
    e.preventDefault()
    if (savingPergunta || perguntaQuizSelecionado === 'none') return
    setSavingPergunta(true)
    setError(null)
    const fd = new FormData()
    fd.append('quiz_id', perguntaQuizSelecionado)
    fd.append('enunciado', perguntaEnunciado)
    fd.append('ordem', perguntaOrdem)
    const result = await criarPerguntaQuizCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setPerguntaEnunciado(''); setPerguntaOrdem('1')
      await load()
    }
    setSavingPergunta(false)
  }

  async function onCreateAlternativa(e: React.FormEvent) {
    e.preventDefault()
    if (savingAlternativa || alternativaPerguntaSelecionada === 'none') return
    setSavingAlternativa(true)
    setError(null)
    const fd = new FormData()
    fd.append('pergunta_id', alternativaPerguntaSelecionada)
    fd.append('texto', alternativaTexto)
    fd.append('ordem', alternativaOrdem)
    fd.append('correta', alternativaCorreta)
    const result = await criarAlternativaQuizCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setAlternativaTexto(''); setAlternativaOrdem('1'); setAlternativaCorreta('false')
      await load()
    }
    setSavingAlternativa(false)
  }

  async function onSubmitTentativa(e: React.FormEvent) {
    e.preventDefault()
    if (submittingTentativa || !quizTentativa) return
    setSubmittingTentativa(true)
    setError(null)
    setQuizResultMsg(null)
    const fd = new FormData()
    fd.append('quiz_id', quizTentativa.id)
    for (const pergunta of quizTentativa.perguntas) fd.append(`pergunta_${pergunta.id}`, respostasSelecionadas[pergunta.id] ?? '')
    const result = await responderQuizCurso(escolaId, fd)
    if (result.error) setError(result.error)
    else {
      setQuizResultMsg(`Resultado: nota ${result.nota?.toFixed(2)} • ${result.aprovado ? 'aprovado' : 'pendente'}`)
      setRespostasSelecionadas({})
      await load()
    }
    setSubmittingTentativa(false)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">`r`n        <h1 className="text-2xl font-semibold">Cursos · Catálogo, conteúdo e avaliação</h1>`r`n        <Link href="/painel/cursos/comercializacao" className="rounded-md border px-4 py-2 text-sm font-medium">`r`n          Comercialização e progresso`r`n        </Link>`r`n      </div>

      {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {quizResultMsg && <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">{quizResultMsg}</p>}

      <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-semibold">{resumo.total}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Publicados</p><p className="text-2xl font-semibold">{resumo.publicados}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Rascunhos</p><p className="text-2xl font-semibold">{resumo.rascunhos}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Arquivados</p><p className="text-2xl font-semibold">{resumo.arquivados}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Por assinatura</p><p className="text-2xl font-semibold">{resumo.assinatura}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Individuais</p><p className="text-2xl font-semibold">{resumo.individual}</p></div>
      </div>
      <form onSubmit={onCreateCurso} className="mb-6 grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="text-base font-medium">Criar curso do catálogo</h2></div>
        <div className="flex flex-col gap-1.5 md:col-span-2"><Label htmlFor="curso-titulo">Título</Label><Input id="curso-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Curso de fundamentos para professores" required /></div>
        <div className="flex flex-col gap-1.5 md:col-span-2"><Label htmlFor="curso-descricao">Descrição</Label><textarea id="curso-descricao" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Resumo editorial e proposta de valor do curso..." /></div>
        <div className="flex flex-col gap-1.5"><Label>Público-alvo</Label><Select value={publicoAlvo} onValueChange={(value) => setPublicoAlvo(value ?? 'todos')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="professor">Professor</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="responsavel">Responsável</SelectItem><SelectItem value="atleta">Atleta</SelectItem></SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value ?? 'rascunho')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="publicado">Publicado</SelectItem><SelectItem value="arquivado">Arquivado</SelectItem></SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label>Modalidade comercial</Label><Select value={modalidade} onValueChange={(value) => setModalidade(value ?? 'individual')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="assinatura">Assinatura</SelectItem></SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="curso-preco">Preço</Label><Input id="curso-preco" type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="curso-periodo">Período de acesso em dias</Label><Input id="curso-periodo" type="number" min="1" value={periodoAcessoDias} onChange={(e) => setPeriodoAcessoDias(e.target.value)} placeholder="90" /></div>
        <div className="flex flex-col gap-1.5"><Label>Oferta ativa</Label><Select value={ofertaAtiva} onValueChange={(value) => setOfertaAtiva(value ?? 'true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label>Curso interno</Label><Select value={interno} onValueChange={(value) => setInterno(value ?? 'false')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Não</SelectItem><SelectItem value="true">Sim</SelectItem></SelectContent></Select></div>
        <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar curso'}</Button></div>
      </form>

      <div className="mb-6 overflow-hidden rounded-lg border"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left"><th className="px-4 py-3 font-medium">Curso</th><th className="px-4 py-3 font-medium">Público</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Modelo</th><th className="px-4 py-3 font-medium">Oferta</th><th className="px-4 py-3 font-medium text-right">Preço</th></tr></thead><tbody>{loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Carregando catálogo...</td></tr>}{!loading && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum curso cadastrado no catálogo.</td></tr>}{!loading && rows.map((row) => <tr key={row.id} className="border-b border-border/80"><td className="px-4 py-3"><p className="font-medium">{row.titulo}</p><p className="text-xs text-muted-foreground">{row.descricao ?? 'Sem descrição'}</p></td><td className="px-4 py-3 capitalize">{row.publico_alvo}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>{row.status}</span></td><td className="px-4 py-3 capitalize">{row.modalidade_comercial}</td><td className="px-4 py-3">{row.status === 'publicado' && row.oferta_ativa && !row.interno ? 'No catálogo' : row.status === 'arquivado' ? 'Oculto' : row.interno ? 'Interno' : 'Preparação'}</td><td className="px-4 py-3 text-right tabular-nums">{formatBRL(row.preco)}</td></tr>)}</tbody></table></div></div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={onCreateModulo} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Estruturar módulos do curso</h2>
          <div className="flex flex-col gap-1.5"><Label>Curso</Label><Select value={cursoSelecionado} onValueChange={(value) => setCursoSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione um curso" /></SelectTrigger><SelectContent>{estrutura.length === 0 ? <SelectItem value="none">Cadastre um curso primeiro</SelectItem> : estrutura.map((curso) => <SelectItem key={curso.id} value={curso.id}>{curso.titulo}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="modulo-titulo">Título do módulo</Label><Input id="modulo-titulo" value={moduloTitulo} onChange={(e) => setModuloTitulo(e.target.value)} placeholder="Módulo 1 · Fundamentos" required /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="modulo-descricao">Descrição do módulo</Label><textarea id="modulo-descricao" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" value={moduloDescricao} onChange={(e) => setModuloDescricao(e.target.value)} placeholder="Objetivo pedagógico do módulo..." /></div>
          <div className="grid gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><Label htmlFor="modulo-ordem">Ordem</Label><Input id="modulo-ordem" type="number" min="1" value={moduloOrdem} onChange={(e) => setModuloOrdem(e.target.value)} required /></div><div className="flex flex-col gap-1.5"><Label>Publicado</Label><Select value={moduloPublished} onValueChange={(value) => setModuloPublished(value ?? 'true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div></div>
          <Button type="submit" disabled={savingModulo || cursoSelecionado === 'none'}>{savingModulo ? 'Salvando...' : 'Criar módulo'}</Button>
        </form>

        <form onSubmit={onCreateAula} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar aula</h2>
          <div className="grid gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><Label>Curso</Label><Select value={aulaCursoSelecionado} onValueChange={(value) => setAulaCursoSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione um curso" /></SelectTrigger><SelectContent>{estrutura.length === 0 ? <SelectItem value="none">Cadastre um curso primeiro</SelectItem> : estrutura.map((curso) => <SelectItem key={curso.id} value={curso.id}>{curso.titulo}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-1.5"><Label>Módulo</Label><Select value={aulaModuloSelecionado} onValueChange={(value) => setAulaModuloSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione um módulo" /></SelectTrigger><SelectContent>{(cursoAulaSelecionado?.modulos ?? []).length === 0 ? <SelectItem value="none">Cadastre um módulo primeiro</SelectItem> : (cursoAulaSelecionado?.modulos ?? []).map((modulo) => <SelectItem key={modulo.id} value={modulo.id}>{modulo.ordem}. {modulo.titulo}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="aula-titulo">Título da aula</Label><Input id="aula-titulo" value={aulaTitulo} onChange={(e) => setAulaTitulo(e.target.value)} placeholder="Aula 1 · Introdução" required /></div>
          <div className="grid gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><Label htmlFor="aula-ordem">Ordem</Label><Input id="aula-ordem" type="number" min="1" value={aulaOrdem} onChange={(e) => setAulaOrdem(e.target.value)} required /></div><div className="flex flex-col gap-1.5"><Label>Quiz associado</Label><Select value={aulaQuizHabilitado} onValueChange={(value) => setAulaQuizHabilitado(value ?? 'false')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Não</SelectItem><SelectItem value="true">Sim</SelectItem></SelectContent></Select></div></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="aula-descricao">Descrição da aula</Label><textarea id="aula-descricao" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" value={aulaDescricao} onChange={(e) => setAulaDescricao(e.target.value)} placeholder="Resumo da aula..." /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="aula-video">URL do vídeo</Label><Input id="aula-video" value={aulaVideoUrl} onChange={(e) => setAulaVideoUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="aula-pdf">URL do PDF</Label><Input id="aula-pdf" value={aulaPdfUrl} onChange={(e) => setAulaPdfUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="aula-texto">Texto da aula</Label><textarea id="aula-texto" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" value={aulaTextoConteudo} onChange={(e) => setAulaTextoConteudo(e.target.value)} placeholder="Conteúdo textual da aula..." /></div>
          <div className="flex flex-col gap-1.5"><Label>Publicado</Label><Select value={aulaPublished} onValueChange={(value) => setAulaPublished(value ?? 'true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div>
          <Button type="submit" disabled={savingAula || aulaCursoSelecionado === 'none' || aulaModuloSelecionado === 'none'}>{savingAula ? 'Salvando...' : 'Criar aula'}</Button>
        </form>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={onCreateQuiz} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar quiz ou avaliação</h2>
          <div className="flex flex-col gap-1.5"><Label>Curso</Label><Select value={quizCursoSelecionado} onValueChange={(value) => setQuizCursoSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione um curso" /></SelectTrigger><SelectContent>{estrutura.length === 0 ? <SelectItem value="none">Cadastre um curso primeiro</SelectItem> : estrutura.map((curso) => <SelectItem key={curso.id} value={curso.id}>{curso.titulo}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-4 md:grid-cols-3"><div className="flex flex-col gap-1.5"><Label>Tipo</Label><Select value={quizTipo} onValueChange={(value) => setQuizTipo((value ?? 'curso_final') as 'aula' | 'modulo' | 'curso_final')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aula">Aula</SelectItem><SelectItem value="modulo">Módulo</SelectItem><SelectItem value="curso_final">Curso final</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-1.5"><Label>Módulo</Label><Select value={quizModuloSelecionado} onValueChange={(value) => setQuizModuloSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{(cursoQuizSelecionado?.modulos ?? []).map((modulo) => <SelectItem key={modulo.id} value={modulo.id}>{modulo.ordem}. {modulo.titulo}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-1.5"><Label>Aula</Label><Select value={quizAulaSelecionada} onValueChange={(value) => setQuizAulaSelecionada(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{(cursoQuizSelecionado?.modulos ?? []).flatMap((modulo) => modulo.aulas.map((aula) => <SelectItem key={aula.id} value={aula.id}>{modulo.ordem}.{aula.ordem} {aula.titulo}</SelectItem>))}</SelectContent></Select></div></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="quiz-titulo">Título</Label><Input id="quiz-titulo" value={quizTitulo} onChange={(e) => setQuizTitulo(e.target.value)} placeholder="Quiz de revisão do módulo" required /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="quiz-descricao">Descrição</Label><textarea id="quiz-descricao" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" value={quizDescricao} onChange={(e) => setQuizDescricao(e.target.value)} placeholder="Orientações para o quiz..." /></div>
          <div className="grid gap-4 md:grid-cols-3"><div className="flex flex-col gap-1.5"><Label htmlFor="quiz-nota">Nota mínima</Label><Input id="quiz-nota" type="number" min="0" max="100" step="0.01" value={quizNotaMinima} onChange={(e) => setQuizNotaMinima(e.target.value)} /></div><div className="flex flex-col gap-1.5"><Label htmlFor="quiz-tentativas">Tentativas máximas</Label><Input id="quiz-tentativas" type="number" min="1" value={quizTentativasMax} onChange={(e) => setQuizTentativasMax(e.target.value)} /></div><div className="flex flex-col gap-1.5"><Label>Publicado</Label><Select value={quizPublished} onValueChange={(value) => setQuizPublished(value ?? 'true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div></div>
          <Button type="submit" disabled={savingQuiz || quizCursoSelecionado === 'none'}>{savingQuiz ? 'Salvando...' : 'Criar quiz'}</Button>
        </form>

        <form onSubmit={onCreatePergunta} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar pergunta do quiz</h2>
          <div className="flex flex-col gap-1.5"><Label>Quiz</Label><Select value={perguntaQuizSelecionado} onValueChange={(value) => setPerguntaQuizSelecionado(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione um quiz" /></SelectTrigger><SelectContent>{quizzes.length === 0 ? <SelectItem value="none">Cadastre um quiz primeiro</SelectItem> : quizzes.map((quiz) => <SelectItem key={quiz.id} value={quiz.id}>{quiz.titulo}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="pergunta-enunciado">Enunciado</Label><textarea id="pergunta-enunciado" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" value={perguntaEnunciado} onChange={(e) => setPerguntaEnunciado(e.target.value)} placeholder="Qual alternativa representa..." required /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="pergunta-ordem">Ordem</Label><Input id="pergunta-ordem" type="number" min="1" value={perguntaOrdem} onChange={(e) => setPerguntaOrdem(e.target.value)} required /></div>
          <Button type="submit" disabled={savingPergunta || perguntaQuizSelecionado === 'none'}>{savingPergunta ? 'Salvando...' : 'Criar pergunta'}</Button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={onCreateAlternativa} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Criar alternativa</h2>
          <div className="flex flex-col gap-1.5"><Label>Pergunta</Label><Select value={alternativaPerguntaSelecionada} onValueChange={(value) => setAlternativaPerguntaSelecionada(value ?? 'none')}><SelectTrigger><SelectValue placeholder="Selecione uma pergunta" /></SelectTrigger><SelectContent>{quizzes.flatMap((quiz) => quiz.perguntas).length === 0 ? <SelectItem value="none">Cadastre uma pergunta primeiro</SelectItem> : quizzes.flatMap((quiz) => quiz.perguntas.map((pergunta) => <SelectItem key={pergunta.id} value={pergunta.id}>{quiz.titulo} · {pergunta.ordem}. {pergunta.enunciado.slice(0, 40)}</SelectItem>))}</SelectContent></Select></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="alternativa-texto">Texto da alternativa</Label><Input id="alternativa-texto" value={alternativaTexto} onChange={(e) => setAlternativaTexto(e.target.value)} placeholder="Alternativa A" required /></div>
          <div className="grid gap-4 md:grid-cols-2"><div className="flex flex-col gap-1.5"><Label htmlFor="alternativa-ordem">Ordem</Label><Input id="alternativa-ordem" type="number" min="1" value={alternativaOrdem} onChange={(e) => setAlternativaOrdem(e.target.value)} required /></div><div className="flex flex-col gap-1.5"><Label>Resposta correta</Label><Select value={alternativaCorreta} onValueChange={(value) => setAlternativaCorreta(value ?? 'false')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Não</SelectItem><SelectItem value="true">Sim</SelectItem></SelectContent></Select></div></div>
          <Button type="submit" disabled={savingAlternativa || alternativaPerguntaSelecionada === 'none'}>{savingAlternativa ? 'Salvando...' : 'Criar alternativa'}</Button>
        </form>

        <form onSubmit={onSubmitTentativa} className="grid gap-4 rounded-lg border bg-card p-4">
          <h2 className="text-base font-medium">Testar tentativa de quiz</h2>
          <div className="flex flex-col gap-1.5"><Label>Quiz</Label><Select value={quizTentativaSelecionado} onValueChange={(value) => { setQuizTentativaSelecionado(value ?? 'none'); setRespostasSelecionadas({}) }}><SelectTrigger><SelectValue placeholder="Selecione um quiz" /></SelectTrigger><SelectContent>{quizzes.length === 0 ? <SelectItem value="none">Cadastre um quiz primeiro</SelectItem> : quizzes.map((quiz) => <SelectItem key={quiz.id} value={quiz.id}>{quiz.titulo}</SelectItem>)}</SelectContent></Select></div>
          {quizTentativa && <div className="space-y-4"><div className="rounded-lg border bg-muted/20 p-3 text-sm"><p className="font-medium">{quizTentativa.titulo}</p><p className="mt-1 text-muted-foreground">Nota mínima: {quizTentativa.nota_minima} · Tentativas máximas: {quizTentativa.tentativas_max}</p></div>{quizTentativa.perguntas.length === 0 && <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">Esse quiz ainda não possui perguntas.</div>}{quizTentativa.perguntas.map((pergunta) => <div key={pergunta.id} className="rounded-lg border p-3"><p className="font-medium">{pergunta.ordem}. {pergunta.enunciado}</p><div className="mt-3 space-y-2">{pergunta.alternativas.map((alternativa) => <label key={alternativa.id} className="flex items-center gap-2 text-sm"><input type="radio" name={`quiz_${quizTentativa.id}_${pergunta.id}`} checked={respostasSelecionadas[pergunta.id] === alternativa.id} onChange={() => setRespostasSelecionadas((current) => ({ ...current, [pergunta.id]: alternativa.id }))} /><span>{alternativa.texto}</span></label>)}</div></div>)}<Button type="submit" disabled={submittingTentativa || quizTentativa.perguntas.length === 0}>{submittingTentativa ? 'Enviando...' : 'Enviar respostas'}</Button></div>}
        </form>
      </div>
      <div className="mt-6 grid gap-5">
        {estrutura.length === 0 && <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">Nenhum curso estruturado ainda.</div>}
        {estrutura.map((curso) => {
          const quizzesCurso = quizzes.filter((quiz) => quiz.curso_id === curso.id)
          return (
            <section key={curso.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-semibold">{curso.titulo}</h2><p className="text-sm text-muted-foreground">{curso.modulos.length} módulo(s) · {curso.modulos.reduce((acc, modulo) => acc + modulo.aulas.length, 0)} aula(s) · {quizzesCurso.length} quiz(zes)</p></div><span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[curso.status]}`}>{curso.status}</span></div>
              <div className="mt-4 space-y-4">
                {curso.modulos.length === 0 && <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">Este curso ainda não possui módulos.</div>}
                {curso.modulos.map((modulo) => <div key={modulo.id} className="rounded-xl border p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-medium">{modulo.ordem}. {modulo.titulo}</h3><p className="text-sm text-muted-foreground">{modulo.descricao ?? 'Sem descrição do módulo'}</p></div><span className="text-xs text-muted-foreground">{modulo.published ? 'Publicado' : 'Rascunho'}</span></div><div className="mt-3 space-y-2">{modulo.aulas.length === 0 && <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">Nenhuma aula cadastrada neste módulo.</div>}{modulo.aulas.map((aula) => <div key={aula.id} className="rounded-lg border bg-muted/20 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{aula.ordem}. {aula.titulo}</p><span className="text-xs text-muted-foreground">{aula.published ? 'Publicada' : 'Rascunho'}</span></div><p className="mt-1 text-sm text-muted-foreground">{aula.descricao ?? 'Sem descrição da aula'}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{aula.video_url && <span className="rounded-full border px-2 py-0.5">Vídeo</span>}{aula.pdf_url && <span className="rounded-full border px-2 py-0.5">PDF</span>}{aula.texto_conteudo && <span className="rounded-full border px-2 py-0.5">Texto</span>}{aula.quiz_habilitado && <span className="rounded-full border px-2 py-0.5">Quiz</span>}</div></div>)}</div></div>)}
                <div className="rounded-xl border p-4"><h3 className="font-medium">Quizzes e avaliações</h3><div className="mt-3 space-y-3">{quizzesCurso.length === 0 && <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">Nenhum quiz cadastrado neste curso.</div>}{quizzesCurso.map((quiz) => <div key={quiz.id} className="rounded-lg border bg-muted/20 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{quiz.titulo}</p><p className="text-sm text-muted-foreground">Tipo {quiz.tipo} · nota mínima {quiz.nota_minima} · tentativas {quiz.tentativas_max}</p></div><span className="text-xs text-muted-foreground">{quiz.published ? 'Publicado' : 'Rascunho'}</span></div><p className="mt-2 text-sm text-muted-foreground">{quiz.perguntas.length} pergunta(s)</p>{quiz.tentativas.length > 0 && <div className="mt-2 rounded-md border bg-background p-2 text-xs text-muted-foreground">Última tentativa: nota {quiz.tentativas[0].nota.toFixed(2)} · {quiz.tentativas[0].aprovado ? 'aprovado' : 'pendente'} em {formatDateTime(quiz.tentativas[0].created_at)}</div>}</div>)}</div></div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}


