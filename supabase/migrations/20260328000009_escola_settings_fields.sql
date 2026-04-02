-- Migration: escola_settings_fields
-- Adds address and operational columns to escolas (Story 2.2)
-- No new RLS policies needed: escolas_update_admin (migration 00007) covers all UPDATE operations

-- ─── Address columns ──────────────────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN cep          text;
ALTER TABLE escolas ADD COLUMN logradouro   text;
ALTER TABLE escolas ADD COLUMN numero       text;
ALTER TABLE escolas ADD COLUMN complemento  text;
ALTER TABLE escolas ADD COLUMN bairro       text;
ALTER TABLE escolas ADD COLUMN cidade       text;
ALTER TABLE escolas ADD COLUMN estado       text;

-- ─── Operational columns ──────────────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN janela_chamada_h  integer     NOT NULL DEFAULT 48;
ALTER TABLE escolas ADD COLUMN capacidade_padrao integer;
ALTER TABLE escolas ADD COLUMN fuso_horario      text        NOT NULL DEFAULT 'America/Sao_Paulo';

-- ─── Supabase Storage — escola-logos bucket ───────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('escola-logos', 'escola-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- admin_escola can upload/replace logo for their own escola folder
CREATE POLICY "escola_logos_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'escola-logos'
    AND EXISTS (
      SELECT 1 FROM escola_usuarios
      WHERE user_id   = auth.uid()
        AND escola_id = (storage.foldername(name))[1]::uuid
        AND perfil    = 'admin_escola'
        AND ativo     = true
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "escola_logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'escola-logos'
    AND EXISTS (
      SELECT 1 FROM escola_usuarios
      WHERE user_id   = auth.uid()
        AND escola_id = (storage.foldername(name))[1]::uuid
        AND perfil    = 'admin_escola'
        AND ativo     = true
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    bucket_id = 'escola-logos'
    AND EXISTS (
      SELECT 1 FROM escola_usuarios
      WHERE user_id   = auth.uid()
        AND escola_id = (storage.foldername(name))[1]::uuid
        AND perfil    = 'admin_escola'
        AND ativo     = true
        AND deleted_at IS NULL
    )
  );

-- Public read: logos are public (bucket is public, but explicit policy is safer)
CREATE POLICY "escola_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'escola-logos');
