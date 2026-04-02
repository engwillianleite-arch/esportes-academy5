-- Migration: create_escolas
-- Creates the core tenant registry table with RLS

-- Enable moddatetime extension for updated_at triggers
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE escolas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  cnpj        TEXT        UNIQUE,
  email       TEXT,
  telefone    TEXT,
  plano       TEXT        NOT NULL DEFAULT 'starter'
                          CHECK (plano IN ('starter', 'pro', 'enterprise')),
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_escolas
  BEFORE UPDATE ON escolas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;

-- SELECT policy is created in migration 20260327000002 (after escola_usuarios table exists)
-- INSERT/UPDATE/DELETE: blocked for authenticated users
-- School management is performed by service_role (SuperAdmin portal — Epic 7)
