-- Migration: escola_registration_patches
-- Code review patches for Story 2.1:
--   1. Tighten escola_usuarios_insert_self_admin to prevent takeover of existing schools
--   2. Add criar_escola_completo() RPC — wraps all 3 registration inserts in one transaction

-- ─── P2: Tighten escola_usuarios INSERT policy ────────────────────────────────
-- Old policy allowed any authenticated user to insert themselves as admin_escola
-- for ANY escola UUID they knew. New policy adds a NOT EXISTS guard: you may only
-- claim admin_escola if the escola currently has no active admin.

DROP POLICY IF EXISTS "escola_usuarios_insert_self_admin" ON escola_usuarios;

CREATE POLICY "escola_usuarios_insert_self_admin" ON escola_usuarios
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND perfil = 'admin_escola'
    AND NOT EXISTS (
      SELECT 1 FROM escola_usuarios eu
      WHERE eu.escola_id = escola_id
        AND eu.perfil = 'admin_escola'
        AND eu.ativo = true
        AND eu.deleted_at IS NULL
    )
  );

-- ─── D1/P1: Transactional school registration RPC ────────────────────────────
-- Wraps escola INSERT + escola_usuarios INSERT + escola_modulos INSERT in a
-- single Postgres transaction. Any failure rolls back all three.
-- Uses SECURITY INVOKER so all existing RLS policies are enforced.
-- auth.uid() resolves to the calling user's Supabase JWT subject.

CREATE OR REPLACE FUNCTION criar_escola_completo(
  p_nome       text,
  p_cnpj       text,
  p_email      text,
  p_telefone   text,
  p_plano      text,
  p_modalidades text[],
  p_modulos    text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_escola_id uuid;
  v_user_id   uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO escolas (nome, cnpj, email, telefone, plano, modalidades)
  VALUES (p_nome, p_cnpj, p_email, p_telefone, p_plano, p_modalidades)
  RETURNING id INTO v_escola_id;

  INSERT INTO escola_usuarios (user_id, escola_id, perfil)
  VALUES (v_user_id, v_escola_id, 'admin_escola');

  INSERT INTO escola_modulos (escola_id, modulo_slug, ativo)
  SELECT v_escola_id, unnest(p_modulos), true;

  RETURN v_escola_id;
END;
$$;
