# Esportes Academy — Portal Web

Aplicação web multi-tenant da plataforma Esportes Academy, construída com Next.js + Supabase.

## Estrutura do repositório

```text
.
├─ src/                     # App Next.js (rotas, componentes, libs)
├─ public/                  # Assets estáticos
├─ supabase/                # Migrations e artefatos de banco
├─ stories/                 # Stories detalhadas (BMAD)
├─ STORIES.md               # Backlog resumido e status oficial
├─ prd Esportes Academy.md  # PRD do produto
├─ agents/                  # Artefatos de agentes/squad
├─ output/                  # Protótipos/saídas auxiliares
├─ _memory/                 # Memória de trabalho do squad
└─ _investigations/         # Investigações técnicas
```

## Pré-requisitos

- Node.js 20+
- npm 10+

## Configuração

1. Copie `.env.local.example` para `.env.local`
2. Preencha as variáveis do Supabase e ambiente

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Convenções de produto (BMAD)

- Quadro único de status: `STORIES.md`
- Especificações detalhadas: `stories/README.md` e arquivos `stories/*.md`
- PRD base: `prd Esportes Academy.md`

## Fluxo recomendado de execução

1. Abrir `STORIES.md` e marcar a próxima story como `in_progress`.
2. Ler a especificação detalhada correspondente em `stories/*.md`.
3. Implementar em ordem de dependência:
   - Epic 7 (SuperAdmin): `7.1` → `7.2` → `7.3` → `7.4`
   - Epic 8 (Permissões): `8.1` → `8.2` → `8.3` → `8.4`
   - Epic 9+ (Módulos de negócio): Saúde, Comunicação, Eventos, Competições
4. Validar localmente com `npm run build` (e `npm run lint` quando aplicável).
5. Atualizar status no `STORIES.md` e no índice `stories/README.md` para `done`.

## Bootstrap do primeiro SuperAdmin

Após aplicar as migrations mais recentes, crie o primeiro usuário interno da plataforma:

1. Crie/convide o usuário no Supabase Auth.
2. Insira um registro em `plataforma_usuarios` com:
   - `user_id` do usuário Auth
   - `perfil = 'super_admin'`
   - `ativo = true`
3. Faça login com esse usuário e acesse `/superadmin/escolas`.

## Observação

O projeto foi consolidado na raiz deste diretório (`esportes-academy-Desenvolvimento-do-site`).
