-- Migration: matriculas — Story 3.4
-- Enrollment contract per school; references optional plano template.

CREATE TABLE matriculas (
  id                uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id         uuid            NOT NULL REFERENCES atletas(id),
  escola_id         uuid            NOT NULL REFERENCES escolas(id),
  turma_id          uuid,
  plano_id          uuid            REFERENCES planos_pagamento(id),

  data_inicio       date            NOT NULL,
  data_fim          date,
  tipo_periodo      text            NOT NULL DEFAULT 'mensal'
    CHECK (tipo_periodo IN ('mensal', 'trimestral', 'semestral', 'anual', 'personalizado')),

  valor             numeric(10,2)   NOT NULL,
  desconto_pct      numeric(5,2)    NOT NULL DEFAULT 0
    CHECK (desconto_pct >= 0 AND desconto_pct <= 100),
  desconto_motivo   text,
  valor_liquido     numeric(10,2)   NOT NULL,
  dia_vencimento    smallint        NOT NULL
    CHECK (dia_vencimento BETWEEN 1 AND 28),
  forma_pagamento   text            NOT NULL DEFAULT 'qualquer'
    CHECK (forma_pagamento IN ('boleto', 'pix', 'cartao_credito', 'qualquer')),
  gerar_auto        boolean         NOT NULL DEFAULT true,

  total_parcelas    int,
  parcelas_geradas  int             NOT NULL DEFAULT 0,

  status            text            NOT NULL DEFAULT 'ativa'
    CHECK (status IN ('ativa', 'suspensa', 'cancelada', 'encerrada')),
  motivo_status     text,
  obs               text,

  criado_por        uuid            REFERENCES escola_usuarios(id),
  created_at        timestamptz     NOT NULL DEFAULT now(),
  updated_at        timestamptz     NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE TRIGGER handle_updated_at_matriculas
  BEFORE UPDATE ON matriculas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- At most one active enrollment per (atleta, escola) at a time (soft delete allows history)
CREATE UNIQUE INDEX matriculas_atleta_escola_ativa_idx
  ON matriculas (atleta_id, escola_id)
  WHERE deleted_at IS NULL AND status = 'ativa';

CREATE INDEX matriculas_escola_idx ON matriculas (escola_id) WHERE deleted_at IS NULL;
CREATE INDEX matriculas_plano_idx ON matriculas (plano_id) WHERE deleted_at IS NULL;

ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;

-- SELECT: staff of the school (financeiro needs read for future billing)
CREATE POLICY "matriculas_select_escola" ON matriculas
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria', 'financeiro')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- INSERT/UPDATE: cadastro escolar (not financeiro-only)
CREATE POLICY "matriculas_insert_escola" ON matriculas
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "matriculas_update_escola" ON matriculas
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- ── buscar_atleta_por_cpf: block duplicate active enrollment ─────────────────

CREATE OR REPLACE FUNCTION buscar_atleta_por_cpf(p_cpf text, p_escola_id uuid)
RETURNS TABLE (
  status          text,
  atleta_id       uuid,
  nome            text,
  data_nascimento date,
  sexo            text,
  foto_url        text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_atleta atletas%ROWTYPE;
BEGIN
  SELECT * INTO v_atleta FROM atletas WHERE cpf = p_cpf AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'novo'::text, NULL::uuid, NULL::text, NULL::date, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.atleta_id = v_atleta.id
      AND m.escola_id = p_escola_id
      AND m.status = 'ativa'
      AND m.deleted_at IS NULL
  ) THEN
    RETURN QUERY SELECT
      'mesma_escola'::text,
      v_atleta.id,
      v_atleta.nome,
      v_atleta.data_nascimento,
      v_atleta.sexo,
      v_atleta.foto_url;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    'existe'::text,
    v_atleta.id,
    v_atleta.nome,
    v_atleta.data_nascimento,
    v_atleta.sexo,
    v_atleta.foto_url;
END;
$$;
