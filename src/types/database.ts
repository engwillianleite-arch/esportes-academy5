// ─── Enums ────────────────────────────────────────────────────────────────────

export type PlanoTipo = 'starter' | 'pro' | 'enterprise'

export type FrequenciaTipo = 'mensal' | 'trimestral' | 'semestral' | 'anual'

export type MetodoPagamento = 'boleto' | 'pix' | 'cartao_credito'

export type SexoTipo = 'M' | 'F' | 'outro'

export type PerfilUsuario =
  | 'admin_escola'
  | 'coordenador'
  | 'professor'
  | 'financeiro'
  | 'secretaria'
  | 'saude'
  | 'marketing'
  | 'responsavel'

export type ModuloSlug =
  | 'administrativo'
  | 'financeiro'
  | 'comunicacao_basica'
  | 'saude'
  | 'eventos'
  | 'treinamentos'
  | 'comunicacao_avancada'
  | 'relatorios'
  | 'competicoes'
  | 'metodologia'
  | 'cursos'

// ─── Row types ────────────────────────────────────────────────────────────────

// Must be `type` (not `interface`) — Supabase SDK checks Row extends Record<string, unknown>
// in conditional types, which fails for interface types due to TypeScript's index-signature rules.
export type Escola = {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  plano: PlanoTipo
  ativo: boolean
  logo_url: string | null
  modalidades: string[]
  onboarding_completo: boolean
  // Address fields (Story 2.2)
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  // Operational fields (Story 2.2)
  janela_chamada_h: number
  capacidade_padrao: number | null
  /** % mínimo esperado; abaixo disso o atleta é sinalizado (Story 5.2) */
  limiar_freq_pct: number
  fuso_horario: string
  // Asaas integration fields (Story 2.3)
  asaas_env: string
  asaas_vault_secret_id: string | null
  asaas_wallet_id: string | null
  asaas_webhook_secret: string | null
  dias_antecipacao: number
  multa_pct: number
  juros_pct: number
  desconto_antecip_pct: number
  // Notification settings (Story 2.4)
  notif_email: boolean
  notif_push: boolean
  notif_whatsapp: boolean
  notif_sms: boolean
  notif_cobranca_lembrete_d3: boolean
  notif_cobranca_lembrete_d1: boolean
  notif_cobranca_vencida: boolean
  notif_cobranca_confirmacao: boolean
  notif_frequencia_baixa: boolean
  notif_ausencia: boolean
  notif_relatorio_mensal: boolean
  notif_aniversario_atleta: boolean
  checkin_checkout_ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type EscolaUsuario = {
  id: string
  user_id: string
  escola_id: string
  perfil: PerfilUsuario
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type EscolaModulo = {
  id: string
  escola_id: string
  modulo_slug: ModuloSlug
  ativo: boolean
  liberado_por: string | null
  liberado_em: string | null
  expira_em: string | null
  nota: string | null
  created_at: string
  updated_at: string
}

export type Atleta = {
  id: string
  cpf: string
  nome: string
  data_nascimento: string // date as ISO string
  sexo: SexoTipo
  foto_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type Responsavel = {
  id: string
  nome: string
  /** CPF 11 dígitos — identificador único da pessoa (ver migration responsaveis.cpf) */
  cpf: string | null
  email: string | null
  telefone: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AtletaResponsavel = {
  id: string
  atleta_id: string
  responsavel_id: string
  financeiro: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AtletaResponsavelWithResponsavel = AtletaResponsavel & {
  responsavel: Responsavel
}

export type ResponsavelUsuario = {
  id: string
  responsavel_id: string
  user_id: string
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type UsuarioGlobal = {
  id: string
  auth_user_id: string
  cpf: string
  nome: string
  email: string | null
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type UsuarioEscolaTipo = {
  id: string
  usuario_id: string
  escola_id: string
  tipo_usuario: PerfilUsuario
  principal: boolean
  origem: string | null
  ref_id: string | null
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AtletaCarteirinha = {
  id: string
  atleta_id: string
  escola_id: string
  matricula_id: string | null
  qr_token: string
  ativo: boolean
  impresso_em: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type TipoAcessoAtleta = 'check_in' | 'check_out'

export type AtletaAcesso = {
  id: string
  atleta_id: string
  escola_id: string
  matricula_id: string | null
  carteirinha_id: string | null
  tipo: TipoAcessoAtleta
  lido_por_user_id: string | null
  qr_token_snapshot: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type TipoExameAtleta = 'clinico' | 'esportivo' | 'laboratorial'

export type AtletaExame = {
  id: string
  atleta_id: string
  escola_id: string
  matricula_id: string | null
  tipo_exame: TipoExameAtleta
  titulo: string
  data_exame: string
  resultado_resumido: string | null
  arquivo_url: string | null
  recorrente: boolean
  proximo_vencimento: string | null
  criado_por: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AtletaAtestado = {
  id: string
  atleta_id: string
  escola_id: string
  matricula_id: string | null
  titulo: string
  observacao: string | null
  data_emissao: string
  validade_ate: string | null
  arquivo_url: string | null
  criado_por: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type PlanoPagamento = {
  id: string
  escola_id: string
  nome: string
  frequencia: FrequenciaTipo
  valor: number
  desconto_pct: number
  valor_liquido: number
  dia_vencimento: number
  metodo_pagamento: MetodoPagamento
  cor: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type TipoPeriodoMatricula =
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'personalizado'

export type StatusMatricula = 'ativa' | 'suspensa' | 'cancelada' | 'encerrada'

export type FormaPagamentoMatricula = 'boleto' | 'pix' | 'cartao_credito' | 'qualquer'
export type StatusCobranca = 'pendente' | 'pago' | 'vencido' | 'cancelado'
export type PerfilPlataforma = 'super_admin' | 'suporte' | 'financeiro_interno'
export type StatusAssinaturaPlataforma = 'adimplente' | 'atraso' | 'suspenso'
export type StatusNotificacaoOutbox = 'queued' | 'processing' | 'sent' | 'failed'
export type CanalNotificacao = 'email' | 'push'
export type StatusEntregaNotificacao = 'queued' | 'sent' | 'failed'

export type Matricula = {
  id: string
  atleta_id: string
  escola_id: string
  turma_id: string | null
  plano_id: string | null
  data_inicio: string
  data_fim: string | null
  tipo_periodo: TipoPeriodoMatricula
  valor: number
  desconto_pct: number
  desconto_motivo: string | null
  valor_liquido: number
  dia_vencimento: number
  forma_pagamento: FormaPagamentoMatricula
  gerar_auto: boolean
  total_parcelas: number | null
  parcelas_geradas: number
  status: StatusMatricula
  motivo_status: string | null
  obs: string | null
  criado_por: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Cobranca = {
  id: string
  escola_id: string
  matricula_id: string | null
  valor: number
  vencimento: string
  descricao: string | null
  referencia: string | null
  asaas_charge_id: string | null
  status: StatusCobranca
  data_pagamento: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type PlataformaUsuario = {
  id: string
  user_id: string
  perfil: PerfilPlataforma
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AssinaturaPlataforma = {
  id: string
  escola_id: string
  valor_mensal: number
  dia_vencimento: number
  status: StatusAssinaturaPlataforma
  referencia_externa: string | null
  proximo_vencimento: string | null
  observacoes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type PublicoAlvoCurso = 'professor' | 'admin' | 'responsavel' | 'atleta' | 'todos'
export type StatusCurso = 'rascunho' | 'publicado' | 'arquivado'
export type ModalidadeComercialCurso = 'assinatura' | 'individual'

export type Curso = {
  id: string
  escola_id: string
  titulo: string
  descricao: string | null
  publico_alvo: PublicoAlvoCurso
  status: StatusCurso
  modalidade_comercial: ModalidadeComercialCurso
  preco: number
  periodo_acesso_dias: number | null
  oferta_ativa: boolean
  interno: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CursoModulo = {
  id: string
  curso_id: string
  titulo: string
  descricao: string | null
  ordem: number
  published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CursoAula = {
  id: string
  curso_id: string
  modulo_id: string
  titulo: string
  descricao: string | null
  ordem: number
  video_url: string | null
  pdf_url: string | null
  texto_conteudo: string | null
  quiz_habilitado: boolean
  published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type TipoCursoQuiz = 'aula' | 'modulo' | 'curso_final'

export type CursoQuiz = {
  id: string
  curso_id: string
  modulo_id: string | null
  aula_id: string | null
  tipo: TipoCursoQuiz
  titulo: string
  descricao: string | null
  nota_minima: number
  tentativas_max: number
  published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CursoQuizPergunta = {
  id: string
  quiz_id: string
  enunciado: string
  ordem: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CursoQuizAlternativa = {
  id: string
  pergunta_id: string
  texto: string
  ordem: number
  correta: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CursoQuizTentativa = {
  id: string
  quiz_id: string
  user_id: string
  tentativa_numero: number
  nota: number
  aprovado: boolean
  respostas: Record<string, unknown>[]
  created_at: string
  updated_at: string
}

export type NotificacaoOutbox = {
  id: string
  escola_id: string
  evento_tipo: string
  ref_tipo: string | null
  ref_id: string | null
  payload: Record<string, unknown>
  status: StatusNotificacaoOutbox
  tentativas: number
  next_retry_at: string | null
  idempotency_key: string | null
  erro: string | null
  created_at: string
  updated_at: string
}

export type NotificacaoEntrega = {
  id: string
  outbox_id: string
  escola_id: string
  canal: CanalNotificacao
  destinatario_id: string | null
  destinatario_contato: string | null
  status: StatusEntregaNotificacao
  provider_message_id: string | null
  erro: string | null
  created_at: string
  updated_at: string
}

export type Turma = {
  id: string
  escola_id: string
  nome: string
  modalidade: string
  local: string | null
  capacidade_max: number
  idade_min: number | null
  idade_max: number | null
  professor_nome: string | null
  /** Usuário logado responsável pela turma (chamada / Story 5.1) */
  professor_user_id: string | null
  dia_semana: number | null
  hora_inicio: string | null
  hora_fim: string | null
  ativo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type StatusPresenca = 'presente' | 'ausente' | 'justificada'

export type Aula = {
  id: string
  escola_id: string
  turma_id: string
  data_aula: string
  created_at: string
  updated_at: string
}

export type PresencaRegistro = {
  id: string
  aula_id: string
  matricula_id: string
  status: StatusPresenca
  observacao: string | null
  created_at: string
  updated_at: string
}

// ─── Joined types ─────────────────────────────────────────────────────────────

// Used when escola data is fetched alongside escola_usuarios
// Matches: .from('escola_usuarios').select('*, escola:escolas(*)')
export type EscolaUsuarioWithEscola = EscolaUsuario & {
  escola: Escola
}

// ─── Supabase Database type (for typed client generics) ───────────────────────
// Uses flat inline types (not Partial<Omit<...>>) to match Supabase SDK's
// generic resolution — Supabase SDK collapses Partial<Omit<...>> to `never`
// when resolving .update() and .insert() parameter types.

export type Database = {
  public: {
    Tables: {
      escolas: {
        Row: Escola
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          email?: string | null
          telefone?: string | null
          plano?: PlanoTipo
          ativo?: boolean
          logo_url?: string | null
          modalidades?: string[] | null
          onboarding_completo?: boolean | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          janela_chamada_h?: number
          capacidade_padrao?: number | null
          limiar_freq_pct?: number
          fuso_horario?: string
          asaas_env?: string
          asaas_vault_secret_id?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_secret?: string | null
          dias_antecipacao?: number
          multa_pct?: number
          juros_pct?: number
          desconto_antecip_pct?: number
          notif_email?: boolean
          notif_push?: boolean
          notif_whatsapp?: boolean
          notif_sms?: boolean
          notif_cobranca_lembrete_d3?: boolean
          notif_cobranca_lembrete_d1?: boolean
          notif_cobranca_vencida?: boolean
          notif_cobranca_confirmacao?: boolean
          notif_frequencia_baixa?: boolean
          notif_ausencia?: boolean
          notif_relatorio_mensal?: boolean
          notif_aniversario_atleta?: boolean
          checkin_checkout_ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          email?: string | null
          telefone?: string | null
          plano?: PlanoTipo
          ativo?: boolean
          logo_url?: string | null
          modalidades?: string[] | null
          onboarding_completo?: boolean | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          janela_chamada_h?: number
          capacidade_padrao?: number | null
          limiar_freq_pct?: number
          fuso_horario?: string
          asaas_env?: string
          asaas_vault_secret_id?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_secret?: string | null
          dias_antecipacao?: number
          multa_pct?: number
          juros_pct?: number
          desconto_antecip_pct?: number
          notif_email?: boolean
          notif_push?: boolean
          notif_whatsapp?: boolean
          notif_sms?: boolean
          notif_cobranca_lembrete_d3?: boolean
          notif_cobranca_lembrete_d1?: boolean
          notif_cobranca_vencida?: boolean
          notif_cobranca_confirmacao?: boolean
          notif_frequencia_baixa?: boolean
          notif_ausencia?: boolean
          notif_relatorio_mensal?: boolean
          notif_aniversario_atleta?: boolean
          checkin_checkout_ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      escola_usuarios: {
        Row: EscolaUsuario
        Insert: {
          id?: string
          user_id: string
          escola_id: string
          perfil?: PerfilUsuario
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          escola_id?: string
          perfil?: PerfilUsuario
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      escola_modulos: {
        Row: EscolaModulo
        Insert: {
          id?: string
          escola_id: string
          modulo_slug: ModuloSlug
          ativo?: boolean
          liberado_por?: string | null
          liberado_em?: string | null
          expira_em?: string | null
          nota?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          modulo_slug?: ModuloSlug
          ativo?: boolean
          liberado_por?: string | null
          liberado_em?: string | null
          expira_em?: string | null
          nota?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atletas: {
        Row: Atleta
        Insert: {
          id?: string
          cpf: string
          nome: string
          data_nascimento: string
          sexo: SexoTipo
          foto_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cpf?: string
          nome?: string
          data_nascimento?: string
          sexo?: SexoTipo
          foto_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: Responsavel
        Insert: {
          id?: string
          nome: string
          cpf?: string | null
          email?: string | null
          telefone?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string | null
          email?: string | null
          telefone?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atleta_responsaveis: {
        Row: AtletaResponsavel
        Insert: {
          id?: string
          atleta_id: string
          responsavel_id: string
          financeiro?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atleta_id?: string
          responsavel_id?: string
          financeiro?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'atleta_responsaveis_responsavel_id_fkey'
            columns: ['responsavel_id']
            referencedRelation: 'responsaveis'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'atleta_responsaveis_atleta_id_fkey'
            columns: ['atleta_id']
            referencedRelation: 'atletas'
            referencedColumns: ['id']
          },
        ]
      }
      responsavel_usuarios: {
        Row: ResponsavelUsuario
        Insert: {
          id?: string
          responsavel_id: string
          user_id: string
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          responsavel_id?: string
          user_id?: string
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: UsuarioGlobal
        Insert: {
          id?: string
          auth_user_id: string
          cpf: string
          nome: string
          email?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          cpf?: string
          nome?: string
          email?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuario_escola_tipos: {
        Row: UsuarioEscolaTipo
        Insert: {
          id?: string
          usuario_id: string
          escola_id: string
          tipo_usuario: PerfilUsuario
          principal?: boolean
          origem?: string | null
          ref_id?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          escola_id?: string
          tipo_usuario?: PerfilUsuario
          principal?: boolean
          origem?: string | null
          ref_id?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atleta_carteirinhas: {
        Row: AtletaCarteirinha
        Insert: {
          id?: string
          atleta_id: string
          escola_id: string
          matricula_id?: string | null
          qr_token: string
          ativo?: boolean
          impresso_em?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atleta_id?: string
          escola_id?: string
          matricula_id?: string | null
          qr_token?: string
          ativo?: boolean
          impresso_em?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atleta_acessos: {
        Row: AtletaAcesso
        Insert: {
          id?: string
          atleta_id: string
          escola_id: string
          matricula_id?: string | null
          carteirinha_id?: string | null
          tipo: TipoAcessoAtleta
          lido_por_user_id?: string | null
          qr_token_snapshot?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atleta_id?: string
          escola_id?: string
          matricula_id?: string | null
          carteirinha_id?: string | null
          tipo?: TipoAcessoAtleta
          lido_por_user_id?: string | null
          qr_token_snapshot?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atleta_exames: {
        Row: AtletaExame
        Insert: {
          id?: string
          atleta_id: string
          escola_id: string
          matricula_id?: string | null
          tipo_exame: TipoExameAtleta
          titulo: string
          data_exame: string
          resultado_resumido?: string | null
          arquivo_url?: string | null
          recorrente?: boolean
          proximo_vencimento?: string | null
          criado_por?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atleta_id?: string
          escola_id?: string
          matricula_id?: string | null
          tipo_exame?: TipoExameAtleta
          titulo?: string
          data_exame?: string
          resultado_resumido?: string | null
          arquivo_url?: string | null
          recorrente?: boolean
          proximo_vencimento?: string | null
          criado_por?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      atleta_atestados: {
        Row: AtletaAtestado
        Insert: {
          id?: string
          atleta_id: string
          escola_id: string
          matricula_id?: string | null
          titulo: string
          observacao?: string | null
          data_emissao: string
          validade_ate?: string | null
          arquivo_url?: string | null
          criado_por?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atleta_id?: string
          escola_id?: string
          matricula_id?: string | null
          titulo?: string
          observacao?: string | null
          data_emissao?: string
          validade_ate?: string | null
          arquivo_url?: string | null
          criado_por?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      planos_pagamento: {
        Row: PlanoPagamento
        Insert: {
          id?: string
          escola_id: string
          nome: string
          frequencia: FrequenciaTipo
          valor: number
          desconto_pct?: number
          valor_liquido: number
          dia_vencimento: number
          metodo_pagamento: MetodoPagamento
          cor?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          nome?: string
          frequencia?: FrequenciaTipo
          valor?: number
          desconto_pct?: number
          valor_liquido?: number
          dia_vencimento?: number
          metodo_pagamento?: MetodoPagamento
          cor?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: Turma
        Insert: {
          id?: string
          escola_id: string
          nome: string
          modalidade: string
          local?: string | null
          capacidade_max?: number
          idade_min?: number | null
          idade_max?: number | null
          professor_nome?: string | null
          professor_user_id?: string | null
          dia_semana?: number | null
          hora_inicio?: string | null
          hora_fim?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          nome?: string
          modalidade?: string
          local?: string | null
          capacidade_max?: number
          idade_min?: number | null
          idade_max?: number | null
          professor_nome?: string | null
          professor_user_id?: string | null
          dia_semana?: number | null
          hora_inicio?: string | null
          hora_fim?: string | null
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      aulas: {
        Row: Aula
        Insert: {
          id?: string
          escola_id: string
          turma_id: string
          data_aula: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          turma_id?: string
          data_aula?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      presencas_registros: {
        Row: PresencaRegistro
        Insert: {
          id?: string
          aula_id: string
          matricula_id: string
          status: StatusPresenca
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aula_id?: string
          matricula_id?: string
          status?: StatusPresenca
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: Matricula
        Insert: {
          id?: string
          atleta_id: string
          escola_id: string
          turma_id?: string | null
          plano_id?: string | null
          data_inicio: string
          data_fim?: string | null
          tipo_periodo?: TipoPeriodoMatricula
          valor: number
          desconto_pct?: number
          desconto_motivo?: string | null
          valor_liquido: number
          dia_vencimento: number
          forma_pagamento?: FormaPagamentoMatricula
          gerar_auto?: boolean
          total_parcelas?: number | null
          parcelas_geradas?: number
          status?: StatusMatricula
          motivo_status?: string | null
          obs?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          atleta_id?: string
          escola_id?: string
          turma_id?: string | null
          plano_id?: string | null
          data_inicio?: string
          data_fim?: string | null
          tipo_periodo?: TipoPeriodoMatricula
          valor?: number
          desconto_pct?: number
          desconto_motivo?: string | null
          valor_liquido?: number
          dia_vencimento?: number
          forma_pagamento?: FormaPagamentoMatricula
          gerar_auto?: boolean
          total_parcelas?: number | null
          parcelas_geradas?: number
          status?: StatusMatricula
          motivo_status?: string | null
          obs?: string | null
          criado_por?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      cobrancas: {
        Row: Cobranca
        Insert: {
          id?: string
          escola_id: string
          matricula_id?: string | null
          valor: number
          vencimento: string
          descricao?: string | null
          referencia?: string | null
          asaas_charge_id?: string | null
          status?: StatusCobranca
          data_pagamento?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          matricula_id?: string | null
          valor?: number
          vencimento?: string
          descricao?: string | null
          referencia?: string | null
          asaas_charge_id?: string | null
          status?: StatusCobranca
          data_pagamento?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plataforma_usuarios: {
        Row: PlataformaUsuario
        Insert: {
          id?: string
          user_id: string
          perfil: PerfilPlataforma
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          perfil?: PerfilPlataforma
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assinaturas_plataforma: {
        Row: AssinaturaPlataforma
        Insert: {
          id?: string
          escola_id: string
          valor_mensal?: number
          dia_vencimento?: number
          status?: StatusAssinaturaPlataforma
          referencia_externa?: string | null
          proximo_vencimento?: string | null
          observacoes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          valor_mensal?: number
          dia_vencimento?: number
          status?: StatusAssinaturaPlataforma
          referencia_externa?: string | null
          proximo_vencimento?: string | null
          observacoes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cursos: {
        Row: Curso
        Insert: {
          id?: string
          escola_id: string
          titulo: string
          descricao?: string | null
          publico_alvo: PublicoAlvoCurso
          status?: StatusCurso
          modalidade_comercial: ModalidadeComercialCurso
          preco?: number
          periodo_acesso_dias?: number | null
          oferta_ativa?: boolean
          interno?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          titulo?: string
          descricao?: string | null
          publico_alvo?: PublicoAlvoCurso
          status?: StatusCurso
          modalidade_comercial?: ModalidadeComercialCurso
          preco?: number
          periodo_acesso_dias?: number | null
          oferta_ativa?: boolean
          interno?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_modulos: {
        Row: CursoModulo
        Insert: {
          id?: string
          curso_id: string
          titulo: string
          descricao?: string | null
          ordem: number
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          curso_id?: string
          titulo?: string
          descricao?: string | null
          ordem?: number
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_aulas: {
        Row: CursoAula
        Insert: {
          id?: string
          curso_id: string
          modulo_id: string
          titulo: string
          descricao?: string | null
          ordem: number
          video_url?: string | null
          pdf_url?: string | null
          texto_conteudo?: string | null
          quiz_habilitado?: boolean
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          curso_id?: string
          modulo_id?: string
          titulo?: string
          descricao?: string | null
          ordem?: number
          video_url?: string | null
          pdf_url?: string | null
          texto_conteudo?: string | null
          quiz_habilitado?: boolean
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_quizzes: {
        Row: CursoQuiz
        Insert: {
          id?: string
          curso_id: string
          modulo_id?: string | null
          aula_id?: string | null
          tipo: TipoCursoQuiz
          titulo: string
          descricao?: string | null
          nota_minima?: number
          tentativas_max?: number
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          curso_id?: string
          modulo_id?: string | null
          aula_id?: string | null
          tipo?: TipoCursoQuiz
          titulo?: string
          descricao?: string | null
          nota_minima?: number
          tentativas_max?: number
          published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_quiz_perguntas: {
        Row: CursoQuizPergunta
        Insert: {
          id?: string
          quiz_id: string
          enunciado: string
          ordem: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          enunciado?: string
          ordem?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_quiz_alternativas: {
        Row: CursoQuizAlternativa
        Insert: {
          id?: string
          pergunta_id: string
          texto: string
          ordem: number
          correta?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pergunta_id?: string
          texto?: string
          ordem?: number
          correta?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curso_quiz_tentativas: {
        Row: CursoQuizTentativa
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          tentativa_numero: number
          nota?: number
          aprovado?: boolean
          respostas?: Record<string, unknown>[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          tentativa_numero?: number
          nota?: number
          aprovado?: boolean
          respostas?: Record<string, unknown>[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificacoes_outbox: {
        Row: NotificacaoOutbox
        Insert: {
          id?: string
          escola_id: string
          evento_tipo: string
          ref_tipo?: string | null
          ref_id?: string | null
          payload?: Record<string, unknown>
          status?: StatusNotificacaoOutbox
          tentativas?: number
          next_retry_at?: string | null
          idempotency_key?: string | null
          erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escola_id?: string
          evento_tipo?: string
          ref_tipo?: string | null
          ref_id?: string | null
          payload?: Record<string, unknown>
          status?: StatusNotificacaoOutbox
          tentativas?: number
          next_retry_at?: string | null
          idempotency_key?: string | null
          erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificacoes_entregas: {
        Row: NotificacaoEntrega
        Insert: {
          id?: string
          outbox_id: string
          escola_id: string
          canal: CanalNotificacao
          destinatario_id?: string | null
          destinatario_contato?: string | null
          status?: StatusEntregaNotificacao
          provider_message_id?: string | null
          erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          outbox_id?: string
          escola_id?: string
          canal?: CanalNotificacao
          destinatario_id?: string | null
          destinatario_contato?: string | null
          status?: StatusEntregaNotificacao
          provider_message_id?: string | null
          erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Story 8.2 — Auditoria de alterações em permissões
      auditoria_permissoes: {
        Row: {
          id: string
          tipo: string
          escola_id: string | null
          ator_id: string
          ator_email: string | null
          modulo_slug: string | null
          perfil: string | null
          valor_antes: boolean | null
          valor_depois: boolean | null
          detalhes: Record<string, unknown> | null
          ip: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          tipo: string
          escola_id?: string | null
          ator_id: string
          ator_email?: string | null
          modulo_slug?: string | null
          perfil?: string | null
          valor_antes?: boolean | null
          valor_depois?: boolean | null
          detalhes?: Record<string, unknown> | null
          ip?: string | null
          criado_em?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      // Story 8.1 — Matriz perfil × módulo editável
      perfil_modulo_acesso: {
        Row: {
          id: string
          modulo_slug: string
          perfil: string
          ativo: boolean
          atualizado_por: string | null
          atualizado_em: string
        }
        Insert: {
          id?: string
          modulo_slug: string
          perfil: string
          ativo?: boolean
          atualizado_por?: string | null
          atualizado_em?: string
        }
        Update: {
          id?: string
          modulo_slug?: string
          perfil?: string
          ativo?: boolean
          atualizado_por?: string | null
          atualizado_em?: string
        }
        Relationships: []
      }
    }
    Views: {
      modulos_ativos: {
        Row: EscolaModulo
        Relationships: []
      }
    }
    Functions: {
      is_module_active: {
        Args: { p_escola_id: string; p_modulo_slug: string }
        Returns: boolean
      }
      criar_escola_completo: {
        Args: {
          p_nome: string
          p_cnpj: string
          p_email: string
          p_telefone: string
          p_plano: string
          p_modalidades: string[]
          p_modulos: string[]
        }
        Returns: string
      }
      salvar_asaas_token: {
        Args: { p_escola_id: string; p_token: string }
        Returns: string
      }
      obter_asaas_token: {
        Args: { p_escola_id: string }
        Returns: string | null
      }
      buscar_atleta_por_cpf: {
        Args: { p_cpf: string; p_escola_id: string }
        Returns: Array<{
          status: string
          atleta_id: string | null
          nome: string | null
          data_nascimento: string | null
          sexo: string | null
          foto_url: string | null
        }>
      }
      chamada_pode_editar: {
        Args: { p_data: string; p_escola_id: string }
        Returns: boolean
      }
      listar_membros_escola: {
        Args: { p_escola_id: string }
        Returns: Array<{ user_id: string; perfil: string; email: string | null }>
      }
      frequencia_resumo_matriculas: {
        Args: { p_escola_id: string; p_matricula_ids: string[] }
        Returns: Array<{ matricula_id: string; total: number; presentes: number }>
      }
      historico_presencas_matricula: {
        Args: { p_escola_id: string; p_matricula_id: string }
        Returns: Array<{ data_aula: string; turma_nome: string; status: string }>
      }
      dashboard_kpis_escola: {
        Args: { p_escola_id: string }
        Returns: Array<{
          atletas_ativos: number
          turmas_ativas: number
          aulas_hoje: number
          aulas_com_chamada: number
        }>
      }
      aulas_hoje_status: {
        Args: { p_escola_id: string; p_user_id: string; p_perfil: string }
        Returns: Array<{
          turma_id: string
          turma_nome: string
          matriculas_ativas: number
          registros_presenca: number
          chamada_feita: boolean
        }>
      }
    }
  }
}
