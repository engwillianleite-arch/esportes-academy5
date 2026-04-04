# User Stories — arquivos detalhados

Este diretório complementa o [`STORIES.md`](../STORIES.md) (backlog resumido e status).

A organização das stories agora segue três linhas de produto independentes: `Gestão`, `Cursos` e `Competições`. O único portal comum entre elas é o `SuperAdmin`.

## Convenção de nomes

`{epico}.{id}-{slug-curto}.md` — exemplo: `6.1-cobrancas-schema-rls.md`

## O que entra em cada arquivo

| Seção | Conteúdo |
|--------|-----------|
| Cabeçalho | Epic, prioridade, dependências, o que desbloqueia |
| User story | Formato **Como / Quero / Para** |
| Contexto | PRD, regras de negócio, integrações |
| Comportamento | Fluxos, dados, permissões |
| Critérios de aceite | Itens testáveis |
| Fora do escopo | Evita creep |
| Arquivos prováveis | Orientação para implementação |
| Definition of Done | Checklist |

## Índice (stories detalhadas)

### Comum da Plataforma

| Epic | Linha | Observação |
|------|-------|------------|
| 7 | Comum | Portal SuperAdmin compartilhado entre Gestão, Cursos e Competições |

### Sistema de Gestão Esportes Academy

#### Epic 1 — Fundação multi-tenant e acesso

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 1.1 | [fundacao-escolas-rls-base.md](./1.1-fundacao-escolas-rls-base.md) | `done` |
| 1.2 | [fundacao-escola-usuarios-rls.md](./1.2-fundacao-escola-usuarios-rls.md) | `done` |
| 1.3 | [fundacao-feature-flags-escola.md](./1.3-fundacao-feature-flags-escola.md) | `done` |
| 1.4 | [fundacao-perfil-multi-escola-convites.md](./1.4-fundacao-perfil-multi-escola-convites.md) | `done` |
| 1.5 | [fundacao-identidade-visual-logo.md](./1.5-fundacao-identidade-visual-logo.md) | `done` |
| 1.6 | [fundacao-middleware-modulo-perfil.md](./1.6-fundacao-middleware-modulo-perfil.md) | `done` |
| 1.7 | [fundacao-contexto-escola-ativa-sessao.md](./1.7-fundacao-contexto-escola-ativa-sessao.md) | `done` |

#### Epic 2 — Onboarding e configurações da escola

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 2.1 | [onboarding-dados-juridicos-contato.md](./2.1-onboarding-dados-juridicos-contato.md) | `done` |
| 2.2 | [onboarding-endereco-preferencias.md](./2.2-onboarding-endereco-preferencias.md) | `done` |
| 2.3 | [onboarding-asaas-configuracao.md](./2.3-onboarding-asaas-configuracao.md) | `done` |
| 2.4 | [onboarding-preferencias-notificacao.md](./2.4-onboarding-preferencias-notificacao.md) | `done` |

#### Epic 3 — Administrativo (base)

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 3.1 | [adm-planos-pagamento-reutilizaveis.md](./3.1-adm-planos-pagamento-reutilizaveis.md) | `done` |
| 3.2 | [adm-atleta-perfil-global-cpf.md](./3.2-adm-atleta-perfil-global-cpf.md) | `done` |
| 3.3 | [adm-responsaveis-vinculo-atleta.md](./3.3-adm-responsaveis-vinculo-atleta.md) | `done` |
| 3.4 | [matricula-contrato-e-plano.md](./3.4-matricula-contrato-e-plano.md) | `done` |
| 3.5 | [adm-lista-busca-atletas.md](./3.5-adm-lista-busca-atletas.md) | `done` |
| 3.6 | [filtro-turma-lista-atletas.md](./3.6-filtro-turma-lista-atletas.md) | `done` |

#### Epic 4 — Turmas

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 4.1 | [turmas-schema-rls.md](./4.1-turmas-schema-rls.md) | `done` |
| 4.2 | [turmas-crud-painel.md](./4.2-turmas-crud-painel.md) | `done` |
| 4.3 | [turmas-vinculo-atleta.md](./4.3-turmas-vinculo-atleta.md) | `done` |

