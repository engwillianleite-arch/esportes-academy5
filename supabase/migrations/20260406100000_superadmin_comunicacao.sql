-- Migration: superadmin + comunicacao basica (MVP)

-- ------------------------------
-- 7.3 Usuários internos da plataforma
-- ------------------------------

CREATE TABLE plataforma_usuarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil      text NOT NULL CHECK (perfil IN ('super_admin', 'suporte', 'financeiro_interno')),
  ativo       boolean NOT NULL DEFAULT true,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER handle_updated_at_plataforma_usuarios
  BEFORE UPDATE ON plataforma_usuarios
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE plataforma_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plataforma_usuarios_select_superadmin" ON plataforma_usuarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plataforma_usuarios pu
      WHERE pu.user_id = auth.uid()
        AND pu.ativo = true
        AND pu.deleted_at IS NULL
        AND pu.perfil = 'super_admin'
    )
    OR user_id = auth.uid()
  );

-- ------------------------------
-- 7.4 Faturamento da plataforma
-- ------------------------------

CREATE TABLE assinaturas_plataforma (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id           uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  valor_mensal        numeric(10,2) NOT NULL DEFAULT 0,
  dia_vencimento      smallint NOT NULL DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 28),
  status              text NOT NULL DEFAULT 'adimplente' CHECK (status IN ('adimplente', 'atraso', 'suspenso')),
  referencia_externa  text,
  proximo_vencimento  date,
  observacoes         text,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escola_id)
);

CREATE TRIGGER handle_updated_at_assinaturas_plataforma
  BEFORE UPDATE ON assinaturas_plataforma
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE assinaturas_plataforma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinaturas_plataforma_select_superadmin" ON assinaturas_plataforma
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plataforma_usuarios pu
      WHERE pu.user_id = auth.uid()
        AND pu.ativo = true
        AND pu.deleted_at IS NULL
        AND pu.perfil IN ('super_admin', 'financeiro_interno')
    )
  );

-- ------------------------------
-- 10.1 Comunicação básica (outbox + entregas)
-- ------------------------------

CREATE TABLE notificacoes_outbox (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  evento_tipo       text NOT NULL,
  ref_tipo          text,
  ref_id            text,
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  status            text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')),
  tentativas        int NOT NULL DEFAULT 0,
  next_retry_at     timestamptz,
  idempotency_key   text,
  erro              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE TRIGGER handle_updated_at_notificacoes_outbox
  BEFORE UPDATE ON notificacoes_outbox
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX notificacoes_outbox_escola_idx
  ON notificacoes_outbox (escola_id, created_at DESC);

CREATE INDEX notificacoes_outbox_status_retry_idx
  ON notificacoes_outbox (status, next_retry_at, created_at);

CREATE TABLE notificacoes_entregas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id           uuid NOT NULL REFERENCES notificacoes_outbox(id) ON DELETE CASCADE,
  escola_id           uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  canal               text NOT NULL CHECK (canal IN ('email', 'push')),
  destinatario_id     text,
  destinatario_contato text,
  status              text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  provider_message_id text,
  erro                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (outbox_id, canal, destinatario_id, destinatario_contato)
);

CREATE TRIGGER handle_updated_at_notificacoes_entregas
  BEFORE UPDATE ON notificacoes_entregas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX notificacoes_entregas_outbox_idx ON notificacoes_entregas (outbox_id);

ALTER TABLE notificacoes_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes_outbox_select_escola" ON notificacoes_outbox
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria', 'marketing')
    )
  );

CREATE POLICY "notificacoes_outbox_write_escola" ON notificacoes_outbox
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria', 'marketing')
    )
  );

CREATE POLICY "notificacoes_entregas_select_escola" ON notificacoes_entregas
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
        AND eu.perfil IN ('admin_escola', 'coordenador', 'secretaria', 'marketing')
    )
  );
