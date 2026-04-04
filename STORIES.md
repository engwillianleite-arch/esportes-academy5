# Backlog de User Stories — Esportes Academy (Portal Web)

> Documento de trabalho do squad. Complementa o `prd Esportes Academy.md`.  
> **Status:** `done` | `in_progress` | `todo` | `blocked`  
> Última revisão: 2026-04-02 — Backlog reorganizado para o app único `Esportes Academy`; stories detalhadas na pasta [`stories/`](./stories/README.md).

**Histórias com especificação longa:** use os arquivos em [`stories/`](./stories/README.md) (critérios, DoD, fora de escopo). Este arquivo continua sendo o **quadro único** de status.

---

## Linhas de Produto

A plataforma agora está organizada em **três sistemas independentes**, compartilhando apenas o **Portal SuperAdmin** e a base de identidade global por CPF:

1. **Sistema de Gestão Esportes Academy** — operação da escola, app único, saúde, comunicação, eventos e expansão de clube.
2. **Sistema de Cursos** — produto independente com portais próprios de criador e aluno, governado pelo SuperAdmin.
3. **Sistema de Competições** — produto independente com portais próprios de organizador e clube, governado pelo SuperAdmin.

> Regra de arquitetura: os portais de `Gestão`, `Cursos` e `Competições` não se confundem. O único portal em comum entre os sistemas é o **SuperAdmin**, que governa toda a plataforma.

---

## Legenda de épicos

| Epic | Tema | Sistema |
|------|------|---------|
| 1 | Fundação multi-tenant, auth e matriz de módulos | Gestão |
| 2 | Onboarding e configurações da escola (fora de módulos) | Gestão |
| 3 | Administrativo — atletas, responsáveis, planos e matrícula | Gestão |
| 4 | Administrativo — turmas (grupos) | Gestão |
| 5 | Administrativo — presenças e frequência | Gestão |
| 6 | Financeiro — cobranças e integração Asaas (runtime) | Gestão |
| 7 | Portal SuperAdmin — tenants e operações da plataforma | Comum |
| 8 | Evolução de permissões e feature flags (DB-driven) | Gestão |
| 9 | Saúde — ficha médica, lesões e alertas operacionais | Gestão |
| 10 | App Esportes Academy — identidade global, acesso e contexto | Gestão |
| 11 | App Esportes Academy — jornadas por tipo de usuário | Gestão |
| 12 | Comunicação — notificações automáticas e comunicados | Gestão |
| 13 | Eventos — gestão, inscrições e check-in | Gestão |
| 14 | Competições — módulo legado interno de gestão | Competições |
| 15 | Expansão para clubes — módulos e operação multi-contexto | Gestão |
| 16 | Cursos — fundação, conteúdo, avaliações e comercialização | Cursos |
| 17 | Cursos — portais independentes e experiência de aprendizagem | Cursos |
| 18 | Competições — portais independentes, comercialização e jornada | Competições |

---

## Blocos por Sistema

### Comum da Plataforma
- Epic `7` — Portal SuperAdmin

### Sistema de Gestão Esportes Academy
- Epics `1–6`, `8–13` e `15`
- Portal principal da escola e app único `Esportes Academy`

### Sistema de Cursos
- Epics `16–17`
- Portais independentes de `criador` e `aluno`

### Sistema de Competições
- Epics `14` e `18`
- Portais independentes de `organizador` e `clube`

---

## Sistema de Gestão Esportes Academy

### Base da Plataforma de Gestão

## Epic 1 — Fundação multi-tenant e acesso

| ID | Story | Status | Notas |
|----|--------|--------|--------|
| 1.1 | Registro de tenant: tabela `escolas` com RLS base | done | Migration `20260327000001` |
| 1.2 | Vínculo usuário ↔ escola: `escola_usuarios` + policies de leitura | done | `20260327000002`; base para RLS |
| 1.3 | Feature flags por escola: `escola_modulos` + slugs ADR-001 | done | `20260327000003` |
| 1.4 | Perfil multi-escola: gestão de usuários, convites, RLS escrita | done | `20260328000005`; UI em painel |
| 1.5 | Identidade visual: `logo_url` em `escolas` | done | `20260328000006` |
| 1.6 | Middleware: módulo ativo + matriz perfil × módulo | done | `middleware.ts`, `escola-modulos.ts` |
| 1.7 | Contexto de sessão / proxy: escola ativa para rotas do painel | done | Helpers RLS `202603270000004` + proxy |

---

### Epic 2 — Onboarding e configurações da escola

| ID | Story | Status | Notas |
|----|--------|--------|--------|
| 2.1 | Wizard de cadastro da escola: campos jurídicos e de contato | done | `20260328000007`, `00008` |
| 2.2 | Endereço completo + preferências operacionais (timezone, modalidades, etc.) | done | `20260328000009` |
| 2.3 | Integração Asaas: colunas, ambiente, token via Vault | done | `20260328000010` |
| 2.4 | Preferências de notificação (canais e gatilhos) na escola | done | `20260329000011` |

---

### Epic 3 — Administrativo: atletas, planos e matrícula

| ID | Story | Status | Notas |
|----|--------|--------|--------|
| 3.1 | Planos de pagamento reutilizáveis por escola | done | `20260330000012`, patches `00015` |
| 3.2 | Perfil global do atleta: CPF, RPC lookup, cadastro | done | `20260330000013`, patches `00016` |
| 3.3 | Responsáveis + `atleta_responsaveis` (incl. financeiro) | done | `20260401000014` |
| 3.4 | Matrícula: contrato, `plano_id`, bloqueio mesma escola, `linked_count` | done | Migration `20260401120000_matriculas.sql`; drawer + `matricula-actions` |
| 3.5 | Lista e busca de atletas (filtros PRD §7.01) | done | `atleta-list-actions`, tabela + busca + detalhe (`atleta-detalhe-sheet`) |
| 3.6 | Filtro por turma na lista de atletas | done | `atleta-list-actions` + `atletas-page-client` (select turma + opção sem turma) |

### Story 3.4 — Matrícula e vínculo com plano (detalhe)

**Como** admin ou secretaria,  
**quero** concluir o cadastro criando a matrícula com plano e período,  
**para** que o atleta passe a contar no financeiro e nas regras de tenant.

**Critérios de aceite**

1. Ao salvar, criar registro em `matriculas` com `escola_id` do contexto, `atleta_id`, `plano_id` opcional, campos de valor/desconto/dia vencimento alinhados ao drawer.
2. RPC de CPF / existência: se já existir matrícula ativa na **mesma** escola, bloquear com mensagem clara (PRD).
3. Atualizar contagem de uso em planos (`linked_count` ou agregado real) para UI de planos e regra de exclusão em `plano-actions`.
4. Manter RLS: apenas dados da escola ativa.

### Story 3.5 — Lista e busca de atletas (detalhe)

**Como** usuário com permissão no Administrativo,  
**quero** listar e filtrar atletas por nome, CPF e responsável,  
**para** localizar e abrir a ficha rapidamente.

**Critérios de aceite**

1. Tabela ou grid com paginação, busca debounced, máscara de CPF.
2. Filtros mínimos: status de matrícula, turma (quando Epic 4 existir), texto livre.
3. Ação de abrir detalhe / drawer coerente com o cadastro já implementado.
4. Estados vazio, carregando e erro.

---

### Epic 4 — Turmas (grupos)

*(PRD §7.01 Gestão de Turmas; protótipo `Escola-grupos.html` na memória do squad.)*

| ID | Story | Status | Notas |
|----|--------|--------|--------|
| 4.1 | Schema e RLS de turmas | done | Migration `20260402100000_turmas.sql` |
| 4.2 | CRUD de turmas no painel | done | `turma-actions.ts`, `/painel/turmas`, só `admin_escola` grava |
| 4.3 | Vincular atleta à turma | done | `matriculas.turma_id` opcional + validação de capacidade no drawer de matrícula |

### Story 4.1 — Schema e RLS de turmas

**Como** sistema,  
**preciso** da tabela `turmas` (e relações necessárias) com RLS por `escola_id`,  
**para** isolar dados entre tenants.

**Critérios de aceite**

1. Campos alinhados ao PRD: nome, modalidade, capacidade, horários, local, faixa etária, vínculo com escola e soft delete.
2. Policies: leitura/escrita apenas para perfis autorizados na matriz (admin, coordenador conforme regra final).
3. Índices para listagem por escola e status.

### Story 4.2 — CRUD de turmas no painel

**Como** admin_escola ou coordenador (conforme matriz),  
**quero** criar, editar e desativar turmas,  
**para** organizar atletas e presenças.

