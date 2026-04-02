-- Story 16.2 - estrutura de cursos, modulos e aulas

CREATE TABLE curso_modulos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id        uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  descricao       text,
  ordem           integer NOT NULL CHECK (ordem >= 1),
  published       boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curso_id, ordem)
);

CREATE TRIGGER handle_updated_at_curso_modulos
  BEFORE UPDATE ON curso_modulos
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_modulos_curso_ordem_idx
  ON curso_modulos (curso_id, ordem)
  WHERE deleted_at IS NULL;

CREATE TABLE curso_aulas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id         uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  modulo_id        uuid NOT NULL REFERENCES curso_modulos(id) ON DELETE CASCADE,
  titulo           text NOT NULL,
  descricao        text,
  ordem            integer NOT NULL CHECK (ordem >= 1),
  video_url        text,
  pdf_url          text,
  texto_conteudo   text,
  quiz_habilitado  boolean NOT NULL DEFAULT false,
  published        boolean NOT NULL DEFAULT true,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (modulo_id, ordem)
);

CREATE TRIGGER handle_updated_at_curso_aulas
  BEFORE UPDATE ON curso_aulas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_aulas_modulo_ordem_idx
  ON curso_aulas (modulo_id, ordem)
  WHERE deleted_at IS NULL;

ALTER TABLE curso_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curso_modulos_select_escola" ON curso_modulos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_modulos.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_modulos_write_escola" ON curso_modulos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_modulos.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_modulos_update_escola" ON curso_modulos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_modulos.curso_id
        AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_modulos.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_aulas_select_escola" ON curso_aulas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_aulas.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_aulas_write_escola" ON curso_aulas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_aulas.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_aulas_update_escola" ON curso_aulas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_aulas.curso_id
        AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_aulas.curso_id
        AND c.deleted_at IS NULL
    )
  );
