# PRD — Esportes Academy
## Product Requirements Document

> **Documento vivo.** Mantido pelo Product Owner.
> Todo o squad deve consultar este arquivo antes de iniciar qualquer tarefa.
> Versão atual sempre reflete o escopo aprovado e em desenvolvimento.

---

## Metadados

| Campo | Valor |
|---|---|
| Produto | Esportes Academy |
| Tipo | SaaS B2B Modular |
| Versão do Documento | 0.8 |
| Status | Em construção — MVP |
| Última atualização | 2026-03-24 |
| Product Owner | — |

---

## Índice

1. [Visão do Produto](#1-visão-do-produto)
2. [Público-Alvo](#2-público-alvo)
3. [Perfis de Usuário e Permissões](#3-perfis-de-usuário-e-permissões)
4. [Planos e Controle de Módulos](#4-planos-e-controle-de-módulos)
5. [Stack Técnico](#5-stack-técnico)
6. [Arquitetura de Ambientes](#6-arquitetura-de-ambientes)
7. [Módulos da Plataforma](#7-módulos-da-plataforma)
   - 7.01 Administrativo *(core)*
   - 7.02 Financeiro
   - 7.03 Saúde
   - 7.04 Comunicação
   - 7.05 Eventos
   - 7.06 Competições
   - 7.07 Treinamentos
   - 7.08 Metodologia de Treinamento
   - 7.09 Cursos
   - 7.10 Relatórios & BI
8. [Integrações Externas](#8-integrações-externas)
9. [Regras de Negócio Globais](#9-regras-de-negócio-globais)
10. [Requisitos Não-Funcionais](#10-requisitos-não-funcionais)
11. [Roadmap](#11-roadmap)
12. [Fora do Escopo](#12-fora-do-escopo)
13. [Glossário](#13-glossário)
14. [Histórico de Alterações](#14-histórico-de-alterações)
15. [Paleta de Cores](#15-paleta-de-cores)

---

## 1. Visão do Produto

### O Problema
Escolas esportivas (futebol, natação, tênis, artes marciais etc.) gerenciam hoje seus atletas, turmas, presenças e cobranças via planilhas, WhatsApp e cadernos. Isso gera:
- Inadimplência não controlada
- Pais sem visibilidade da evolução dos filhos
- Professores perdendo tempo com chamadas manuais
- Gestores sem dados para tomar decisões
- Metodologia de treino não documentada e não replicável

### A Solução
A **Esportes Academy** é uma plataforma SaaS B2B **modular** que digitaliza e automatiza a gestão completa de escolas esportivas. Cada escola contrata o plano adequado ao seu porte e desbloqueia módulos conforme cresce — sem pagar por funcionalidades que não usa.

Além da operação da escola, a plataforma preserva a **jornada esportiva completa do atleta** ao longo do tempo. O atleta possui um histórico global e contínuo na Esportes Academy, independente da escola em que está matriculado hoje ou já esteve no passado. Esse histórico pode consolidar, conforme módulos ativos e permissões:
- Competições disputadas
- Exames e documentos de saúde realizados
- Treinos, planos de aula e evolução esportiva
- Presenças, frequência e participação operacional

**Superfícies da plataforma:**
- **Portal Escola** — painel web completo para gestão operacional e administrativa
- **App Esportes Academy** — app único (mobile e web) para responsáveis, professores e demais tipos de usuário elegíveis
- **Portal SuperAdmin** — painel interno Esportes Academy para gestão da plataforma e dos tenants
- **Arquitetura de portais independentes** — `Gestão`, `Cursos` e `Competições` devem ser tratados como sistemas separados no produto e no backlog; o único portal em comum entre eles é o `SuperAdmin`

### Proposta de Valor
> *"Tudo que a sua escola esportiva precisa em um só lugar — e só o que você precisa pagar."*

### Diferenciais da Arquitetura Modular
- Escola começa com o básico (Administrativo + Financeiro) e expande com o tempo
- Módulos avançados (Saúde, Competições, Cursos) desbloqueados por plano ou liberação manual do SuperAdmin
- Preço escalonável: escolas pequenas pagam menos, escolas grandes têm tudo
- Sem funcionalidade "escondida" — a UI mostra os módulos bloqueados com call-to-action de upgrade
- A arquitetura é preparada para evoluir de gestão de escola para gestão de **clube**, mantendo a mesma base modular
- Novos domínios podem ser adicionados sem criar outro produto, como Recursos Humanos, Logística e Competições em nível de clube

---

## 2. Público-Alvo

### Clientes (pagantes do SaaS)
Escolas esportivas de pequeno e médio porte:
- 30 a 500 atletas matriculados
- 1 a 20 turmas ativas
- 1 a 15 funcionários/professores
- Modalidades: futebol, natação, tênis, vôlei, basquete, artes marciais, ginástica etc.

### Usuários Finais
- **Gestores/Donos** — Portal Escola (web)
- **Coordenadores Pedagógicos** — Portal Escola (web)
- **Professores** — Portal Escola (web, visão restrita) + App Esportes Academy
- **Equipe Administrativa** — Portal Escola (web, perfis: secretaria, financeiro, saúde, marketing)
- **Pais/Responsáveis** — App Esportes Academy

> **Padronização terminológica desta revisão:** sempre que este PRD mencionar historicamente `App Pais` ou `App Professor`, leia como uma **jornada específica dentro do app único Esportes Academy**.

> **Importante:** Um mesmo usuário pode ter perfis diferentes em escolas diferentes.
> Ex.: João é `professor` na Arena Futebol Kids e `financeiro` na Academia Vôlei Pro.

---

## 3. Perfis de Usuário e Permissões

### 3.1 Modelo Multi-Escola e Multi-Perfil

**Princípio central:** Um usuário tem uma identidade global única, identificada por **CPF obrigatório e único**. O acesso efetivo é sempre relativo à escola e ao tipo de usuário ativos no momento.

**Regras do modelo:**
- Um usuário pode estar vinculado a **N escolas** simultaneamente
- Em cada escola, o usuário pode ter **um ou mais tipos de usuário**, com um tipo principal para a experiência inicial
- O mesmo usuário pode ter **tipos diferentes em escolas diferentes**
- Após o login, se o usuário pertencer a mais de uma escola ou tiver mais de um tipo elegível, o sistema exibe um **seletor de contexto**
- O contexto ativo (`escola + tipo_usuario`) é armazenado na sessão e usado para queries, navegação e permissões

**Tabela central do tenant:** `escolas`
```sql
escolas (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidade visual
  nome_fantasia       text          NOT NULL,
  razao_social        text          NOT NULL,
  logo_url            text,         -- URL do arquivo no Supabase Storage
  slogan              text,

  -- Dados jurídicos
  cnpj                text          UNIQUE NOT NULL,
  inscricao_estadual  text,
  inscricao_municipal text,
  regime_tributario   text          DEFAULT 'simples',
  -- simples | presumido | real | mei | isento

  -- Contato
  telefone            text          NOT NULL,
  email               text          NOT NULL,
  site                text,
  instagram           text,

  -- Endereço
  cep                 text,
  logradouro          text,
  numero              text,
  complemento         text,
  bairro              text,
  cidade              text,
  estado              text,         -- sigla UF (SP, RJ, MG, ...)

  -- Integração Asaas (financeiro)
  asaas_env           text          NOT NULL DEFAULT 'sandbox',  -- sandbox | producao
  asaas_access_token  text,         -- $aact_... (criptografado em repouso via Vault)
  asaas_wallet_id     text,         -- para split multi-unidades
  asaas_webhook_secret text,        -- validação de autenticidade do webhook

  -- Preferências de cobrança
  dias_antecipacao    smallint      NOT NULL DEFAULT 3,   -- dias antes do vencimento para emitir cobrança
  multa_pct           numeric(5,2)  NOT NULL DEFAULT 2,   -- % multa atraso
  juros_pct           numeric(5,2)  NOT NULL DEFAULT 1,   -- % juros mensais atraso
  desconto_antecip_pct numeric(5,2) NOT NULL DEFAULT 0,   -- % desconto pagamento antecipado

  -- Configurações operacionais
  modalidades         text[],                             -- ex: {Futebol, Natação, Jiu-Jitsu}
  timezone            text          NOT NULL DEFAULT 'America/Sao_Paulo',
  idioma              text          NOT NULL DEFAULT 'pt-BR',
  moeda               text          NOT NULL DEFAULT 'BRL',
  cap_turma_default   smallint      NOT NULL DEFAULT 20,  -- capacidade padrão por turma
  limiar_freq_pct     smallint      NOT NULL DEFAULT 75,  -- % mínimo de frequência antes do alerta
  janela_chamada_h    smallint      NOT NULL DEFAULT 48,  -- horas para lançar chamada retroativa
  periodo_default     text          NOT NULL DEFAULT 'mensal',

  -- Privacidade
  cpf_mascara_staff   boolean       NOT NULL DEFAULT true,   -- mascarar CPF para não-admin
  hist_cross_escola   boolean       NOT NULL DEFAULT true,   -- staff vê lista de escolas anteriores

  -- Notificações ativas
  notif_whatsapp      boolean       NOT NULL DEFAULT true,
  notif_email         boolean       NOT NULL DEFAULT true,
  notif_push          boolean       NOT NULL DEFAULT true,
  notif_sms           boolean       NOT NULL DEFAULT false,
  notif_lembrete_dias smallint      NOT NULL DEFAULT 3,    -- dias antes para lembrete de vencimento
  notif_vencido       boolean       NOT NULL DEFAULT true,
  notif_reenvio_auto  boolean       NOT NULL DEFAULT true,
  notif_confirmacao   boolean       NOT NULL DEFAULT true,
  notif_freq_baixa    boolean       NOT NULL DEFAULT true,
  notif_rel_mensal    boolean       NOT NULL DEFAULT true,

  -- Plano SaaS
  plano               text          NOT NULL DEFAULT 'starter', -- starter | pro | enterprise | custom
  plano_ativo_ate     date,
  trial_ate           date,

  -- Auditoria
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz,
  deleted_at          timestamptz   -- soft delete
)
```

> ⚠️ **Segurança:** `asaas_access_token` deve ser armazenado criptografado via **Supabase Vault** (ou variável de ambiente da Edge Function). Nunca expor no client-side. A API do Asaas só é chamada pelas Edge Functions server-side.

**Tabela de vínculo:** `escola_usuarios`
```sql
escola_usuarios (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid          NOT NULL REFERENCES auth.users(id),
  escola_id      uuid          NOT NULL REFERENCES escolas(id),
  perfil         text          NOT NULL,  -- ver lista de perfis abaixo
  ativo          boolean       NOT NULL DEFAULT true,
  convidado_por  uuid          REFERENCES auth.users(id),
  convidado_em   timestamptz   DEFAULT now(),
  aceito_em      timestamptz,             -- null = convite pendente
  deleted_at     timestamptz,             -- soft delete

  UNIQUE (user_id, escola_id)             -- um perfil por (usuário + escola)
)
```

> **RLS:** Todas as policies do Supabase devem considerar o par `(auth.uid(), escola_id_da_sessão)` para garantir isolamento tanto por tenant quanto por perfil.

---

### 3.2 Perfis do Sistema

#### `super_admin` *(plataforma)*
- Identidade global — não pertence a nenhuma escola específica
- Acesso total ao Portal SuperAdmin
- Gerencia todos os tenants, planos, módulos e usuários da plataforma
- Pode liberar/bloquear módulos em qualquer escola
- Exclusivo para a equipe interna da Esportes Academy

---

#### Tipos de usuário por escola *(escopo de uma escola e do app único)*

> Todos os tipos abaixo estão restritos aos dados da escola em que o usuário está autenticado no momento. Nenhum contexto de usuário enxerga dados de outra escola.

##### `admin_escola`
- Acesso total a todos os módulos ativos da escola
- Gerencia usuários da escola (convida, altera perfil, desativa)
- Gerencia plano e configurações de integração
- Única role que pode alterar configurações da escola

##### `coordenador`
- Foco pedagógico: treinamentos, metodologia, turmas e atletas
- Sem acesso ao módulo Financeiro
- Leitura no dashboard e relatórios (sem exportação)
- Acesso total: Treinamentos, Metodologia, Cursos, Competições, Eventos

##### `professor`
- Acesso restrito às **suas turmas** (definidas pelo admin)
- Realiza chamada de presença nas suas turmas
- Preenche plano de aula no App Esportes Academy
- Visualiza ficha de saúde apenas dos atletas de suas turmas (alertas e restrições ativas)
- Sem acesso a dados financeiros ou de outras turmas

##### `financeiro`
- Acesso exclusivo ao Módulo Financeiro
- Visualiza dashboard financeiro (receita, inadimplência)
- Emite cobranças, estorna, exporta relatórios financeiros
- Sem acesso a dados pedagógicos, de saúde ou de turmas

##### `secretaria`
- Foco administrativo: cadastro de atletas, gestão de turmas, comunicação
- Sem acesso ao Módulo Financeiro e Saúde
- Pode convidar responsáveis e enviar comunicados
- Acesso: Administrativo (full) + Comunicação + Eventos (básico)

##### `saude` *(médico / fisioterapeuta)*
- Acesso exclusivo ao Módulo Saúde
- Leitura dos dados de treinamento (para correlacionar com lesões)
- Sem acesso a financeiro, turmas completas ou comunicação em massa

##### `marketing`
- Acesso a Eventos, Comunicação Avançada e galeria de fotos
- Leitura de dados básicos de turmas (para segmentação de comunicados)
- Sem acesso a financeiro, saúde ou dados individuais de atletas

---

##### `responsavel`
- É um tipo de usuário do ecossistema Esportes Academy, não um app separado
- Acessa apenas dados dos atletas vinculados ao seu usuário no contexto ativo
- Utiliza o **App Esportes Academy** com navegação restrita a acompanhamento, financeiro, notificações e confirmações
- Funcionalidades disponíveis conforme módulos ativos da escola e regras de relacionamento com atleta

---

### 3.3 Matriz de Permissões por Módulo

> ✅ Acesso completo &nbsp;|&nbsp; 👁️ Somente leitura &nbsp;|&nbsp; ⚡ Acesso parcial (ver detalhe) &nbsp;|&nbsp; ❌ Sem acesso

| Módulo | admin_escola | coordenador | professor | financeiro | secretaria | saude | marketing |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Administrativo** | ✅ | 👁️ | ⚡ suas turmas | ❌ | ✅ | ❌ | 👁️ |
| **Financeiro** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Saúde** | ✅ | 👁️ | ⚡ alertas | ❌ | ❌ | ✅ | ❌ |
| **Comunicação Básica** | ✅ | ✅ | ⚡ envio | ❌ | ✅ | ❌ | ✅ |
| **Comunicação Avançada** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Eventos** | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ | ✅ |
| **Treinamentos** | ✅ | ✅ | ⚡ suas turmas | ❌ | ❌ | 👁️ | ❌ |
| **Metodologia** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| **Competições** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | 👁️ |
| **Cursos** | ✅ | ✅ | ⚡ aluno | ❌ | ❌ | ❌ | ❌ |
| **Relatórios & BI** | ✅ | 👁️ pedagógico | ❌ | 👁️ financeiro | ❌ | ❌ | ❌ |
| **Configurações da Escola** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Gestão de Usuários** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Detalhes do acesso ⚡ parcial:**
- `professor` → Administrativo: vê apenas suas turmas e atletas dessas turmas
- `professor` → Saúde: vê apenas alertas e restrições ativas dos seus atletas (sem histórico clínico)
- `professor` → Comunicação Básica: pode enviar mensagem para pais de suas turmas
- `professor` → Treinamentos: cria/edita planos apenas de suas turmas
- `professor` → Cursos: acessa como aluno (não cria cursos)
- `financeiro` → Relatórios: apenas dashboards e exports financeiros
- `coordenador` → Relatórios: apenas relatórios pedagógicos (frequência, evolução)

**Nota sobre `responsavel` no app único:**
- `responsavel` não usa a matriz interna do Portal Escola; usa a mesma identidade global do produto, porém com navegação e dados limitados aos atletas vinculados no contexto ativo
- No MVP do app único, `responsavel` acessa presenças, financeiro, notificações e confirmações operacionais

---

### 3.4 Fluxo de Login Multi-Escola

```
1. Usuário faz login (email + senha / Google / Apple)
2. Sistema busca em escola_usuarios onde user_id = atual e ativo = true
   ├── Se 0 escolas → tela de erro "Você não tem acesso a nenhuma escola"
   ├── Se 1 escola  → entra diretamente no portal com o perfil dessa escola
   └── Se N escolas → exibe SELETOR DE ESCOLA com nome, logo e perfil em cada uma
3. Usuário seleciona a escola
4. Sessão é iniciada com contexto (escola_id, perfil)
5. Sidebar e módulos são filtrados por (perfil × módulos ativos da escola)
6. Usuário pode trocar de escola via botão "Trocar escola" no sidebar (sem fazer logout)
```

---

### 3.5 Convite de Usuário para a Escola

O `admin_escola` gerencia quem tem acesso ao Portal Escola:

1. Admin acessa **Configurações → Usuários**
2. Clica em **Convidar usuário** → informa e-mail e seleciona perfil
3. Sistema cria registro em `escola_usuarios` com `aceito_em = null` e envia e-mail com link de convite
4. Usuário clica no link → cria conta (se não existir) → vinculado automaticamente com o perfil definido
5. Admin pode alterar o perfil ou desativar o acesso a qualquer momento (soft delete)

---

## 4. Planos e Controle de Módulos

### 4.1 Planos Disponíveis

| Plano | Atletas | Turmas | Usuários | Módulos Incluídos |
|---|---|---|---|---|
| **Starter** | até 50 | até 5 | até 3 | Administrativo + Financeiro (básico) + Comunicação (push) |
| **Pro** | até 200 | até 20 | até 10 | Starter + Saúde + Eventos + Treinamentos + Comunicação (completo) + Relatórios |
| **Enterprise** | ilimitado | ilimitado | ilimitado | Pro + Competições + Metodologia + Cursos + BI avançado |
| **Custom** | configurável | configurável | configurável | Módulos liberados individualmente pelo SuperAdmin |

### 4.2 Lógica de Controle de Acesso aos Módulos

**Regra de ouro:** Um módulo só aparece funcional no Portal Escola se estiver ativo no plano da escola **ou** manualmente liberado pelo super_admin.

**Comportamento na UI para módulo bloqueado:**
- Item de menu aparece com ícone de cadeado 🔒
- Ao clicar, exibe modal de upgrade com descrição do módulo e CTA para upgrade de plano
- Super_admin pode liberar qualquer módulo para qualquer escola sem alterar o plano (ex: trial, parceria, exceção comercial)

**Tabela no banco:** `escola_modulos`
```sql
escola_id       uuid  (FK → escolas)
modulo_slug     text  (ex: 'saude', 'competicoes', 'cursos')
ativo           boolean
liberado_por    uuid  (null = pelo plano; uuid = super_admin que liberou)
liberado_em     timestamptz
expira_em       timestamptz (null = permanente)
```

**Feature flags por módulo** são verificados em:
1. Middleware Next.js (rota web) — verifica **módulo ativo na escola** E **permissão do perfil do usuário**; redireciona se inativo
2. Supabase RLS — bloqueia acesso a dados mesmo que rota seja acessada; verifica `(auth.uid(), escola_id_sessão, perfil)`
3. UI — esconde ou bloqueia visualmente o item de menu com base no perfil + módulo

**Dupla verificação em toda rota:**
```
Middleware → Módulo ativo? (escola_modulos)  →  NÃO → tela de upgrade
                  ↓ SIM
           Perfil tem acesso? (matriz §3.3)   →  NÃO → 403 sem exposição
                  ↓ SIM
           RLS confirma no banco              →  NÃO → query retorna vazio
                  ↓ SIM
           Renderiza a tela
```

### 4.3 Módulos e seus Slugs

| Módulo | Slug | Starter | Pro | Enterprise |
|---|---|:---:|:---:|:---:|
| Administrativo | `administrativo` | ✅ | ✅ | ✅ |
| Financeiro | `financeiro` | ✅ | ✅ | ✅ |
| Comunicação Básica | `comunicacao_basica` | ✅ | ✅ | ✅ |
| Saúde | `saude` | 🔒 | ✅ | ✅ |
| Eventos | `eventos` | 🔒 | ✅ | ✅ |
| Treinamentos | `treinamentos` | 🔒 | ✅ | ✅ |
| Comunicação Avançada | `comunicacao_avancada` | 🔒 | ✅ | ✅ |
| Relatórios & BI | `relatorios` | 🔒 | ✅ | ✅ |
| Competições | `competicoes` | 🔒 | 🔒 | ✅ |
| Metodologia | `metodologia` | 🔒 | 🔒 | ✅ |
| Cursos | `cursos` | 🔒 | ✅ add-on | ✅ |

> **Evolução futura da plataforma:** a arquitetura de módulos deve suportar não apenas escolas, mas também a operação de **clubes**. Módulos futuros previstos incluem `recursos_humanos`, `logistica` e expansões do domínio `competicoes`, preservando a mesma base de identidade, permissões e tenant.

---

## 5. Stack Técnico

| Camada | Tecnologia |
|---|---|
| Frontend Web | Next.js 14 (App Router), TailwindCSS, shadcn/ui, React Query |
| Mobile | React Native, Expo, EAS Build |
| Banco de Dados | Supabase (PostgreSQL, RLS, Edge Functions, Realtime, Storage) |
| Backend / API | Node.js, Supabase Edge Functions (Deno) |
| Autenticação | Supabase Auth + OAuth Google + Sign in with Apple |
| Pagamentos | Asaas |
| Notificações Push | Expo Push Notifications + FCM + APNs |
| Mensagens | WhatsApp Business API |
| Calendário | Google Calendar API |
| BI / Relatórios | Recharts (gráficos), Metabase (dashboards avançados — Enterprise) |
| Infra / Deploy Web | Vercel |
| Infra / Deploy Mobile | EAS Build + EAS Update |
| CI/CD | GitHub Actions |
| Monitoramento | Sentry |
| Gestão de Secrets | Doppler (ou GitHub Secrets) |
| Feature Flags | Tabela `escola_modulos` no Supabase + middleware Next.js |

---

## 6. Arquitetura de Ambientes

| Ambiente | Branch Git | URL | Banco Supabase | Uso |
|---|---|---|---|---|
| Desenvolvimento | `develop` | `dev.esportesacademy.com.br` | Projeto `dev` | Desenvolvimento e testes |
| Staging | `staging` | `staging.esportesacademy.com.br` | Projeto `staging` | Validação do PO |
| Produção | `main` | `app.esportesacademy.com.br` | Projeto `prod` | Usuários reais |

### Fluxo de Deploy
```
feature/* → develop → staging → main
               ↓           ↓        ↓
             CI/CD      Validação  Produção
             auto        PO        manual
```

### Migrations de Banco
- Toda alteração de schema via arquivo `.sql` versionado (Supabase CLI)
- Migrations aplicadas automaticamente pelo CI/CD em cada ambiente
- **Nunca** alterar banco em produção manualmente

---

## 7. Módulos da Plataforma

> Cada módulo é independente. O squad deve verificar a seção do módulo relevante antes de implementar qualquer feature.

---

### 7.01 Módulo — Administrativo
**Slug:** `administrativo` | **Planos:** Todos

**Objetivo:** Núcleo da plataforma. Gerencia atletas, turmas, professores, presenças e a operação diária da escola.

**Funcionalidades:**

**Onboarding da Escola**
- Formulário de cadastro (nome, CNPJ, endereço, modalidades, logo)
- Criação automática do tenant isolado no Supabase
- Wizard de configuração inicial (modalidades, mensalidades, integrações)
- Tela de boas-vindas com checklist de progresso

**Cadastro de Atletas — Perfil Global**

> **Decisão arquitetural:** O atleta tem um **perfil global** na plataforma, identificado pelo CPF. Seu histórico esportivo (turmas, presenças, avaliações, conquistas) é portável entre escolas. Ao se matricular em uma nova escola, o atleta não perde o histórico anterior.

> **Extensão da decisão arquitetural:** O perfil global do atleta deve sustentar uma **linha do tempo única da jornada esportiva**, agregando experiências entre escolas e, futuramente, clubes. Essa jornada pode incluir competições disputadas, exames realizados, treinos executados, avaliações, documentos, check-ins/check-outs e conquistas acumuladas ao longo da vida esportiva do atleta.

**Modelo de dados:**
```sql
-- Perfil global (cross-escola) — identificado pelo CPF
atletas (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf          text         UNIQUE NOT NULL,  -- identificador global
  nome         text         NOT NULL,
  data_nasc    date         NOT NULL,
  foto_url     text,
  sexo         text,        -- M | F | outro
  created_at   timestamptz  DEFAULT now(),
  deleted_at   timestamptz  -- soft delete global (apenas super_admin)
)

-- Templates reutilizáveis de plano de pagamento (por escola)
planos_pagamento (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid          NOT NULL REFERENCES escolas(id),
  nome            text          NOT NULL,
  descricao       text,
  frequencia      text          NOT NULL DEFAULT 'mensal',
  -- mensal | trimestral | semestral | anual
  valor           numeric(10,2) NOT NULL,
  desconto_pct    numeric(5,2)  NOT NULL DEFAULT 0,
  desconto_motivo text,         -- bolsa | irmao | funcionario | convenio | outro
  valor_liquido   numeric(10,2) NOT NULL,  -- calculado na app: valor * (1 - desconto_pct/100)
  dia_vencimento  smallint      NOT NULL DEFAULT 5,  -- dia do mês 1-28
  forma_pagamento text          NOT NULL DEFAULT 'qualquer',
  -- pix | boleto | cartao | qualquer
  cor             text          DEFAULT '#20C997',   -- cor de destaque do card na UI
  ativo           boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now()
)

-- Matrícula em uma escola (tenant-specific) — com contrato e plano de pagamento
matriculas (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id         uuid          NOT NULL REFERENCES atletas(id),
  escola_id         uuid          NOT NULL REFERENCES escolas(id),
  turma_id          uuid          REFERENCES turmas(id),  -- null = sem turma no momento
  plano_id          uuid          REFERENCES planos_pagamento(id),  -- template usado (opcional)

  -- Período do contrato
  data_inicio       date          NOT NULL,
  data_fim          date,         -- null = recorrente sem fim definido
  tipo_periodo      text          NOT NULL DEFAULT 'mensal',
  -- mensal | trimestral | semestral | anual | personalizado

  -- Plano de pagamento
  valor             numeric(10,2) NOT NULL,            -- valor base por cobrança
  desconto_pct      numeric(5,2)  NOT NULL DEFAULT 0,  -- % de desconto (bolsa, irmão, etc.)
  desconto_motivo   text,         -- bolsa | irmao | funcionario | convenio | outro
  valor_liquido     numeric(10,2) NOT NULL,            -- valor - desconto (calculado na app)
  dia_vencimento    smallint      NOT NULL DEFAULT 5,  -- dia do mês 1-28
  forma_pagamento   text          NOT NULL DEFAULT 'qualquer',
  -- pix | boleto | cartao | qualquer
  gerar_auto        boolean       NOT NULL DEFAULT true, -- gera cobrança automática todo mês

  -- Parcelamento (para contratos fechados — trimestral, semestral, anual)
  total_parcelas    int,          -- null = recorrente; N = número fixo de cobranças
  parcelas_geradas  int           NOT NULL DEFAULT 0,

  -- Status
  status            text          NOT NULL DEFAULT 'ativa',
  -- ativa | suspensa | cancelada | encerrada
  motivo_status     text,
  obs               text,

  -- Auditoria
  criado_por        uuid          REFERENCES escola_usuarios(id),
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  deleted_at        timestamptz,

  UNIQUE (atleta_id, escola_id)   -- atleta tem 1 matrícula ativa por escola (soft delete permite re-matrícula)
)

-- Responsável (global — tipo de usuário `responsavel`, pode ter N atletas vinculados)
responsaveis (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf          text         UNIQUE NOT NULL,
  nome         text         NOT NULL,
  email        text         UNIQUE NOT NULL,
  telefone     text,
  user_id      uuid         REFERENCES auth.users(id),
  deleted_at   timestamptz
)

-- Vínculo atleta ↔ responsável (N:N)
atleta_responsaveis (
  atleta_id        uuid    NOT NULL REFERENCES atletas(id),
  responsavel_id   uuid    NOT NULL REFERENCES responsaveis(id),
  tipo             text    NOT NULL,  -- pai | mae | avo | tio | responsavel_legal | outro
  financeiro       boolean NOT NULL DEFAULT false,  -- responsável financeiro
  PRIMARY KEY (atleta_id, responsavel_id)
)
```

**Regras do Responsável Financeiro:**
- Cada atleta deve ter **obrigatoriamente pelo menos 1 responsável com `financeiro = true`**
- O responsável financeiro é quem recebe cobranças, 2ª via e notificações financeiras
- Um responsável pode ser financeiro de múltiplos atletas (ex: pai de 3 filhos na mesma escola)
- Ao criar atleta: o sistema exige vincular ao menos 1 responsável e marcar um deles como financeiro antes de salvar

**Fluxo de Cadastro — CPF como identificador:**
1. Admin informa o CPF do atleta
2. Sistema consulta se CPF já existe em `atletas`
   - **CPF não encontrado** → formulário completo de novo atleta
   - **CPF encontrado na mesma escola** → alerta "Atleta já matriculado nesta escola"
   - **CPF encontrado em outra escola** → exibe perfil global existente com histórico anterior; admin confirma matrícula nesta escola (sem redigitar dados)
3. Admin vincula ao menos 1 responsável (existente ou novo) e marca financeiro
4. Admin preenche o **plano de matrícula**:
   - Turma (opcional)
   - Tipo de período: mensal recorrente | trimestral | semestral | anual | personalizado
   - Data início (obrigatório) e data fim (calculada automaticamente ou manual)
   - Valor base da cobrança (pré-preenchido do cadastro da turma, editável)
   - Desconto (%) e motivo, se houver
   - Dia de vencimento (padrão: dia 5 do mês)
   - Forma de pagamento preferencial
   - Toggle: gerar cobranças automaticamente
5. Sistema cria registro em `matriculas` com `escola_id` do tenant ativo e, se `gerar_auto = true`, agenda as cobranças do contrato

**Visibilidade do Histórico:**
- **Escola atual:** vê histórico completo (presenças, financeiro, saúde, treinamentos)
- **Outras escolas:** read-only — vê nome das escolas, período e status da matrícula; nunca vê dados financeiros ou de saúde de outra escola
- **Atleta/Responsável no App Esportes Academy:** vê histórico permitido de todas as escolas, incluindo presenças, conquistas, competições, exames, avaliações físicas e treinos vinculados ao atleta
- **Portabilidade:** se atleta sai de uma escola e entra em outra, o histórico da escola anterior permanece visível (read-only) no App Esportes Academy conforme as regras de visibilidade

**Linha do Tempo do Atleta no App Esportes Academy:**
- Matrículas e passagens por escolas
- Turmas e frequência histórica
- Competições disputadas e resultados
- Exames, atestados e documentos clínicos permitidos
- Treinos, planos de aula executados e evolução esportiva
- Eventos relevantes de operação, incluindo check-in e check-out quando o módulo estiver ativo

**Ficha do Atleta (por escola):**
- Nome, CPF (mascarado para não-admin), data de nascimento, foto, sexo
- Status da matrícula nesta escola: `ativo` / `inativo` / `suspenso`
- Turma(s) ativa(s) nesta escola
- Responsáveis vinculados (com destaque para o financeiro)
- Upload de documentos (RG, atestado médico) via Supabase Storage — por escola
- Informações de saúde (via Módulo Saúde — Pro+)
- Carteirinha digital com QR Code único do atleta, com opção de impressão física pela escola

**Busca e Filtros:**
- Busca por nome, CPF, nome do responsável
- Filtros: status, turma, modalidade, faixa etária, flag inadimplente, atletas sem turma

**Gestão de Turmas**
- Cadastro: nome, modalidade, professor, horários, capacidade, local, faixa etária, valor
- Matrícula e desmatrícula de atletas
- Grade de aulas gerada automaticamente
- Cancelamento e reagendamento de aulas avulsas
- Integração com Google Calendar (via módulo de Comunicação Avançada)

**Controle de Presenças**
- Chamada digital por turma e data (presente / ausente / falta_justificada)
- Disponível para professor no App Esportes Academy
- Janela de registro: aula atual e até 48h anteriores
- Histórico e percentual de frequência por atleta
- Alertas para frequência abaixo do threshold configurável (padrão: 75%)

**Carteirinha do Atleta e Controle de Acesso**
- Cada atleta possui uma **carteirinha digital** no App Esportes Academy
- A escola pode optar por **impressão física** da carteirinha
- A carteirinha possui um **QR Code único** do atleta
- O QR Code pode ser lido pelo App Esportes Academy no **check-in** e no **check-out**
- O objetivo é registrar os momentos de **entrada e saída do atleta na escola**
- O uso deste recurso é **opcional por escola**
- O histórico de check-in/check-out fica visível para a operação da escola e para os responsáveis no app

**Check-in / Check-out do Atleta**
- Registro de entrada (`check_in`) e saída (`check_out`) por leitura de QR Code
- Leitura realizada pelo App Esportes Academy em modo operacional
- Cada evento registra atleta, escola, data/hora, tipo do evento, operador e origem da leitura
- A escola consegue saber quais atletas estão **presentes agora** na unidade
- Regras para evitar duplicidade de check-in sem check-out intermediário
- Painel/tela específica no app do responsável para consultar histórico e status recente de entrada e saída
- Notificações automáticas para responsáveis a cada check-in e check-out, quando o recurso estiver ativo

**Dashboard Administrativo**
- KPIs: atletas ativos, turmas ativas, receita do mês, inadimplência, presenças do dia
- Lista de aniversariantes do mês, ordenada pelo dia, para apoio operacional da escola
- Gráfico de receita mensal (12 meses)
- Top 5 turmas por lotação
- Alertas operacionais prioritários
- Chamadas do dia com status

**Critérios de Aceite:**
- [ ] Escola cadastrada em menos de 5 minutos
- [ ] Dados completamente isolados de outros tenants via RLS
- [ ] Chamada só registrada para aulas nas últimas 48h
- [ ] Professor só acessa turmas pelas quais é responsável
- [ ] Soft delete em todos os registros (campo `deleted_at`)
- [ ] CPF é único em `atletas` — sistema detecta duplicatas e exibe perfil existente
- [ ] Impossível salvar atleta sem ao menos 1 responsável com `financeiro = true`
- [ ] Histórico de outras escolas visível no App Esportes Academy conforme regra de contexto, mas nunca os dados financeiros/saúde de outra escola
- [ ] RLS impede escola A de ler dados de matrícula da escola B, mesmo com o mesmo `atleta_id`
- [ ] Carteirinha do atleta disponível em formato digital e apta para impressão pela escola
- [ ] QR Code do atleta permite registrar check-in e check-out com trilha de data/hora
- [ ] Escola consegue identificar atletas atualmente dentro da unidade quando o recurso estiver habilitado
- [ ] Responsáveis recebem notificação de check-in e check-out quando a escola habilitar o módulo

---

### 7.02 Módulo — Financeiro
**Slug:** `financeiro` | **Planos:** Todos

**Objetivo:** Automatizar cobranças, controlar inadimplência e dar visibilidade financeira ao gestor.

**Funcionalidades:**

**Cobranças**
- Toda cobrança está **vinculada a uma matrícula** (`matricula_id`) — exceto cobranças avulsas (uniforme, evento)
- Geração automática a partir do plano definido na matrícula: no `dia_vencimento` configurado, usando `valor_liquido` e `forma_pagamento` da matrícula
- Cobranças de contratos fechados (trimestral, semestral, anual) são todas geradas de uma vez no ato da matrícula com status `pendente` e vencimentos calculados
- Contratos mensais recorrentes geram 1 cobrança por vez (Edge Function agendada, no mês anterior)
- Meios: boleto bancário, PIX e cartão de crédito via Asaas
- 2ª via disponível no App Esportes Academy
- Cobrança avulsa manual (uniforme, evento, material) — sem `matricula_id`
- Desconto e acréscimo configuráveis individualmente por cobrança (sobrescreve o da matrícula)

**Modelo de dados — Cobranças:**
```sql
cobrancas (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid          NOT NULL REFERENCES escolas(id),
  matricula_id    uuid          REFERENCES matriculas(id),  -- null apenas em avulsas
  atleta_id       uuid          NOT NULL REFERENCES atletas(id),
  tipo            text          NOT NULL,
  -- mensalidade | parcela | taxa_matricula | avulsa | uniforme | evento | material
  descricao       text          NOT NULL,
  valor           numeric(10,2) NOT NULL,
  desconto        numeric(10,2) NOT NULL DEFAULT 0,
  acrescimo       numeric(10,2) NOT NULL DEFAULT 0,
  valor_final     numeric(10,2) NOT NULL,  -- valor - desconto + acrescimo
  vencimento      date          NOT NULL,
  status          text          NOT NULL DEFAULT 'pendente',
  -- pendente | paga | vencida | cancelada | estornada
  forma_pagamento text,
  pago_em         date,
  ref_asaas       text,         -- ID da cobrança no Asaas
  obs             text,
  created_at      timestamptz   NOT NULL DEFAULT now()
)
```

**Status de Cobrança**
- `pendente` — gerada, aguardando pagamento
- `paga` — confirmada via webhook Asaas
- `vencida` — passou da data sem pagamento
- `cancelada` — cancelada pelo admin

**Inadimplência**
- Flag `inadimplente` após 30 dias corridos de cobrança vencida
- Bloqueio do App Esportes Academy no contexto `responsavel` enquanto inadimplente (configurável por escola)
- Notificações automáticas: D-3, D-1 e D+1 do vencimento

**Relatórios Financeiros (básico — Starter)**
- Receita mensal (prevista x realizada)
- Lista de inadimplentes com exportação CSV
- Histórico de pagamentos por atleta

**Relatórios Financeiros (avançado — Pro+, via módulo Relatórios)**
- Projeção de receita
- Análise de churn financeiro
- Exportação PDF

**Critérios de Aceite:**
- [ ] Cobrança gerada automaticamente no dia 1 via Edge Function agendada
- [ ] Webhook Asaas atualiza status em tempo real
- [ ] Notificações nos dias D-3, D-1 e D+1 via WhatsApp e push
- [ ] Admin pode cancelar ou estornar cobrança manualmente
- [ ] Exportação CSV funcional

---

### 7.03 Módulo — Saúde
**Slug:** `saude` | **Planos:** Pro, Enterprise

**Objetivo:** Centralizar informações de saúde dos atletas, aumentar a segurança dos treinos e facilitar atendimento médico.

**Funcionalidades:**

**Ficha Médica do Atleta**
- Alergias e medicamentos em uso
- Limitações físicas e restrições de atividade
- Plano de saúde e contato de emergência médica
- Tipo sanguíneo
- Condições preexistentes (campo livre e estruturado)

**Histórico de Lesões**
- Registro de lesão: data, tipo, parte do corpo, gravidade, descrição
- Período de afastamento e retorno ao treino
- Observações do médico/fisioterapeuta
- Vinculação com presença (atleta marcado como `ausente_lesão`)

**Documentos de Saúde**
- Upload de atestado médico de aptidão para esporte
- Validade do atestado com alerta de vencimento
- Histórico de documentos por atleta
- Registro de exames clínicos, esportivos e laboratoriais relacionados ao atleta
- Linha do tempo de exames por atleta, preservada entre escolas conforme política de visibilidade

**Avaliações Físicas Periódicas** *(via integração com módulo Treinamentos)*
- Biometria: peso, altura, IMC, percentual de gordura
- Testes físicos por modalidade (configuráveis)
- Evolução em gráfico ao longo do tempo
- Comparativo com turma e faixa etária

**Alertas de Saúde**
- Atleta com atestado vencido: alerta no dashboard e bloqueio de chamada
- Atleta em recuperação de lesão: aviso visual na chamada
- Atleta com restrição ativa: badge vermelho na ficha

**Permissões de Acesso**
- `admin_escola`: acesso total à ficha de saúde
- `professor`: visualiza apenas alertas e restrições ativas (não o histórico completo)
- `pai`: não acessa ficha de saúde via portal (somente pode informar dados no onboarding)

**Critérios de Aceite:**
- [ ] Ficha de saúde acessível apenas por admin_escola e professor da turma
- [ ] Alerta de atestado vencido disparado 15 dias antes do vencimento
- [ ] Lesão ativa exibe badge na chamada do professor
- [ ] Dados de saúde nunca expostos para o responsável via API

---

### 7.04 Módulo — Comunicação
**Slugs:** `comunicacao_basica` (Starter+) | `comunicacao_avancada` (Pro+)

**Objetivo:** Manter pais, professores e a escola conectados de forma proativa e centralizada.

**Comunicação Básica (Starter+)**
- Notificações push para o App Esportes Academy
- E-mail transacional (confirmações, alertas de cobrança)
- Mural de avisos da escola (comunicados gerais)
- Histórico de notificações recebidas
- Mensagem padrão automática de parabéns para aniversariantes do dia
- Preferência por escola para ativar ou desativar o parabéns automático de aniversário

**Comunicação Avançada (Pro+)**
- WhatsApp Business (mensagens transacionais via templates HSM aprovados)
- Envio de comunicado segmentado por turma ou modalidade
- Mensagem individual para responsável
- Agendamento de comunicados
- Integração Google Calendar para grade de aulas

**Notificações Automáticas**

| Evento | Canal (básico) | Canal (avançado) | Destinatário |
|---|---|---|---|
| Aula cancelada | Push | Push + WhatsApp | Pais da turma |
| Cobrança vencendo (D-3) | Push | Push + WhatsApp | Pai/responsável |
| Cobrança vencendo (D-1) | Push | Push + WhatsApp | Pai/responsável |
| Cobrança vencida (D+1) | Push | Push + WhatsApp | Pai/responsável |
| Pagamento confirmado | Push | Push + WhatsApp | Pai/responsável |
| Atleta ausente | Push | Push | Pai/responsável |
| Check-in do atleta | Push | Push + WhatsApp | Pai/responsável |
| Check-out do atleta | Push | Push + WhatsApp | Pai/responsável |
| Aniversário do atleta | Push | Push + WhatsApp | Pai/responsável |
| Novo comunicado | Push | Push + WhatsApp | Todos os pais |
| Frequência abaixo do threshold | Push | Push + WhatsApp | Pai/responsável |
| Atestado médico vencendo | Push | Push + WhatsApp | Pai/responsável |

**Critérios de Aceite:**
- [ ] Token push armazenado ao fazer login no app
- [ ] Notificação entregue em até 30 segundos após o evento
- [ ] Idempotência: mesma notificação não enviada duas vezes para mesmo destinatário no mesmo evento
- [ ] Pai pode configurar quais notificações deseja receber
- [ ] Templates WhatsApp HSM configurados antes do go-live (avançado)

---

### 7.05 Módulo — Eventos
**Slug:** `eventos` | **Planos:** Pro, Enterprise

**Objetivo:** Organizar e comunicar eventos da escola (festas, apresentações, confraternizações, torneios internos).

**Funcionalidades:**

**Criação e Gestão de Eventos**
- Cadastro: nome, tipo (apresentação / confraternização / torneio interno / outro), data, horário, local, descrição
- Vinculação com turmas específicas ou toda a escola
- Capacidade máxima de participantes
- Status: `rascunho`, `publicado`, `cancelado`, `encerrado`

**Inscrição de Atletas**
- Inscrição manual pelo admin ou aberta para responsáveis via App Esportes Academy
- Confirmação de presença do responsável
- Lista de confirmados vs. convidados
- Limite de vagas com fila de espera

**Comunicação do Evento**
- Publicação automática no mural e notificação push ao publicar evento
- Lembrete automático D-1 do evento
- Aviso de cancelamento de evento

**Controle de Presença no Evento**
- Checkin digital no dia do evento
- Relatório de presença final

**Galeria**
- Upload de fotos do evento (Supabase Storage)
- Visível para responsáveis dos atletas participantes via App Esportes Academy

**Critérios de Aceite:**
- [ ] Evento publicado dispara notificação para todos os pais das turmas vinculadas
- [ ] Cancelamento de evento notifica todos os inscritos
- [ ] Responsável confirma presença via App Esportes Academy
- [ ] Fotos visíveis apenas para pais de participantes do evento

---

### 7.06 Módulo — Competições
**Slug:** `competicoes` | **Planos:** Enterprise

**Objetivo:** Registrar participações em competições externas, acompanhar resultados e construir o histórico esportivo do atleta. No futuro, este módulo também deve sustentar a gestão competitiva de clubes.

**Funcionalidades:**

**Cadastro de Competições**
- Nome, modalidade, data, local, promotor, regulamento (link ou upload)
- Categorias disponíveis (ex: Sub-10, Sub-12, Adulto)
- Status: `planejada`, `em_andamento`, `encerrada`

**Inscrição de Atletas**
- Seleção de atletas por categoria
- Taxas de inscrição (integração financeira para cobranças de inscrição)
- Autorização dos responsáveis via App Esportes Academy

**Registro de Resultados**
- Colocação do atleta / equipe na competição
- Medalhas e troféus conquistados
- Notas técnicas por modalidade (configuráveis)
- Fotos e documentos do evento

**Histórico de Conquistas**
- Linha do tempo de competições por atleta
- Ranking interno da escola por modalidade
- Galeria de conquistas visível para responsáveis no App Esportes Academy

**Visão futura para clubes**
- O módulo deve evoluir para suportar estrutura de clube, equipes, categorias, calendário competitivo e operação de delegações
- A funcionalidade implantada desde já deve nascer modular para permitir crescimento sem ruptura de produto

**Critérios de Aceite:**
- [ ] Inscrição só possível com autorização do responsável (via App Esportes Academy)
- [ ] Histórico de conquistas visível na ficha do atleta
- [ ] Ranking interno atualizado automaticamente ao registrar resultado
- [ ] Exportação de lista de inscritos para CSV

---

### 7.07 Módulo — Treinamentos
**Slug:** `treinamentos` | **Planos:** Pro, Enterprise

**Objetivo:** Digitalizar o planejamento pedagógico dos treinos, permitindo que professores documentem, repliquem e evoluam suas metodologias.

> O módulo de Treinamentos também alimenta a jornada global do atleta no App Esportes Academy. O histórico de treinos executados, planos aplicados e evolução registrada deve compor a visão contínua do atleta entre escolas, respeitando permissões e contexto.

**Funcionalidades:**

**Plano de Treino**
- Criação de plano por turma e período (semanal / mensal / semestral)
- Estrutura: objetivo, conteúdo técnico, físico, tático e psicológico
- Vinculação com aulas da grade
- Status: `rascunho`, `ativo`, `encerrado`

**Plano de Aula**
- Detalhamento de cada aula: aquecimento, parte principal, volta à calma
- Exercícios da biblioteca (módulo Metodologia) ou livres
- Duração por fase, material necessário, número de atletas
- Professor preenche via App Esportes Academy

**Periodização**
- Macrociclo / Mesociclo / Microciclo configuráveis
- Visualização em calendário (integração com grade de aulas)
- Alertas para turmas sem plano de treino ativo

**Evolução do Atleta**
- Registro de métricas técnicas por aula ou avaliação
- Métricas configuráveis por modalidade (ex: futebol: finalização, passe, condução)
- Gráfico de evolução ao longo do tempo
- Visível para responsável no App Esportes Academy (leitura)

**Critérios de Aceite:**
- [ ] Plano de treino vinculado à turma e ao período letivo
- [ ] Professor preenche plano de aula no App Esportes Academy em menos de 3 minutos
- [ ] Métricas de evolução configuráveis por modalidade pelo admin
- [ ] Evolução do atleta visível para responsável no App Esportes Academy

---

### 7.08 Módulo — Metodologia de Treinamento
**Slug:** `metodologia` | **Planos:** Enterprise

**Objetivo:** Criar e manter uma biblioteca institucional de exercícios, métodos e padrões pedagógicos que padronizem a qualidade do ensino em toda a escola.

**Funcionalidades:**

**Biblioteca de Exercícios**
- Cadastro de exercício: nome, modalidade, categoria (técnico/tático/físico/lúdico), descrição, material, faixa etária recomendada
- Upload de vídeo demonstrativo ou link externo
- Tags para busca rápida
- Visível para professores no App Esportes Academy

**Fichas Técnicas de Metodologia**
- Documento de referência por modalidade
- Progressão pedagógica por faixa etária
- Competências esperadas por nível (iniciante, intermediário, avançado)

**Templates de Plano de Aula**
- Templates reutilizáveis criados pelo admin ou coordenador
- Professor usa template como ponto de partida no módulo Treinamentos
- Versionamento de templates

**Biblioteca de Planos de Treino**
- Banco de planos prontos por modalidade / faixa etária / período
- Admin compartilha com professores específicos ou toda a escola

**Critérios de Aceite:**
- [ ] Exercício cadastrado em menos de 2 minutos
- [ ] Professor busca exercício por tag no App Esportes Academy
- [ ] Template de plano de aula disponível ao criar novo plano de aula
- [ ] Biblioteca visível apenas para usuários internos da escola (não pais)

---

### 7.09 M?dulo ? Cursos
**Slug:** `cursos` | **Planos:** Pro (add-on) e Enterprise

**Objetivo:** Permitir que a plataforma, escolas e criadores publiquem, organizem e monetizem cursos com m?dulos, aulas, avalia??es e quizzes, atendendo tanto capacita??o interna quanto oferta comercial eleg?vel dentro do ecossistema Esportes Academy.

**Arquitetura de experi?ncia do m?dulo**
- **Portal SuperAdmin de Cursos** ? governan?a da plataforma, habilita??o do m?dulo, split padr?o, acompanhamento macro e regras comerciais
- **Portal do Criador de Conte?do** ? experi?ncia editorial independente para treinadores, escolas e demais produtores autorizados
- **Portal do Aluno** ? experi?ncia independente de consumo de aulas, progresso, quizzes e continuidade

> Refer?ncia de produto para o MVP: inspirar-se em fluxos essenciais de plataformas como Hotmart, mas implementar apenas o necess?rio para o MVP da Esportes Academy.

**Funcionalidades:**

**Cria??o de Cursos**
- T?tulo, descri??o, carga hor?ria estimada, p?blico-alvo (professor, admin, respons?vel, atleta, todos)
- Modalidade comercial do curso: `gratuito`, `individual` ou `assinatura`
- Curso pode ser:
  - totalmente gratuito
  - totalmente pago
  - h?brido, com aulas gratuitas de libera??o inicial e restante pago
- Pre?o, per?odo de acesso, oferta ativa, status comercial e quantidade de aulas gratuitas
- M?dulos e aulas dentro do curso
- Conte?do: v?deo, PDF, texto, quiz
- V?deo inicialmente suportado por:
  - **YouTube**
  - **Panda Video**
- Status: `rascunho`, `publicado`, `arquivado`

**Trilhas de Aprendizado**
- Sequ?ncia de cursos recomendados por fun??o (ex: "Trilha do Professor Iniciante")
- Progresso individual rastreado
- Certificado de conclus?o gerado automaticamente

**Matr?culas e Progresso**
- Admin matricula usu?rio em curso ou trilha
- Usu?rio acessa pelo Portal do Aluno conforme o contexto habilitado
- Progresso em percentual, aulas conclu?das, tempo dedicado
- Lembretes autom?ticos para cursos em andamento n?o conclu?dos

**Avalia??es e Quizzes**
- Quiz por aula ou por m?dulo com nota m?nima configur?vel
- Avalia??o final opcional por curso
- Tentativas configur?veis por quiz/avalia??o
- Resultado armazenado por usu?rio com status de aprova??o

**Comercializa??o**
- Curso pode ser gratuito
- Curso pode ser vendido individualmente
- Cat?logo de cursos pode ser vendido por assinatura
- Curso pago pode conter aulas gratuitas como amostra
- Libera??o e bloqueio de acesso conforme status da compra ou assinatura
- Hist?rico de compras, matr?culas e consumo por usu?rio

**Split Financeiro do M?dulo**
- Cada oferta comercial de curso deve prever participa??o percentual para:
  - **plataforma / SuperAdmin**
  - **criador do conte?do**
  - **escola**, quando aplic?vel
- O SuperAdmin define um **percentual padr?o da plataforma**
- O modelo deve permitir configura??o de percentuais por oferta, respeitando a composi??o de 100%
- No MVP, o split pode ser apenas configurado e exibido na camada de governan?a e nos mocks, sem repasse financeiro automatizado

**Identidade e Controle de Acesso**
- Todo usu?rio do ecossistema de cursos continua identificado por **CPF ?nico e obrigat?rio**
- O mesmo usu?rio pode atuar como criador, aluno ou operador em contextos diferentes
- O acesso efetivo continua dependente de:
  - usu?rio global
  - contexto habilitado
  - permiss?o no portal correspondente

**Certifica??es**
- Certificado digital gerado em PDF com nome, curso, carga hor?ria e data
- Hist?rico de certifica??es na ficha do usu?rio
- Vis?vel pelo admin para fins de avalia??o de desempenho e acompanhamento comercial

**Crit?rios de Aceite:**
- [ ] Admin cria curso completo com v?deo e quiz em menos de 10 minutos
- [ ] Curso pode ser configurado como gratuito, individual, por assinatura ou h?brido com aulas gratuitas
- [ ] SuperAdmin consegue visualizar e definir percentual da plataforma no modelo comercial
- [ ] Modelo comercial contempla split entre plataforma, criador e escola
- [ ] Certificado gerado automaticamente ao concluir curso
- [ ] Progresso salvo e retom?vel a qualquer momento
- [ ] Admin visualiza progresso de todos os funcion?rios em cada curso
- [ ] Avalia??es e quizzes registram nota, tentativa e status de aprova??o

---

### 7.10 Módulo — Relatórios & BI
**Slug:** `relatorios` | **Planos:** Pro (padrão), Enterprise (BI avançado)

**Objetivo:** Fornecer dados e análises para que gestores tomem decisões baseadas em evidências.

**Relatórios Disponíveis (Pro)**

| Relatório | Filtros | Exportação |
|---|---|---|
| Frequência por atleta | Turma, período | CSV, PDF |
| Frequência por turma | Período | CSV, PDF |
| Financeiro mensal | Mês/ano | CSV, PDF |
| Inadimplentes | Status, período | CSV |
| Atletas por turma | Modalidade | CSV |
| Histórico de pagamentos | Atleta, período | CSV, PDF |
| Eventos e presenças | Período | CSV |
| Evolução física dos atletas | Atleta, período | PDF |

**BI Avançado (Enterprise)**
- Dashboard Metabase integrado ao Supabase
- Análise de churn (atletas que cancelaram vs. motivo)
- Projeção de receita por cenário
- Análise de performance de turmas
- Relatório comparativo entre turmas e professores
- Exportação em Excel nativo

**Critérios de Aceite:**
- [ ] Dashboard carrega em menos de 3 segundos
- [ ] Todos os relatórios filtráveis por período
- [ ] Exportação CSV funcional para todos os relatórios
- [ ] Exportação PDF para relatórios financeiros e de frequência
- [ ] Acesso a BI avançado restrito ao plano Enterprise

---

## 8. Integrações Externas

### 8.1 Asaas (Pagamentos)
- **Finalidade:** Boleto, PIX, cartão; cobranças recorrentes e avulsas
- **Fluxo:** cadastro responsável → cliente Asaas; dia 1 → cobrança; webhook → atualizar status
- **Módulo:** `financeiro`
- **Chave:** `ASAAS_API_KEY` no Doppler

### 8.2 WhatsApp Business API
- **Finalidade:** Notificações transacionais
- **Provedor:** A definir (Z-API, Twilio ou Meta direto)
- **Módulo:** `comunicacao_avancada`
- **Requisito:** Templates HSM aprovados antes do go-live
- **Chave:** `WHATSAPP_API_TOKEN`

### 8.3 Google Calendar API
- **Finalidade:** Sincronizar grade de aulas com calendário do responsável
- **Módulo:** `comunicacao_avancada`
- **Credenciais:** `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`

### 8.4 Supabase Auth
- **Provedores:** Email/senha, Google OAuth, Sign in with Apple (obrigatório iOS)
- **Módulo:** core (todos)

### 8.5 Expo Push Notifications
- **Finalidade:** Push mobile (iOS + Android)
- **Módulo:** `comunicacao_basica`
- **Tabela:** `push_tokens`

### 8.6 Sentry
- **Finalidade:** Monitoramento de erros — web e mobile
- **Módulo:** core (infra)
- **Chave:** `SENTRY_DSN` por ambiente

### 8.7 Metabase *(Enterprise)*
- **Finalidade:** BI avançado conectado diretamente ao Supabase
- **Módulo:** `relatorios` (Enterprise tier)

---

## 9. Regras de Negócio Globais

1. **Multi-tenancy:** Cada escola é um tenant isolado. RLS ativo em 100% das tabelas.

2. **Multi-escola por usuário:** Um usuário pode ter acesso a múltiplas escolas com perfis diferentes. O contexto ativo (escola + perfil) é determinado na sessão após seleção na tela de escola. Nunca expor dados de escola A para usuário autenticado no contexto de escola B.

3. **Um perfil por vínculo:** Cada par `(user_id, escola_id)` tem exatamente um perfil. Se o admin_escola quiser alterar o perfil de um usuário, sobrescreve o registro existente (não cria duplicata).

4. **Módulos:** Uma escola só acessa funcionalidade se o módulo correspondente estiver ativo em `escola_modulos`. Middleware, permissão de perfil e RLS devem bloquear acesso em camadas independentes.

4a. **Configurações sempre disponíveis:** A tela `Escola-configuracoes.html` e as configurações gerais da escola (dados da escola, endereço, integração Asaas, notificações) estão **fora da lógica de módulos** — acessíveis para qualquer escola em qualquer plano. Apenas o `admin_escola` tem permissão de editar (read-only para outros perfis).

3. **Cobrança automática:** Gerada no dia 1 de cada mês para atletas com status `ativo`.

4. **Inadimplência:** Cobrança `vencida` há mais de 30 dias → flag `inadimplente`. Acesso ao App Esportes Academy no contexto `responsavel` pode ser bloqueado (configurável por escola).

5. **Cancelamento de aula:** Com menos de 2 horas de antecedência → notificação automática a todos os pais da turma.

6. **Chamada de presença:** Só pode ser registrada para aulas nas últimas 48 horas. Aulas futuras não podem ter chamada.

7. **Capacidade de turma:** Ao atingir capacidade máxima, novas matrículas são bloqueadas. Admin pode aumentar manualmente.

8. **Soft delete:** Nenhum dado é excluído permanentemente. Campo `deleted_at` em todas as tabelas.

9. **Permissões de professor:** Professor acessa apenas turmas pelas quais é responsável.

10. **Permissões de responsável:** Pai acessa apenas dados dos atletas vinculados ao seu cadastro.

11. **Dados de saúde:** Visíveis apenas para `admin_escola` e `professor` da turma do atleta. Pais não acessam via portal.

12. **Notificações duplicadas:** Idempotência garantida por `evento_id` único por notificação.

13. **Upgrade de plano:** UI exibe módulos bloqueados com cadeado e CTA de upgrade. Ao desbloquear, dados já existentes são imediatamente acessíveis.

14. **Expiração de módulo personalizado:** Se `expira_em` de um módulo liberado pelo super_admin passou, módulo deve ser automaticamente desativado via Edge Function agendada.

---

## 10. Requisitos Não-Funcionais

### Performance
- Dashboard: carregamento < 3 segundos
- APIs: tempo de resposta < 500ms (P95)
- App mobile: inicialização < 2 segundos

### Disponibilidade
- Uptime mínimo: 99,5% (SLA)
- Janela de manutenção: domingos 02h–04h

### Segurança
- Todas as comunicações via HTTPS
- RLS ativo em 100% das tabelas
- Senhas mínimo 8 caracteres (hash bcrypt)
- Tokens de API nunca expostos no cliente
- Rate limiting nas APIs públicas
- Verificação de módulo ativo em middleware E em RLS (dupla proteção)

### Escalabilidade
- Suportar até 10.000 atletas por tenant sem degradação
- Suportar até 500 tenants simultâneos

### Acessibilidade
- Web: WCAG 2.1 nível AA
- Mobile: VoiceOver (iOS) e TalkBack (Android)

### Compatibilidade
- Web: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- iOS: 15+
- Android: 10+

---

## 11. Roadmap

### MVP — Sprint 1–4 (Módulos Core)
- [ ] Onboarding da escola e configuração inicial
- [ ] **Módulo Administrativo** completo (atletas, turmas, presenças, dashboard)
- [ ] **Módulo Financeiro** (cobranças Asaas, inadimplência, relatórios básicos)
- [ ] **Módulo Comunicação Básica** (push notifications, e-mail transacional)
- [ ] **App Esportes Academy** — identidade global por CPF, acesso por escola/tipo de usuário e jornada básica do responsável
- [ ] **Carteirinha do atleta + check-in/check-out opcional por escola** com QR Code e notificações para responsáveis
- [ ] **Aniversariantes do mês + parabéns automático** com mensagem padrão da escola
- [ ] **Módulo Cursos MVP** (cursos, módulos, aulas, avaliações, quizzes e venda por assinatura ou individual)
- [ ] Portal SuperAdmin — gestão de tenants e módulos

### Fase 2 — Sprint 5–8 (Módulos Pro)
- [ ] **Módulo Saúde** (ficha médica, lesões, atestados, avaliações físicas)
- [ ] **Módulo Eventos** (criação, inscrição, presença, galeria)
- [ ] **Módulo Treinamentos** (planos de treino, plano de aula, evolução do atleta)
- [ ] **Módulo Comunicação Avançada** (WhatsApp, segmentação, agendamento)
- [ ] **Módulo Relatórios** (exportação PDF/CSV, relatórios completos)
- [ ] **App Esportes Academy** — jornada completa do responsável
- [ ] **App Esportes Academy** — jornada completa do professor

### Fase 3 — Sprint 9–12 (Módulos Enterprise)
- [ ] **Módulo Competições** (inscrição, resultados, conquistas, ranking)
- [ ] **Módulo Metodologia** (biblioteca de exercícios, templates, fichas técnicas)
- [ ] **Módulo Cursos** — expansão avançada (trilhas complexas, certificações avançadas e analytics)
- [ ] **BI Avançado** (Metabase, projeções, análise de churn)
- [ ] White-label para redes de escolas
- [ ] Marketplace público de escolas

### Fase 4 — Futuro
- [ ] IA para sugestão de treinos e análise de performance
- [ ] Integração com wearables e apps de saúde
- [ ] App Atleta (para maiores de 16 anos)
- [ ] Multi-unidade: escola com filiais
- [ ] Operação de **clubes** usando a mesma base modular da plataforma
- [ ] **Módulo Recursos Humanos** para gestão de equipe técnica e administrativa do clube
- [ ] **Módulo Logística** para deslocamentos, materiais, viagens e operação esportiva
- [ ] Expansão do **Módulo Competições** para calendário, delegações e gestão competitiva de clube

---

## 12. Fora do Escopo

Os itens abaixo **não fazem parte** da plataforma em nenhuma fase planejada:

- Streaming de vídeo ou aulas online ao vivo
- E-commerce de produtos esportivos (loja física ou virtual)
- Sistema de ponto eletrônico para funcionários
- Integração com ERP ou sistemas contábeis externos (ex: TOTVS, SAP)
- Pagamento internacional (fora do Brasil)
- App específico para atletas adultos como usuário final autônomo *(parcial — ver Fase 4)*

---

## 13. Glossário

| Termo | Definição |
|---|---|
| **Tenant** | Uma escola esportiva cadastrada. Dados completamente isolados via RLS. |
| **Módulo** | Conjunto de funcionalidades relacionadas, ativável por plano ou super_admin. |
| **Feature Flag** | Controle de acesso a módulo armazenado em `escola_modulos`. |
| **Slug** | Identificador textual de um módulo (ex: `saude`, `competicoes`). |
| **Plano** | Tier de assinatura da escola (Starter, Pro, Enterprise, Custom). |
| **Perfil** | Role do usuário dentro de uma escola específica (admin_escola, professor, financeiro etc.). |
| **Tipo de Usuário** | Papel operacional assumido pelo usuário em uma escola específica (`professor`, `responsavel`, `financeiro` etc.). |
| **Contexto Ativo** | Par (`escola_id + tipo_usuario`) da sessão atual. Determina o que o usuário pode ver e fazer. |
| **Seletor de Contexto** | Tela exibida após login quando o usuário tem mais de uma escola ou mais de um tipo de usuário elegível. |
| **escola_usuarios** | Estrutura de vínculo entre usuários globais e escolas, com seus respectivos tipos de usuário. |
| **Convite** | Fluxo de adição de usuário a uma escola iniciado pelo admin_escola via e-mail. |
| **Usuário Global** | Identidade única da pessoa na plataforma, identificada por CPF obrigatório e único. |
| **Atleta** | Aluno matriculado em uma ou mais turmas da escola. |
| **Responsável** | Pai, mãe ou guardião vinculado a um atleta. Usa o App Esportes Academy no contexto `responsavel`. |
| **Jornada do Atleta** | Linha do tempo global do atleta na plataforma, reunindo histórico entre escolas e, futuramente, clubes. |
| **Carteirinha do Atleta** | Identificação digital e opcionalmente impressa do atleta, com QR Code único para operações presenciais. |
| **Check-in / Check-out** | Registro de entrada e saída do atleta por leitura de QR Code no App Esportes Academy. |
| **Turma** | Grupo de atletas treinando juntos em modalidade, horário e local definidos. |
| **Aula** | Instância de uma turma em uma data específica. |
| **Chamada** | Registro de presença dos atletas em uma aula. |
| **Cobrança** | Documento financeiro (boleto, PIX ou cartão) gerado para um responsável. |
| **Inadimplente** | Responsável com cobrança vencida há mais de 30 dias. |
| **RLS** | Row Level Security — mecanismo PostgreSQL que isola dados por tenant. |
| **Edge Function** | Função serverless executada no Supabase. |
| **HSM** | Highly Structured Message — template WhatsApp aprovado pela Meta. |
| **EAS** | Expo Application Services — build e publicação de apps React Native. |
| **OTA Update** | Over-the-Air Update — atualização do app sem nova versão nas stores. |
| **Soft Delete** | Exclusão lógica: campo `deleted_at` preenchido, registro mantido no banco. |
| **Clube** | Evolução futura do tenant esportivo, com necessidades operacionais mais amplas que uma escola, suportadas por módulos adicionais. |
| **Macrociclo** | Período longo de planejamento esportivo (ex: ano inteiro). |
| **Mesociclo** | Subdivisão do macrociclo (ex: bloco de 4 semanas). |
| **Microciclo** | Menor unidade de planejamento (ex: semana de treinos). |

---

## 14. Histórico de Alterações

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-03-23 | 0.1 | Criação inicial do PRD — estrutura completa do MVP | Product Owner |
| 2026-03-24 | 0.2 | Refatoração para arquitetura modular: 10 módulos, tabela `escola_modulos`, 3 planos (Starter/Pro/Enterprise), roadmap por módulo, glossário expandido | Product Owner |
| 2026-03-24 | 0.4 | Perfil global do atleta: CPF como identificador único cross-escola, tabelas `atletas`/`matriculas`/`responsaveis`/`atleta_responsaveis`, regra de responsável financeiro obrigatório, histórico portável entre escolas, fluxo de cadastro com lookup de CPF | Product Owner |
| 2026-03-24 | 0.3 | Sistema multi-escola e multi-perfil: tabela `escola_usuarios`, 7 perfis do Portal Escola, matriz de permissões por módulo×perfil, fluxo de login multi-escola, fluxo de convite, dupla verificação middleware+RLS | Product Owner |
| 2026-03-24 | 0.6 | Tabela `planos_pagamento` como templates reutilizáveis de matrícula; `matriculas.plano_id FK`; tela `Escola-planos-pagamento.html` v1.0 | Product Owner |
| 2026-03-25 | 0.7 | Tabela `escolas` completa (identidade, jurídico, contato, endereço, integração Asaas, prefs cobrança, prefs operacionais, notificações, plano SaaS); regra 4a — configurações fora de módulos; tela `Escola-configuracoes.html` v1.0 | Product Owner |
| 2026-03-25 | 0.8 | Tela `Escola-usuarios.html` v1.0 — gestão multi-perfil de usuários: convite por e-mail (lookup de usuário existente na plataforma), seleção de perfil, painel de detalhe com outras escolas do usuário, alteração de perfil e desativação/remoção | Product Owner |
| 2026-04-02 | 0.9 | Reconceituação do produto para app único `Esportes Academy`: fim da separação entre App Pais e App Professor, usuário global com CPF obrigatório e único, acesso por `usuario + escola + tipo_usuario`, roadmap e glossário revisados | Product Owner |
| 2026-04-02 | 1.0 | PRD ampliado com jornada global do atleta entre escolas, carteirinha com QR para check-in/check-out opcional por escola, notificações para responsáveis e visão futura modular para gestão de clubes | Product Owner |
| 2026-04-02 | 1.1 | PRD atualizado com aniversariantes do mês no dashboard da escola e mensagem automática de parabéns para o atleta no dia do aniversário | Product Owner |
| 2026-04-02 | 1.2 | Módulo Cursos reposicionado no MVP com catálogo comercial, módulos, aulas, avaliações, quizzes e venda por assinatura ou individual | Product Owner |
| 2026-04-04 | 1.3 | M?dulo Cursos evolu?do para portais independentes de SuperAdmin, criador e aluno; modelo comercial passa a prever cursos gratuitos, pagos, h?bridos e split entre plataforma, criador e escola, com v?deo por YouTube ou Panda Video | Product Owner |
| 2026-04-04 | 1.4 | PRD reorganizado conceitualmente em tr?s sistemas independentes — Gest?o, Cursos e Competi??es — compartilhando apenas o Portal SuperAdmin e a identidade global por CPF | Product Owner |

---

> ⚠️ **Para o Squad:** Este documento é a sua principal referência de produto.
> Sempre que receber uma tarefa, verifique o módulo relevante e se ele está no escopo do plano sendo desenvolvido.
> Em caso de dúvida ou ausência de informação, acione o Product Owner antes de implementar.

---

## 15. Paleta de Cores

| Nome | Hex | Uso |
|---|---|---|
| Verde Vitória | `#20C997` | Cor principal — botões, menus ativos, identidade da marca |
| Azul Céu Claro | `#5BC0EB` | Cor secundária — elementos de apoio, destaques sutis |
| Cinza Luz | `#F7F9FA` | Fundo das telas e áreas neutras |
| Laranja Ação | `#FFA552` | Destaques, CTAs, alertas leves |
| Preto Terra | `#1B1B1B` | Textos principais, títulos, ícones escuros |
