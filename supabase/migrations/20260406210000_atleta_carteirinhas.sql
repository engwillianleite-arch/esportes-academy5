-- Stories 11.5 / 11.6 — carteirinha digital e check-in/check-out

ALTER TABLE escolas
  ADD COLUMN IF NOT EXISTS checkin_checkout_ativo boolean NOT NULL DEFAULT false;

CREATE TABLE atleta_carteirinhas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id     uuid NOT NULL REFERENCES atletas(id) ON DELETE CASCADE,
  escola_id     uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula_id  uuid REFERENCES matriculas(id) ON DELETE SET NULL,
  qr_token      text NOT NULL UNIQUE,
  ativo         boolean NOT NULL DEFAULT true,
  impresso_em   timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT atleta_carteirinhas_atleta_escola_unique UNIQUE (atleta_id, escola_id)
);

CREATE TRIGGER handle_updated_at_atleta_carteirinhas
  BEFORE UPDATE ON atleta_carteirinhas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX atleta_carteirinhas_escola_idx
  ON atleta_carteirinhas (escola_id)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_carteirinhas_atleta_idx
  ON atleta_carteirinhas (atleta_id)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.trg_atleta_carteirinhas_valida_contexto()
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
    RAISE EXCEPTION 'Matricula invalida para carteirinha.';
  END IF;

  IF v_atleta_id IS DISTINCT FROM NEW.atleta_id THEN
    RAISE EXCEPTION 'A matricula informada nao pertence ao atleta da carteirinha.';
  END IF;

  IF v_escola_id IS DISTINCT FROM NEW.escola_id THEN
    RAISE EXCEPTION 'A matricula informada nao pertence a escola da carteirinha.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER atleta_carteirinhas_valida_contexto
  BEFORE INSERT OR UPDATE ON atleta_carteirinhas
  FOR EACH ROW EXECUTE FUNCTION public.trg_atleta_carteirinhas_valida_contexto();

ALTER TABLE atleta_carteirinhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atleta_carteirinhas_select_escola" ON atleta_carteirinhas
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
        AND ar.atleta_id = atleta_carteirinhas.atleta_id
    )
  );

CREATE POLICY "atleta_carteirinhas_insert_escola" ON atleta_carteirinhas
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "atleta_carteirinhas_update_escola" ON atleta_carteirinhas
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE TABLE atleta_acessos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id         uuid NOT NULL REFERENCES atletas(id) ON DELETE CASCADE,
  escola_id         uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula_id      uuid REFERENCES matriculas(id) ON DELETE SET NULL,
  carteirinha_id    uuid REFERENCES atleta_carteirinhas(id) ON DELETE SET NULL,
  tipo              text NOT NULL CHECK (tipo IN ('check_in', 'check_out')),
  lido_por_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_token_snapshot text,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_atleta_acessos
  BEFORE UPDATE ON atleta_acessos
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX atleta_acessos_escola_created_idx
  ON atleta_acessos (escola_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX atleta_acessos_atleta_created_idx
  ON atleta_acessos (atleta_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.trg_atleta_acessos_valida_contexto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_card record;
BEGIN
  IF NEW.carteirinha_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT atleta_id, escola_id, matricula_id, qr_token
    INTO v_card
  FROM atleta_carteirinhas
  WHERE id = NEW.carteirinha_id
    AND deleted_at IS NULL;

  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Carteirinha invalida para registro de acesso.';
  END IF;

  IF v_card.atleta_id IS DISTINCT FROM NEW.atleta_id THEN
    RAISE EXCEPTION 'Carteirinha nao pertence ao atleta informado.';
  END IF;

  IF v_card.escola_id IS DISTINCT FROM NEW.escola_id THEN
    RAISE EXCEPTION 'Carteirinha nao pertence a escola informada.';
  END IF;

  IF NEW.matricula_id IS NULL THEN
    NEW.matricula_id := v_card.matricula_id;
  END IF;

  IF NEW.qr_token_snapshot IS NULL THEN
    NEW.qr_token_snapshot := v_card.qr_token;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER atleta_acessos_valida_contexto
  BEFORE INSERT OR UPDATE ON atleta_acessos
  FOR EACH ROW EXECUTE FUNCTION public.trg_atleta_acessos_valida_contexto();

ALTER TABLE atleta_acessos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atleta_acessos_select_escola_ou_responsavel" ON atleta_acessos
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
        AND ar.atleta_id = atleta_acessos.atleta_id
    )
  );

CREATE POLICY "atleta_acessos_insert_escola" ON atleta_acessos
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria', 'professor')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );
