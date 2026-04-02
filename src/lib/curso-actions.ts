'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResponsavelAppContext } from '@/lib/pais-actions'
import { createClient } from '@/lib/supabase/server'

export type PublicoAlvoCurso = 'professor' | 'admin' | 'responsavel' | 'atleta' | 'todos'
export type StatusCurso = 'rascunho' | 'publicado' | 'arquivado'
export type ModalidadeComercialCurso = 'assinatura' | 'individual'

export type CursoCatalogoRow = {
  id: string
  titulo: string
  descricao: string | null
  publico_alvo: PublicoAlvoCurso
  status: StatusCurso
  modalidade_comercial: ModalidadeComercialCurso
  preco: number
  periodo_acesso_dias: number | null
  oferta_ativa: boolean
  interno: boolean
  created_at: string
}

export type CursoAulaRow = {
  id: string
  modulo_id: string
  titulo: string
  descricao: string | null
  ordem: number
  video_url: string | null
  pdf_url: string | null
  texto_conteudo: string | null
  quiz_habilitado: boolean
  published: boolean
}

export type CursoModuloRow = {
  id: string
  curso_id: string
  titulo: string
  descricao: string | null
  ordem: number
  published: boolean
  aulas: CursoAulaRow[]
}

export type CursoEstruturaRow = CursoCatalogoRow & {
  modulos: CursoModuloRow[]
}

export type CursoQuizAlternativaRow = {
  id: string
  pergunta_id: string
  texto: string
  ordem: number
  correta: boolean
}

export type CursoQuizPerguntaRow = {
  id: string
  quiz_id: string
  enunciado: string
  ordem: number
  alternativas: CursoQuizAlternativaRow[]
}

export type CursoQuizRow = {
  id: string
  curso_id: string
  modulo_id: string | null
  aula_id: string | null
  tipo: 'aula' | 'modulo' | 'curso_final'
  titulo: string
  descricao: string | null
  nota_minima: number
  tentativas_max: number
  published: boolean
  perguntas: CursoQuizPerguntaRow[]
  tentativas: Array<{
    id: string
    user_id: string
    tentativa_numero: number
    nota: number
    aprovado: boolean
    created_at: string
  }>
}

export type CursoUsuarioOption = {
  usuario_id: string
  auth_user_id: string
  nome: string
  email: string | null
  tipo_usuario: string
  principal: boolean
}

export type CursoAssinaturaUsuarioRow = {
  id: string
  user_id: string
  titulo: string | null
  status: 'ativa' | 'suspensa' | 'cancelada' | 'expirada'
  inicio_em: string
  fim_em: string | null
  origem: 'manual' | 'financeiro' | 'admin'
  created_at: string
}

export type CursoMatriculaUsuarioRow = {
  id: string
  curso_id: string
  user_id: string
  assinatura_id: string | null
  origem_liberacao: 'manual' | 'compra_individual' | 'assinatura'
  status: 'ativo' | 'concluido' | 'suspenso' | 'expirado' | 'cancelado'
  valor_pago: number
  liberado_em: string
  expira_em: string | null
  ultima_atividade_em: string | null
  progresso_pct: number
  aprovado: boolean
  created_at: string
}

export type CursoComercializacaoRow = {
  usuarios: CursoUsuarioOption[]
  assinaturas: Array<
    CursoAssinaturaUsuarioRow & {
      usuario_nome: string
      usuario_email: string | null
    }
  >
  matriculas: Array<
    CursoMatriculaUsuarioRow & {
      curso_titulo: string
      usuario_nome: string
      usuario_email: string | null
    }
  >
}

export type CursoDisponivelAlunoRow = {
  curso_id: string
  titulo: string
  descricao: string | null
  modalidade_comercial: ModalidadeComercialCurso
  origem_acesso: 'manual' | 'compra_individual' | 'assinatura'
  progresso_pct: number
  ultima_atividade_em: string | null
  aprovado: boolean
  status: 'ativo' | 'concluido' | 'suspenso' | 'expirado' | 'cancelado'
  modulos: Array<{
    id: string
    titulo: string
    ordem: number
    aulas: Array<{
      id: string
      titulo: string
      ordem: number
      descricao: string | null
      concluida: boolean
      concluida_em: string | null
    }>
  }>
}

const CURSOS_PERFIS = ['admin_escola', 'coordenador'] as const

async function assertCursosEscola(escolaId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado' }

  const { data: membership } = await supabase
    .from('escola_usuarios')
    .select('id')
    .eq('user_id', user.id)
    .eq('escola_id', escolaId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .in('perfil', [...CURSOS_PERFIS])
    .maybeSingle()

  if (!membership) return { error: 'Sem permissão para o módulo cursos' }
  return { ok: true }
}

export async function listarCursosEscola(
  escolaId: string
): Promise<{
  error: string | null
  rows?: CursoCatalogoRow[]
  resumo?: {
    total: number
    publicados: number
    rascunhos: number
    arquivados: number
    assinatura: number
    individual: number
  }
}> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cursos')
    .select(
      'id, titulo, descricao, publico_alvo, status, modalidade_comercial, preco, periodo_acesso_dias, oferta_ativa, interno, created_at'
    )
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listarCursosEscola]', error.message)
    return { error: 'Erro ao carregar catálogo de cursos.' }
  }

  const rows: CursoCatalogoRow[] = (data ?? []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    publico_alvo: row.publico_alvo as PublicoAlvoCurso,
    status: row.status as StatusCurso,
    modalidade_comercial: row.modalidade_comercial as ModalidadeComercialCurso,
    preco: Number(row.preco),
    periodo_acesso_dias: row.periodo_acesso_dias,
    oferta_ativa: row.oferta_ativa,
    interno: row.interno,
    created_at: row.created_at,
  }))

  return {
    error: null,
    rows,
    resumo: {
      total: rows.length,
      publicados: rows.filter((row) => row.status === 'publicado').length,
      rascunhos: rows.filter((row) => row.status === 'rascunho').length,
      arquivados: rows.filter((row) => row.status === 'arquivado').length,
      assinatura: rows.filter((row) => row.modalidade_comercial === 'assinatura').length,
      individual: rows.filter((row) => row.modalidade_comercial === 'individual').length,
    },
  }
}

