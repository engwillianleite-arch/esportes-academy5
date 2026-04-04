export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assinaturas_plataforma: {
        Row: {
          created_at: string
          deleted_at: string | null
          dia_vencimento: number
          escola_id: string
          id: string
          observacoes: string | null
          proximo_vencimento: string | null
          referencia_externa: string | null
          status: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dia_vencimento?: number
          escola_id: string
          id?: string
          observacoes?: string | null
          proximo_vencimento?: string | null
          referencia_externa?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dia_vencimento?: number
          escola_id?: string
          id?: string
          observacoes?: string | null
          proximo_vencimento?: string | null
          referencia_externa?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plataforma_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: true
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      plataforma_configuracoes: {
        Row: {
          alertas_falha_ativos: boolean
          canal_escalonamento: string
          cpf_global_obrigatorio: boolean
          created_at: string
          email_alertas_operacionais: boolean
          eventos_por_lote: number
          exigir_reset_senha_internos: boolean
          exportacao_auditoria_frequencia: string
          idioma_padrao: string
          key: string
          landing_publica_ativa: boolean
          mensagem_aniversario_template: string
          mfa_superadmin: boolean
          nome_publico: string
          notif_aniversario_padrao: boolean
          notif_checkin_checkout: boolean
          pais_padrao: string
          politica_cookies_status: string
          politica_cookies_versao: string
          politica_privacidade_status: string
          politica_privacidade_versao: string
          provider_video_padrao: string
          rate_limit_janela_segundos: number
          retencao_logs_dias: number
          retry_jobs_limite: number
          sandbox_cursos_ativo: boolean
          selecao_contexto_obrigatoria: boolean
          sessao_curta_critica: boolean
          slug_institucional: string
          termos_status: string
          termos_versao: string
          timeout_jobs_segundos: number
          updated_at: string
        }
        Insert: {
          alertas_falha_ativos?: boolean
          canal_escalonamento?: string
          cpf_global_obrigatorio?: boolean
          created_at?: string
          email_alertas_operacionais?: boolean
          eventos_por_lote?: number
          exigir_reset_senha_internos?: boolean
          exportacao_auditoria_frequencia?: string
          idioma_padrao?: string
          key?: string
          landing_publica_ativa?: boolean
          mensagem_aniversario_template?: string
          mfa_superadmin?: boolean
          nome_publico?: string
          notif_aniversario_padrao?: boolean
          notif_checkin_checkout?: boolean
          pais_padrao?: string
          politica_cookies_status?: string
          politica_cookies_versao?: string
          politica_privacidade_status?: string
          politica_privacidade_versao?: string
          provider_video_padrao?: string
          rate_limit_janela_segundos?: number
          retencao_logs_dias?: number
          retry_jobs_limite?: number
          sandbox_cursos_ativo?: boolean
          selecao_contexto_obrigatoria?: boolean
          sessao_curta_critica?: boolean
          slug_institucional?: string
          termos_status?: string
          termos_versao?: string
          timeout_jobs_segundos?: number
          updated_at?: string
        }
        Update: {
          alertas_falha_ativos?: boolean
          canal_escalonamento?: string
          cpf_global_obrigatorio?: boolean
          created_at?: string
          email_alertas_operacionais?: boolean
          eventos_por_lote?: number
          exigir_reset_senha_internos?: boolean
          exportacao_auditoria_frequencia?: string
          idioma_padrao?: string
          key?: string
          landing_publica_ativa?: boolean
          mensagem_aniversario_template?: string
          mfa_superadmin?: boolean
          nome_publico?: string
          notif_aniversario_padrao?: boolean
          notif_checkin_checkout?: boolean
          pais_padrao?: string
          politica_cookies_status?: string
          politica_cookies_versao?: string
          politica_privacidade_status?: string
          politica_privacidade_versao?: string
          provider_video_padrao?: string
          rate_limit_janela_segundos?: number
          retencao_logs_dias?: number
          retry_jobs_limite?: number
          sandbox_cursos_ativo?: boolean
          selecao_contexto_obrigatoria?: boolean
          sessao_curta_critica?: boolean
          slug_institucional?: string
          termos_status?: string
          termos_versao?: string
          timeout_jobs_segundos?: number
          updated_at?: string
        }
        Relationships: []
      }
      atleta_acessos: {
        Row: {
          atleta_id: string
          carteirinha_id: string | null
          created_at: string
          deleted_at: string | null
          escola_id: string
          id: string
          lido_por_user_id: string | null
          matricula_id: string | null
          qr_token_snapshot: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          atleta_id: string
          carteirinha_id?: string | null
          created_at?: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          lido_por_user_id?: string | null
          matricula_id?: string | null
          qr_token_snapshot?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          atleta_id?: string
          carteirinha_id?: string | null
          created_at?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          lido_por_user_id?: string | null
          matricula_id?: string | null
          qr_token_snapshot?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_acessos_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_acessos_carteirinha_id_fkey"
            columns: ["carteirinha_id"]
            isOneToOne: false
            referencedRelation: "atleta_carteirinhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_acessos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_acessos_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_atestados: {
        Row: {
          arquivo_url: string | null
          atleta_id: string
          created_at: string
          criado_por: string | null
          data_emissao: string
          deleted_at: string | null
          escola_id: string
          id: string
          matricula_id: string | null
          observacao: string | null
          titulo: string
          updated_at: string
          validade_ate: string | null
        }
        Insert: {
          arquivo_url?: string | null
          atleta_id: string
          created_at?: string
          criado_por?: string | null
          data_emissao: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          matricula_id?: string | null
          observacao?: string | null
          titulo: string
          updated_at?: string
          validade_ate?: string | null
        }
        Update: {
          arquivo_url?: string | null
          atleta_id?: string
          created_at?: string
          criado_por?: string | null
          data_emissao?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          matricula_id?: string | null
          observacao?: string | null
          titulo?: string
          updated_at?: string
          validade_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atleta_atestados_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_atestados_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_atestados_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_carteirinhas: {
        Row: {
          ativo: boolean
          atleta_id: string
          created_at: string
          deleted_at: string | null
          escola_id: string
          id: string
          impresso_em: string | null
          matricula_id: string | null
          qr_token: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atleta_id: string
          created_at?: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          impresso_em?: string | null
          matricula_id?: string | null
          qr_token: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atleta_id?: string
          created_at?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          impresso_em?: string | null
          matricula_id?: string | null
          qr_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_carteirinhas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_carteirinhas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_carteirinhas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_exames: {
        Row: {
          arquivo_url: string | null
          atleta_id: string
          created_at: string
          criado_por: string | null
          data_exame: string
          deleted_at: string | null
          escola_id: string
          id: string
          matricula_id: string | null
          proximo_vencimento: string | null
          recorrente: boolean
          resultado_resumido: string | null
          tipo_exame: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          atleta_id: string
          created_at?: string
          criado_por?: string | null
          data_exame: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          matricula_id?: string | null
          proximo_vencimento?: string | null
          recorrente?: boolean
          resultado_resumido?: string | null
          tipo_exame: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          atleta_id?: string
          created_at?: string
          criado_por?: string | null
          data_exame?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          matricula_id?: string | null
          proximo_vencimento?: string | null
          recorrente?: boolean
          resultado_resumido?: string | null
          tipo_exame?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_exames_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_exames_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_exames_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_responsaveis: {
        Row: {
          atleta_id: string
          created_at: string
          deleted_at: string | null
          financeiro: boolean
          id: string
          responsavel_id: string
          updated_at: string
        }
        Insert: {
          atleta_id: string
          created_at?: string
          deleted_at?: string | null
          financeiro?: boolean
          id?: string
          responsavel_id: string
          updated_at?: string
        }
        Update: {
          atleta_id?: string
          created_at?: string
          deleted_at?: string | null
          financeiro?: boolean
          id?: string
          responsavel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_responsaveis_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_responsaveis_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      atletas: {
        Row: {
          cpf: string
          created_at: string
          data_nascimento: string
          deleted_at: string | null
          foto_url: string | null
          id: string
          nome: string
          sexo: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          data_nascimento: string
          deleted_at?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          sexo: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          data_nascimento?: string
          deleted_at?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          sexo?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditoria_permissoes: {
        Row: {
          ator_email: string | null
          ator_id: string
          criado_em: string
          detalhes: Json | null
          escola_id: string | null
          id: string
          ip: string | null
          modulo_slug: string | null
          perfil: string | null
          tipo: string
          valor_antes: boolean | null
          valor_depois: boolean | null
        }
        Insert: {
          ator_email?: string | null
          ator_id: string
          criado_em?: string
          detalhes?: Json | null
          escola_id?: string | null
          id?: string
          ip?: string | null
          modulo_slug?: string | null
          perfil?: string | null
          tipo: string
          valor_antes?: boolean | null
          valor_depois?: boolean | null
        }
        Update: {
          ator_email?: string | null
          ator_id?: string
          criado_em?: string
          detalhes?: Json | null
          escola_id?: string | null
          id?: string
          ip?: string | null
          modulo_slug?: string | null
          perfil?: string | null
          tipo?: string
          valor_antes?: boolean | null
          valor_depois?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_permissoes_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string
          data_aula: string
          escola_id: string
          id: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_aula: string
          escola_id: string
          id?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_aula?: string
          escola_id?: string
          id?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          asaas_charge_id: string | null
          created_at: string
          data_pagamento: string | null
          deleted_at: string | null
          descricao: string | null
          escola_id: string
          id: string
          matricula_id: string | null
          referencia: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          asaas_charge_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          deleted_at?: string | null
          descricao?: string | null
          escola_id: string
          id?: string
          matricula_id?: string | null
          referencia?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          asaas_charge_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          deleted_at?: string | null
          descricao?: string | null
          escola_id?: string
          id?: string
          matricula_id?: string | null
          referencia?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_assinaturas_usuarios: {
        Row: {
          created_at: string
          deleted_at: string | null
          escola_id: string
          fim_em: string | null
          id: string
          inicio_em: string
          origem: string
          status: string
          titulo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          escola_id: string
          fim_em?: string | null
          id?: string
          inicio_em: string
          origem?: string
          status?: string
          titulo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          escola_id?: string
          fim_em?: string | null
          id?: string
          inicio_em?: string
          origem?: string
          status?: string
          titulo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_assinaturas_usuarios_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_aula_progresso: {
        Row: {
          aula_id: string
          concluida: boolean
          concluida_em: string | null
          created_at: string
          curso_id: string
          id: string
          matricula_id: string | null
          ultima_interacao_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aula_id: string
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          curso_id: string
          id?: string
          matricula_id?: string | null
          ultima_interacao_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          curso_id?: string
          id?: string
          matricula_id?: string | null
          ultima_interacao_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_aula_progresso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_aula_progresso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_aula_progresso_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "curso_matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_aulas: {
        Row: {
          created_at: string
          curso_id: string
          deleted_at: string | null
          descricao: string | null
          id: string
          modulo_id: string
          ordem: number
          pdf_url: string | null
          published: boolean
          quiz_habilitado: boolean
          texto_conteudo: string | null
          titulo: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          curso_id: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          modulo_id: string
          ordem: number
          pdf_url?: string | null
          published?: boolean
          quiz_habilitado?: boolean
          texto_conteudo?: string | null
          titulo: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          curso_id?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          modulo_id?: string
          ordem?: number
          pdf_url?: string | null
          published?: boolean
          quiz_habilitado?: boolean
          texto_conteudo?: string | null
          titulo?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curso_aulas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_matriculas: {
        Row: {
          aprovado: boolean
          assinatura_id: string | null
          created_at: string
          curso_id: string
          deleted_at: string | null
          escola_id: string
          expira_em: string | null
          id: string
          liberado_em: string
          origem_liberacao: string
          progresso_pct: number
          status: string
          ultima_atividade_em: string | null
          updated_at: string
          user_id: string
          valor_pago: number
        }
        Insert: {
          aprovado?: boolean
          assinatura_id?: string | null
          created_at?: string
          curso_id: string
          deleted_at?: string | null
          escola_id: string
          expira_em?: string | null
          id?: string
          liberado_em?: string
          origem_liberacao: string
          progresso_pct?: number
          status?: string
          ultima_atividade_em?: string | null
          updated_at?: string
          user_id: string
          valor_pago?: number
        }
        Update: {
          aprovado?: boolean
          assinatura_id?: string | null
          created_at?: string
          curso_id?: string
          deleted_at?: string | null
          escola_id?: string
          expira_em?: string | null
          id?: string
          liberado_em?: string
          origem_liberacao?: string
          progresso_pct?: number
          status?: string
          ultima_atividade_em?: string | null
          updated_at?: string
          user_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "curso_matriculas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "curso_assinaturas_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_matriculas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_modulos: {
        Row: {
          created_at: string
          curso_id: string
          deleted_at: string | null
          descricao: string | null
          id: string
          ordem: number
          published: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          ordem: number
          published?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          published?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_quiz_alternativas: {
        Row: {
          correta: boolean
          created_at: string
          deleted_at: string | null
          id: string
          ordem: number
          pergunta_id: string
          texto: string
          updated_at: string
        }
        Insert: {
          correta?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          ordem: number
          pergunta_id: string
          texto: string
          updated_at?: string
        }
        Update: {
          correta?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          ordem?: number
          pergunta_id?: string
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_quiz_alternativas_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "curso_quiz_perguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_quiz_perguntas: {
        Row: {
          created_at: string
          deleted_at: string | null
          enunciado: string
          id: string
          ordem: number
          quiz_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          enunciado: string
          id?: string
          ordem: number
          quiz_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          enunciado?: string
          id?: string
          ordem?: number
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_quiz_perguntas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "curso_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_quiz_tentativas: {
        Row: {
          aprovado: boolean
          created_at: string
          id: string
          nota: number
          quiz_id: string
          respostas: Json
          tentativa_numero: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          id?: string
          nota?: number
          quiz_id: string
          respostas?: Json
          tentativa_numero: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          id?: string
          nota?: number
          quiz_id?: string
          respostas?: Json
          tentativa_numero?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_quiz_tentativas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "curso_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_quizzes: {
        Row: {
          aula_id: string | null
          created_at: string
          curso_id: string
          deleted_at: string | null
          descricao: string | null
          id: string
          modulo_id: string | null
          nota_minima: number
          published: boolean
          tentativas_max: number
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aula_id?: string | null
          created_at?: string
          curso_id: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          modulo_id?: string | null
          nota_minima?: number
          published?: boolean
          tentativas_max?: number
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aula_id?: string | null
          created_at?: string
          curso_id?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          modulo_id?: string | null
          nota_minima?: number
          published?: boolean
          tentativas_max?: number
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_quizzes_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_quizzes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_quizzes_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          created_at: string
          deleted_at: string | null
          descricao: string | null
          escola_id: string
          id: string
          interno: boolean
          modalidade_comercial: string
          oferta_ativa: boolean
          periodo_acesso_dias: number | null
          preco: number
          publico_alvo: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          escola_id: string
          id?: string
          interno?: boolean
          modalidade_comercial: string
          oferta_ativa?: boolean
          periodo_acesso_dias?: number | null
          preco?: number
          publico_alvo: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          escola_id?: string
          id?: string
          interno?: boolean
          modalidade_comercial?: string
          oferta_ativa?: boolean
          periodo_acesso_dias?: number | null
          preco?: number
          publico_alvo?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      escola_modulos: {
        Row: {
          ativo: boolean
          created_at: string
          escola_id: string
          expira_em: string | null
          id: string
          liberado_em: string | null
          liberado_por: string | null
          modulo_slug: string
          nota: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          escola_id: string
          expira_em?: string | null
          id?: string
          liberado_em?: string | null
          liberado_por?: string | null
          modulo_slug: string
          nota?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          escola_id?: string
          expira_em?: string | null
          id?: string
          liberado_em?: string | null
          liberado_por?: string | null
          modulo_slug?: string
          nota?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escola_modulos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      escola_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          escola_id: string
          id: string
          perfil: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          perfil?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          perfil?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escola_usuarios_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      escolas: {
        Row: {
          asaas_env: string
          asaas_vault_secret_id: string | null
          asaas_wallet_id: string | null
          asaas_webhook_secret: string | null
          ativo: boolean
          bairro: string | null
          capacidade_padrao: number | null
          cep: string | null
          checkin_checkout_ativo: boolean
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string
          deleted_at: string | null
          desconto_antecip_pct: number
          dias_antecipacao: number
          email: string | null
          estado: string | null
          fuso_horario: string
          id: string
          janela_chamada_h: number
          juros_pct: number
          limiar_freq_pct: number
          logo_url: string | null
          logradouro: string | null
          modalidades: string[]
          multa_pct: number
          nome: string
          notif_aniversario_atleta: boolean
          notif_ausencia: boolean
          notif_cobranca_confirmacao: boolean
          notif_cobranca_lembrete_d1: boolean
          notif_cobranca_lembrete_d3: boolean
          notif_cobranca_vencida: boolean
          notif_email: boolean
          notif_frequencia_baixa: boolean
          notif_push: boolean
          notif_relatorio_mensal: boolean
          notif_sms: boolean
          notif_whatsapp: boolean
          numero: string | null
          onboarding_completo: boolean
          plano: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          asaas_env?: string
          asaas_vault_secret_id?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_secret?: string | null
          ativo?: boolean
          bairro?: string | null
          capacidade_padrao?: number | null
          cep?: string | null
          checkin_checkout_ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          deleted_at?: string | null
          desconto_antecip_pct?: number
          dias_antecipacao?: number
          email?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: string
          janela_chamada_h?: number
          juros_pct?: number
          limiar_freq_pct?: number
          logo_url?: string | null
          logradouro?: string | null
          modalidades?: string[]
          multa_pct?: number
          nome: string
          notif_aniversario_atleta?: boolean
          notif_ausencia?: boolean
          notif_cobranca_confirmacao?: boolean
          notif_cobranca_lembrete_d1?: boolean
          notif_cobranca_lembrete_d3?: boolean
          notif_cobranca_vencida?: boolean
          notif_email?: boolean
          notif_frequencia_baixa?: boolean
          notif_push?: boolean
          notif_relatorio_mensal?: boolean
          notif_sms?: boolean
          notif_whatsapp?: boolean
          numero?: string | null
          onboarding_completo?: boolean
          plano?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          asaas_env?: string
          asaas_vault_secret_id?: string | null
          asaas_wallet_id?: string | null
          asaas_webhook_secret?: string | null
          ativo?: boolean
          bairro?: string | null
          capacidade_padrao?: number | null
          cep?: string | null
          checkin_checkout_ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          deleted_at?: string | null
          desconto_antecip_pct?: number
          dias_antecipacao?: number
          email?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: string
          janela_chamada_h?: number
          juros_pct?: number
          limiar_freq_pct?: number
          logo_url?: string | null
          logradouro?: string | null
          modalidades?: string[]
          multa_pct?: number
          nome?: string
          notif_aniversario_atleta?: boolean
          notif_ausencia?: boolean
          notif_cobranca_confirmacao?: boolean
          notif_cobranca_lembrete_d1?: boolean
          notif_cobranca_lembrete_d3?: boolean
          notif_cobranca_vencida?: boolean
          notif_email?: boolean
          notif_frequencia_baixa?: boolean
          notif_push?: boolean
          notif_relatorio_mensal?: boolean
          notif_sms?: boolean
          notif_whatsapp?: boolean
          numero?: string | null
          onboarding_completo?: boolean
          plano?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fluxo_caixa_plataforma: {
        Row: {
          asaas_payment_id: string | null
          ator_email: string | null
          ator_id: string | null
          base_calculo: number | null
          categoria: string
          created_at: string
          data_lancamento: string
          deleted_at: string | null
          descricao: string
          escola_id: string | null
          escola_nome_cache: string | null
          forma_pagamento: string
          id: string
          observacao: string | null
          percentual: number | null
          recorrencia: string
          recorrencia_grupo_id: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          asaas_payment_id?: string | null
          ator_email?: string | null
          ator_id?: string | null
          base_calculo?: number | null
          categoria: string
          created_at?: string
          data_lancamento?: string
          deleted_at?: string | null
          descricao: string
          escola_id?: string | null
          escola_nome_cache?: string | null
          forma_pagamento?: string
          id?: string
          observacao?: string | null
          percentual?: number | null
          recorrencia?: string
          recorrencia_grupo_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          asaas_payment_id?: string | null
          ator_email?: string | null
          ator_id?: string | null
          base_calculo?: number | null
          categoria?: string
          created_at?: string
          data_lancamento?: string
          deleted_at?: string | null
          descricao?: string
          escola_id?: string | null
          escola_nome_cache?: string | null
          forma_pagamento?: string
          id?: string
          observacao?: string | null
          percentual?: number | null
          recorrencia?: string
          recorrencia_grupo_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_plataforma_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          atleta_id: string
          created_at: string
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          deleted_at: string | null
          desconto_motivo: string | null
          desconto_pct: number
          dia_vencimento: number
          escola_id: string
          forma_pagamento: string
          gerar_auto: boolean
          id: string
          motivo_status: string | null
          obs: string | null
          parcelas_geradas: number
          plano_id: string | null
          status: string
          tipo_periodo: string
          total_parcelas: number | null
          turma_id: string | null
          updated_at: string
          valor: number
          valor_liquido: number
        }
        Insert: {
          atleta_id: string
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          deleted_at?: string | null
          desconto_motivo?: string | null
          desconto_pct?: number
          dia_vencimento: number
          escola_id: string
          forma_pagamento?: string
          gerar_auto?: boolean
          id?: string
          motivo_status?: string | null
          obs?: string | null
          parcelas_geradas?: number
          plano_id?: string | null
          status?: string
          tipo_periodo?: string
          total_parcelas?: number | null
          turma_id?: string | null
          updated_at?: string
          valor: number
          valor_liquido: number
        }
        Update: {
          atleta_id?: string
          created_at?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          deleted_at?: string | null
          desconto_motivo?: string | null
          desconto_pct?: number
          dia_vencimento?: number
          escola_id?: string
          forma_pagamento?: string
          gerar_auto?: boolean
          id?: string
          motivo_status?: string | null
          obs?: string | null
          parcelas_geradas?: number
          plano_id?: string | null
          status?: string
          tipo_periodo?: string
          total_parcelas?: number | null
          turma_id?: string | null
          updated_at?: string
          valor?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "escola_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_entregas: {
        Row: {
          canal: string
          created_at: string
          destinatario_contato: string | null
          destinatario_id: string | null
          erro: string | null
          escola_id: string
          id: string
          outbox_id: string
          provider_message_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          canal: string
          created_at?: string
          destinatario_contato?: string | null
          destinatario_id?: string | null
          erro?: string | null
          escola_id: string
          id?: string
          outbox_id: string
          provider_message_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          canal?: string
          created_at?: string
          destinatario_contato?: string | null
          destinatario_id?: string | null
          erro?: string | null
          escola_id?: string
          id?: string
          outbox_id?: string
          provider_message_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_entregas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_entregas_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "notificacoes_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_outbox: {
        Row: {
          created_at: string
          erro: string | null
          escola_id: string
          evento_tipo: string
          id: string
          idempotency_key: string | null
          next_retry_at: string | null
          payload: Json
          ref_id: string | null
          ref_tipo: string | null
          status: string
          tentativas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          escola_id: string
          evento_tipo: string
          id?: string
          idempotency_key?: string | null
          next_retry_at?: string | null
          payload?: Json
          ref_id?: string | null
          ref_tipo?: string | null
          status?: string
          tentativas?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          escola_id?: string
          evento_tipo?: string
          id?: string
          idempotency_key?: string | null
          next_retry_at?: string | null
          payload?: Json
          ref_id?: string | null
          ref_tipo?: string | null
          status?: string
          tentativas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_outbox_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_modulo_acesso: {
        Row: {
          ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          id: string
          modulo_slug: string
          perfil: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          modulo_slug: string
          perfil: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          modulo_slug?: string
          perfil?: string
        }
        Relationships: []
      }
      planos_pagamento: {
        Row: {
          cor: string
          created_at: string
          deleted_at: string | null
          desconto_pct: number
          dia_vencimento: number
          escola_id: string
          frequencia: string
          id: string
          metodo_pagamento: string
          nome: string
          updated_at: string
          valor: number
          valor_liquido: number
        }
        Insert: {
          cor?: string
          created_at?: string
          deleted_at?: string | null
          desconto_pct?: number
          dia_vencimento: number
          escola_id: string
          frequencia: string
          id?: string
          metodo_pagamento: string
          nome: string
          updated_at?: string
          valor: number
          valor_liquido: number
        }
        Update: {
          cor?: string
          created_at?: string
          deleted_at?: string | null
          desconto_pct?: number
          dia_vencimento?: number
          escola_id?: string
          frequencia?: string
          id?: string
          metodo_pagamento?: string
          nome?: string
          updated_at?: string
          valor?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "planos_pagamento_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      plataforma_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          perfil: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          perfil: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          perfil?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presencas_registros: {
        Row: {
          aula_id: string
          created_at: string
          id: string
          matricula_id: string
          observacao: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aula_id: string
          created_at?: string
          id?: string
          matricula_id: string
          observacao?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          aula_id?: string
          created_at?: string
          id?: string
          matricula_id?: string
          observacao?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_registros_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_registros_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responsavel_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          responsavel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          responsavel_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          responsavel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsavel_usuarios_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: true
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativo: boolean
          capacidade_max: number
          created_at: string
          deleted_at: string | null
          dia_semana: number | null
          escola_id: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          idade_max: number | null
          idade_min: number | null
          local: string | null
          modalidade: string
          nome: string
          professor_nome: string | null
          professor_user_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidade_max?: number
          created_at?: string
          deleted_at?: string | null
          dia_semana?: number | null
          escola_id: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          idade_max?: number | null
          idade_min?: number | null
          local?: string | null
          modalidade: string
          nome: string
          professor_nome?: string | null
          professor_user_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidade_max?: number
          created_at?: string
          deleted_at?: string | null
          dia_semana?: number | null
          escola_id?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          idade_max?: number | null
          idade_min?: number | null
          local?: string | null
          modalidade?: string
          nome?: string
          professor_nome?: string | null
          professor_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_escola_tipos: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          escola_id: string
          id: string
          origem: string | null
          principal: boolean
          ref_id: string | null
          tipo_usuario: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          escola_id: string
          id?: string
          origem?: string | null
          principal?: boolean
          ref_id?: string | null
          tipo_usuario: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          escola_id?: string
          id?: string
          origem?: string | null
          principal?: boolean
          ref_id?: string | null
          tipo_usuario?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_escola_tipos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_escola_tipos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          auth_user_id: string
          cpf: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id: string
          cpf: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string
          cpf?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      modulos_ativos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          escola_id: string | null
          expira_em: string | null
          id: string | null
          liberado_em: string | null
          liberado_por: string | null
          modulo_slug: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          escola_id?: string | null
          expira_em?: string | null
          id?: string | null
          liberado_em?: string | null
          liberado_por?: string | null
          modulo_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          escola_id?: string | null
          expira_em?: string | null
          id?: string | null
          liberado_em?: string | null
          liberado_por?: string | null
          modulo_slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escola_modulos_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aulas_hoje_status: {
        Args: { p_escola_id: string; p_perfil: string; p_user_id: string }
        Returns: {
          chamada_feita: boolean
          matriculas_ativas: number
          registros_presenca: number
          turma_id: string
          turma_nome: string
        }[]
      }
      buscar_atleta_por_cpf: {
        Args: { p_cpf: string; p_escola_id: string }
        Returns: {
          atleta_id: string
          data_nascimento: string
          foto_url: string
          nome: string
          sexo: string
          status: string
        }[]
      }
      chamada_pode_editar: {
        Args: { p_data: string; p_escola_id: string }
        Returns: boolean
      }
      criar_escola_completo: {
        Args: {
          p_cnpj: string
          p_email: string
          p_modalidades: string[]
          p_modulos: string[]
          p_nome: string
          p_plano: string
          p_telefone: string
        }
        Returns: string
      }
      dashboard_kpis_escola: {
        Args: { p_escola_id: string }
        Returns: {
          atletas_ativos: number
          aulas_com_chamada: number
          aulas_hoje: number
          turmas_ativas: number
        }[]
      }
      frequencia_resumo_matriculas: {
        Args: { p_escola_id: string; p_matricula_ids: string[] }
        Returns: {
          matricula_id: string
          presentes: number
          total: number
        }[]
      }
      historico_presencas_matricula: {
        Args: { p_escola_id: string; p_matricula_id: string }
        Returns: {
          data_aula: string
          status: string
          turma_nome: string
        }[]
      }
      is_module_active: {
        Args: { p_escola_id: string; p_modulo_slug: string }
        Returns: boolean
      }
      listar_membros_escola: {
        Args: { p_escola_id: string }
        Returns: {
          email: string
          perfil: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// â”€â”€â”€ Custom type aliases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type Escola                         = Tables<'escolas'>
export type EscolaUsuario                  = Tables<'escola_usuarios'>
export type EscolaModulo                   = Tables<'escola_modulos'>
export type PlanoPagamento                 = Tables<'planos_pagamento'>
export type Matricula                      = Tables<'matriculas'>
export type Cobranca                       = Tables<'cobrancas'>
export type PlataformaUsuario              = Tables<'plataforma_usuarios'>
export type AssinaturaPlataforma           = Tables<'assinaturas_plataforma'>
export type PlataformaConfiguracao         = Tables<'plataforma_configuracoes'>
export type Curso                          = Tables<'cursos'>
export type CursoModulo                    = Tables<'curso_modulos'>
export type CursoAula                      = Tables<'curso_aulas'>
export type CursoQuiz                      = Tables<'curso_quizzes'>
export type CursoQuizPergunta              = Tables<'curso_quiz_perguntas'>
export type CursoQuizAlternativa           = Tables<'curso_quiz_alternativas'>
export type CursoQuizTentativa             = Tables<'curso_quiz_tentativas'>
export type NotificacaoOutbox              = Tables<'notificacoes_outbox'>
export type NotificacaoEntrega             = Tables<'notificacoes_entregas'>
export type Turma                          = Tables<'turmas'>
export type Atleta                         = Tables<'atletas'>
export type Responsavel                    = Tables<'responsaveis'>
export type ResponsavelUsuario             = Tables<'responsavel_usuarios'>
export type AtletaResponsavel              = Tables<'atleta_responsaveis'>
export type AtletaCarteirinha              = Tables<'atleta_carteirinhas'>
export type AtletaAcesso                   = Tables<'atleta_acessos'>
export type AtletaExame                    = Tables<'atleta_exames'>
export type AtletaAtestado                 = Tables<'atleta_atestados'>
export type Aula                           = Tables<'aulas'>
export type PresencaRegistro               = Tables<'presencas_registros'>
export type FluxoCaixaPlataforma           = Tables<'fluxo_caixa_plataforma'>

export type EscolaUsuarioWithEscola        = EscolaUsuario & { escola: Escola | null }
export type AtletaResponsavelWithResponsavel = AtletaResponsavel & { responsavel: Responsavel }
export type UsuarioGlobal                  = Tables<'usuarios'>
export type UsuarioEscolaTipo              = Tables<'usuario_escola_tipos'>

// â”€â”€â”€ Scalar type aliases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type PlanoTipo                 = 'starter' | 'pro' | 'premium' | 'enterprise'
export type FrequenciaTipo            = 'mensal' | 'trimestral' | 'semestral' | 'anual'
export type MetodoPagamento           = 'pix' | 'boleto' | 'cartao_credito'
export type SexoTipo                  = 'M' | 'F' | 'outro'
export type PerfilUsuario             = 'admin_escola' | 'professor' | 'secretaria' | 'financeiro' | 'visualizador' | 'coordenador' | 'saude' | 'marketing' | 'responsavel'
export type PerfilPlataforma          = 'super_admin' | 'suporte' | 'financeiro_interno'
export type ModuloSlug                = string
export type StatusPresenca            = 'presente' | 'ausente' | 'justificado' | 'justificada'
export type StatusCobranca            = 'pendente' | 'pago' | 'vencido' | 'cancelado'
export type StatusAssinaturaPlataforma = 'adimplente' | 'inadimplente' | 'atraso' | 'suspenso' | 'cancelado'
export type StatusMatricula           = 'ativa' | 'inativa' | 'cancelada' | 'suspensa' | 'trancada' | 'encerrada'
export type PublicoAlvoCurso          = 'alunos' | 'professores' | 'responsaveis' | 'publico'
export type StatusCurso               = 'rascunho' | 'publicado' | 'arquivado'
export type ModalidadeComercialCurso  = 'gratuito' | 'pago' | 'assinatura'
export type TipoCursoQuiz             = 'multipla_escolha' | 'verdadeiro_falso'
export type TipoAcessoAtleta          = 'entrada' | 'saida'
export type TipoExameAtleta           = 'admissional' | 'periodico' | 'demissional' | 'retorno' | 'mudanca_funcao'
export type StatusNotificacaoOutbox   = 'pendente' | 'processando' | 'enviado' | 'erro' | 'cancelado'
export type CanalNotificacao          = 'whatsapp' | 'email' | 'sms' | 'push'
export type StatusEntregaNotificacao  = 'pendente' | 'entregue' | 'falhou' | 'lido'



