-- Migration: planos_pagamento
-- Creates reusable payment plan templates per school (Story 3.1)
-- Templates are referenced by matriculas (Story 3.4) for enrollment pre-fill

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE planos_pagamento (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id        uuid        NOT NULL REFERENCES escolas(id),
  nome             text        NOT NULL,
  frequencia       text        NOT NULL,
  valor            numeric(10,2) NOT NULL,
  desconto_pct     numeric(5,2)  NOT NULL DEFAULT 0,
  valor_liquido    numeric(10,2) NOT NULL,
  dia_vencimento   integer     NOT NULL,
  metodo_pagamento text        NOT NULL,
  cor              text        NOT NULL DEFAULT '#6366f1',
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT planos_pagamento_dia_vencimento_check
    CHECK (dia_vencimento BETWEEN 1 AND 28),

  CONSTRAINT planos_pagamento_desconto_pct_check
    CHECK (desconto_pct BETWEEN 0 AND 100)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE planos_pagamento ENABLE ROW LEVEL SECURITY;

-- SELECT: admin_escola and coordenador of the same school can read
CREATE POLICY "planos_pagamento_select" ON planos_pagamento
  FOR SELECT
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id   = auth.uid()
        AND eu.perfil     IN ('admin_escola', 'coordenador')
        AND eu.ativo      = true
        AND eu.deleted_at IS NULL
    )
  );

-- INSERT: only admin_escola of the same school
CREATE POLICY "planos_pagamento_insert" ON planos_pagamento
  FOR INSERT
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id   = auth.uid()
        AND eu.perfil     = 'admin_escola'
        AND eu.ativo      = true
        AND eu.deleted_at IS NULL
    )
  );

-- UPDATE: only admin_escola of the same school
CREATE POLICY "planos_pagamento_update" ON planos_pagamento
  FOR UPDATE
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id   = auth.uid()
        AND eu.perfil     = 'admin_escola'
        AND eu.ativo      = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id   = auth.uid()
        AND eu.perfil     = 'admin_escola'
        AND eu.ativo      = true
        AND eu.deleted_at IS NULL
    )
  );

-- DELETE: only admin_escola of the same school (hard-delete guard; soft-delete preferred)
CREATE POLICY "planos_pagamento_delete" ON planos_pagamento
  FOR DELETE
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id   = auth.uid()
        AND eu.perfil     = 'admin_escola'
        AND eu.ativo      = true
        AND eu.deleted_at IS NULL
    )
  );