export async function criarCursoCatalogo(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const publicoAlvo = ((formData.get('publico_alvo') as string | null)?.trim() ??
    '') as PublicoAlvoCurso
  const status = ((formData.get('status') as string | null)?.trim() ?? 'rascunho') as StatusCurso
  const modalidade = ((formData.get('modalidade_comercial') as string | null)?.trim() ??
    '') as ModalidadeComercialCurso
  const precoRaw = (formData.get('preco') as string | null)?.trim() ?? '0'
  const preco = Number(precoRaw.replace(',', '.'))
  const periodoRaw = (formData.get('periodo_acesso_dias') as string | null)?.trim() ?? ''
  const periodoAcessoDias = periodoRaw ? Number(periodoRaw) : null
  const ofertaAtiva = (formData.get('oferta_ativa') as string | null) === 'true'
  const interno = (formData.get('interno') as string | null) === 'true'

  if (!titulo) return { error: 'Título do curso é obrigatório.' }
  if (!['professor', 'admin', 'responsavel', 'atleta', 'todos'].includes(publicoAlvo)) {
    return { error: 'Público-alvo inválido.' }
  }
  if (!['rascunho', 'publicado', 'arquivado'].includes(status)) {
    return { error: 'Status do curso inválido.' }
  }
  if (!['assinatura', 'individual'].includes(modalidade)) {
    return { error: 'Modalidade comercial inválida.' }
  }
  if (Number.isNaN(preco) || preco < 0) return { error: 'Preço inválido.' }
  if (periodoAcessoDias !== null && (Number.isNaN(periodoAcessoDias) || periodoAcessoDias <= 0)) {
    return { error: 'Período de acesso inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('cursos').insert({
    escola_id: escolaId,
    titulo,
    descricao,
    publico_alvo: publicoAlvo,
    status,
    modalidade_comercial: modalidade,
    preco,
    periodo_acesso_dias: periodoAcessoDias,
    oferta_ativa: ofertaAtiva,
    interno,
  })

  if (error) {
    console.error('[criarCursoCatalogo]', error.message)
    return { error: 'Erro ao criar curso.' }
  }

  return { error: null }
}

export async function listarEstruturaCursosEscola(
  escolaId: string
): Promise<{ error: string | null; rows?: CursoEstruturaRow[] }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const cursosResult = await listarCursosEscola(escolaId)
  if (cursosResult.error) return { error: cursosResult.error }

  const cursoIds = (cursosResult.rows ?? []).map((curso) => curso.id)
  if (cursoIds.length === 0) return { error: null, rows: [] }

  const [modulosRes, aulasRes] = await Promise.all([
    supabase
      .from('curso_modulos')
      .select('id, curso_id, titulo, descricao, ordem, published')
      .in('curso_id', cursoIds)
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
    supabase
      .from('curso_aulas')
      .select(
        'id, curso_id, modulo_id, titulo, descricao, ordem, video_url, pdf_url, texto_conteudo, quiz_habilitado, published'
      )
      .in('curso_id', cursoIds)
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
  ])

  if (modulosRes.error) {
    console.error('[listarEstruturaCursosEscola.modulos]', modulosRes.error.message)
    return { error: 'Erro ao carregar módulos dos cursos.' }
  }

  if (aulasRes.error) {
    console.error('[listarEstruturaCursosEscola.aulas]', aulasRes.error.message)
    return { error: 'Erro ao carregar aulas dos cursos.' }
  }

  const aulasPorModulo = new Map<string, CursoAulaRow[]>()
  for (const aula of aulasRes.data ?? []) {
    const current = aulasPorModulo.get(aula.modulo_id) ?? []
    current.push({
      id: aula.id,
      modulo_id: aula.modulo_id,
      titulo: aula.titulo,
      descricao: aula.descricao,
      ordem: aula.ordem,
      video_url: aula.video_url,
      pdf_url: aula.pdf_url,
      texto_conteudo: aula.texto_conteudo,
      quiz_habilitado: aula.quiz_habilitado,
      published: aula.published,
    })
    aulasPorModulo.set(aula.modulo_id, current)
  }

  const modulosPorCurso = new Map<string, CursoModuloRow[]>()
  for (const modulo of modulosRes.data ?? []) {
    const current = modulosPorCurso.get(modulo.curso_id) ?? []
    current.push({
      id: modulo.id,
      curso_id: modulo.curso_id,
      titulo: modulo.titulo,
      descricao: modulo.descricao,
      ordem: modulo.ordem,
      published: modulo.published,
      aulas: (aulasPorModulo.get(modulo.id) ?? []).sort((a, b) => a.ordem - b.ordem),
    })
    modulosPorCurso.set(modulo.curso_id, current)
  }

  return {
    error: null,
    rows: (cursosResult.rows ?? []).map((curso) => ({
      ...curso,
      modulos: (modulosPorCurso.get(curso.id) ?? []).sort((a, b) => a.ordem - b.ordem),
    })),
  }
}

export async function criarModuloCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const cursoId = (formData.get('curso_id') as string | null)?.trim() ?? ''
  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const ordemRaw = (formData.get('ordem') as string | null)?.trim() ?? ''
  const published = (formData.get('published') as string | null) !== 'false'
  const ordem = Number(ordemRaw)

  if (!cursoId) return { error: 'Curso é obrigatório.' }
  if (!titulo) return { error: 'Título do módulo é obrigatório.' }
  if (!ordem || Number.isNaN(ordem) || ordem < 1) return { error: 'Ordem do módulo inválida.' }

  const supabase = await createClient()
  const { data: curso } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', cursoId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!curso) return { error: 'Curso inválido para esta escola.' }

  const { error } = await supabase.from('curso_modulos').insert({
    curso_id: cursoId,
    titulo,
    descricao,
    ordem,
    published,
  })

  if (error) {
    console.error('[criarModuloCurso]', error.message)
    if (error.code === '23505') {
      return { error: 'Já existe um módulo com essa ordem neste curso.' }
    }
    return { error: 'Erro ao criar módulo do curso.' }
  }

  return { error: null }
}

export async function criarAulaCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const cursoId = (formData.get('curso_id') as string | null)?.trim() ?? ''
  const moduloId = (formData.get('modulo_id') as string | null)?.trim() ?? ''
  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const ordemRaw = (formData.get('ordem') as string | null)?.trim() ?? ''
  const videoUrl = (formData.get('video_url') as string | null)?.trim() || null
  const pdfUrl = (formData.get('pdf_url') as string | null)?.trim() || null
  const textoConteudo = (formData.get('texto_conteudo') as string | null)?.trim() || null
  const quizHabilitado = (formData.get('quiz_habilitado') as string | null) === 'true'
  const published = (formData.get('published') as string | null) !== 'false'
  const ordem = Number(ordemRaw)

  if (!cursoId || !moduloId) return { error: 'Curso e módulo são obrigatórios.' }
  if (!titulo) return { error: 'Título da aula é obrigatório.' }
  if (!ordem || Number.isNaN(ordem) || ordem < 1) return { error: 'Ordem da aula inválida.' }
  if (!videoUrl && !pdfUrl && !textoConteudo) {
    return { error: 'A aula precisa ter vídeo, PDF ou texto.' }
  }

  const supabase = await createClient()
  const { data: modulo } = await supabase
    .from('curso_modulos')
    .select('id, curso_id')
    .eq('id', moduloId)
    .eq('curso_id', cursoId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!modulo) return { error: 'Módulo inválido para este curso.' }

  const { error } = await supabase.from('curso_aulas').insert({
    curso_id: cursoId,
    modulo_id: moduloId,
    titulo,
    descricao,
    ordem,
    video_url: videoUrl,
    pdf_url: pdfUrl,
    texto_conteudo: textoConteudo,
    quiz_habilitado: quizHabilitado,
    published,
  })

  if (error) {
    console.error('[criarAulaCurso]', error.message)
    if (error.code === '23505') {
      return { error: 'Já existe uma aula com essa ordem neste módulo.' }
    }
    return { error: 'Erro ao criar aula do curso.' }
  }

  return { error: null }
}

export async function listarQuizzesCursosEscola(
  escolaId: string
): Promise<{ error: string | null; rows?: CursoQuizRow[] }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const cursosResult = await listarEstruturaCursosEscola(escolaId)
  if (cursosResult.error) return { error: cursosResult.error }

  const cursoIds = (cursosResult.rows ?? []).map((curso) => curso.id)
  if (cursoIds.length === 0) return { error: null, rows: [] }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [quizzesRes, perguntasRes, alternativasRes, tentativasRes] = await Promise.all([
    supabase
      .from('curso_quizzes')
      .select(
        'id, curso_id, modulo_id, aula_id, tipo, titulo, descricao, nota_minima, tentativas_max, published'
      )
      .in('curso_id', cursoIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('curso_quiz_perguntas')
      .select('id, quiz_id, enunciado, ordem')
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
    supabase
      .from('curso_quiz_alternativas')
      .select('id, pergunta_id, texto, ordem, correta')
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
    user
      ? supabase
          .from('curso_quiz_tentativas')
          .select('id, quiz_id, user_id, tentativa_numero, nota, aprovado, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (quizzesRes.error) return { error: 'Erro ao carregar quizzes.' }
  if (perguntasRes.error) return { error: 'Erro ao carregar perguntas dos quizzes.' }
  if (alternativasRes.error) return { error: 'Erro ao carregar alternativas dos quizzes.' }
  if (tentativasRes.error) return { error: 'Erro ao carregar tentativas dos quizzes.' }

  const alternativasPorPergunta = new Map<string, CursoQuizAlternativaRow[]>()
  for (const alternativa of alternativasRes.data ?? []) {
    const current = alternativasPorPergunta.get(alternativa.pergunta_id) ?? []
    current.push({
      id: alternativa.id,
      pergunta_id: alternativa.pergunta_id,
      texto: alternativa.texto,
      ordem: alternativa.ordem,
      correta: alternativa.correta,
    })
    alternativasPorPergunta.set(alternativa.pergunta_id, current)
  }

  const perguntasPorQuiz = new Map<string, CursoQuizPerguntaRow[]>()
  for (const pergunta of perguntasRes.data ?? []) {
    const current = perguntasPorQuiz.get(pergunta.quiz_id) ?? []
    current.push({
      id: pergunta.id,
      quiz_id: pergunta.quiz_id,
      enunciado: pergunta.enunciado,
      ordem: pergunta.ordem,
      alternativas: (alternativasPorPergunta.get(pergunta.id) ?? []).sort(
        (a, b) => a.ordem - b.ordem
      ),
    })
    perguntasPorQuiz.set(pergunta.quiz_id, current)
  }

  const tentativasPorQuiz = new Map<string, CursoQuizRow['tentativas']>()
  for (const tentativa of tentativasRes.data ?? []) {
    const current = tentativasPorQuiz.get(tentativa.quiz_id) ?? []
    current.push({
      id: tentativa.id,
      user_id: tentativa.user_id,
      tentativa_numero: tentativa.tentativa_numero,
      nota: Number(tentativa.nota),
      aprovado: tentativa.aprovado,
      created_at: tentativa.created_at,
    })
    tentativasPorQuiz.set(tentativa.quiz_id, current)
  }

  return {
    error: null,
    rows: (quizzesRes.data ?? []).map((quiz) => ({
      id: quiz.id,
      curso_id: quiz.curso_id,
      modulo_id: quiz.modulo_id,
      aula_id: quiz.aula_id,
      tipo: quiz.tipo as CursoQuizRow['tipo'],
      titulo: quiz.titulo,
      descricao: quiz.descricao,
      nota_minima: Number(quiz.nota_minima),
      tentativas_max: quiz.tentativas_max,
      published: quiz.published,
      perguntas: (perguntasPorQuiz.get(quiz.id) ?? []).sort((a, b) => a.ordem - b.ordem),
      tentativas: (tentativasPorQuiz.get(quiz.id) ?? []).sort(
        (a, b) => b.tentativa_numero - a.tentativa_numero
      ),
    })),
  }
}

export async function criarQuizCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const cursoId = (formData.get('curso_id') as string | null)?.trim() ?? ''
  const moduloId = (formData.get('modulo_id') as string | null)?.trim() || null
  const aulaId = (formData.get('aula_id') as string | null)?.trim() || null
  const tipo = ((formData.get('tipo') as string | null)?.trim() ?? '') as CursoQuizRow['tipo']
  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const notaMinima = Number(((formData.get('nota_minima') as string | null)?.trim() ?? '70').replace(',', '.'))
  const tentativasMax = Number((formData.get('tentativas_max') as string | null)?.trim() ?? '1')
  const published = (formData.get('published') as string | null) !== 'false'

  if (!cursoId || !titulo) return { error: 'Curso e título do quiz são obrigatórios.' }
  if (!['aula', 'modulo', 'curso_final'].includes(tipo)) return { error: 'Tipo de quiz inválido.' }
  if (tipo === 'aula' && !aulaId) return { error: 'Selecione a aula para o quiz.' }
  if (tipo === 'modulo' && !moduloId) return { error: 'Selecione o módulo para o quiz.' }
  if (Number.isNaN(notaMinima) || notaMinima < 0 || notaMinima > 100) return { error: 'Nota mínima inválida.' }
  if (Number.isNaN(tentativasMax) || tentativasMax < 1) return { error: 'Tentativas máximas inválidas.' }

  const supabase = await createClient()
  const { error } = await supabase.from('curso_quizzes').insert({
    curso_id: cursoId,
    modulo_id: tipo === 'modulo' ? moduloId : null,
    aula_id: tipo === 'aula' ? aulaId : null,
    tipo,
    titulo,
    descricao,
    nota_minima: notaMinima,
    tentativas_max: tentativasMax,
    published,
  })

  if (error) {
    console.error('[criarQuizCurso]', error.message)
    return { error: 'Erro ao criar quiz.' }
  }

  return { error: null }
}

export async function criarPerguntaQuizCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const quizId = (formData.get('quiz_id') as string | null)?.trim() ?? ''
  const enunciado = (formData.get('enunciado') as string | null)?.trim() ?? ''
  const ordem = Number((formData.get('ordem') as string | null)?.trim() ?? '1')

  if (!quizId || !enunciado) return { error: 'Quiz e enunciado são obrigatórios.' }
  if (Number.isNaN(ordem) || ordem < 1) return { error: 'Ordem da pergunta inválida.' }

  const supabase = await createClient()
  const { error } = await supabase.from('curso_quiz_perguntas').insert({
    quiz_id: quizId,
    enunciado,
    ordem,
  })

  if (error) {
    console.error('[criarPerguntaQuizCurso]', error.message)
    if (error.code === '23505') return { error: 'Já existe pergunta com essa ordem no quiz.' }
    return { error: 'Erro ao criar pergunta do quiz.' }
  }

  return { error: null }
}

export async function criarAlternativaQuizCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const perguntaId = (formData.get('pergunta_id') as string | null)?.trim() ?? ''
  const texto = (formData.get('texto') as string | null)?.trim() ?? ''
  const ordem = Number((formData.get('ordem') as string | null)?.trim() ?? '1')
  const correta = (formData.get('correta') as string | null) === 'true'

  if (!perguntaId || !texto) return { error: 'Pergunta e texto da alternativa são obrigatórios.' }
  if (Number.isNaN(ordem) || ordem < 1) return { error: 'Ordem da alternativa inválida.' }

  const supabase = await createClient()
  const { error } = await supabase.from('curso_quiz_alternativas').insert({
    pergunta_id: perguntaId,
    texto,
    ordem,
    correta,
  })

  if (error) {
    console.error('[criarAlternativaQuizCurso]', error.message)
    if (error.code === '23505') return { error: 'Já existe alternativa com essa ordem na pergunta.' }
    return { error: 'Erro ao criar alternativa do quiz.' }
  }

  return { error: null }
}

export async function responderQuizCurso(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null; nota?: number; aprovado?: boolean }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const quizId = (formData.get('quiz_id') as string | null)?.trim() ?? ''
  if (!quizId) return { error: 'Quiz obrigatório.' }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Usuário não autenticado.' }

  const [quizRes, perguntasRes, alternativasRes, tentativasRes] = await Promise.all([
    supabase
      .from('curso_quizzes')
      .select('id, nota_minima, tentativas_max')
      .eq('id', quizId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('curso_quiz_perguntas')
      .select('id, quiz_id, enunciado, ordem')
      .eq('quiz_id', quizId)
      .is('deleted_at', null),
    supabase
      .from('curso_quiz_alternativas')
      .select('id, pergunta_id, correta')
      .is('deleted_at', null),
    supabase
      .from('curso_quiz_tentativas')
      .select('id, tentativa_numero')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('tentativa_numero', { ascending: false }),
  ])

  if (!quizRes.data) return { error: 'Quiz não encontrado.' }

  const tentativasAtual = tentativasRes.data ?? []
  if (tentativasAtual.length >= quizRes.data.tentativas_max) {
    return { error: 'Limite de tentativas atingido para este quiz.' }
  }

  const corretasPorPergunta = new Map<string, string>()
  for (const alternativa of alternativasRes.data ?? []) {
    if (alternativa.correta) {
      corretasPorPergunta.set(alternativa.pergunta_id, alternativa.id)
    }
  }

  const perguntas = perguntasRes.data ?? []
  if (perguntas.length === 0) return { error: 'Quiz sem perguntas cadastradas.' }

  let acertos = 0
  const respostas: Array<{ pergunta_id: string; alternativa_id: string | null; correta: boolean }> = []

  for (const pergunta of perguntas) {
    const alternativaId = (formData.get(`pergunta_${pergunta.id}`) as string | null)?.trim() ?? null
    const correta = alternativaId !== null && corretasPorPergunta.get(pergunta.id) === alternativaId
    if (correta) acertos += 1
    respostas.push({
      pergunta_id: pergunta.id,
      alternativa_id: alternativaId,
      correta,
    })
  }

  const nota = Number(((acertos / perguntas.length) * 100).toFixed(2))
  const aprovado = nota >= Number(quizRes.data.nota_minima)
  const tentativaNumero = (tentativasAtual[0]?.tentativa_numero ?? 0) + 1

  const { error } = await supabase.from('curso_quiz_tentativas').insert({
    quiz_id: quizId,
    user_id: user.id,
    tentativa_numero: tentativaNumero,
    nota,
    aprovado,
    respostas,
  })

  if (error) {
    console.error('[responderQuizCurso]', error.message)
    return { error: 'Erro ao salvar tentativa do quiz.' }
  }

  return { error: null, nota, aprovado }
}

function isDateActive(start: string | null, end: string | null): boolean {
  const now = new Date()
  const startOk = !start || new Date(start) <= now
  const endOk = !end || new Date(end) >= now
  return startOk && endOk
}

async function listarUsuariosCursosEscolaInterno(
  escolaId: string
): Promise<{ error: string | null; rows: CursoUsuarioOption[] }> {
  const admin = createAdminClient() as any
  const [contextosRes, usuariosRes] = await Promise.all([
    admin
      .from('usuario_escola_tipos')
      .select('usuario_id, tipo_usuario, principal')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    admin
      .from('usuarios')
      .select('id, auth_user_id, nome, email')
      .eq('ativo', true)
      .is('deleted_at', null),
  ])

  if (contextosRes.error || usuariosRes.error) {
    return { error: 'Erro ao carregar usuários elegíveis do módulo cursos.', rows: [] }
  }

  const usuarioMap = new Map(
    ((usuariosRes.data ?? []) as Array<{ id: string; auth_user_id: string; nome: string; email: string | null }>).map((row) => [
      row.id,
      row,
    ])
  )

  const rows = ((contextosRes.data ?? []) as Array<{
    usuario_id: string
    tipo_usuario: string
    principal: boolean
  }>)
    .map((row) => {
      const usuario = usuarioMap.get(row.usuario_id)
      if (!usuario) return null
      return {
        usuario_id: row.usuario_id,
        auth_user_id: usuario.auth_user_id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: row.tipo_usuario,
        principal: row.principal,
      }
    })
    .filter((row): row is CursoUsuarioOption => Boolean(row))

  return { error: null, rows }
}

