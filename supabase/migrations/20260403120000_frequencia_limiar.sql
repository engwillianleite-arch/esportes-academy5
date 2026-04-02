-- Story 5.2: limiar de alerta de frequência + RPCs agregados (coordenador / admin / secretaria)

ALTER TABLE escolas
  ADD COLUMN limiar_freq_pct smallint NOT NULL DEFAULT 75
    CHECK (limiar_freq_pct >= 0 AND limiar_freq_pct <= 100);

-- Resumo por matrícula (lista de atletas)
CREATE OR REPLACE FUNCTION public.frequencia_resumo_matriculas(p_escola_id uuid, p_matricula_ids uuid[])
RETURNS TABLE (matricula_id uuid, total bigint, presentes bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escola_usuarios eu
    WHERE eu.user_id = auth.uid()
      AND eu.escola_id = p_escola_id
      AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
      AND eu.ativo = true
      AND eu.deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  IF p_matricula_ids IS NULL OR cardinality(p_matricula_ids) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pr.matricula_id,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE pr.status = 'presente')::bigint AS presentes
  FROM presencas_registros pr
  INNER JOIN matriculas m ON m.id = pr.matricula_id AND m.escola_id = p_escola_id
  WHERE pr.matricula_id = ANY(p_matricula_ids)
  GROUP BY pr.matricula_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.frequencia_resumo_matriculas(uuid, uuid[]) TO authenticated;

-- Histórico por matrícula (detalhe)
CREATE OR REPLACE FUNCTION public.historico_presencas_matricula(p_escola_id uuid, p_matricula_id uuid)
RETURNS TABLE (
  data_aula date,
  turma_nome text,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escola_usuarios eu
    WHERE eu.user_id = auth.uid()
      AND eu.escola_id = p_escola_id
      AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
      AND eu.ativo = true
      AND eu.deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = p_matricula_id AND m.escola_id = p_escola_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.data_aula, t.nome, pr.status
  FROM presencas_registros pr
  JOIN aulas a ON a.id = pr.aula_id
  JOIN turmas t ON t.id = a.turma_id
  WHERE pr.matricula_id = p_matricula_id
  ORDER BY a.data_aula DESC
  LIMIT 60;
END;
$$;

GRANT EXECUTE ON FUNCTION public.historico_presencas_matricula(uuid, uuid) TO authenticated;
