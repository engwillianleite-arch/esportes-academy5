export type CompetitionPricingModel = 'gratis' | 'pago'
export type CompetitionChargeMode = 'por_clube' | 'por_atleta'
export type CompetitionDisputeType = 'mata_mata' | 'pontos_corridos' | 'festival' | 'grupos_e_finais'

export type MockOrganizer = {
  id: string
  name: string
  cpf: string
  monthlyFee: number
  platformFeePct: number
  activeCompetitions: number
  clubs: number
  grossVolume: number
}

export type MockCompetition = {
  id: string
  slug: string
  title: string
  organizerName: string
  organizerCpf: string
  sport: string
  category: string
  pricingModel: CompetitionPricingModel
  chargeMode: CompetitionChargeMode
  disputeType: CompetitionDisputeType
  entryFee: number
  monthlyPlatformFeePct: number
  organizerSharePct: number
  clubSharePct: number
  platformSharePct: number
  clubCount: number
  athleteCount: number
  status: 'rascunho' | 'publicada' | 'inscricoes_abertas' | 'em_andamento'
  featured?: boolean
  teamBlogTitle: string
  competitionBlogTitle: string
  location?: string
  periodLabel?: string
  registrationDeadline?: string
}

export type MockClub = {
  id: string
  name: string
  city: string
  cpf: string
  activeInvites: number
  confirmedAthletes: number
  amountToCollect: number
}

export type MockInvite = {
  id: string
  competitionSlug: string
  clubName: string
  status: 'convite_enviado' | 'inscricao_direta' | 'aguardando_pagamento' | 'confirmado'
  via: 'email' | 'link' | 'manual'
}

export type MockAthleteRegistration = {
  id: string
  athleteName: string
  category: string
  clubName: string
  status: 'pendente' | 'pagamento_pendente' | 'confirmado'
  amount: number
  checklistStatus: 'completo' | 'documentos_pendentes' | 'aguardando_pagamento'
  confirmationAction: 'confirmar' | 'cobrar' | 'revisar'
}

export type MockBlogPost = {
  id: string
  title: string
  excerpt: string
  author: string
  publishedAt: string
  status?: 'publicado' | 'rascunho' | 'agendado'
}

export type MockCompetitionTeam = {
  id: string
  competitionSlug: string
  name: string
  shortName: string
  city: string
  status: 'vaga' | 'pre_inscrito' | 'confirmado'
  athleteCount: number
}

export type MockCompetitionAsset = {
  id: string
  competitionSlug: string
  area: 'patrocinador' | 'parceiro'
  title: string
  subtitle: string
  imageHint: string
  targetUrl: string
}

export const mockOrganizers: MockOrganizer[] = [
  {
    id: 'org-1',
    name: 'Liga Sul de Formacao',
    cpf: '***.901.220-**',
    monthlyFee: 399,
    platformFeePct: 12,
    activeCompetitions: 4,
    clubs: 28,
    grossVolume: 128400,
  },
  {
    id: 'org-2',
    name: 'Circuito Base Pro',
    cpf: '***.412.880-**',
    monthlyFee: 599,
    platformFeePct: 10,
    activeCompetitions: 7,
    clubs: 43,
    grossVolume: 242900,
  },
]