**Critérios de aceite**

1. Lista com busca e filtros básicos; painel detalhe ou drawer alinhado ao design system.
2. Validação de capacidade e campos obrigatórios.
3. Exclusão lógica; confirmação para ações destrutivas.

### Story 4.3 — Vincular atleta à turma

**Como** admin ou secretaria,  
**quero** associar matrícula ativa a uma ou mais turmas (conforme modelo de dados),  
**para** refletir a operação real da escola.

**Critérios de aceite**

1. Respeitar capacidade máxima (PRD regra global #7).
2. Impedir vínculo inconsistente (ex.: matrícula cancelada).
3. Atualizar contagens para telas dependentes (presenças, dashboard).

---

### Epic 5 — Presenças e frequência

*(PRD §7.01; janela de 48h; limiar configurável na escola.)*

| ID | Story | Status | Notas |
|----|--------|--------|--------|
| 5.1 | Aulas instanciadas e chamada | done | Migration `20260403100000_presencas.sql`; `/painel/presencas`; RPCs `chamada_pode_editar`, `listar_membros_escola`; `turmas.professor_user_id` |
| 5.2 | Histórico e percentual de frequência | done | Migration `20260403120000_frequencia_limiar.sql`; coluna `escolas.limiar_freq_pct`; RPCs `frequencia_resumo_matriculas`, `historico_presencas_matricula`; lista + sheet em Atletas |

### Story 5.1 — Aulas instanciadas e chamada

**Como** professor (ou admin),  
**quero** registrar presença por turma e data dentro da janela permitida,  
**para** cumprir o controle pedagógico.

**Critérios de aceite**

1. Não permitir chamada para aulas fora da janela de horas configurável (`janela_chamada_h`).
2. Estados: presente, ausente, falta justificada (ou equivalente do PRD).
3. Professor vê apenas suas turmas; admin vê conforme matriz.

### Story 5.2 — Histórico e percentual de frequência por atleta

**Como** coordenador ou admin,  
**quero** ver frequência acumulada e alertas abaixo do limiar,  
**para** agir sobre evasão.

**Critérios de aceite**

1. Cálculo coerente com registros de chamada.
2. Alerta visual quando abaixo de `limiar_freq_pct` da escola.
3. Exportação pode ficar para Epic de relatórios (opcional MVP).

---

### Epic 6 — Financeiro (cobranças)

*(Depende de matrículas estáveis — Epic 3.4.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 6.1 | Tabela `cobrancas` + RLS | done | Migration `20260405100000_cobrancas.sql` |
| 6.2 | Geração manual e listagem no painel | done | `/painel/financeiro`, `cobranca-actions`, link no nav |
| 6.3 | Webhook Asaas e atualização de status | done | API route `/api/asaas/webhook` + client admin Supabase |

*(6.3 costuma envolver Edge Function / API route — ver critérios no arquivo da story.)*

---

## Comum da Plataforma

### Epic 7 — Portal SuperAdmin

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 7.1 | Listagem e detalhe de escolas (tenants) | done | Rotas `/superadmin/escolas` e `/superadmin/escolas/[id]` com filtros, detalhe e proteção de acesso |
| 7.2 | Gestão de planos SaaS e módulos por tenant | done | Ações SuperAdmin para alterar plano e sincronizar/alternar `escola_modulos` |
| 7.3 | Usuários internos da plataforma | done | Tabela `plataforma_usuarios`, convite Auth e gestão em `/superadmin/usuarios` |
| 7.4 | Cobranças e faturamento da plataforma | done | Tabela `assinaturas_plataforma` + visão em `/superadmin/faturamento` e editor no detalhe da escola |

*(Protótipos HTML em `output/` podem apoiar UI.)*

---

### Epic 8 — Permissões e módulos avançados

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 8.1 | Matriz perfil × módulo editável (super_admin) | todo | [`stories/8.1-matriz-perfil-modulo-editavel.md`](./stories/8.1-matriz-perfil-modulo-editavel.md) |
| 8.2 | Auditoria de alterações em permissões | todo | [`stories/8.2-auditoria-permissoes.md`](./stories/8.2-auditoria-permissoes.md) |
| 8.3 | Feature flags por escola com expiração — UI completa | todo | [`stories/8.3-feature-flags-expiracao-ui.md`](./stories/8.3-feature-flags-expiracao-ui.md) — colunas em `escola_modulos` |
| 8.4 | Fonte da matriz de acesso **DB-driven** (`modulo-access`) | todo | [`stories/8.4-matriz-acesso-db-driven.md`](./stories/8.4-matriz-acesso-db-driven.md) |

---

### Epic 9 — Saúde

*(PRD §7.03; sensível a LGPD e políticas de acesso por perfil.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 9.1 | Ficha médica base do atleta | todo | [`stories/9.1-saude-ficha-medica-base.md`](./stories/9.1-saude-ficha-medica-base.md) |
| 9.2 | Histórico de lesões e alertas operacionais | todo | [`stories/9.2-saude-lesoes-alertas.md`](./stories/9.2-saude-lesoes-alertas.md) |
| 9.3 | Exames, atestados e linha do tempo clínica do atleta | done | [`stories/9.3-saude-exames-linha-do-tempo.md`](./stories/9.3-saude-exames-linha-do-tempo.md) |

---

### Epic 10 — App Esportes Academy: identidade, acesso e contexto

*(Nova diretriz de produto: app único para responsáveis, professores e demais perfis elegíveis. Acesso definido por `usuario + escola + tipo_usuario`, com CPF obrigatório e único por usuário.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 10.1 | Identidade global de usuários com CPF obrigatório e único | done | [`stories/10.1-app-unico-identidade-global-cpf.md`](./stories/10.1-app-unico-identidade-global-cpf.md) |
| 10.2 | Vínculo usuário ↔ escola ↔ tipo de usuário | done | [`stories/10.2-app-unico-vinculo-usuario-escola-tipo.md`](./stories/10.2-app-unico-vinculo-usuario-escola-tipo.md) |
| 10.3 | Login unificado, seleção de escola e roteamento por perfil | done | [`stories/10.3-app-unico-login-contexto-perfil.md`](./stories/10.3-app-unico-login-contexto-perfil.md) |

---

### Epic 11 — App Esportes Academy: jornadas por tipo de usuário

*(Substitui a separação anterior entre App Pais e App Professor. O mesmo app adapta navegação, permissões e conteúdo conforme o contexto ativo do usuário.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 11.1 | Jornada do responsável no app único | done | [`stories/11.1-app-unico-jornada-responsavel.md`](./stories/11.1-app-unico-jornada-responsavel.md) |
| 11.2 | Jornada do professor no app único | done | [`stories/11.2-app-unico-jornada-professor.md`](./stories/11.2-app-unico-jornada-professor.md) |
| 11.3 | Navegação adaptativa por tipo de usuário no app único | todo | [`stories/11.3-app-unico-navegacao-adaptativa.md`](./stories/11.3-app-unico-navegacao-adaptativa.md) |
| 11.4 | Linha do tempo global da jornada do atleta no app | done | [`stories/11.4-app-unico-jornada-global-atleta.md`](./stories/11.4-app-unico-jornada-global-atleta.md) |
| 11.5 | Carteirinha digital e impressão do atleta com QR Code | done | [`stories/11.5-app-unico-carteirinha-qr.md`](./stories/11.5-app-unico-carteirinha-qr.md) |
| 11.6 | Check-in/check-out do atleta e visão para responsáveis | done | [`stories/11.6-app-unico-checkin-checkout-responsavel.md`](./stories/11.6-app-unico-checkin-checkout-responsavel.md) |

---

### Epic 12 — Comunicação

*(PRD §7.04; canais por plano e idempotência de envios.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 12.1 | Central de notificações e eventos automáticos | done | Outbox/entregas + processador interno + UI `/painel/comunicacao-basica/notificacoes` |
| 12.2 | Comunicados segmentados e agendamento | todo | [`stories/12.2-comunicacao-comunicados-segmentados.md`](./stories/12.2-comunicacao-comunicados-segmentados.md) |
| 12.3 | Notificações de check-in e check-out para responsáveis | done | [`stories/12.3-comunicacao-checkin-checkout.md`](./stories/12.3-comunicacao-checkin-checkout.md) |
| 12.4 | Aniversariantes do mês e parabéns automático para atleta | done | [`stories/12.4-comunicacao-aniversariantes-parabens.md`](./stories/12.4-comunicacao-aniversariantes-parabens.md) |

---

### Epic 13 — Eventos

*(PRD §7.05; eventos da escola com publicação e confirmação.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 13.1 | CRUD de eventos com publicação | todo | [`stories/13.1-eventos-crud-publicacao.md`](./stories/13.1-eventos-crud-publicacao.md) |
| 13.2 | Inscrições, confirmação e check-in de eventos | todo | [`stories/13.2-eventos-inscricoes-checkin.md`](./stories/13.2-eventos-inscricoes-checkin.md) |

---

## Sistema de Competições

### Epic 14 — Competições

*(PRD §7.06; restrito ao plano Enterprise.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 14.1 | Cadastro de competições e inscrição de atletas | todo | [`stories/14.1-competicoes-cadastro-inscricoes.md`](./stories/14.1-competicoes-cadastro-inscricoes.md) |
| 14.2 | Resultados, conquistas e ranking interno | todo | [`stories/14.2-competicoes-resultados-ranking.md`](./stories/14.2-competicoes-resultados-ranking.md) |

---

### Epic 15 — Expansão para clubes

*(Visão futura do PRD: a plataforma deve evoluir da gestão de escolas para operação de clubes, preservando a base modular e multi-tenant.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 15.1 | Fundação do tenant para contexto de clube | todo | [`stories/15.1-clube-foundation-tenant-contexto.md`](./stories/15.1-clube-foundation-tenant-contexto.md) |
| 15.2 | Módulo Recursos Humanos para equipes técnica e administrativa | todo | [`stories/15.2-clube-recursos-humanos.md`](./stories/15.2-clube-recursos-humanos.md) |
| 15.3 | Módulo Logística para deslocamentos, materiais e viagens | todo | [`stories/15.3-clube-logistica.md`](./stories/15.3-clube-logistica.md) |
| 15.4 | Módulo Competições em nível de clube e delegações | todo | [`stories/15.4-clube-competicoes.md`](./stories/15.4-clube-competicoes.md) |

---

## Sistema de Cursos

### Epic 16 — Cursos: fundação e operação

*(PRD §7.09; base já entregue para catálogo, estrutura pedagógica, avaliações e comercialização do módulo.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 16.1 | Catálogo de cursos e modelo comercial | done | [`stories/16.1-cursos-catalogo-modelo-comercial.md`](./stories/16.1-cursos-catalogo-modelo-comercial.md) |
| 16.2 | Estrutura de cursos, módulos e aulas | done | [`stories/16.2-cursos-estrutura-modulos-aulas.md`](./stories/16.2-cursos-estrutura-modulos-aulas.md) |
| 16.3 | Quizzes, avaliações e critérios de aprovação | done | [`stories/16.3-cursos-quizzes-avaliacoes.md`](./stories/16.3-cursos-quizzes-avaliacoes.md) |
| 16.4 | Matrículas, assinatura, compra individual e progresso | done | [`stories/16.4-cursos-matriculas-progresso-comercializacao.md`](./stories/16.4-cursos-matriculas-progresso-comercializacao.md) |

---

### Epic 17 — Cursos: portais independentes

*(Nova diretriz de produto para Cursos: o módulo passa a ter três experiências independentes, porém conectadas pela mesma identidade global por CPF. Primeiro passo será prototipar as telas com dados mockados usando BMAD. O player de vídeo deve suportar YouTube e Panda Video.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 17.1 | Governança do módulo de cursos no portal SuperAdmin | todo | [`stories/17.1-cursos-superadmin-governanca-plataforma.md`](./stories/17.1-cursos-superadmin-governanca-plataforma.md) |
| 17.2 | Portal do criador de conteúdo com dados mockados | todo | [`stories/17.2-cursos-portal-criador-conteudo-mockado.md`](./stories/17.2-cursos-portal-criador-conteudo-mockado.md) |
| 17.3 | Portal do aluno com dados mockados | in_progress | [`stories/17.3-cursos-portal-aluno-mockado.md`](./stories/17.3-cursos-portal-aluno-mockado.md) |
| 17.4 | Player e estratégia de vídeo com YouTube ou Panda Video | todo | [`stories/17.4-cursos-player-youtube-panda.md`](./stories/17.4-cursos-player-youtube-panda.md) |

---

### Epic 18 — Competicoes: portais independentes

*(Nova diretriz de produto para Competições: o sistema passa a ter governança central do SuperAdmin e portais independentes para organizadores e clubes, com primeira fase em telas mockadas. O fluxo comercial deve suportar competições pagas ou gratuitas, cobrança por clube ou por atleta, repasse percentual para a plataforma e reflexo na jornada do atleta.)*

| ID | Story | Status | Doc |
|----|--------|--------|-----|
| 18.1 | Governança do sistema de competições no portal SuperAdmin | in_progress | [`stories/18.1-competicoes-superadmin-governanca-plataforma.md`](./stories/18.1-competicoes-superadmin-governanca-plataforma.md) |
| 18.2 | Portal do organizador de competições com dados mockados | in_progress | [`stories/18.2-competicoes-portal-organizador-mockado.md`](./stories/18.2-competicoes-portal-organizador-mockado.md) |
| 18.3 | Portal do clube para inscrições e gestão competitiva com dados mockados | in_progress | [`stories/18.3-competicoes-portal-clube-mockado.md`](./stories/18.3-competicoes-portal-clube-mockado.md) |
| 18.4 | Inscrição, pagamento, blogs e reflexo na jornada do atleta | in_progress | [`stories/18.4-competicoes-inscricao-pagamento-blog-jornada.md`](./stories/18.4-competicoes-inscricao-pagamento-blog-jornada.md) |

---

## Próximos passos sugeridos (ordem)

1. **Sistema de Gestão** — seguir com `11.2`, `11.3`, `15.*` e evoluções avançadas do app único.
2. **Sistema de Cursos** — consolidar Epics `16–17`, conectando os portais independentes ao runtime real.
3. **Sistema de Competições** — executar `18.1` → `18.2` → `18.3` → `18.4`, mantendo `14.*` como domínio funcional legado do produto competitivo.
4. **Portal comum** — o `SuperAdmin` segue como camada transversal de governança entre os três sistemas.
5. **Arquitetura de produto** — preservar CPF único, identidade global e separação clara entre portais de Gestão, Cursos e Competições.

---

## Histórico

| Data | Alteração |
|------|-----------|
| 2026-04-01 | Criação do backlog: Epics 1–3 consolidados a partir do código; Epics 4–8 detalhados para continuidade |
| 2026-04-02 | Epic 4 implementado: migration turmas, CRUD painel, vínculo opcional na matrícula; build Next.js OK |
| 2026-04-03 | Story 5.1: tabelas `aulas` e `presencas_registros`, chamada no painel, professor vinculado à turma |
| 2026-04-03 | Story 5.2: `limiar_freq_pct`, frequência na lista/sheet de atletas, RPCs agregados |
| 2026-04-03 | Pasta `stories/`: README + histórias 3.6, 6–8 detalhadas; `STORIES.md` com coluna Doc |
| 2026-04-01 | Expansão BMAD: histórias detalhadas dos Epics 9–12 adicionadas com índice e links no backlog |
| 2026-04-02 | Story 3.6 concluída: filtro por turma na lista de atletas (inclui opção “Sem turma”) |
| 2026-04-02 | Epic 6 concluído: tabela `cobrancas` com RLS, UI `/painel/financeiro` e webhook Asaas de atualização de status |
| 2026-04-02 | Epic 7 concluído: Portal SuperAdmin com escolas, plano/módulos, usuários internos e faturamento plataforma |
| 2026-04-02 | Story 12.1 concluída: outbox de notificações, entregas e processador interno com histórico no painel |
| 2026-04-02 | Reorganização de produto: Epics 10 e 11 passam a representar o app único `Esportes Academy`; comunicação/eventos/competições foram renumerados para 12–14; antigo Epic 13 foi incorporado como referência histórica para a nova jornada unificada |
| 2026-04-02 | Backlog ampliado com jornada global do atleta, carteirinha QR, check-in/check-out com notificações para responsáveis e visão futura de módulos para clubes |
| 2026-04-02 | Trilha oficial do MVP definida: `11.5` → `11.6` → `12.3` → `9.3` (básico) → `11.4` (inicial); Epic 15 e expansões avançadas ficam pós-MVP |
| 2026-04-02 | Story 11.5 concluída: tabela `atleta_carteirinhas`, QR persistido, rota `/pais/carteirinhas` e impressão básica da carteirinha |
| 2026-04-02 | Story 11.6 concluída: toggle opcional por escola, tabela `atleta_acessos`, operação em `/painel/acessos` e histórico no app em `/pais/acessos` |
| 2026-04-02 | Story 12.3 concluída: registros de acesso agora enfileiram eventos `check_in`/`check_out` no outbox e o histórico de notificações do responsável passa a receber essas entregas |
| 2026-04-02 | Story 11.4 concluída em versão inicial: rota `/pais/jornada` com timeline global baseada em matrículas, presenças e acessos já existentes, além de blocos preparados para competições, exames e treinos |
| 2026-04-02 | Story 12.4 concluída: dashboard da escola com aniversariantes do mês, evento `aniversario_atleta` com mensagem padrão da escola e histórico visível na central de notificações |
| 2026-04-02 | Trilha oficial final de fechamento do MVP revisada: pendências concentradas em `10.1`, `10.2`, `10.3`, `11.1` e `9.3`; itens `11.4`, `11.5`, `11.6`, `12.1`, `12.3` e `12.4` considerados entregues para o recorte MVP |
| 2026-04-02 | Story 10.1 concluída: tabela `usuarios` para identidade global, CPF obrigatório e único por conta autenticada e rota `/completar-cadastro` para primeira entrada de contas sem CPF |
| 2026-04-02 | Story 10.2 concluída: tabela `usuario_escola_tipos` criada, sincronização automática dos contextos atuais do usuário e base preparada para autorização por `usuario + escola + tipo_usuario` |
| 2026-04-02 | Story 10.3 concluída: login e home passam a resolver contexto unificado, seleção de contexto usa `usuario_escola_tipos` e o roteamento inicial responde ao perfil escolhido (`/painel` ou `/pais`) |
| 2026-04-02 | Story 11.1 concluída: jornada do responsável no app único agora respeita a escola ativa, permite troca de contexto e filtra home, financeiro, presenças, carteirinhas, acessos e notificações por `usuario + escola + tipo_usuario` |
| 2026-04-02 | Story 9.3 concluída em versão básica: módulo `/painel/saude` com cadastro de exames e atestados, alertas operacionais por vencimento e integração desses registros à jornada global do atleta no app |
| 2026-04-02 | Story 16.1 concluída: módulo `/painel/cursos` com catálogo por escola, status de publicação, público-alvo e modalidade comercial `assinatura` ou `individual`, pronto para receber módulos/aulas na próxima etapa |
| 2026-04-02 | Story 16.2 concluída: cursos agora suportam módulos e aulas ordenadas com conteúdo em vídeo, PDF, texto e flag de quiz, tudo gerenciado no mesmo módulo `/painel/cursos` |
| 2026-04-02 | Story 16.3 concluída: quizzes de aula, módulo e curso final com nota mínima, tentativas máximas, perguntas, alternativas e registro real de tentativas com aprovação |
| 2026-04-02 | Story 16.4 concluída: assinaturas de catálogo, matrículas manuais e individuais, progresso por aula, painel de comercialização e consumo no app do responsável; MVP de cursos fechado |
| 2026-04-02 | Módulo Cursos adicionado ao recorte do MVP: PRD atualizado para catálogo comercial com venda por assinatura ou individual e backlog expandido com Epic 16 e stories detalhadas |
| 2026-04-04 | Backlog de Cursos reorganizado: Epic 16 passa a representar a fundação já entregue e novo Epic 17 detalha os portais independentes de SuperAdmin, criador de conteúdo e aluno, com primeira fase em telas mockadas e suporte planejado a YouTube ou Panda Video |
| 2026-04-04 | Competicoes ganham trilha própria de produto: Epic 18 define governança SuperAdmin e portais independentes de organizador e clube, incluindo competições pagas ou gratuitas, split percentual da plataforma, inscrição por clube ou atleta, blogs e integração futura com a jornada do atleta |
| 2026-04-04 | Backlog reorganizado por linhas de produto: Sistema de Gestão, Sistema de Cursos e Sistema de Competições passam a ficar separados no BMAD, mantendo apenas o Portal SuperAdmin como camada comum entre os sistemas |
| 2026-04-04 | Epic 18.2 refinado com o novo fluxo mockado do organizador: dashboard executivo, criação de campeonato e configuração de categorias com número de times, grupos e fase eliminatória inspirados em plataformas competitivas modernas, preservando o layout da Esportes Academy |
| 2026-04-04 | Story 11.2 concluída: jornada do professor no app único entregue com roteamento dedicado para `/professor`, shell próprio, dashboard, turmas e chamada reutilizando a operação existente por contexto ativo |


