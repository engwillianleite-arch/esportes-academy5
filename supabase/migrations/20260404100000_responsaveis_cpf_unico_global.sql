-- CPF como identificador único de pessoa física: responsáveis + cruzamento com atletas ativos.

-- ── Coluna CPF em responsaveis ────────────────────────────────────────────────

ALTER TABLE responsaveis
  ADD COLUMN cpf text;

COMMENT ON COLUMN responsaveis.cpf IS 'CPF 11 dígitos (somente números). Identificador único da pessoa no sistema; não pode coincidir com atleta ativo.';

ALTER TABLE responsaveis
  ADD CONSTRAINT responsaveis_cpf_format_check
    CHECK (cpf IS NULL OR cpf ~ '^\d{11}$');

CREATE UNIQUE INDEX responsaveis_cpf_active_idx
  ON responsaveis (cpf)
  WHERE deleted_at IS NULL AND cpf IS NOT NULL;

-- ── Unicidade global: mesmo CPF não pode existir como atleta ativo e responsável ativo ──

CREATE OR REPLACE FUNCTION public.trg_cpf_unico_pessoa_fisica()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'atletas' THEN
    IF NEW.deleted_at IS NULL THEN
      IF EXISTS (
        SELECT 1 FROM responsaveis r
        WHERE r.cpf = NEW.cpf AND r.deleted_at IS NULL
      ) THEN
        RAISE EXCEPTION 'Este CPF já está cadastrado como responsável. Use o mesmo cadastro ou altere o CPF.'
          USING ERRCODE = '23505';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'responsaveis' THEN
    IF NEW.deleted_at IS NULL AND NEW.cpf IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM atletas a
        WHERE a.cpf = NEW.cpf AND a.deleted_at IS NULL
      ) THEN
        RAISE EXCEPTION 'Este CPF já está cadastrado como atleta. Um mesmo CPF não pode ser atleta e responsável ao mesmo tempo.'
          USING ERRCODE = '23505';
      END IF;
      IF EXISTS (
        SELECT 1 FROM responsaveis r
        WHERE r.cpf = NEW.cpf AND r.deleted_at IS NULL
          AND r.id IS DISTINCT FROM NEW.id
      ) THEN
        RAISE EXCEPTION 'Este CPF já está cadastrado em outro responsável.'
          USING ERRCODE = '23505';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER atletas_cpf_unico_global_trg
  BEFORE INSERT OR UPDATE OF cpf, deleted_at ON atletas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_cpf_unico_pessoa_fisica();

CREATE TRIGGER responsaveis_cpf_unico_global_trg
  BEFORE INSERT OR UPDATE OF cpf, deleted_at ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_cpf_unico_pessoa_fisica();

-- ── CPF obrigatório em novos responsáveis (INSERT sempre com CPF) ─────────────

CREATE OR REPLACE FUNCTION public.responsaveis_cpf_obrigatorio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cpf IS NULL OR btrim(NEW.cpf) = '' THEN
    RAISE EXCEPTION 'CPF do responsável é obrigatório';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER responsaveis_cpf_obrigatorio_ins
  BEFORE INSERT ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.responsaveis_cpf_obrigatorio();

-- Linhas antigas sem CPF: preencher via script ou UI antes de exigir NOT NULL em migration futura.
