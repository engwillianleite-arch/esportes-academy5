-- Migration: escola_registration_fields
-- Adds fields needed for the school registration wizard (Story 2.1)
-- and INSERT/UPDATE RLS policies for the school creation flow.

-- ─── Schema Changes ────────────────────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN modalidades text[] NOT NULL DEFAULT '{}';
ALTER TABLE escolas ADD COLUMN onboarding_completo boolean NOT NULL DEFAULT false;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- Any authenticated user can create a new escola
CREATE POLICY "escolas_insert_authenticated" ON escolas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- admin_escola can update their own escola (general settings + onboarding dismiss)
CREATE POLICY "escolas_update_admin" ON escolas
  FOR UPDATE USING (
    id IN (
      SELECT escola_id FROM escola_usuarios
      WHERE user_id = auth.uid()
        AND perfil = 'admin_escola'
        AND ativo = true
        AND deleted_at IS NULL
    )
  ) WITH CHECK (true);

-- User can link themselves to an escola as admin_escola during registration
CREATE POLICY "escola_usuarios_insert_self_admin" ON escola_usuarios
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    perfil = 'admin_escola'
  );

-- admin_escola can seed modules for their escola
-- NOTE: escola_usuarios row must already exist (inserted before this in Server Action)
CREATE POLICY "escola_modulos_insert_as_admin" ON escola_modulos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM escola_usuarios
      WHERE user_id = auth.uid()
        AND escola_id = escola_modulos.escola_id
        AND perfil = 'admin_escola'
        AND ativo = true
        AND deleted_at IS NULL
    )
  );
