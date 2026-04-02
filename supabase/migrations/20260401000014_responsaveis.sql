-- Migration: responsaveis + atleta_responsaveis — Story 3.3: Financial Guardian Linkage

-- ── responsaveis (global table) ──────────────────────────────────────────────

CREATE TABLE responsaveis (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL,
  email      text,
  telefone   text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user
CREATE POLICY "responsaveis_select" ON responsaveis
  FOR SELECT TO authenticated USING (true);

-- INSERT: user must be admin_escola or coordenador in at least one active escola
CREATE POLICY "responsaveis_insert" ON responsaveis
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
CREATE POLICY "responsaveis_update" ON responsaveis
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- ── atleta_responsaveis (junction table) ─────────────────────────────────────

CREATE TABLE atleta_responsaveis (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id      uuid        NOT NULL REFERENCES atletas(id),
  responsavel_id uuid        NOT NULL REFERENCES responsaveis(id),
  financeiro     boolean     NOT NULL DEFAULT false,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atleta_responsaveis ENABLE ROW LEVEL SECURITY;

-- Partial unique index: prevent duplicate linkages (ignores soft-deleted rows)
CREATE UNIQUE INDEX atleta_responsaveis_unique_link_idx
  ON atleta_responsaveis (atleta_id, responsavel_id)
  WHERE deleted_at IS NULL;

-- SELECT: any authenticated user
CREATE POLICY "atleta_responsaveis_select" ON atleta_responsaveis
  FOR SELECT TO authenticated USING (true);

-- INSERT: user must be admin_escola or coordenador in at least one active escola
CREATE POLICY "atleta_responsaveis_insert" ON atleta_responsaveis
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
CREATE POLICY "atleta_responsaveis_update" ON atleta_responsaveis
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );
