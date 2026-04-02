-- Story 16.1 - catalogo de cursos e modelo comercial

CREATE TABLE cursos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id            uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  titulo               text NOT NULL,
  descricao            text,
  publico_alvo         text NOT NULL
                         CHECK (publico_alvo IN ('professor', 'admin', 'responsavel', 'atleta', 'todos')),
  status               text NOT NULL DEFAULT 'rascunho'
                         CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  modalidade_comercial text NOT NULL
                         CHECK (modalidade_comercial IN ('assinatura', 'individual')),
  preco                numeric(10,2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  periodo_acesso_dias  integer CHECK (periodo_acesso_dias IS NULL OR periodo_acesso_dias > 0),
  oferta_ativa         boolean NOT NULL DEFAULT true,
  interno              boolean NOT NULL DEFAULT false,
  deleted_at           timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_cursos
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX cursos_escola_status_idx
  ON cursos (escola_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX cursos_escola_modalidade_idx
  ON cursos (escola_id, modalidade_comercial)
  WHERE deleted_at IS NULL;

ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_select_escola" ON cursos
  FOR SELECT TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "cursos_write_escola" ON cursos
  FOR INSERT TO authenticated
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

CREATE POLICY "cursos_update_escola" ON cursos
  FOR UPDATE TO authenticated
  USING (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  )
  WITH CHECK (
    escola_id IN (
      SELECT eu.escola_id
      FROM escola_usuarios eu
      WHERE eu.user_id = auth.uid()
        AND eu.perfil IN ('admin_escola', 'coordenador')
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );
