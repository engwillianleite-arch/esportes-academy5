-- Migration: atletas patches — Story 3.2 code review
-- P1: DB-level CPF format check (11 digits only)
-- P2: atletas_update policy WITH CHECK clause
-- P5: Replace unconditional cpf UNIQUE with partial unique index (excludes soft-deleted rows)

-- P1: Enforce 11-digit-only CPF at DB level
ALTER TABLE atletas
  ADD CONSTRAINT atletas_cpf_format_check
    CHECK (cpf ~ '^\d{11}$');

-- P2: Recreate update policy with WITH CHECK to prevent arbitrary column escalation
DROP POLICY "atletas_update" ON atletas;

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

-- P5: Drop unconditional UNIQUE constraint; replace with partial unique index
-- that excludes soft-deleted rows so a deleted athlete's CPF can be re-registered.
ALTER TABLE atletas DROP CONSTRAINT atletas_cpf_key;

CREATE UNIQUE INDEX atletas_cpf_active_idx
  ON atletas (cpf)
  WHERE deleted_at IS NULL;
