export type MockCourseAccessModel = 'gratuito' | 'individual' | 'assinatura' | 'hibrido'
export type MockVideoProvider = 'youtube' | 'panda'

export type MockCourse = {
  id: string
  slug: string
  title: string
  subtitle: string
  creatorName: string
  creatorCpf: string
  schoolName: string
  schoolSharePct: number
  creatorSharePct: number
  platformSharePct: number
  accessModel: MockCourseAccessModel
  price: number
  freeLessons: number
  totalLessons: number
  totalModules: number
  videoProvider: MockVideoProvider
  category: string
  audience: string
  status: 'rascunho' | 'publicado'
  featured?: boolean
}

export type MockCreator = {
  id: string
  name: string
  cpf: string
  type: 'treinador' | 'escola' | 'especialista'
  schoolName: string
  activeCourses: number
  students: number
  monthlyGross: number
}

export type MockOfferOption = {
  id: string
  courseSlug: string
  title: string
  kind: 'gratis' | 'individual' | 'assinatura'
  price: number
  installmentLabel?: string
  perks: string[]
  recommended?: boolean
}

export type MockLessonAsset = {
  id: string
  label: string
  kind: 'video' | 'pdf' | 'texto' | 'quiz'
  provider?: MockVideoProvider
  status: 'pronto' | 'rascunho'
}

export const mockCourses: MockCourse[] = [
  {
    id: 'curso-1',
    slug: 'metodologia-futebol-base',
    title: 'Metodologia Futebol Base',
    subtitle: 'Curso hibrido com aulas gratuitas de entrada para apresentacao da metodologia.',
    creatorName: 'Carlos Menezes',
    creatorCpf: '***.456.789-**',
    schoolName: 'Arena Futebol Kids',
    schoolSharePct: 20,
    creatorSharePct: 55,
    platformSharePct: 25,
    accessModel: 'hibrido',
    price: 297,
    freeLessons: 3,
    totalLessons: 18,
    totalModules: 4,
    videoProvider: 'youtube',
    category: 'Metodologia',
    audience: 'Treinadores e coordenadores',
    status: 'publicado',
    featured: true,
  },
  {
    id: 'curso-2',
    slug: 'psicologia-do-esporte-para-pais',
    title: 'Psicologia do Esporte para Pais',
    subtitle: 'Curso gratuito para responsaveis com foco em rotina, pressao e apoio emocional.',
    creatorName: 'Dra. Marina Souto',
    creatorCpf: '***.221.330-**',
    schoolName: 'Esportes Academy',
    schoolSharePct: 0,
    creatorSharePct: 70,
    platformSharePct: 30,
    accessModel: 'gratuito',
    price: 0,
    freeLessons: 8,
    totalLessons: 8,
    totalModules: 2,
    videoProvider: 'panda',
    category: 'Familia',
    audience: 'Responsaveis',
    status: 'publicado',
  },
  {
    id: 'curso-3',
    slug: 'gestao-operacional-da-escola-esportiva',
    title: 'Gestao Operacional da Escola Esportiva',
    subtitle: 'Catalogo por assinatura para equipes administrativas e lideres de unidade.',
    creatorName: 'Equipe Esportes Academy',
    creatorCpf: '***.999.000-**',
    schoolName: 'Esportes Academy',
    schoolSharePct: 15,
    creatorSharePct: 45,
    platformSharePct: 40,
    accessModel: 'assinatura',
    price: 79,
    freeLessons: 0,
    totalLessons: 24,
    totalModules: 6,
    videoProvider: 'youtube',
    category: 'Gestao',
    audience: 'Administrativo e lideranca',
    status: 'publicado',
  },
  {
    id: 'curso-4',
    slug: 'preparacao-fisica-infantil',
    title: 'Preparacao Fisica Infantil',
    subtitle: 'Curso pago individual com plano de aulas e avaliacoes praticas.',
    creatorName: 'Renata Almeida',
    creatorCpf: '***.322.100-**',
    schoolName: 'Move Sports Lab',
    schoolSharePct: 10,
    creatorSharePct: 60,
    platformSharePct: 30,
    accessModel: 'individual',
    price: 197,
    freeLessons: 0,
    totalLessons: 14,
    totalModules: 3,
    videoProvider: 'panda',
    category: 'Preparacao Fisica',
    audience: 'Professores',
    status: 'rascunho',
  },
]