export const mockCompetitions: MockCompetition[] = [
  {
    id: 'comp-1',
    slug: 'copa-futuro-sub13',
    title: 'Copa Futuro Sub13',
    organizerName: 'Liga Sul de Formacao',
    organizerCpf: '***.901.220-**',
    sport: 'Futebol',
    category: 'Sub13',
    pricingModel: 'pago',
    chargeMode: 'por_clube',
    disputeType: 'grupos_e_finais',
    entryFee: 1200,
    monthlyPlatformFeePct: 12,
    organizerSharePct: 68,
    clubSharePct: 20,
    platformSharePct: 12,
    clubCount: 16,
    athleteCount: 288,
    status: 'inscricoes_abertas',
    featured: true,
    teamBlogTitle: 'Diario da delegacao Sub13',
    competitionBlogTitle: 'Central de noticias da Copa Futuro',
    location: 'Curitiba • Arena Sul',
    periodLabel: '18 a 21 de maio',
    registrationDeadline: '10 de maio',
  },
  {
    id: 'comp-2',
    slug: 'festival-de-goleiros-kids',
    title: 'Festival de Goleiros Kids',
    organizerName: 'Liga Sul de Formacao',
    organizerCpf: '***.901.220-**',
    sport: 'Futebol',
    category: 'Sub11',
    pricingModel: 'gratis',
    chargeMode: 'por_atleta',
    disputeType: 'festival',
    entryFee: 0,
    monthlyPlatformFeePct: 12,
    organizerSharePct: 88,
    clubSharePct: 0,
    platformSharePct: 12,
    clubCount: 9,
    athleteCount: 74,
    status: 'publicada',
    teamBlogTitle: 'Bastidores do Festival',
    competitionBlogTitle: 'Noticias do Festival de Goleiros',
    location: 'Joinville • Centro de Treino Kids',
    periodLabel: '07 de junho',
    registrationDeadline: '31 de maio',
  },
  {
    id: 'comp-3',
    slug: 'liga-performance-sub15',
    title: 'Liga Performance Sub15',
    organizerName: 'Circuito Base Pro',
    organizerCpf: '***.412.880-**',
    sport: 'Futsal',
    category: 'Sub15',
    pricingModel: 'pago',
    chargeMode: 'por_atleta',
    disputeType: 'pontos_corridos',
    entryFee: 85,
    monthlyPlatformFeePct: 10,
    organizerSharePct: 55,
    clubSharePct: 35,
    platformSharePct: 10,
    clubCount: 12,
    athleteCount: 180,
    status: 'em_andamento',
    teamBlogTitle: 'Jornada competitiva do clube',
    competitionBlogTitle: 'Radar da Liga Performance',
    location: 'Florianopolis • Ginasio Central',
    periodLabel: 'Temporada abril a agosto',
    registrationDeadline: 'Encerrada',
  },
]

export const mockClubs: MockClub[] = [
  {
    id: 'club-1',
    name: 'Clube Estrela Jovem',
    city: 'Curitiba',
    cpf: '***.552.441-**',
    activeInvites: 3,
    confirmedAthletes: 21,
    amountToCollect: 6840,
  },
  {
    id: 'club-2',
    name: 'Academia Horizonte',
    city: 'Joinville',
    cpf: '***.441.109-**',
    activeInvites: 2,
    confirmedAthletes: 14,
    amountToCollect: 2380,
  },
]

export const mockInvites: MockInvite[] = [
  {
    id: 'invite-1',
    competitionSlug: 'copa-futuro-sub13',
    clubName: 'Clube Estrela Jovem',
    status: 'convite_enviado',
    via: 'email',
  },
  {
    id: 'invite-2',
    competitionSlug: 'copa-futuro-sub13',
    clubName: 'Academia Horizonte',
    status: 'aguardando_pagamento',
    via: 'link',
  },
  {
    id: 'invite-3',
    competitionSlug: 'liga-performance-sub15',
    clubName: 'Clube Estrela Jovem',
    status: 'inscricao_direta',
    via: 'manual',
  },
]

export const mockAthleteRegistrations: MockAthleteRegistration[] = [
  {
    id: 'reg-1',
    athleteName: 'Henrique Lopes',
    category: 'Sub13',
    clubName: 'Clube Estrela Jovem',
    status: 'confirmado',
    amount: 180,
    checklistStatus: 'completo',
    confirmationAction: 'confirmar',
  },
  {
    id: 'reg-2',
    athleteName: 'Miguel Ferraz',
    category: 'Sub13',
    clubName: 'Clube Estrela Jovem',
    status: 'pagamento_pendente',
    amount: 180,
    checklistStatus: 'aguardando_pagamento',
    confirmationAction: 'cobrar',
  },
  {
    id: 'reg-3',
    athleteName: 'Theo Martins',
    category: 'Sub15',
    clubName: 'Academia Horizonte',
    status: 'pendente',
    amount: 85,
    checklistStatus: 'documentos_pendentes',
    confirmationAction: 'revisar',
  },
]

