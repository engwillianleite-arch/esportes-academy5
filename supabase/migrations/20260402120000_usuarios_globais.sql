CREATE TABLE IF NOT EXISTS usuarios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf          text NOT NULL,
  nome         text NOT NULL,
  email        text,
  ativo        boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_cpf_format_check CHECK (cpf ~ '^\d{11}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_cpf_active_idx
  ON usuarios (cpf)
  WHERE deleted_at IS NULL;

CREATE TRIGGER handle_updated_at_usuarios
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select_self" ON usuarios;
CREATE POLICY "usuarios_select_self" ON usuarios
  FOR SELECT
  USING (auth_user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "usuarios_insert_self" ON usuarios;
CREATE POLICY "usuarios_insert_self" ON usuarios
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "usuarios_update_self" ON usuarios;
CREATE POLICY "usuarios_update_self" ON usuarios
  FOR UPDATE
  USING (auth_user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (auth_user_id = auth.uid());
