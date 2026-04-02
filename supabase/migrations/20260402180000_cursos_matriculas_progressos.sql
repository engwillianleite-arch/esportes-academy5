-- Story 16.4 - matriculas, assinatura, compra individual e progresso

CREATE TABLE curso_assinaturas_usuarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id   uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text,
  status      text NOT NULL DEFAULT 'ativa'
                CHECK (status IN ('ativa', 'suspensa', 'cancelada', 'expirada')),
  inicio_em   date NOT NULL,
  fim_em      date,
  origem      text NOT NULL DEFAULT 'manual'
                CHECK (origem IN ('manual', 'financeiro', 'admin')),
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_curso_assinaturas_usuarios
  BEFORE UPDATE ON curso_assinaturas_usuarios
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_assinaturas_usuarios_escola_user_idx
  ON curso_assinaturas_usuarios (escola_id, user_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE curso_matriculas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id            uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  escola_id           uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assinatura_id       uuid REFERENCES curso_assinaturas_usuarios(id) ON DELETE SET NULL,
  origem_liberacao    text NOT NULL
                        CHECK (origem_liberacao IN ('manual', 'compra_individual', 'assinatura')),
  status              text NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo', 'concluido', 'suspenso', 'expirado', 'cancelado')),
  valor_pago          numeric(10,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  liberado_em         timestamptz NOT NULL DEFAULT now(),
  expira_em           timestamptz,
  ultima_atividade_em timestamptz,
  progresso_pct       numeric(5,2) NOT NULL DEFAULT 0 CHECK (progresso_pct >= 0 AND progresso_pct <= 100),
  aprovado            boolean NOT NULL DEFAULT false,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_curso_matriculas
  BEFORE UPDATE ON curso_matriculas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_matriculas_escola_user_idx
  ON curso_matriculas (escola_id, user_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX curso_matriculas_curso_user_idx
  ON curso_matriculas (curso_id, user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE curso_aula_progresso (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id            uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  aula_id             uuid NOT NULL REFERENCES curso_aulas(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula_id        uuid REFERENCES curso_matriculas(id) ON DELETE SET NULL,
  concluida           boolean NOT NULL DEFAULT false,
  concluida_em        timestamptz,
  ultima_interacao_em timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, aula_id)
);

CREATE TRIGGER handle_updated_at_curso_aula_progresso
  BEFORE UPDATE ON curso_aula_progresso
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_aula_progresso_user_curso_idx
  ON curso_aula_progresso (user_id, curso_id, updated_at DESC);

ALTER TABLE curso_assinaturas_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_aula_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curso_assinaturas_select_own_or_escola" ON curso_assinaturas_usuarios
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_assinaturas_usuarios.escola_id
        AND eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_assinaturas_write_escola" ON curso_assinaturas_usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_assinaturas_usuarios.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_assinaturas_update_escola" ON curso_assinaturas_usuarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_assinaturas_usuarios.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_assinaturas_usuarios.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_matriculas_select_own_or_escola" ON curso_matriculas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_matriculas.escola_id
        AND eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_matriculas_insert_own_or_escola" ON curso_matriculas
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_matriculas.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_matriculas_update_own_or_escola" ON curso_matriculas
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_matriculas.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM escola_usuarios eu
      WHERE eu.escola_id = curso_matriculas.escola_id
        AND eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_aula_progresso_select_own_or_escola" ON curso_aula_progresso
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM curso_matriculas cm
      JOIN escola_usuarios eu
        ON eu.escola_id = cm.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE cm.id = curso_aula_progresso.matricula_id
        AND cm.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_aula_progresso_insert_own" ON curso_aula_progresso
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "curso_aula_progresso_update_own_or_escola" ON curso_aula_progresso
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM curso_matriculas cm
      JOIN escola_usuarios eu
        ON eu.escola_id = cm.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE cm.id = curso_aula_progresso.matricula_id
        AND cm.deleted_at IS NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM curso_matriculas cm
      JOIN escola_usuarios eu
        ON eu.escola_id = cm.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE cm.id = curso_aula_progresso.matricula_id
        AND cm.deleted_at IS NULL
    )
  );
