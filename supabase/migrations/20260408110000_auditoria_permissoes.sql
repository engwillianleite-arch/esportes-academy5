-- Migration: 20260408110000_auditoria_permissoes.sql
-- Story 8.2 — Auditoria de alterações em permissões
-- Append-only audit log for permission and module changes made by SuperAdmins.
--
-- Política de retenção: mínimo recomendado de 1 ano para compliance.
-- Limpeza de entradas antigas (> 1 ano) deve ser feita via cron job ou manualmente.
-- Exemplo de limpeza: DELETE FROM auditoria_permissoes WHERE criado_em < now() - interval '1 year';

-- ─── Table ────────────────────────────────────────────────────────────────────
-- Tipos de evento (campo `tipo`):
--   'permissao_matriz'  — alteração no grid módulo × perfil (Story 8.1)
--   'modulo_escola'     — ativar/desativar módulo avulso de uma escola
--   'plano_escola'      — mudança de plano SaaS da escola

CREATE TABLE IF NOT EXISTS auditoria_permissoes (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text          NOT NULL,
  escola_id     uuid          REFERENCES escolas(id),
  ator_id       uuid          NOT NULL REFERENCES auth.users(id),
  ator_email    text,
  modulo_slug   text,
  perfil        text,
  valor_antes   boolean,
  valor_depois  boolean,
  detalhes      jsonb,
  ip            text,
  criado_em     timestamptz   NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS auditoria_permissoes_criado_em_idx  ON auditoria_permissoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS auditoria_permissoes_escola_id_idx  ON auditoria_permissoes (escola_id);
CREATE INDEX IF NOT EXISTS auditoria_permissoes_ator_id_idx    ON auditoria_permissoes (ator_id);
CREATE INDEX IF NOT EXISTS auditoria_permissoes_tipo_idx       ON auditoria_permissoes (tipo);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- No public SELECT — only service role (admin client) can read or insert.
-- This table is never exposed to anon or authenticated roles directly.

ALTER TABLE auditoria_permissoes ENABLE ROW LEVEL SECURITY;

-- No policies defined: only the service role (which bypasses RLS) may access this table.
-- INSERT and SELECT happen exclusively via createAdminClient() in superadmin-actions.ts.
