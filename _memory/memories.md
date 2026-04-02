# Memórias do Squad — Esportes Academy

*(Use para anotar decisões persistentes entre execuções: preferências técnicas, padrões acordados, decisões de arquitetura, contexto de módulos.)*

## Stack e Convenções
- Frontend Web: Next.js 14 (App Router), TailwindCSS, shadcn/ui, React Query
- Mobile: React Native + Expo, Expo Router
- Banco: Supabase (PostgreSQL + RLS + Edge Functions)
- Pagamentos: Asaas
- Auth: Supabase Auth + OAuth Google/Apple
- Infra: Vercel + EAS + GitHub Actions + Sentry

## Fonte da Verdade
- O arquivo `prd Esportes Academy.md` (na raiz do squad) é o documento oficial do produto — **v0.8** desde 2026-03-25.
- Todo agente consulta o PRD antes de iniciar qualquer tarefa.
- O PRD agora usa arquitetura modular: 10 módulos, 3 planos (Starter/Pro/Enterprise), tabela `escola_modulos` para feature flags.

## Convenção de Nomenclatura de Telas (Portal-Tela)

**Padrão obrigatório:** Todos os arquivos de tela devem seguir o formato `Portal-tela`, com o nome do portal em PascalCase e o nome da tela em lowercase com hífens.

**Portais definidos:**
- `Admin` — telas do painel administrativo (admin_escola)
- `Escola` — telas de gestão da escola (contexto da escola, ex: grupos/turmas)
- `SuperAdmin` — telas de gestão da plataforma SaaS (todos os tenants)
- `Professor` — telas do app/portal do professor
- `Pais` — telas do app/portal dos pais/responsáveis

**Exemplos confirmados pelo PO (2026-03-23):**
- `SuperAdmin-dashboard.html`
- `SuperAdmin-notificacoes.html`
- `SuperAdmin-planos.html`
- `SuperAdmin-schools.html`
- `Escola-grupos.html`

**Regra:** Ao criar qualquer nova tela, o agente responsável deve perguntar ao PO a qual portal ela pertence e aplicar o prefixo correto antes de salvar o arquivo. Nunca criar telas sem prefixo de portal.

---

## Decisões de Arquitetura

### ADR-002: Multi-Escola e Multi-Perfil por Usuário (2026-03-24)
- **Decisão:** Um usuário tem identidade global única, mas perfil por escola. Tabela `escola_usuarios` com UNIQUE(user_id, escola_id).
- **Perfis do Portal Escola:** `admin_escola`, `coordenador`, `professor`, `financeiro`, `secretaria`, `saude`, `marketing`
- **Responsáveis** (pais) NÃO entram em `escola_usuarios` — ficam na tabela `responsaveis` e acessam apenas o App Pais
- **Fluxo login:** 1 escola → entra direto | N escolas → seletor de escola → contexto (escola_id + perfil) na sessão
- **Tripla proteção:** Middleware Next.js (módulo ativo?) → Matriz de permissão (perfil tem acesso?) → RLS Supabase (dado pertence ao tenant?)
- **Convite:** admin_escola convida por e-mail, usuário aceita e é vinculado com o perfil definido

### ADR-003: Matrícula como Contrato com Plano de Pagamento (2026-03-24)
- **Decisão:** A tabela `matriculas` agora é o núcleo do relacionamento atleta-escola. Ela carrega o contrato completo: período, plano de pagamento, desconto, dia de vencimento e forma de pagamento preferencial.
- **Tipos de período:** `mensal` (recorrente sem fim) | `trimestral` | `semestral` | `anual` | `personalizado`
- **Cobrança vinculada:** Toda cobrança tem `matricula_id` (FK) — exceto avulsas (uniforme, evento, material)
- **Geração automática:** `gerar_auto = true` → Edge Function gera cobranças conforme o plano. Contratos fechados (trimestral/semestral/anual) geram todas as parcelas de uma vez; mensais geram 1/mês.
- **Desconto na matrícula:** desconto_pct (%) com motivo (bolsa, irmão, funcionário, convênio, outro) → `valor_liquido` calculado na app
- **Impacto UI:** Step 3 do drawer de cadastro de atleta expandido com seletor de tipo de período + plano de pagamento completo

### ADR-004: Configurações Fora de Módulos (2026-03-25)
- **Decisão:** A tela de Configurações da Escola (`Escola-configuracoes.html`) é acessível independente de plano ou módulo ativo.
- **Acesso:** Apenas `admin_escola` pode editar; demais perfis veem overlay de acesso bloqueado.
- **Segurança:** `asaas_access_token` nunca exposto ao client — armazenado criptografado via Supabase Vault e acessado apenas por Edge Functions.

