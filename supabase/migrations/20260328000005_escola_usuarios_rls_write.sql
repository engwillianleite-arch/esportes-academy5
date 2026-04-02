-- Migration: escola_usuarios_rls_write
-- Adds UPDATE policy for admin_escola to manage user profiles within their school
-- Story 1.4: Multi-School User Profile System (AC#3)
--
-- INSERT/DELETE policies are NOT added here:
--   - INSERT: handled via service_role only (school registration in Epic 2, invite flow in Epic 6)
--   - Soft-delete (deleted_at): handled in future stories

-- UPDATE: admin_escola can update profiles of users in their own school
-- USING clause: restricts which rows can be matched (current state must pass)
-- WITH CHECK clause: restricts what the new values can be (prevents privilege escalation)
--   - escola_id must still belong to a school where caller is admin_escola
--   - NEW.perfil must not be 'admin_escola' — granting admin role is a privileged
--     operation reserved for service_role (Epic 6 invite flow)
CREATE POLICY "escola_usuarios_update_admin" ON escola_usuarios
  FOR UPDATE
  USING (
    escola_id IN (
      SELECT eu2.escola_id FROM escola_usuarios eu2
      WHERE eu2.user_id    = auth.uid()
        AND eu2.perfil      = 'admin_escola'
        AND eu2.ativo       = true
        AND eu2.deleted_at  IS NULL
    )
  )
  WITH CHECK (
    perfil != 'admin_escola'
    AND escola_id IN (
      SELECT eu2.escola_id FROM escola_usuarios eu2
      WHERE eu2.user_id    = auth.uid()
        AND eu2.perfil      = 'admin_escola'
        AND eu2.ativo       = true
        AND eu2.deleted_at  IS NULL
    )
  );