async function recalcularProgressoCurso(
  userId: string,
  cursoId: string
): Promise<{ error: string | null; progressoPct: number; aprovado: boolean; ultimaAtividadeEm: string | null; status: CursoMatriculaUsuarioRow['status'] }> {
  const admin = createAdminClient() as any
  const [aulasRes, progressoRes, quizzesRes, tentativasRes] = await Promise.all([
    admin
      .from('curso_aulas')
      .select('id')
      .eq('curso_id', cursoId)
      .eq('published', true)
      .is('deleted_at', null),
    admin
      .from('curso_aula_progresso')
      .select('aula_id, concluida, concluida_em, ultima_interacao_em')
      .eq('curso_id', cursoId)
      .eq('user_id', userId),
    admin
      .from('curso_quizzes')
      .select('id')
      .eq('curso_id', cursoId)
      .eq('tipo', 'curso_final')
      .eq('published', true)
      .is('deleted_at', null),
    admin
      .from('curso_quiz_tentativas')
      .select('quiz_id, aprovado, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (aulasRes.error || progressoRes.error || quizzesRes.error || tentativasRes.error) {
    return {
      error: 'Erro ao recalcular progresso do curso.',
      progressoPct: 0,
      aprovado: false,
      ultimaAtividadeEm: null,
      status: 'ativo',
    }
  }

  const totalAulas = (aulasRes.data ?? []).length
  const concluidas = ((progressoRes.data ?? []) as Array<{ concluida: boolean }>).filter((row) => row.concluida).length
  const progressoPct = totalAulas > 0 ? Number(((concluidas / totalAulas) * 100).toFixed(2)) : 0

  const quizIds = new Set(((quizzesRes.data ?? []) as Array<{ id: string }>).map((row) => row.id))
  const temQuizFinal = quizIds.size > 0
  const aprovado = temQuizFinal
    ? ((tentativasRes.data ?? []) as Array<{ quiz_id: string; aprovado: boolean }>).some(
        (row) => quizIds.has(row.quiz_id) && row.aprovado
      )
    : progressoPct >= 100

  const ultimaAtividadeEm =
    ((progressoRes.data ?? []) as Array<{ concluida_em: string | null; ultima_interacao_em: string | null }>)
      .map((row) => row.concluida_em ?? row.ultima_interacao_em)
      .filter((row): row is string => Boolean(row))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

  const status: CursoMatriculaUsuarioRow['status'] =
    progressoPct >= 100 && aprovado ? 'concluido' : 'ativo'

  return { error: null, progressoPct, aprovado, ultimaAtividadeEm, status }
}

export async function listarComercializacaoCursosEscola(
  escolaId: string
): Promise<{ error: string | null; rows?: CursoComercializacaoRow; cursos?: CursoCatalogoRow[] }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const usuariosResult = await listarUsuariosCursosEscolaInterno(escolaId)
  if (usuariosResult.error) return { error: usuariosResult.error }

  const cursosResult = await listarCursosEscola(escolaId)
  if (cursosResult.error) return { error: cursosResult.error }

  const admin = createAdminClient() as any
  const cursoIds = (cursosResult.rows ?? []).map((curso) => curso.id)

  const [assinaturasRes, matriculasRes] = await Promise.all([
    admin
      .from('curso_assinaturas_usuarios')
      .select('id, user_id, titulo, status, inicio_em, fim_em, origem, created_at')
      .eq('escola_id', escolaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    cursoIds.length
      ? admin
          .from('curso_matriculas')
          .select(
            'id, curso_id, user_id, assinatura_id, origem_liberacao, status, valor_pago, liberado_em, expira_em, ultima_atividade_em, progresso_pct, aprovado, created_at'
          )
          .eq('escola_id', escolaId)
          .in('curso_id', cursoIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (assinaturasRes.error || matriculasRes.error) {
    return { error: 'Erro ao carregar comercialização dos cursos.' }
  }

  const usuarioMap = new Map(usuariosResult.rows.map((row) => [row.auth_user_id, row]))
  const cursoMap = new Map((cursosResult.rows ?? []).map((row) => [row.id, row]))

  return {
    error: null,
    cursos: cursosResult.rows ?? [],
    rows: {
      usuarios: usuariosResult.rows,
      assinaturas: ((assinaturasRes.data ?? []) as Array<{
        id: string
        user_id: string
        titulo: string | null
        status: CursoAssinaturaUsuarioRow['status']
        inicio_em: string
        fim_em: string | null
        origem: CursoAssinaturaUsuarioRow['origem']
        created_at: string
      }>).map((row) => ({
        ...row,
        usuario_nome: usuarioMap.get(row.user_id)?.nome ?? 'Usuário',
        usuario_email: usuarioMap.get(row.user_id)?.email ?? null,
      })),
      matriculas: ((matriculasRes.data ?? []) as Array<{
        id: string
        curso_id: string
        user_id: string
        assinatura_id: string | null
        origem_liberacao: CursoMatriculaUsuarioRow['origem_liberacao']
        status: CursoMatriculaUsuarioRow['status']
        valor_pago: number
        liberado_em: string
        expira_em: string | null
        ultima_atividade_em: string | null
        progresso_pct: number
        aprovado: boolean
        created_at: string
      }>).map((row) => ({
        ...row,
        valor_pago: Number(row.valor_pago ?? 0),
        progresso_pct: Number(row.progresso_pct ?? 0),
        curso_titulo: cursoMap.get(row.curso_id)?.titulo ?? 'Curso',
        usuario_nome: usuarioMap.get(row.user_id)?.nome ?? 'Usuário',
        usuario_email: usuarioMap.get(row.user_id)?.email ?? null,
      })),
    },
  }
}

export async function criarAssinaturaCursoUsuario(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const userId = (formData.get('user_id') as string | null)?.trim() ?? ''
  const titulo = (formData.get('titulo') as string | null)?.trim() || null
  const status = ((formData.get('status') as string | null)?.trim() ?? 'ativa') as CursoAssinaturaUsuarioRow['status']
  const inicioEm = (formData.get('inicio_em') as string | null)?.trim() ?? ''
  const fimEm = (formData.get('fim_em') as string | null)?.trim() || null
  const origem = ((formData.get('origem') as string | null)?.trim() ?? 'manual') as CursoAssinaturaUsuarioRow['origem']

  if (!userId) return { error: 'Selecione o usuário da assinatura.' }
  if (!inicioEm) return { error: 'Data de início é obrigatória.' }
  if (!['ativa', 'suspensa', 'cancelada', 'expirada'].includes(status)) {
    return { error: 'Status da assinatura inválido.' }
  }
  if (!['manual', 'financeiro', 'admin'].includes(origem)) {
    return { error: 'Origem da assinatura inválida.' }
  }
  if (fimEm && new Date(fimEm) < new Date(inicioEm)) {
    return { error: 'A data final não pode ser anterior ao início.' }
  }

  const usuariosResult = await listarUsuariosCursosEscolaInterno(escolaId)
  if (!usuariosResult.rows.some((row) => row.auth_user_id === userId)) {
    return { error: 'Usuário não pertence à escola selecionada.' }
  }

  const admin = createAdminClient() as any
  const { error } = await admin.from('curso_assinaturas_usuarios').insert({
    escola_id: escolaId,
    user_id: userId,
    titulo,
    status,
    inicio_em: inicioEm,
    fim_em: fimEm,
    origem,
  })

  if (error) {
    console.error('[criarAssinaturaCursoUsuario]', error.message)
    return { error: 'Erro ao criar assinatura do módulo de cursos.' }
  }

  revalidatePath('/painel/cursos/comercializacao')
  return { error: null }
}

export async function criarMatriculaCursoUsuario(
  escolaId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const auth = await assertCursosEscola(escolaId)
  if ('error' in auth) return { error: auth.error }

  const cursoId = (formData.get('curso_id') as string | null)?.trim() ?? ''
  const userId = (formData.get('user_id') as string | null)?.trim() ?? ''
  const assinaturaId = (formData.get('assinatura_id') as string | null)?.trim() || null
  const origem = ((formData.get('origem_liberacao') as string | null)?.trim() ?? 'manual') as CursoMatriculaUsuarioRow['origem_liberacao']
  const status = ((formData.get('status') as string | null)?.trim() ?? 'ativo') as CursoMatriculaUsuarioRow['status']
  const valorPago = Number(((formData.get('valor_pago') as string | null)?.trim() ?? '0').replace(',', '.'))
  const expiraEm = (formData.get('expira_em') as string | null)?.trim() || null

  if (!cursoId || !userId) return { error: 'Curso e usuário são obrigatórios.' }
  if (!['manual', 'compra_individual', 'assinatura'].includes(origem)) {
    return { error: 'Origem da liberação inválida.' }
  }
  if (!['ativo', 'concluido', 'suspenso', 'expirado', 'cancelado'].includes(status)) {
    return { error: 'Status da matrícula inválido.' }
  }
  if (Number.isNaN(valorPago) || valorPago < 0) return { error: 'Valor pago inválido.' }
  if (origem === 'assinatura' && !assinaturaId) {
    return { error: 'Selecione uma assinatura para matrícula por assinatura.' }
  }

  const usuariosResult = await listarUsuariosCursosEscolaInterno(escolaId)
  if (!usuariosResult.rows.some((row) => row.auth_user_id === userId)) {
    return { error: 'Usuário não pertence à escola selecionada.' }
  }

  const admin = createAdminClient() as any
  const { data: curso } = await admin
    .from('cursos')
    .select('id, periodo_acesso_dias, preco')
    .eq('id', cursoId)
    .eq('escola_id', escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!curso) return { error: 'Curso inválido para esta escola.' }

  let assinaturaExpiraEm: string | null = null
  if (assinaturaId) {
    const { data: assinatura } = await admin
      .from('curso_assinaturas_usuarios')
      .select('id, user_id, fim_em')
      .eq('id', assinaturaId)
      .eq('escola_id', escolaId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!assinatura) return { error: 'Assinatura inválida para o usuário selecionado.' }
    assinaturaExpiraEm = assinatura.fim_em
  }

  const { data: existente } = await admin
    .from('curso_matriculas')
    .select('id')
    .eq('curso_id', cursoId)
    .eq('user_id', userId)
    .in('status', ['ativo', 'concluido'])
    .is('deleted_at', null)
    .maybeSingle()

  if (existente) return { error: 'Já existe matrícula ativa ou concluída para este curso.' }

  let finalExpiraEm = expiraEm
  if (!finalExpiraEm && assinaturaExpiraEm) {
    finalExpiraEm = `${assinaturaExpiraEm}T23:59:59.000Z`
  }
  if (!finalExpiraEm && curso.periodo_acesso_dias) {
    const end = new Date()
    end.setDate(end.getDate() + Number(curso.periodo_acesso_dias))
    finalExpiraEm = end.toISOString()
  }

  const { error } = await admin.from('curso_matriculas').insert({
    curso_id: cursoId,
    escola_id: escolaId,
    user_id: userId,
    assinatura_id: assinaturaId,
    origem_liberacao: origem,
    status,
    valor_pago: origem === 'compra_individual' && valorPago === 0 ? Number(curso.preco ?? 0) : valorPago,
    expira_em: finalExpiraEm,
  })

  if (error) {
    console.error('[criarMatriculaCursoUsuario]', error.message)
    return { error: 'Erro ao criar matrícula do curso.' }
  }

  revalidatePath('/painel/cursos/comercializacao')
  return { error: null }
}

export async function listarCursosDisponiveisResponsavel(): Promise<{
  error: string | null
  escolaAtivaNome?: string | null
  rows?: CursoDisponivelAlunoRow[]
}> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }

  const admin = createAdminClient() as any
  const [cursosRes, modulosRes, aulasRes, assinaturasRes, matriculasRes, progressoRes] = await Promise.all([
    admin
      .from('cursos')
      .select('id, titulo, descricao, modalidade_comercial, publico_alvo')
      .eq('escola_id', rctx.ctx.escolaId)
      .eq('status', 'publicado')
      .eq('oferta_ativa', true)
      .is('deleted_at', null),
    admin
      .from('curso_modulos')
      .select('id, curso_id, titulo, ordem, published')
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
    admin
      .from('curso_aulas')
      .select('id, curso_id, modulo_id, titulo, descricao, ordem, published')
      .is('deleted_at', null)
      .order('ordem', { ascending: true }),
    admin
      .from('curso_assinaturas_usuarios')
      .select('id, status, inicio_em, fim_em')
      .eq('escola_id', rctx.ctx.escolaId)
      .eq('user_id', rctx.ctx.userId)
      .is('deleted_at', null),
    admin
      .from('curso_matriculas')
      .select(
        'id, curso_id, origem_liberacao, status, ultima_atividade_em, progresso_pct, aprovado, expira_em'
      )
      .eq('escola_id', rctx.ctx.escolaId)
      .eq('user_id', rctx.ctx.userId)
      .is('deleted_at', null),
    admin
      .from('curso_aula_progresso')
      .select('curso_id, aula_id, concluida, concluida_em')
      .eq('user_id', rctx.ctx.userId),
  ])

  if (cursosRes.error || modulosRes.error || aulasRes.error || assinaturasRes.error || matriculasRes.error || progressoRes.error) {
    return { error: 'Erro ao carregar cursos do responsável.' }
  }

  const assinaturaAtiva = ((assinaturasRes.data ?? []) as Array<{ status: string; inicio_em: string | null; fim_em: string | null }>).some(
    (row) => row.status === 'ativa' && isDateActive(row.inicio_em, row.fim_em)
  )

  const matriculaMap = new Map(
    ((matriculasRes.data ?? []) as Array<{
      id: string
      curso_id: string
      origem_liberacao: CursoMatriculaUsuarioRow['origem_liberacao']
      status: CursoMatriculaUsuarioRow['status']
      ultima_atividade_em: string | null
      progresso_pct: number
      aprovado: boolean
      expira_em: string | null
    }>)
      .filter((row) => row.status !== 'cancelado' && row.status !== 'suspenso' && (!row.expira_em || new Date(row.expira_em) >= new Date()))
      .map((row) => [row.curso_id, row])
  )

  const modulosPorCurso = new Map<string, Array<{ id: string; titulo: string; ordem: number }>>()
  for (const modulo of (modulosRes.data ?? []) as Array<{ id: string; curso_id: string; titulo: string; ordem: number; published: boolean }>) {
    if (!modulo.published) continue
    const current = modulosPorCurso.get(modulo.curso_id) ?? []
    current.push({ id: modulo.id, titulo: modulo.titulo, ordem: modulo.ordem })
    modulosPorCurso.set(modulo.curso_id, current)
  }

  const progressoPorAula = new Map(
    ((progressoRes.data ?? []) as Array<{ aula_id: string; concluida: boolean; concluida_em: string | null }>).map((row) => [
      row.aula_id,
      row,
    ])
  )

  const aulasPorModulo = new Map<string, CursoDisponivelAlunoRow['modulos'][number]['aulas']>()
  for (const aula of (aulasRes.data ?? []) as Array<{
    id: string
    curso_id: string
    modulo_id: string
    titulo: string
    descricao: string | null
    ordem: number
    published: boolean
  }>) {
    if (!aula.published) continue
    const current = aulasPorModulo.get(aula.modulo_id) ?? []
    const progresso = progressoPorAula.get(aula.id)
    current.push({
      id: aula.id,
      titulo: aula.titulo,
      ordem: aula.ordem,
      descricao: aula.descricao,
      concluida: Boolean(progresso?.concluida),
      concluida_em: progresso?.concluida_em ?? null,
    })
    aulasPorModulo.set(aula.modulo_id, current)
  }

  const rows = ((cursosRes.data ?? []) as Array<{
    id: string
    titulo: string
    descricao: string | null
    modalidade_comercial: ModalidadeComercialCurso
    publico_alvo: PublicoAlvoCurso
  }>)
    .filter((curso) => ['responsavel', 'todos'].includes(curso.publico_alvo))
    .map((curso) => {
      const matricula = matriculaMap.get(curso.id)
      const acessoPorAssinatura = curso.modalidade_comercial === 'assinatura' && assinaturaAtiva
      if (!matricula && !acessoPorAssinatura) return null

      const modulos = (modulosPorCurso.get(curso.id) ?? [])
        .sort((a, b) => a.ordem - b.ordem)
        .map((modulo) => ({
          ...modulo,
          aulas: (aulasPorModulo.get(modulo.id) ?? []).sort((a, b) => a.ordem - b.ordem),
        }))

      return {
        curso_id: curso.id,
        titulo: curso.titulo,
        descricao: curso.descricao,
        modalidade_comercial: curso.modalidade_comercial,
        origem_acesso: matricula?.origem_liberacao ?? ('assinatura' as const),
        progresso_pct: Number(matricula?.progresso_pct ?? 0),
        ultima_atividade_em: matricula?.ultima_atividade_em ?? null,
        aprovado: Boolean(matricula?.aprovado),
        status: matricula?.status ?? ('ativo' as const),
        modulos,
      }
    })
    .filter((row): row is CursoDisponivelAlunoRow => Boolean(row))

  return {
    error: null,
    escolaAtivaNome: rctx.ctx.escolaNome,
    rows,
  }
}

export async function marcarAulaCursoConcluidaResponsavel(
  formData: FormData
): Promise<{ error: string | null }> {
  const rctx = await getResponsavelAppContext()
  if ('error' in rctx) return { error: rctx.error }

  const aulaId = (formData.get('aula_id') as string | null)?.trim() ?? ''
  if (!aulaId) return { error: 'Aula inválida.' }

  const admin = createAdminClient() as any
  const { data: aula } = await admin
    .from('curso_aulas')
    .select('id, curso_id, titulo, published')
    .eq('id', aulaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!aula || !aula.published) return { error: 'Aula não encontrada.' }

  const { data: curso } = await admin
    .from('cursos')
    .select('id, escola_id, publico_alvo, modalidade_comercial, status, oferta_ativa, periodo_acesso_dias')
    .eq('id', aula.curso_id)
    .eq('escola_id', rctx.ctx.escolaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!curso || curso.status !== 'publicado' || !curso.oferta_ativa) {
    return { error: 'Curso não disponível para o responsável.' }
  }
  if (!['responsavel', 'todos'].includes(curso.publico_alvo)) {
    return { error: 'Curso não elegível para o perfil atual.' }
  }

  let { data: matricula } = await admin
    .from('curso_matriculas')
    .select('id, origem_liberacao, status, expira_em')
    .eq('curso_id', curso.id)
    .eq('escola_id', rctx.ctx.escolaId)
    .eq('user_id', rctx.ctx.userId)
    .is('deleted_at', null)
    .in('status', ['ativo', 'concluido'])
    .maybeSingle()

  if (!matricula) {
    if (curso.modalidade_comercial !== 'assinatura') {
      return { error: 'Este curso não está liberado para o usuário atual.' }
    }

    const { data: assinatura } = await admin
      .from('curso_assinaturas_usuarios')
      .select('id, inicio_em, fim_em, status')
      .eq('escola_id', rctx.ctx.escolaId)
      .eq('user_id', rctx.ctx.userId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!assinatura || assinatura.status !== 'ativa' || !isDateActive(assinatura.inicio_em, assinatura.fim_em)) {
      return { error: 'Assinatura inativa ou expirada para este curso.' }
    }

    let expiraEm: string | null = assinatura.fim_em ? `${assinatura.fim_em}T23:59:59.000Z` : null
    if (!expiraEm && curso.periodo_acesso_dias) {
      const end = new Date()
      end.setDate(end.getDate() + Number(curso.periodo_acesso_dias))
      expiraEm = end.toISOString()
    }

    const inserted = await admin
      .from('curso_matriculas')
      .insert({
        curso_id: curso.id,
        escola_id: rctx.ctx.escolaId,
        user_id: rctx.ctx.userId,
        assinatura_id: assinatura.id,
        origem_liberacao: 'assinatura',
        status: 'ativo',
        expira_em: expiraEm,
      })
      .select('id, origem_liberacao, status, expira_em')
      .single()

    if (inserted.error || !inserted.data) {
      return { error: 'Não foi possível liberar o curso por assinatura.' }
    }
    matricula = inserted.data
  }

  if (matricula.expira_em && new Date(matricula.expira_em) < new Date()) {
    return { error: 'O acesso a este curso expirou.' }
  }

  const now = new Date().toISOString()
  const upsertResult = await admin.from('curso_aula_progresso').upsert(
    {
      curso_id: curso.id,
      aula_id: aula.id,
      user_id: rctx.ctx.userId,
      matricula_id: matricula.id,
      concluida: true,
      concluida_em: now,
      ultima_interacao_em: now,
    },
    { onConflict: 'user_id,aula_id' }
  )

  if (upsertResult.error) {
    console.error('[marcarAulaCursoConcluidaResponsavel]', upsertResult.error.message)
    return { error: 'Erro ao registrar progresso da aula.' }
  }

  const progresso = await recalcularProgressoCurso(rctx.ctx.userId, curso.id)
  if (progresso.error) return { error: progresso.error }

  const updateResult = await admin
    .from('curso_matriculas')
    .update({
      progresso_pct: progresso.progressoPct,
      aprovado: progresso.aprovado,
      ultima_atividade_em: progresso.ultimaAtividadeEm ?? now,
      status: progresso.status,
    })
    .eq('id', matricula.id)

  if (updateResult.error) {
    console.error('[marcarAulaCursoConcluidaResponsavel.update]', updateResult.error.message)
    return { error: 'Erro ao atualizar progresso consolidado do curso.' }
  }

  revalidatePath('/pais/cursos')
  revalidatePath('/painel/cursos/comercializacao')
  return { error: null }
}
