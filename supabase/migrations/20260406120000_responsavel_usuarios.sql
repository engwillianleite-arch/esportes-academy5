-- Migration: App Pais MVP (vínculo auth usuário ↔ responsável)

CREATE TABLE responsavel_usuarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id  uuid NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo           boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (responsavel_id),
  UNIQUE (user_id)
);

CREATE TRIGGER handle_updated_at_responsavel_usuarios
  BEFORE UPDATE ON responsavel_usuarios
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX responsavel_usuarios_user_idx
  ON responsavel_usuarios (user_id)
  WHERE deleted_at IS NULL AND ativo = true;

ALTER TABLE responsavel_usuarios ENABLE ROW LEVEL SECURITY;

-- O próprio usuário pode ler seu vínculo.
CREATE POLICY "responsavel_usuarios_select_self" ON responsavel_usuarios
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Cadastro/vínculo controlado por server action com usuário autenticado.
CREATE POLICY "responsavel_usuarios_insert_self" ON responsavel_usuarios
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário pode desativar o próprio vínculo.
CREATE POLICY "responsavel_usuarios_update_self" ON responsavel_usuarios
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