export const mockCompetitionPosts: MockBlogPost[] = [
  {
    id: 'post-1',
    title: 'Tabela da primeira rodada liberada',
    excerpt: 'Calendario oficial publicado com grupos, horarios e protocolo de check-in.',
    author: 'Equipe Liga Sul',
    publishedAt: '04 abr 2026',
    status: 'publicado',
  },
  {
    id: 'post-2',
    title: 'Guia rapido para inscricao de clubes',
    excerpt: 'Passo a passo para inscricao direta ou envio de link pago para atletas.',
    author: 'Operacao Competitiva',
    publishedAt: '02 abr 2026',
    status: 'agendado',
  },
  {
    id: 'post-3',
    title: 'Checklist de chegada das delegacoes',
    excerpt: 'Documento base para credenciamento, uniforme e horarios.',
    author: 'Backoffice da prova',
    publishedAt: 'Rascunho',
    status: 'rascunho',
  },
]

export const mockCompetitionTeams: MockCompetitionTeam[] = [
  {
    id: 'team-comp-1',
    competitionSlug: 'copa-futuro-sub13',
    name: 'Clube Estrela Jovem',
    shortName: 'CEJ',
    city: 'Curitiba',
    status: 'confirmado',
    athleteCount: 18,
  },
  {
    id: 'team-comp-2',
    competitionSlug: 'copa-futuro-sub13',
    name: 'Academia Horizonte',
    shortName: 'AH',
    city: 'Joinville',
    status: 'pre_inscrito',
    athleteCount: 15,
  },
  {
    id: 'team-comp-3',
    competitionSlug: 'copa-futuro-sub13',
    name: 'Vaga 3',
    shortName: 'V3',
    city: 'A definir',
    status: 'vaga',
    athleteCount: 0,
  },
]

export const mockCompetitionAssets: MockCompetitionAsset[] = [
  {
    id: 'asset-1',
    competitionSlug: 'copa-futuro-sub13',
    area: 'patrocinador',
    title: 'Banner tabela de classificacao',
    subtitle: 'Exibido no site e app abaixo da tabela oficial',
    imageHint: 'Formato sugerido 500x200',
    targetUrl: 'https://esportesacademy.com/patrocinador/master',
  },
  {
    id: 'asset-2',
    competitionSlug: 'copa-futuro-sub13',
    area: 'patrocinador',
    title: 'Banner noticias',
    subtitle: 'Exibido nas paginas editoriais da competicao',
    imageHint: 'Formato sugerido 500x200',
    targetUrl: 'https://esportesacademy.com/patrocinador/noticias',
  },
  {
    id: 'asset-3',
    competitionSlug: 'copa-futuro-sub13',
    area: 'parceiro',
    title: 'Parceiro local de hospedagem',
    subtitle: 'Destaque em paginas institucionais e guia do evento',
    imageHint: 'Formato sugerido 500x200',
    targetUrl: 'https://esportesacademy.com/parceiro/hotel',
  },
]

export const mockTeamPosts: MockBlogPost[] = [
  {
    id: 'team-1',
    title: 'Delegacao fechada para a Copa Futuro',
    excerpt: 'Lista de atletas confirmados e agenda de embarque da equipe Sub13.',
    author: 'Comissao tecnica',
    publishedAt: '03 abr 2026',
    status: 'publicado',
  },
  {
    id: 'team-2',
    title: 'Orientacoes para pagamento dos atletas',
    excerpt: 'O clube liberou link individual para atletas com taxa competitiva e uniforme.',
    author: 'Secretaria do clube',
    publishedAt: '01 abr 2026',
    status: 'publicado',
  },
  {
    id: 'team-3',
    title: 'Checklist de documentos da delegacao',
    excerpt: 'Documento interno para confirmar autorizacoes e relacao nominal.',
    author: 'Coordenacao do clube',
    publishedAt: 'Rascunho',
    status: 'rascunho',
  },
]

export const competitionSuperAdminHighlights = [
  { title: 'Organizadores ativos', value: '18', helper: '4 com onboarding comercial em analise' },
  { title: 'Mensalidades MRR', value: 'R$ 18.940', helper: 'Mensalidade + licenca competitiva da plataforma' },
  { title: 'Take rate medio', value: '11,7%', helper: 'Aplicado sobre todas as transacoes competitivas' },
  { title: 'GMV competitivo', value: 'R$ 412.300', helper: 'Competicoes pagas por clube e por atleta' },
]

export function getCompetitionBySlug(slug: string) {
  return mockCompetitions.find((competition) => competition.slug === slug)
}
