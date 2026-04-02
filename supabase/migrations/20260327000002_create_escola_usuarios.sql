-- Migration: create_escola_usuarios
-- User-school profile linkage table (stub — full UI in Story 1.4)
-- Required by Story 1.2 for RLS policies on escolas and escola_modulos

CREATE TABLE escola_usuarios (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  escola_id  UUID        NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  perfil     TEXT        NOT NULL DEFAULT 'admin_escola'
                         CHECK (perfil IN (
                           'admin_escola', 'coordenador', 'professor',
                           'financeiro', 'secretaria', 'saude', 'marketing'
                         )),
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, escola_id)
);

CREATE TRIGGER handle_updated_at_escola_usuarios
  BEFORE UPDATE ON escola_usuarios
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE escola_usuarios ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own active (non-soft-deleted) escola_usuarios rows
CREATE POLICY "escola_usuarios_select_own" ON escola_usuarios
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT policy for escolas (created here because escola_usuarios must exist first)
-- Users can only see schools they belong to (active, non-soft-deleted membership)
CREATE POLICY "escolas_select_own" ON escolas
  FOR SELECT USING (
    id IN (
      SELECT escola_id FROM escola_usuarios
      WHERE user_id = auth.uid()
        AND ativo = true
        AND deleted_at IS NULL
    )
  );
