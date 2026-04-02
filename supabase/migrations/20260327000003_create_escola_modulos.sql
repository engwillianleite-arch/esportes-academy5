-- Migration: create_escola_modulos
-- Feature flag table — tracks which modules are active per school
-- 11 module slugs correspond to ADR-001 module system

CREATE TABLE escola_modulos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id    UUID        NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  modulo_slug  TEXT        NOT NULL
                           CHECK (modulo_slug IN (
                             'administrativo', 'financeiro', 'comunicacao_basica',
                             'saude', 'eventos', 'treinamentos', 'comunicacao_avancada',
                             'relatorios', 'competicoes', 'metodologia', 'cursos'
                           )),
  ativo        BOOLEAN     NOT NULL DEFAULT true,
  liberado_por UUID        REFERENCES auth.users(id),
  liberado_em  TIMESTAMPTZ,
  expira_em    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (escola_id, modulo_slug)
);

CREATE TRIGGER handle_updated_at_escola_modulos
  BEFORE UPDATE ON escola_modulos
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE escola_modulos ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see modules for their own escola(s)
CREATE POLICY "escola_modulos_select_own" ON escola_modulos
  FOR SELECT USING (
    escola_id IN (
      SELECT escola_id FROM escola_usuarios
      WHERE user_id = auth.uid()
        AND ativo = true
        AND deleted_at IS NULL
    )
  );
