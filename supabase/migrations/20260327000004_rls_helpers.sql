-- Migration: rls_helpers
-- Helper function and view for module access checks (AC#3)
-- Used by: proxy.ts (Stories 1.6/1.7), RLS policies (all future stories)

-- is_module_active: checks if a module is active AND not expired for a school
-- SECURITY DEFINER — runs as the function owner (bypasses RLS on escola_modulos
-- so SuperAdmin can also check module status without being enrolled in the school)
CREATE OR REPLACE FUNCTION is_module_active(
  p_escola_id   UUID,
  p_modulo_slug TEXT
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.escola_modulos
    WHERE escola_id   = p_escola_id
      AND modulo_slug = p_modulo_slug
      AND ativo       = true
      AND (expira_em IS NULL OR expira_em > now())
  );
$$;

GRANT EXECUTE ON FUNCTION is_module_active(UUID, TEXT) TO authenticated;

-- modulos_ativos: view of all currently active (non-expired) modules
-- security_invoker = true ensures the calling user's RLS on escola_modulos is applied
-- (without this, the view owner's permissions would bypass RLS — Supabase/PG 15+ requirement)
CREATE OR REPLACE VIEW modulos_ativos
WITH (security_invoker = true)
AS
SELECT *
FROM escola_modulos
WHERE ativo = true
  AND (expira_em IS NULL OR expira_em > now());

GRANT SELECT ON modulos_ativos TO authenticated;
