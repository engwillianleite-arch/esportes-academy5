-- Migration: atletas global table + buscar_atleta_por_cpf SECURITY DEFINER function
-- Story 3.2: Global Athlete Profile — CPF Lookup & Registration

CREATE TABLE atletas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf              text        NOT NULL UNIQUE,
  nome             text        NOT NULL,
  data_nascimento  date        NOT NULL,
  sexo             text        NOT NULL CHECK (sexo IN ('M', 'F', 'outro')),
  foto_url         text,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE atletas ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user (needed for cross-school CPF deduplication)
CREATE POLICY "atletas_select" ON atletas
  FOR SELECT TO authenticated USING (true);

-- INSERT: user must be admin_escola or coordenador in at least one active escola
CREATE POLICY "atletas_insert" ON atletas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- UPDATE: same restriction as INSERT
CREATE POLICY "atletas_update" ON atletas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- ── SECURITY DEFINER function ─────────────────────────────────────────────────
-- Bypasses RLS to allow cross-school CPF lookup without exposing all athlete data.
-- Story 3.4 will extend this function to check matriculas for same-school block.

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

  -- Story 3.4 will add: check if v_atleta.id has active matricula in p_escola_id
  -- and return 'mesma_escola' to block re-registration.
  -- For Story 3.2: always return 'existe' for any found athlete.

  RETURN QUERY SELECT
    'existe'::text,
    v_atleta.id,
    v_atleta.nome,
    v_atleta.data_nascimento,
    v_atleta.sexo,
    v_atleta.foto_url;
END;
$$;

GRANT EXECUTE ON FUNCTION buscar_atleta_por_cpf(text, uuid) TO authenticated;
