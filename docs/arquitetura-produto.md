# Arquitetura de Produto — Esportes Academy

## Visão executiva

A Esportes Academy passa a operar como uma plataforma com **três sistemas independentes**:

1. `Sistema de Gestão Esportes Academy`
2. `Sistema de Cursos`
3. `Sistema de Competições`

Esses sistemas **não compartilham o mesmo portal operacional**.

A única camada comum entre eles é:

1. `Portal SuperAdmin`
2. `Identidade global por CPF`

---

## Regra estrutural

- Cada sistema possui seus próprios portais, fluxos, linguagem operacional e backlog.
- O `SuperAdmin` governa toda a plataforma e atravessa os três sistemas.
- O usuário continua sendo único por `CPF`.
- O mesmo CPF pode existir em mais de um sistema, com contextos e papéis diferentes.

---

## Mapa dos sistemas

### 1. Sistema de Gestão Esportes Academy

Objetivo:
- operar escolas esportivas no dia a dia

Portais:
- `Painel da escola`
- `App Esportes Academy`

Domínios principais:
- onboarding da escola
- atletas
- responsáveis
- matrículas
- turmas
- presenças
- financeiro
- saúde
- comunicação
- eventos
- expansão futura para clube

Epics BMAD:
- `1–6`
- `8–13`
- `15`

Observação:
- este é o sistema principal da operação da escola

---

### 2. Sistema de Cursos

Objetivo:
- operar a criação, comercialização e consumo de cursos

Portais:
- `Portal do Criador`
- `Portal do Aluno`

Domínios principais:
- catálogo
- módulos
- aulas
- quizzes
- avaliações
- assinatura
- compra individual
- cursos gratuitos
- cursos híbridos
- player com `YouTube` ou `Panda Video`

Epics BMAD:
- `16`
- `17`

Observação:
- cursos não devem ser tratados como uma simples área dentro do sistema de gestão
- é um produto com experiência própria

---

### 3. Sistema de Competições

Objetivo:
- operar competições, inscrições, cobrança, narrativa e jornada competitiva

Portais:
- `Portal do Organizador`
- `Portal do Clube`

Domínios principais:
- competições grátis e pagas
- cobrança por clube
- cobrança por atleta
- split da plataforma
- mensalidade do organizador
- convites
- inscrição direta
- links de inscrição
- blog da competição
- blog da equipe
- reflexo na jornada do atleta

Epics BMAD:
- `14`
- `18`

Observação:
- competições devem ser tratadas como sistema independente
- o portal do clube em competições não é o mesmo portal do sistema de gestão

---

## Camada comum

### Portal SuperAdmin

Objetivo:
- governar toda a plataforma

Responsabilidades:
- gestão de tenants
- planos e módulos
- usuários internos
- faturamento da plataforma
- governança de cursos
- governança de competições

Epic BMAD:
- `7`

Regra:
- o `SuperAdmin` é o único portal compartilhado entre os sistemas

---

### Identidade global por CPF

Objetivo:
- manter unicidade do usuário na plataforma inteira

Regras:
- `CPF` obrigatório
- `CPF` único
- contexto de acesso definido por:
  - `usuario`
  - `escola`
  - `tipo_usuario`

Epics BMAD:
- `10`

Observação:
- a identidade é transversal
- a experiência de produto continua separada por sistema

---

## Relação entre os sistemas

### Gestão → Cursos

- gestão pode originar demanda para cursos
- professor, responsável ou outros perfis podem consumir cursos
- isso não significa compartilhar o mesmo portal

### Gestão → Competições

- atletas, escolas e clubes podem alimentar o sistema competitivo
- participações competitivas devem refletir na jornada do atleta
- isso não significa compartilhar o mesmo portal operacional

### Cursos → Competições

- não há dependência de portal
- integrações futuras podem existir por identidade, audiência ou trilhas

---

## Princípio de produto

Se houver dúvida de modelagem, usar esta regra:

> `Gestão`, `Cursos` e `Competições` são produtos independentes dentro da mesma plataforma.  
> O que os conecta é a governança do `SuperAdmin` e a identidade global por `CPF`.

---

## Referência no backlog

Ver:

- [STORIES.md](c:/Users/MSI/OpenSquad/squads/esportes-academy-Desenvolvimento-do-site/STORIES.md)
- [stories/README.md](c:/Users/MSI/OpenSquad/squads/esportes-academy-Desenvolvimento-do-site/stories/README.md)
- [prd Esportes Academy.md](c:/Users/MSI/OpenSquad/squads/esportes-academy-Desenvolvimento-do-site/prd%20Esportes%20Academy.md)