export const mockCreators: MockCreator[] = [
  {
    id: 'criador-1',
    name: 'Carlos Menezes',
    cpf: '***.456.789-**',
    type: 'treinador',
    schoolName: 'Arena Futebol Kids',
    activeCourses: 3,
    students: 184,
    monthlyGross: 18940,
  },
  {
    id: 'criador-2',
    name: 'Dra. Marina Souto',
    cpf: '***.221.330-**',
    type: 'especialista',
    schoolName: 'Esportes Academy',
    activeCourses: 2,
    students: 540,
    monthlyGross: 12400,
  },
  {
    id: 'criador-3',
    name: 'Move Sports Lab',
    cpf: '***.000.888-**',
    type: 'escola',
    schoolName: 'Move Sports Lab',
    activeCourses: 5,
    students: 312,
    monthlyGross: 26750,
  },
]

export const mockStudentHighlights = [
  {
    title: 'Continue de onde parou',
    value: '3 cursos ativos',
    helper: '1 curso com aulas gratuitas prontas para explorar',
  },
  {
    title: 'Seu progresso',
    value: '62%',
    helper: 'Metodologia Futebol Base esta quase no modulo final',
  },
  {
    title: 'Novidade no catalogo',
    value: '2 ofertas novas',
    helper: '1 gratuita e 1 por assinatura da escola',
  },
]

export const mockOfferOptions: MockOfferOption[] = [
  {
    id: 'oferta-curso-1-individual',
    courseSlug: 'metodologia-futebol-base',
    title: 'Compra individual',
    kind: 'individual',
    price: 297,
    installmentLabel: 'ou 12x de R$ 29,70 no mock',
    perks: ['Acesso completo ao curso', 'Materiais complementares', 'Certificado ao concluir'],
    recommended: true,
  },
  {
    id: 'oferta-curso-1-assinatura',
    courseSlug: 'metodologia-futebol-base',
    title: 'Assinatura da escola',
    kind: 'assinatura',
    price: 79,
    installmentLabel: 'recorrente mensal',
    perks: ['Acesso ao curso e ao catalogo elegivel', 'Novos lancamentos incluidos', 'Melhor custo por aluno'],
  },
  {
    id: 'oferta-curso-2-gratis',
    courseSlug: 'psicologia-do-esporte-para-pais',
    title: 'Acesso gratuito',
    kind: 'gratis',
    price: 0,
    perks: ['Liberacao imediata', 'Conteudo completo', 'Ideal para ativacao e relacionamento'],
    recommended: true,
  },
  {
    id: 'oferta-curso-3-assinatura',
    courseSlug: 'gestao-operacional-da-escola-esportiva',
    title: 'Assinatura do catalogo',
    kind: 'assinatura',
    price: 79,
    installmentLabel: 'recorrente mensal',
    perks: ['Acesso continuo', 'Atualizacoes inclusas', 'Uso em equipe no mock'],
    recommended: true,
  },
]

export const mockLessonAssets: MockLessonAsset[] = [
  {
    id: 'asset-1',
    label: 'Aula de abertura com introducao metodologica',
    kind: 'video',
    provider: 'youtube',
    status: 'pronto',
  },
  {
    id: 'asset-2',
    label: 'Plano complementar em PDF',
    kind: 'pdf',
    status: 'pronto',
  },
  {
    id: 'asset-3',
    label: 'Texto de apoio para pais e responsaveis',
    kind: 'texto',
    status: 'rascunho',
  },
  {
    id: 'asset-4',
    label: 'Quiz de fechamento do modulo',
    kind: 'quiz',
    status: 'pronto',
  },
]

export function getMockCourseBySlug(slug: string) {
  return mockCourses.find((course) => course.slug === slug) ?? null
}

export function getMockOffersByCourseSlug(slug: string) {
  return mockOfferOptions.filter((offer) => offer.courseSlug === slug)
}

export function getRecommendedUpsellCourses(slug: string) {
  return mockCourses
    .filter((course) => course.slug !== slug && course.status === 'publicado')
    .slice(0, 2)
}
