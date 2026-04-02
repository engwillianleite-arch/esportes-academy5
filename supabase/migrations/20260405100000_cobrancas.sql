-- Migration: cobrancas â€” Stories 6.1, 6.2, 6.3
-- Base financeira para cobranÃ§as por escola com suporte a status via webhook Asaas.

CREATE TABLE cobrancas (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         uuid          NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  matricula_id      uuid          REFERENCES matriculas(id) ON DELETE SET NULL,
  valor             numeric(10,2) NOT NULL CHECK (valor > 0),
  vencimento        date          NOT NULL,
  descricao         text,
  referencia        text,
  asaas_charge_id   text,
  status            text          NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  data_pagamento    timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_cobrancas
  BEFORE UPDATE ON cobrancas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE UNIQUE INDEX cobrancas_asaas_charge_id_uk
  ON cobrancas (asaas_charge_id)
  WHERE asaas_charge_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX cobrancas_escola_idx
  ON cobrancas (escola_id)
  WHERE deleted_at IS NULL;

CREATE INDEX cobrancas_matricula_idx
  ON cobrancas (matricula_id)
  WHERE deleted_at IS NULL;

CREATE INDEX cobrancas_status_vencimento_idx
  ON cobrancas (escola_id, status, vencimento DESC)
  WHERE deleted_at IS NULL;

-- Valida que a matrÃ­cula vinculada Ã  cobranÃ§a pertence Ã  mesma escola.
CREATE OR REPLACE FUNCTION public.trg_cobrancas_valida_matricula_escola()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_escola_matricula uuid;
BEGIN
  IF NEW.matricula_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT m.escola_id
    INTO v_escola_matricula
  FROM matriculas m
  WHERE m.id = NEW.matricula_id
    AND m.deleted_at IS NULL;

  IF v_escola_matricula IS NULL THEN
    RAISE EXCEPTION 'MatrÃ­cula invÃ¡lida para cobranÃ§a';
  END IF;

  IF v_escola_matricula IS DISTINCT FROM NEW.escola_id THEN
    RAISE EXCEPTION 'MatrÃ­cula pertence a outra escola';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER cobrancas_valida_matricula_escola
  BEFORE INSERT OR UPDATE ON cobrancas
  FOR EACH ROW EXECUTE FUNCTION public.trg_cobrancas_valida_matricula_escola();

ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cobrancas_select_escola" ON cobrancas
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'financeiro')
    )
  );

CREATE POLICY "cobrancas_insert_escola" ON cobrancas
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'financeiro')
    )
  );

CREATE POLICY "cobrancas_update_escola" ON cobrancas
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'financeiro')
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'financeiro')
    )
  );
