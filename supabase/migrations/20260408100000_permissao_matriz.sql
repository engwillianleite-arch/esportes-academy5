-- Migration: 20260408100000_permissao_matriz.sql
-- Story 8.1 — Matriz perfil × módulo editável (SuperAdmin)
-- Creates the perfil_modulo_acesso table and seeds it from the static PERMISSION_MATRIX.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS perfil_modulo_acesso (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_slug   text        NOT NULL,
  perfil        text        NOT NULL,
  ativo         boolean     NOT NULL DEFAULT true,
  atualizado_por uuid       REFERENCES auth.users(id),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT perfil_modulo_acesso_unique UNIQUE (modulo_slug, perfil)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- SELECT is public (permission matrix is not sensitive data).
-- INSERT/UPDATE/DELETE go through the service role (admin client) only.

ALTER TABLE perfil_modulo_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil_modulo_acesso_select_public"
  ON perfil_modulo_acesso FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies — only service role bypasses RLS.

-- ─── Seed (77 rows = 11 modules × 7 perfis) ──────────────────────────────────
-- Source of truth: src/lib/modulo-access.ts → PERMISSION_MATRIX

INSERT INTO perfil_modulo_acesso (modulo_slug, perfil, ativo) VALUES
  -- administrativo: all profiles have access
  ('administrativo', 'admin_escola',  true),
  ('administrativo', 'coordenador',   true),
  ('administrativo', 'professor',     true),
  ('administrativo', 'financeiro',    true),
  ('administrativo', 'secretaria',    true),
  ('administrativo', 'saude',         true),
  ('administrativo', 'marketing',     true),

  -- financeiro: admin_escola, coordenador, financeiro
  ('financeiro', 'admin_escola',  true),
  ('financeiro', 'coordenador',   true),
  ('financeiro', 'professor',     false),
  ('financeiro', 'financeiro',    true),
  ('financeiro', 'secretaria',    false),
  ('financeiro', 'saude',         false),
  ('financeiro', 'marketing',     false),

  -- comunicacao_basica: admin_escola, coordenador, secretaria, marketing
  ('comunicacao_basica', 'admin_escola',  true),
  ('comunicacao_basica', 'coordenador',   true),
  ('comunicacao_basica', 'professor',     false),
  ('comunicacao_basica', 'financeiro',    false),
  ('comunicacao_basica', 'secretaria',    true),
  ('comunicacao_basica', 'saude',         false),
  ('comunicacao_basica', 'marketing',     true),

  -- saude: admin_escola, coordenador, saude
  ('saude', 'admin_escola',  true),
  ('saude', 'coordenador',   true),
  ('saude', 'professor',     false),
  ('saude', 'financeiro',    false),
  ('saude', 'secretaria',    false),
  ('saude', 'saude',         true),
  ('saude', 'marketing',     false),

  -- eventos: admin_escola, coordenador, secretaria, marketing, professor
  ('eventos', 'admin_escola',  true),
  ('eventos', 'coordenador',   true),
  ('eventos', 'professor',     true),
  ('eventos', 'financeiro',    false),
  ('eventos', 'secretaria',    true),
  ('eventos', 'saude',         false),
  ('eventos', 'marketing',     true),

  -- treinamentos: admin_escola, coordenador, professor
  ('treinamentos', 'admin_escola',  true),
  ('treinamentos', 'coordenador',   true),
  ('treinamentos', 'professor',     true),
  ('treinamentos', 'financeiro',    false),
  ('treinamentos', 'secretaria',    false),
  ('treinamentos', 'saude',         false),
  ('treinamentos', 'marketing',     false),

  -- comunicacao_avancada: admin_escola, coordenador, marketing
  ('comunicacao_avancada', 'admin_escola',  true),
  ('comunicacao_avancada', 'coordenador',   true),
  ('comunicacao_avancada', 'professor',     false),
  ('comunicacao_avancada', 'financeiro',    false),
  ('comunicacao_avancada', 'secretaria',    false),
  ('comunicacao_avancada', 'saude',         false),
  ('comunicacao_avancada', 'marketing',     true),

  -- relatorios: admin_escola, coordenador, financeiro
  ('relatorios', 'admin_escola',  true),
  ('relatorios', 'coordenador',   true),
  ('relatorios', 'professor',     false),
  ('relatorios', 'financeiro',    true),
  ('relatorios', 'secretaria',    false),
  ('relatorios', 'saude',         false),
  ('relatorios', 'marketing',     false),

  -- competicoes: admin_escola, coordenador, professor
  ('competicoes', 'admin_escola',  true),
  ('competicoes', 'coordenador',   true),
  ('competicoes', 'professor',     true),
  ('competicoes', 'financeiro',    false),
  ('competicoes', 'secretaria',    false),
  ('competicoes', 'saude',         false),
  ('competicoes', 'marketing',     false),

  -- metodologia: admin_escola, coordenador, professor
  ('metodologia', 'admin_escola',  true),
  ('metodologia', 'coordenador',   true),
  ('metodologia', 'professor',     true),
  ('metodologia', 'financeiro',    false),
  ('metodologia', 'secretaria',    false),
  ('metodologia', 'saude',         false),
  ('metodologia', 'marketing',     false),

  -- cursos: all profiles
  ('cursos', 'admin_escola',  true),
  ('cursos', 'coordenador',   true),
  ('cursos', 'professor',     true),
  ('cursos', 'financeiro',    true),
  ('cursos', 'secretaria',    true),
  ('cursos', 'saude',         true),
  ('cursos', 'marketing',     true)

ON CONFLICT (modulo_slug, perfil) DO NOTHING;