#### Epic 5 — Presenças e frequência

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 5.1 | [presencas-aulas-chamada.md](./5.1-presencas-aulas-chamada.md) | `done` |
| 5.2 | [frequencia-historico-percentual.md](./5.2-frequencia-historico-percentual.md) | `done` |

#### Epic 6 — Financeiro

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 6.1 | [cobrancas-schema-rls.md](./6.1-cobrancas-schema-rls.md) | `done` |
| 6.2 | [cobrancas-ui-listagem.md](./6.2-cobrancas-ui-listagem.md) | `done` |
| 6.3 | [webhook-asaas-status.md](./6.3-webhook-asaas-status.md) | `done` |

### Comum da Plataforma — Epic 7 SuperAdmin

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 7.1 | [superadmin-listagem-escolas.md](./7.1-superadmin-listagem-escolas.md) | `done` |
| 7.2 | [superadmin-planos-modulos-tenant.md](./7.2-superadmin-planos-modulos-tenant.md) | `done` |
| 7.3 | [superadmin-usuarios-internos.md](./7.3-superadmin-usuarios-internos.md) | `done` |
| 7.4 | [superadmin-faturamento-plataforma.md](./7.4-superadmin-faturamento-plataforma.md) | `done` |

#### Epic 8 — Permissões e feature flags

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 8.1 | [matriz-perfil-modulo-editavel.md](./8.1-matriz-perfil-modulo-editavel.md) | `todo` |
| 8.2 | [auditoria-permissoes.md](./8.2-auditoria-permissoes.md) | `todo` |
| 8.3 | [feature-flags-expiracao-ui.md](./8.3-feature-flags-expiracao-ui.md) | `todo` |
| 8.4 | [matriz-acesso-db-driven.md](./8.4-matriz-acesso-db-driven.md) | `todo` |

#### Epic 9 — Saúde

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 9.1 | [saude-ficha-medica-base.md](./9.1-saude-ficha-medica-base.md) | `todo` |
| 9.2 | [saude-lesoes-alertas.md](./9.2-saude-lesoes-alertas.md) | `todo` |
| 9.3 | [saude-exames-linha-do-tempo.md](./9.3-saude-exames-linha-do-tempo.md) | `done` |

#### Epic 10 — App Esportes Academy: identidade, acesso e contexto

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 10.1 | [app-unico-identidade-global-cpf.md](./10.1-app-unico-identidade-global-cpf.md) | `done` |
| 10.2 | [app-unico-vinculo-usuario-escola-tipo.md](./10.2-app-unico-vinculo-usuario-escola-tipo.md) | `done` |
| 10.3 | [app-unico-login-contexto-perfil.md](./10.3-app-unico-login-contexto-perfil.md) | `done` |

#### Epic 11 — App Esportes Academy: jornadas por tipo de usuário

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 11.1 | [app-unico-jornada-responsavel.md](./11.1-app-unico-jornada-responsavel.md) | `done` |
| 11.2 | [app-unico-jornada-professor.md](./11.2-app-unico-jornada-professor.md) | `done` |
| 11.3 | [app-unico-navegacao-adaptativa.md](./11.3-app-unico-navegacao-adaptativa.md) | `todo` |
| 11.4 | [app-unico-jornada-global-atleta.md](./11.4-app-unico-jornada-global-atleta.md) | `done` |
| 11.5 | [app-unico-carteirinha-qr.md](./11.5-app-unico-carteirinha-qr.md) | `done` |
| 11.6 | [app-unico-checkin-checkout-responsavel.md](./11.6-app-unico-checkin-checkout-responsavel.md) | `done` |

#### Epic 12 — Comunicação

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 12.1 | [comunicacao-central-notificacoes.md](./12.1-comunicacao-central-notificacoes.md) | `done` |
| 12.2 | [comunicacao-comunicados-segmentados.md](./12.2-comunicacao-comunicados-segmentados.md) | `todo` |
| 12.3 | [comunicacao-checkin-checkout.md](./12.3-comunicacao-checkin-checkout.md) | `done` |
| 12.4 | [comunicacao-aniversariantes-parabens.md](./12.4-comunicacao-aniversariantes-parabens.md) | `done` |

#### Epic 13 — Eventos

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 13.1 | [eventos-crud-publicacao.md](./13.1-eventos-crud-publicacao.md) | `todo` |
| 13.2 | [eventos-inscricoes-checkin.md](./13.2-eventos-inscricoes-checkin.md) | `todo` |

### Sistema de Competições

#### Epic 14 — Competições

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 14.1 | [competicoes-cadastro-inscricoes.md](./14.1-competicoes-cadastro-inscricoes.md) | `todo` |
| 14.2 | [competicoes-resultados-ranking.md](./14.2-competicoes-resultados-ranking.md) | `todo` |

#### Epic 15 — Expansão para clubes

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 15.1 | [clube-foundation-tenant-contexto.md](./15.1-clube-foundation-tenant-contexto.md) | `todo` |
| 15.2 | [clube-recursos-humanos.md](./15.2-clube-recursos-humanos.md) | `todo` |
| 15.3 | [clube-logistica.md](./15.3-clube-logistica.md) | `todo` |
| 15.4 | [clube-competicoes.md](./15.4-clube-competicoes.md) | `todo` |

### Sistema de Cursos

#### Epic 16 — Cursos: fundação e operação

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 16.1 | [cursos-catalogo-modelo-comercial.md](./16.1-cursos-catalogo-modelo-comercial.md) | `done` |
| 16.2 | [cursos-estrutura-modulos-aulas.md](./16.2-cursos-estrutura-modulos-aulas.md) | `done` |
| 16.3 | [cursos-quizzes-avaliacoes.md](./16.3-cursos-quizzes-avaliacoes.md) | `done` |
| 16.4 | [cursos-matriculas-progresso-comercializacao.md](./16.4-cursos-matriculas-progresso-comercializacao.md) | `done` |

#### Epic 17 — Cursos: portais independentes

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 17.1 | [cursos-superadmin-governanca-plataforma.md](./17.1-cursos-superadmin-governanca-plataforma.md) | `in_progress` |
| 17.2 | [cursos-portal-criador-conteudo-mockado.md](./17.2-cursos-portal-criador-conteudo-mockado.md) | `in_progress` |
| 17.3 | [cursos-portal-aluno-mockado.md](./17.3-cursos-portal-aluno-mockado.md) | `in_progress` |
| 17.4 | [cursos-player-youtube-panda.md](./17.4-cursos-player-youtube-panda.md) | `todo` |

#### Epic 18 — Competicoes: portais independentes

| ID | Arquivo | Status no backlog |
|----|---------|-------------------|
| 18.1 | [competicoes-superadmin-governanca-plataforma.md](./18.1-competicoes-superadmin-governanca-plataforma.md) | `in_progress` |
| 18.2 | [competicoes-portal-organizador-mockado.md](./18.2-competicoes-portal-organizador-mockado.md) | `in_progress` |
| 18.3 | [competicoes-portal-clube-mockado.md](./18.3-competicoes-portal-clube-mockado.md) | `in_progress` |
| 18.4 | [competicoes-inscricao-pagamento-blog-jornada.md](./18.4-competicoes-inscricao-pagamento-blog-jornada.md) | `in_progress` |

## Observação

`STORIES.md` continua sendo o quadro único de status.  
Esta pasta agora possui stories detalhadas dos Epics **1–18**.

### Organização atual por produto

1. `Gestão` — Epics `1–6`, `8–13` e `15`
2. `Cursos` — Epics `16–17`
3. `Competições` — Epics `14` e `18`
4. `Comum` — Epic `7` (SuperAdmin)

### Já concluído no recorte MVP

- `10.1` — identidade global de usuários com CPF obrigatório e único
- `10.2` — vínculo usuário ↔ escola ↔ tipo de usuário
- `10.3` — login unificado, seleção de escola e roteamento por perfil
- `11.4` — jornada global do atleta em versão inicial
- `11.5` — carteirinha digital com QR
- `11.6` — check-in/check-out do atleta e visão para responsáveis
- `12.1` — central de notificações e eventos automáticos
- `12.3` — notificações de check-in/check-out
- `12.4` — aniversariantes do mês e parabéns automático

### Regra estrutural dos portais

- `Gestão` tem seus próprios portais e jornadas
- `Cursos` tem portais independentes de `criador` e `aluno`
- `Competições` tem portais independentes de `organizador` e `clube`
- `SuperAdmin` é o único portal compartilhado entre os sistemas




