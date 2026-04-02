CREATE TABLE IF NOT EXISTS usuario_escola_tipos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  escola_id    uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  tipo_usuario text NOT NULL CHECK (tipo_usuario IN (
    'admin_escola',
    'coordenador',
    'professor',
    'financeiro',
    'secretaria',
    'saude',
    'marketing',
    'responsavel'
  )),
  principal    boolean NOT NULL DEFAULT false,
  origem       text,
  ref_id       uuid,
  ativo        boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuario_escola_tipos_unique_active_idx
  ON usuario_escola_tipos (usuario_id, escola_id, tipo_usuario)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS usuario_escola_tipos_usuario_idx
  ON usuario_escola_tipos (usuario_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS usuario_escola_tipos_escola_idx
  ON usuario_escola_tipos (escola_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER handle_updated_at_usuario_escola_tipos
  BEFORE UPDATE ON usuario_escola_tipos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE usuario_escola_tipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario_escola_tipos_select_self" ON usuario_escola_tipos;
CREATE POLICY "usuario_escola_tipos_select_self" ON usuario_escola_tipos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      WHERE u.id = usuario_escola_tipos.usuario_id
        AND u.auth_user_id = auth.uid()
        AND u.deleted_at IS NULL
    )
  );
