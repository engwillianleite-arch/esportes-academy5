-- Migration: escola_asaas_integration
-- Adds Asaas payment integration columns to escolas + Vault helper functions (Story 2.3)
-- No new RLS table policies needed: escolas_update_admin (migration 00007) covers all UPDATE columns

-- ─── Asaas integration columns ───────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN asaas_env            text        NOT NULL DEFAULT 'sandbox';
-- ^ 'sandbox' | 'producao'

ALTER TABLE escolas ADD COLUMN asaas_vault_secret_id uuid;
-- ^ UUID reference to vault.secrets — token itself never stored in plaintext

ALTER TABLE escolas ADD COLUMN asaas_wallet_id       text;
-- ^ Asaas Wallet ID (for split-payment multi-unit scenarios)

ALTER TABLE escolas ADD COLUMN asaas_webhook_secret  text;
-- ^ Random string used to verify Asaas webhook signature (not sensitive; not in Vault)

-- ─── Billing preference columns ───────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN dias_antecipacao      smallint    NOT NULL DEFAULT 3;
-- ^ Days before due date to issue the charge (1–30)

ALTER TABLE escolas ADD COLUMN multa_pct             numeric(5,2) NOT NULL DEFAULT 2;
-- ^ Late payment fine percentage (0.00–10.00)

ALTER TABLE escolas ADD COLUMN juros_pct             numeric(5,2) NOT NULL DEFAULT 1;
-- ^ Monthly interest rate percentage (0.00–10.00)

ALTER TABLE escolas ADD COLUMN desconto_antecip_pct  numeric(5,2) NOT NULL DEFAULT 0;
-- ^ Early payment discount percentage (0.00–100.00)

-- ─── Supabase Vault helper functions ─────────────────────────────────────────
-- These SECURITY DEFINER functions wrap vault.secrets so Server Actions and Edge
-- Functions never need direct vault access. The functions run with the definer's
-- privileges (postgres/supabase_admin), while callers retain their own identity.

-- salvar_asaas_token: creates or updates the vault secret for an escola's Asaas token.
-- Grants EXECUTE to 'authenticated' so Server Actions (using the auth client) can call it.

CREATE OR REPLACE FUNCTION salvar_asaas_token(p_escola_id uuid, p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_name      text := 'asaas_token_' || p_escola_id::text;
  v_caller_id uuid;
BEGIN
  -- Ownership guard: caller must be an active admin_escola for this escola
  v_caller_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM escola_usuarios
    WHERE user_id = v_caller_id
      AND escola_id = p_escola_id
      AND perfil = 'admin_escola'
      AND ativo = true
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'permission denied for escola %', p_escola_id;
  END IF;

  -- Find existing vault secret reference for this escola
  SELECT asaas_vault_secret_id INTO v_secret_id
  FROM escolas
  WHERE id = p_escola_id;

  IF v_secret_id IS NULL THEN
    -- First time: create a new vault secret and return its id
    INSERT INTO vault.secrets (secret, name)
    VALUES (p_token, v_name)
    RETURNING id INTO v_secret_id;
  ELSE
    -- Subsequent saves: update the existing vault secret in-place
    UPDATE vault.secrets
    SET secret = p_token,
        name   = v_name
    WHERE id = v_secret_id;
  END IF;

  -- Return the vault secret id so the caller can include it in the final UPDATE
  RETURN v_secret_id;
END;
$$;

REVOKE ALL ON FUNCTION salvar_asaas_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salvar_asaas_token(uuid, text) TO authenticated;

-- obter_asaas_token: returns the decrypted Asaas token for a given escola.
-- ONLY service_role can execute this — Edge Functions run with service role.
-- Server Actions must NOT call this (would expose token to client context).

CREATE OR REPLACE FUNCTION obter_asaas_token(p_escola_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_token     text;
BEGIN
  SELECT asaas_vault_secret_id INTO v_secret_id
  FROM escolas
  WHERE id = p_escola_id;

  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_token
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION obter_asaas_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obter_asaas_token(uuid) TO service_role;
