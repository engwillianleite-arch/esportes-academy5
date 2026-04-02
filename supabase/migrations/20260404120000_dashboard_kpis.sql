-- Migration: dashboard KPI RPCs — Story 4.4
-- Two SECURITY DEFINER RPCs that aggregate escola-scoped KPIs for the admin dashboard.

-- ── RPC: escola-wide KPI counts ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dashboard_kpis_escola(p_escola_id uuid)
RETURNS TABLE (
  atletas_ativos    bigint,
  turmas_ativas     bigint,
  aulas_hoje        bigint,
  aulas_com_chamada bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz   text;
  v_hoje date;
BEGIN
  -- Auth guard: caller must be an active member of this escola
  IF NOT EXISTS (
    SELECT 1 FROM escola_usuarios eu
    WHERE eu.user_id = auth.uid()
      AND eu.escola_id = p_escola_id
      AND eu.ativo = true
      AND eu.deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  SELECT e.fuso_horario INTO v_tz
  FROM escolas e
  WHERE e.id = p_escola_id;

  v_hoje := (current_timestamp AT TIME ZONE COALESCE(v_tz, 'America/Sao_Paulo'))::date;

  RETURN QUERY
  SELECT
    -- Active athletes (active enrollments, not deleted)
    (SELECT COUNT(*)::bigint
     FROM matriculas m
     WHERE m.escola_id = p_escola_id
       AND m.status = 'ativa'
       AND m.deleted_at IS NULL),

    -- Active groups
    (SELECT COUNT(*)::bigint
     FROM turmas t
     WHERE t.escola_id = p_escola_id
       AND t.ativo = true
       AND t.deleted_at IS NULL),

    -- Classes today (aulas records for today)
    (SELECT COUNT(*)::bigint
     FROM aulas a
     WHERE a.escola_id = p_escola_id
       AND a.data_aula = v_hoje),

    -- Classes today that have at least one presença record
    (SELECT COUNT(DISTINCT a.id)::bigint
     FROM aulas a
     WHERE a.escola_id = p_escola_id
       AND a.data_aula = v_hoje
       AND EXISTS (
         SELECT 1 FROM presencas_registros pr WHERE pr.aula_id = a.id
       ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_kpis_escola(uuid) TO authenticated;

-- ── RPC: per-turma chamada status for today ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.aulas_hoje_status(
  p_escola_id uuid,
  p_user_id   uuid,
  p_perfil    text
)
RETURNS TABLE (
  turma_id           uuid,
  turma_nome         text,
  matriculas_ativas  bigint,
  registros_presenca bigint,
  chamada_feita      boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz   text;
  v_hoje date;
BEGIN
  -- Auth guard: caller must be an active member of this escola
  IF NOT EXISTS (
    SELECT 1 FROM escola_usuarios eu
    WHERE eu.user_id = auth.uid()
      AND eu.escola_id = p_escola_id
      AND eu.ativo = true
      AND eu.deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  SELECT e.fuso_horario INTO v_tz
  FROM escolas e
  WHERE e.id = p_escola_id;

  v_hoje := (current_timestamp AT TIME ZONE COALESCE(v_tz, 'America/Sao_Paulo'))::date;

  RETURN QUERY
  SELECT
    t.id                                                    AS turma_id,
    t.nome                                                  AS turma_nome,
    -- Active enrollments in this turma
    (SELECT COUNT(*)::bigint
     FROM matriculas m
     WHERE m.turma_id = t.id
       AND m.status = 'ativa'
       AND m.deleted_at IS NULL)                            AS matriculas_ativas,
    -- Presença records for today's aula
    (SELECT COUNT(*)::bigint
     FROM presencas_registros pr
     WHERE pr.aula_id = a.id)                              AS registros_presenca,
    -- chamada_feita = at least one record AND count >= active enrollments
    (
      (SELECT COUNT(*)::bigint
       FROM matriculas m
       WHERE m.turma_id = t.id AND m.status = 'ativa' AND m.deleted_at IS NULL) > 0
      AND
      (SELECT COUNT(*)::bigint FROM presencas_registros pr WHERE pr.aula_id = a.id)
        >= (SELECT COUNT(*)::bigint
            FROM matriculas m
            WHERE m.turma_id = t.id AND m.status = 'ativa' AND m.deleted_at IS NULL)
    )                                                       AS chamada_feita
  FROM aulas a
  JOIN turmas t ON t.id = a.turma_id
  WHERE a.escola_id = p_escola_id
    AND a.data_aula = v_hoje
    -- Professor sees only their own turmas; others see all
    AND (p_perfil <> 'professor' OR t.professor_user_id = p_user_id)
  ORDER BY t.nome;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aulas_hoje_status(uuid, uuid, text) TO authenticated;
