-- Migration: turmas — Epic 4 (Stories 4.1–4.2)
-- Turmas (grupos) por escola; matriculas.turma_id referencia esta tabela.

CREATE TABLE turmas (
  id               uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id        uuid            NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome             text            NOT NULL,
  modalidade       text            NOT NULL,
  local            text,
  capacidade_max   smallint        NOT NULL DEFAULT 20
    CHECK (capacidade_max > 0),
  idade_min        smallint        CHECK (idade_min IS NULL OR idade_min >= 0),
  idade_max        smallint,
  professor_nome   text,
  dia_semana       smallint        CHECK (dia_semana IS NULL OR (dia_semana >= 0 AND dia_semana <= 6)),
  hora_inicio      time,
  hora_fim         time,
  ativo            boolean         NOT NULL DEFAULT true,
  deleted_at       timestamptz,
  created_at       timestamptz     NOT NULL DEFAULT now(),
  updated_at       timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT turmas_idade_check
    CHECK (idade_max IS NULL OR idade_min IS NULL OR idade_max >= idade_min),
  CONSTRAINT turmas_horario_check
    CHECK (
      (hora_inicio IS NULL AND hora_fim IS NULL)
      OR (hora_inicio IS NOT NULL AND hora_fim IS NOT NULL AND hora_fim > hora_inicio)
    )
);

CREATE TRIGGER handle_updated_at_turmas
  BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX turmas_escola_ativo_idx
  ON turmas (escola_id)
  WHERE deleted_at IS NULL;

ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;

-- Leitura: equipe pedagógica/admin da escola
CREATE POLICY "turmas_select_escola" ON turmas
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'professor', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- Escrita: apenas admin_escola (coord/secretaria leem — memória Escola-grupos)
CREATE POLICY "turmas_insert_escola" ON turmas
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil = 'admin_escola'
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "turmas_update_escola" ON turmas
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil = 'admin_escola'
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil = 'admin_escola'
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "turmas_delete_escola" ON turmas
  FOR DELETE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil = 'admin_escola'
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- FK matriculas → turmas (coluna já existia sem FK)
ALTER TABLE matriculas
  ADD CONSTRAINT matriculas_turma_id_fkey
  FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL;