### ADR-001: Arquitetura Modular com Feature Flags (2026-03-24)
- **Decisão:** Portal da Escola é dividido em 10 módulos independentes, ativados por plano ou liberação manual do super_admin.
- **Tabela de controle:** `escola_modulos` (escola_id, modulo_slug, ativo, liberado_por, liberado_em, expira_em)
- **Slugs dos módulos:** `administrativo`, `financeiro`, `comunicacao_basica`, `saude`, `eventos`, `treinamentos`, `comunicacao_avancada`, `relatorios`, `competicoes`, `metodologia`, `cursos`
- **Planos:** Starter (admin+fin+push), Pro (+saude+eventos+treino+comunicacao_avancada+relatorios), Enterprise (+competicoes+metodologia+cursos+BI)
- **Proteção dupla:** middleware Next.js (rota) + Supabase RLS (dado)
- **UI de módulo bloqueado:** item de menu com cadeado 🔒 + modal de upgrade ao clicar

## Módulos Implementados
*(Registrar o que já foi implementado e está em produção)*

### Portal Escola — Telas criadas (2026-03-25)
- `Escola-dashboard.html` — v1.1 — Dashboard multi-perfil e multi-escola
- `Escola-atletas.html` — v1.1 — Gestão de atletas com perfil global (CPF), responsáveis financeiros, drawer de cadastro em 3 passos (Step 3 com seletor de plano de pagamento que pré-preenche campos), painel de detalhe com matrícula ativa e histórico de outras escolas (read-only), 12 atletas mock com filtros
- `Escola-financeiro.html` — v1.0 — Módulo Financeiro completo:
  - **KPIs**: Receita realizada, A receber, Em atraso, Taxa inadimplência
  - **3 abas**: Cobranças (tabela com filtros), Inadimplentes (lista + notificar todos), Relatórios (gráfico barras receita 12m + donut status)
  - **Painel de detalhe** (slide-in): valor, status, responsável financeiro, histórico de pagamentos, ações contextuais por status (2ª via, cancelar, estornar, marcar manual, reativar)
  - **Drawer Nova Cobrança** (2 passos): busca de atleta, 6 tipos (mensalidade/matrícula/uniforme/evento/avulsa/material), formas pagamento, desconto/acréscimo, toggle notificação
  - **Modal Gerar Mensalidades**: confirmação com totais antes de gerar em lote
  - **Demo bar** com 7 perfis: acesso bloqueado para coordenador/professor/secretaria/saúde/marketing (overlay visível)
  - 18 cobranças mock (março 2026), 6 inadimplentes, integração Asaas simulada

- `Escola-presencas.html` — v1.0 — Controle de presenças por turma:
  - **3 abas**: Chamada (fazer/editar chamada), Histórico (frequência por atleta), Relatório (charts + alertas)
  - **Janela de 48h**: seletor de 3 dias (hoje/ontem/anteontem) com chips clicáveis
  - **Cards de aula**: status visual (feita/pendente), barra de frequência, contadores pres/aus/just
  - **Modal de chamada**: grid de cards de atletas, botões 3-estados por atleta (✓/✕/⚠), "Todos presentes/ausentes", salvar com validação de não marcados
  - **Histórico**: tabela com % frequência, barra colorida (verde≥75%/laranja50-74%/vermelho<50%), flag de alerta
  - **Relatório**: KPIs, gráfico barras por turma, gráfico linha evolução mensal, lista de atletas abaixo do limiar (75%)
  - **Demo bar com 4 níveis de acesso**: full (admin/secretaria), parcial (professor: só suas turmas), leitura (coordenador: visualiza sem editar), bloqueado (financeiro/saúde/marketing)

- `Escola-usuarios.html` — v1.0 — Gestão de usuários multi-perfil (apenas admin_escola):
  - **Stats**: Total, Ativos, Pendentes, Perfis distintos
  - **Quota bar** do plano (Pro: 10 usuários) com alerta de limite
  - **Tabela**: avatar colorido por perfil, nome+email, badge de perfil, status (ativo/pendente/inativo), último acesso, indicador de outras escolas na plataforma, ação
  - **Painel de detalhe** (slide-in): hero com badges, acesso nesta escola, "o que esse perfil pode fazer", lista de todas as escolas do usuário na plataforma (multi-escola), alteração inline de perfil, ações contextuais
  - **Convidar usuário** (drawer 3 passos): Step 1 = e-mail com lookup debounced (encontrado/novo usuário), Step 2 = seleção de perfil com cards descritivos, Step 3 = resumo + mensagem personalizada
  - **Ações**: Reenviar convite (pendentes), Alterar perfil, Desativar/Reativar, Remover da escola (com modais de confirmação)
  - **Multi-escola**: Ana Lima é coordenador aqui + admin em outra escola; Roberto Santos e Thiago são professores em múltiplas escolas — visível no painel
  - 11 usuários mock; demo bar: apenas admin_escola acessa, outros veem overlay bloqueado

