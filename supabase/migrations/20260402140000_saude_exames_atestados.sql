-- Story 9.3 - exames, atestados e linha do tempo clinica do atleta

CREATE TABLE atleta_exames (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id          uuid NOT NULL REFERENCES atletas(id) ON DELETE CASCADE,
  escola_id          uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula_id       uuid REFERENCES matriculas(id) ON DELETE SET NULL,
  tipo_exame         text NOT NULL CHECK (tipo_exame IN ('clinico', 'esportivo', 'laboratorial')),
  titulo             text NOT NULL,
  data_exame         date NOT NULL,
  resultado_resumido text,
  arquivo_url        text,
  recorrente         boolean NOT NULL DEFAULT false,
  proximo_vencimento date,
  criado_por         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_atleta_exames
  BEFORE UPDATE ON atleta_exames
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX atleta_exames_escola_data_idx
  ON atleta_exames (escola_id, data_exame DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_exames_atleta_data_idx
  ON atleta_exames (atleta_id, data_exame DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_exames_vencimento_idx
  ON atleta_exames (escola_id, proximo_vencimento)
  WHERE deleted_at IS NULL AND proximo_vencimento IS NOT NULL;

CREATE TABLE atleta_atestados (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id          uuid NOT NULL REFERENCES atletas(id) ON DELETE CASCADE,
  escola_id          uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula_id       uuid REFERENCES matriculas(id) ON DELETE SET NULL,
  titulo             text NOT NULL,
  observacao         text,
  data_emissao       date NOT NULL,
  validade_ate       date,
  arquivo_url        text,
  criado_por         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_atleta_atestados
  BEFORE UPDATE ON atleta_atestados
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX atleta_atestados_escola_emissao_idx
  ON atleta_atestados (escola_id, data_emissao DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_atestados_atleta_emissao_idx
  ON atleta_atestados (atleta_id, data_emissao DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_atestados_validade_idx
  ON atleta_atestados (escola_id, validade_ate)
  WHERE deleted_at IS NULL AND validade_ate IS NOT NULL;

CREATE OR REPLACE FUNCTION public.trg_saude_valida_matricula_escola()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_atleta_id uuid;
  v_escola_id uuid;
BEGIN
  IF NEW.matricula_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT m.atleta_id, m.escola_id
    INTO v_atleta_id, v_escola_id
  FROM matriculas m
  WHERE m.id = NEW.matricula_id
    AND m.deleted_at IS NULL;

  IF v_atleta_id IS NULL THEN
    RAISE EXCEPTION 'Matricula invalida para registro de saude.';
  END IF;

  IF v_atleta_id IS DISTINCT FROM NEW.atleta_id THEN
    RAISE EXCEPTION 'A matricula nao pertence ao atleta informado.';
  END IF;

  IF v_escola_id IS DISTINCT FROM NEW.escola_id THEN
    RAISE EXCEPTION 'A matricula nao pertence a escola informada.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER atleta_exames_valida_contexto
  BEFORE INSERT OR UPDATE ON atleta_exames
  FOR EACH ROW EXECUTE FUNCTION public.trg_saude_valida_matricula_escola();

CREATE TRIGGER atleta_atestados_valida_contexto
  BEFORE INSERT OR UPDATE ON atleta_atestados
  FOR EACH ROW EXECUTE FUNCTION public.trg_saude_valida_matricula_escola();

ALTER TABLE atleta_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE atleta_atestados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atleta_exames_select_escola_ou_responsavel" ON atleta_exames
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM responsavel_usuarios ru
      JOIN atleta_responsaveis ar
        ON ar.responsavel_id = ru.responsavel_id
       AND ar.deleted_at IS NULL
      WHERE ru.user_id = auth.uid()
        AND ru.ativo = true
        AND ru.deleted_at IS NULL
        AND ar.atleta_id = atleta_exames.atleta_id
    )
  );

CREATE POLICY "atleta_exames_write_escola" ON atleta_exames
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "atleta_exames_update_escola" ON atleta_exames
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "atleta_atestados_select_escola_ou_responsavel" ON atleta_atestados
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM responsavel_usuarios ru
      JOIN atleta_responsaveis ar
        ON ar.responsavel_id = ru.responsavel_id
       AND ar.deleted_at IS NULL
      WHERE ru.user_id = auth.uid()
        AND ru.ativo = true
        AND ru.deleted_at IS NULL
        AND ar.atleta_id = atleta_atestados.atleta_id
    )
  );

CREATE POLICY "atleta_atestados_write_escola" ON atleta_atestados
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "atleta_atestados_update_escola" ON atleta_atestados
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'saude')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );
