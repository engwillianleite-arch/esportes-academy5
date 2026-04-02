-- Migration: presenças / chamada — Story 5.1
-- Aulas (instância turma + data), registros por matrícula, professor vinculado à turma.

-- ── Professor logado na turma (RLS: professor vê só turmas onde é o responsável) ──

ALTER TABLE turmas
  ADD COLUMN professor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX turmas_professor_user_idx
  ON turmas (professor_user_id)
  WHERE deleted_at IS NULL AND professor_user_id IS NOT NULL;

-- ── RPC: lista membros (e-mail) para o admin vincular professor à turma ─────────

CREATE OR REPLACE FUNCTION public.listar_membros_escola(p_escola_id uuid)
RETURNS TABLE (
  user_id uuid,
  perfil text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT eu.user_id, eu.perfil::text, u.email::text
  FROM escola_usuarios eu
  JOIN auth.users u ON u.id = eu.user_id
  WHERE eu.escola_id = p_escola_id
    AND eu.deleted_at IS NULL
    AND eu.ativo = true
    AND EXISTS (
      SELECT 1 FROM escola_usuarios me
      WHERE me.user_id = auth.uid()
        AND me.escola_id = p_escola_id
        AND me.perfil = 'admin_escola'
        AND me.ativo = true
        AND me.deleted_at IS NULL
    );
$$;

GRANT EXECUTE ON FUNCTION public.listar_membros_escola(uuid) TO authenticated;

-- ── RPC: chamada editável dentro da janela (fim do dia da aula + janela_chamada_h) ──

CREATE OR REPLACE FUNCTION public.chamada_pode_editar(p_data date, p_escola_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz text;
  v_janela int;
  v_hoje date;
  v_deadline timestamptz;
BEGIN
  SELECT e.fuso_horario, e.janela_chamada_h
  INTO v_tz, v_janela
  FROM escolas e
  WHERE e.id = p_escola_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_hoje := (current_timestamp AT TIME ZONE v_tz)::date;

  IF p_data > v_hoje THEN
    RETURN false;
  END IF;

  v_deadline :=
    ((p_data::timestamp + time '23:59:59') AT TIME ZONE v_tz)
    + (v_janela || ' hours')::interval;

  RETURN current_timestamp <= v_deadline;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chamada_pode_editar(date, uuid) TO authenticated;

-- ── Tabelas ───────────────────────────────────────────────────────────────────

CREATE TABLE aulas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id   uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  turma_id    uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data_aula   date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT aulas_turma_data_unique UNIQUE (turma_id, data_aula)
);

CREATE TRIGGER handle_updated_at_aulas
  BEFORE UPDATE ON aulas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX aulas_escola_data_idx ON aulas (escola_id, data_aula DESC);
CREATE INDEX aulas_turma_idx ON aulas (turma_id);

CREATE TABLE presencas_registros (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id       uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  matricula_id  uuid NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  status        text NOT NULL
    CHECK (status IN ('presente', 'ausente', 'justificada')),
  observacao    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT presencas_aula_matricula_unique UNIQUE (aula_id, matricula_id)
);

CREATE TRIGGER handle_updated_at_presencas_registros
  BEFORE UPDATE ON presencas_registros
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX presencas_registros_aula_idx ON presencas_registros (aula_id);
CREATE INDEX presencas_registros_matricula_idx ON presencas_registros (matricula_id);

-- Matrícula deve ser da mesma turma da aula
CREATE OR REPLACE FUNCTION public.trg_presencas_valida_turma_matricula()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_turma_aula uuid;
  v_turma_mat  uuid;
BEGIN
  SELECT a.turma_id INTO v_turma_aula FROM aulas a WHERE a.id = NEW.aula_id;
  SELECT m.turma_id INTO v_turma_mat FROM matriculas m WHERE m.id = NEW.matricula_id;

  IF v_turma_aula IS NULL OR v_turma_mat IS NULL THEN
    RAISE EXCEPTION 'Aula ou matrícula inválida';
  END IF;

  IF v_turma_aula IS DISTINCT FROM v_turma_mat THEN
    RAISE EXCEPTION 'Matrícula não pertence à turma da aula';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER presencas_valida_turma_matricula
  BEFORE INSERT OR UPDATE ON presencas_registros
  FOR EACH ROW EXECUTE FUNCTION public.trg_presencas_valida_turma_matricula();

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas_registros ENABLE ROW LEVEL SECURITY;

-- ── Matrículas: professor pode ler matrículas da(s) turma(s) onde é responsável ──

CREATE POLICY "matriculas_select_professor_turma" ON matriculas
  FOR SELECT TO authenticated
  USING (
    turma_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM turmas t
      JOIN escola_usuarios eu
        ON eu.escola_id = t.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil = 'professor'
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE t.id = matriculas.turma_id
        AND t.professor_user_id = auth.uid()
        AND t.deleted_at IS NULL
    )
  );

-- ── aulas: leitura ─────────────────────────────────────────────────────────────

CREATE POLICY "aulas_select_staff" ON aulas
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
    )
    OR EXISTS (
      SELECT 1 FROM turmas t
      JOIN escola_usuarios eu
        ON eu.escola_id = t.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil = 'professor'
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE t.id = aulas.turma_id
        AND t.professor_user_id = auth.uid()
        AND t.deleted_at IS NULL
    )
  );

CREATE POLICY "aulas_insert" ON aulas
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
    )
    OR EXISTS (
      SELECT 1 FROM turmas t
      JOIN escola_usuarios eu
        ON eu.escola_id = t.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil = 'professor'
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE t.id = turma_id
        AND t.escola_id = escola_id
        AND t.professor_user_id = auth.uid()
        AND t.deleted_at IS NULL
    )
  );

CREATE POLICY "aulas_update" ON aulas
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
    )
    OR EXISTS (
      SELECT 1 FROM turmas t
      JOIN escola_usuarios eu
        ON eu.escola_id = t.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil = 'professor'
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE t.id = aulas.turma_id
        AND t.professor_user_id = auth.uid()
        AND t.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
    )
    OR EXISTS (
      SELECT 1 FROM turmas t
      JOIN escola_usuarios eu
        ON eu.escola_id = t.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil = 'professor'
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE t.id = aulas.turma_id
        AND t.professor_user_id = auth.uid()
        AND t.deleted_at IS NULL
    )
  );

-- ── presencas_registros (mesmo universo de acesso que a aula) ───────────────────

CREATE POLICY "presencas_select" ON presencas_registros
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM aulas a
      WHERE a.id = presencas_registros.aula_id
        AND (
          a.escola_id IN (
            SELECT eu.escola_id FROM escola_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.ativo = true
              AND eu.deleted_at IS NULL
              AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
          )
          OR EXISTS (
            SELECT 1 FROM turmas t
            JOIN escola_usuarios eu
              ON eu.escola_id = t.escola_id
             AND eu.user_id = auth.uid()
             AND eu.perfil = 'professor'
             AND eu.ativo = true
             AND eu.deleted_at IS NULL
            WHERE t.id = a.turma_id
              AND t.professor_user_id = auth.uid()
              AND t.deleted_at IS NULL
          )
        )
    )
  );

CREATE POLICY "presencas_insert" ON presencas_registros
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aulas a
      WHERE a.id = aula_id
        AND (
          a.escola_id IN (
            SELECT eu.escola_id FROM escola_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.ativo = true
              AND eu.deleted_at IS NULL
              AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
          )
          OR EXISTS (
            SELECT 1 FROM turmas t
            JOIN escola_usuarios eu
              ON eu.escola_id = t.escola_id
             AND eu.user_id = auth.uid()
             AND eu.perfil = 'professor'
             AND eu.ativo = true
             AND eu.deleted_at IS NULL
            WHERE t.id = a.turma_id
              AND t.professor_user_id = auth.uid()
              AND t.deleted_at IS NULL
          )
        )
    )
  );

CREATE POLICY "presencas_update" ON presencas_registros
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM aulas a
      WHERE a.id = presencas_registros.aula_id
        AND (
          a.escola_id IN (
            SELECT eu.escola_id FROM escola_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.ativo = true
              AND eu.deleted_at IS NULL
              AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
          )
          OR EXISTS (
            SELECT 1 FROM turmas t
            JOIN escola_usuarios eu
              ON eu.escola_id = t.escola_id
             AND eu.user_id = auth.uid()
             AND eu.perfil = 'professor'
             AND eu.ativo = true
             AND eu.deleted_at IS NULL
            WHERE t.id = a.turma_id
              AND t.professor_user_id = auth.uid()
              AND t.deleted_at IS NULL
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aulas a
      WHERE a.id = aula_id
        AND (
          a.escola_id IN (
            SELECT eu.escola_id FROM escola_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.ativo = true
              AND eu.deleted_at IS NULL
              AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
          )
          OR EXISTS (
            SELECT 1 FROM turmas t
            JOIN escola_usuarios eu
              ON eu.escola_id = t.escola_id
             AND eu.user_id = auth.uid()
             AND eu.perfil = 'professor'
             AND eu.ativo = true
             AND eu.deleted_at IS NULL
            WHERE t.id = a.turma_id
              AND t.professor_user_id = auth.uid()
              AND t.deleted_at IS NULL
          )
        )
    )
  );

CREATE POLICY "presencas_delete" ON presencas_registros
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM aulas a
      WHERE a.id = presencas_registros.aula_id
        AND (
          a.escola_id IN (
            SELECT eu.escola_id FROM escola_usuarios eu
            WHERE eu.user_id = auth.uid()
              AND eu.ativo = true
              AND eu.deleted_at IS NULL
              AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
          )
          OR EXISTS (
            SELECT 1 FROM turmas t
            JOIN escola_usuarios eu
              ON eu.escola_id = t.escola_id
             AND eu.user_id = auth.uid()
             AND eu.perfil = 'professor'
             AND eu.ativo = true
             AND eu.deleted_at IS NULL
            WHERE t.id = a.turma_id
              AND t.professor_user_id = auth.uid()
              AND t.deleted_at IS NULL
          )
        )
    )
  );