- `Escola-configuracoes.html` — v1.0 — Configurações da escola (fora de módulos — disponível em todos os planos):
  - **Abas verticais**: Dados da Escola, Endereço, Integração Asaas, Configurações Gerais, Notificações, Zona de Risco
  - **Dados da Escola**: upload de logo, nome fantasia, razão social, slogan, CNPJ (com máscara), IE/IM, regime tributário, telefone, email, site, Instagram, modalidades (chips + add/remove)
  - **Endereço**: CEP com busca simulada (auto-preenche campos), logradouro, número, complemento, bairro, cidade, UF
  - **Integração Asaas**: toggle Produção/Sandbox, Access Token mascarado com botão revelar, Wallet ID, **Testar Conexão** (animado, valida prefixo `$aact_`), URL do webhook com copiar, preferências de cobrança (antecipação, multa %, juros %, desconto antecipado)
  - **Config Gerais**: fuso horário, formato de data, moeda, idioma, capacidade padrão de turma, limiar frequência, janela de chamada, período contrato padrão, toggles de privacidade
  - **Notificações**: canal cards (WhatsApp/Email/Push/SMS toggle), gatilhos financeiros (lembrete, vencido, reenvio, confirmação), gatilhos pedagógicos (freq baixa, presença, relatório mensal)
  - **Zona de Risco**: cancelar plano, limpar sandbox, excluir escola
  - **Demo bar**: apenas `admin_escola` edita; todos os demais perfis veem overlay de acesso bloqueado
  - **Save bar flutuante** com indicador de alterações não salvas

- `Escola-planos-pagamento.html` — v1.0 — Gestão de planos de pagamento reutilizáveis:
  - **Stats row**: Total de Planos, Atletas Vinculados, Plano Mais Usado, Ticket Médio
  - **Grid/list view toggle** com cards coloridos e rows compactas
  - **Cards**: cor de destaque, badges (frequência/ativo/popular/desconto), valor em destaque, contagem de atletas com mini-avatars, ações (Editar/Duplicar/Desativar/Deletar)
  - **Drawer criar/editar** (single step): nome, descrição, color picker (8 cores), frequência grid (4 opções), valor, dia vencimento, desconto+motivo, forma pagamento, toggle ativo, **preview em tempo real**
  - **Modal confirmar exclusão** (só para planos sem atletas)
  - **Demo bar**: admin_escola e financeiro = acesso total; demais = bloqueado
  - 6 planos mock; `planos_pagamento` table adicionada ao PRD v0.6 com `matriculas.plano_id FK`

- `Escola-grupos.html` — v1.1 — Gestão de turmas (renomeado de Escola-turmas.html):
  - **KPIs**: Grupos ativos, Atletas total, Horas/semana média, Ocupação média
  - **Tabela filtrada**: busca por nome/escola/professor, filtros de esporte/status/dia
  - **Painel visualizar** (slide-in): hero com ícone por esporte, schedule visual com dias/hora/duração, informações detalhadas, barra de ocupação, lista de atletas, frequência dos últimos 30 dias
  - **Drawer criar/editar**: 3 seções (Identificação, Frequência com days-picker circular, Vagas com toggles lista de espera/ativo), calculador de duração automático
  - **Modal confirmar exclusão**
  - **Demo bar**: 7 perfis — admin_escola: full (criar/editar/excluir); coordenador/professor/secretaria: read-only; financeiro/saúde/marketing: bloqueado com overlay
  - **Sidebar padronizada**: usa `escola-sidebar.js` + `window.ESCOLA_PAGE = 'grupos'`
  - 12 grupos mock (6 esportes): futebol, natação, basquete, vôlei, atletismo, tênis

## Padronização do Portal Escola (2026-03-25)
- Todos os 8 arquivos HTML do portal escola usam `escola-sidebar.js` para o menu lateral
- Cada arquivo define `window.ESCOLA_PAGE = '<id>'` antes de carregar o script
- IDs de página: dashboard, atletas, grupos, presencas, financeiro, planos, configuracoes, usuarios
- Cores padrão: `--primary: #20C997`, `--sidebar-bg: #0d2112`, `--sidebar-hover: #162e1c`, `--bg: #F7F9FA`

## Portal SuperAdmin — Padronização (2026-03-25)
- Todos os 8 arquivos HTML do portal SuperAdmin usam `superadmin-sidebar.js` para o menu lateral
- Cada arquivo define `window.SUPERADMIN_PAGE = '<id>'` antes de carregar o script
- IDs de página: dashboard, schools, usuarios, cobrancas, planos, notificacoes, permissoes, configuracoes
- **Paleta SuperAdmin (indigo):** `--primary: #4f46e5`, `--sidebar-bg: #0d1117`, `--sidebar-hover: #161b22`
- **Distinção visual:** SuperAdmin = indigo escuro · Portal Escola = verde `#20C997`
- Nav sections: Principal (Dashboard/Escolas/Usuários), Financeiro (Cobranças/Planos/Relatórios/NFs), Sistema (Notificações/Permissões/Configurações)
- Relatórios e Notas Fiscais ainda sem tela (`href="#"` — pendentes)

## Pendências e Débitos Técnicos
*(Registrar itens identificados mas não implementados)*
- `Escola-saude.html` — Ficha de saúde do atleta (módulo Pro)
- `SuperAdmin-relatorios.html` — Relatórios financeiros SaaS (pendente)
- `SuperAdmin-notasfiscais.html` — Notas fiscais / faturamento (pendente)
