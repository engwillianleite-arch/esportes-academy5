-- Schema fixes for responsaveis and atleta_responsaveis (Story 3.3 code review)

-- ── email NOT NULL ────────────────────────────────────────────────────────────
-- email is required per spec and enforced by the server action; enforce at DB level too.

ALTER TABLE responsaveis
  ALTER COLUMN email SET NOT NULL;

-- ── moddatetime triggers ──────────────────────────────────────────────────────
-- Consistent with all other project tables (escolas, escola_usuarios, atletas, etc.)

CREATE TRIGGER handle_updated_at_responsaveis
  BEFORE UPDATE ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_atleta_responsaveis
  BEFORE UPDATE ON atleta_responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
