# Esportes Academy ? Portal Web

Aplica??o web multi-tenant da plataforma Esportes Academy, constru?da com Next.js + Supabase.

## Estrutura do reposit?rio

```text
.
?? src/                     # App Next.js (rotas, componentes, libs)
?? public/                  # Assets est?ticos
?? supabase/                # Migrations e artefatos de banco
?? stories/                 # Stories detalhadas (BMAD)
?? docs/                    # Documenta??o executiva e arquitetura
?? STORIES.md               # Backlog resumido e status oficial
?? prd Esportes Academy.md  # PRD do produto
?? agents/                  # Artefatos de agentes/squad
?? output/                  # Prot?tipos/sa?das auxiliares
?? _memory/                 # Mem?ria de trabalho do squad
?? _investigations/         # Investiga??es t?cnicas
```

## Pr?-requisitos

- Node.js 20+
- npm 10+

## Configura??o

1. Copie `.env.local.example` para `.env.local`
2. Preencha as vari?veis do Supabase e ambiente

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Documentos-chave

- `STORIES.md`
- `stories/README.md`
- `prd Esportes Academy.md`
- `docs/arquitetura-produto.md`

## Conven??es de produto (BMAD)

- Quadro ?nico de status: `STORIES.md`
- Especifica??es detalhadas: `stories/README.md` e arquivos `stories/*.md`
- PRD base: `prd Esportes Academy.md`
- Arquitetura executiva dos sistemas: `docs/arquitetura-produto.md`

## Arquitetura de produto

A plataforma est? organizada em tr?s sistemas independentes:

1. `Sistema de Gest?o Esportes Academy`
2. `Sistema de Cursos`
3. `Sistema de Competi??es`

Regra estrutural:
- o ?nico portal em comum entre os sistemas ? o `SuperAdmin`
- a identidade global por `CPF` continua transversal

## Fluxo recomendado de execu??o

1. Abrir `STORIES.md` e localizar o sistema correto: `Gest?o`, `Cursos`, `Competi??es` ou `Comum da Plataforma`
2. Marcar a pr?xima story como `in_progress`
3. Ler a especifica??o detalhada correspondente em `stories/*.md`
4. Implementar respeitando a separa??o entre portais de cada sistema
5. Validar localmente com `npm run build` e, quando fizer sentido, `npm run lint`
6. Atualizar status no `STORIES.md` e no ?ndice `stories/README.md`

## Bootstrap do primeiro SuperAdmin

Ap?s aplicar as migrations mais recentes, crie o primeiro usu?rio interno da plataforma:

1. Crie ou convide o usu?rio no Supabase Auth
2. Insira um registro em `plataforma_usuarios` com:
   - `user_id` do usu?rio Auth
   - `perfil = 'super_admin'`
   - `ativo = true`
3. Fa?a login com esse usu?rio e acesse `/superadmin/escolas`

## Observa??o

O projeto foi consolidado na raiz deste diret?rio (`esportes-academy-Desenvolvimento-do-site`).
