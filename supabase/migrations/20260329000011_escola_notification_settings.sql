-- Migration: escola_notification_settings
-- Adds notification channel and trigger toggle columns to escolas (Story 2.4)
-- No new RLS table policies needed: escolas_update_admin (migration 00007) covers all UPDATE columns

-- ─── Notification channel toggles ────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN notif_email     boolean NOT NULL DEFAULT true;
-- ^ Email channel enabled/disabled

ALTER TABLE escolas ADD COLUMN notif_push      boolean NOT NULL DEFAULT true;
-- ^ Push notification channel (App Pais / App Professor) enabled/disabled

ALTER TABLE escolas ADD COLUMN notif_whatsapp  boolean NOT NULL DEFAULT false;
-- ^ WhatsApp channel — Pro+ plan feature; disabled by default

ALTER TABLE escolas ADD COLUMN notif_sms       boolean NOT NULL DEFAULT false;
-- ^ SMS channel enabled/disabled; disabled by default

-- ─── Financial trigger toggles ───────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN notif_cobranca_lembrete_d3   boolean NOT NULL DEFAULT true;
-- ^ Send reminder notification 3 days before due date

ALTER TABLE escolas ADD COLUMN notif_cobranca_lembrete_d1   boolean NOT NULL DEFAULT true;
-- ^ Send reminder notification 1 day before due date

ALTER TABLE escolas ADD COLUMN notif_cobranca_vencida        boolean NOT NULL DEFAULT true;
-- ^ Send overdue notification after due date passes

ALTER TABLE escolas ADD COLUMN notif_cobranca_confirmacao    boolean NOT NULL DEFAULT true;
-- ^ Send payment confirmation notification when charge is processed

-- ─── Pedagogical trigger toggles ─────────────────────────────────────────────

ALTER TABLE escolas ADD COLUMN notif_frequencia_baixa  boolean NOT NULL DEFAULT true;
-- ^ Alert when athlete attendance falls below minimum threshold

ALTER TABLE escolas ADD COLUMN notif_ausencia          boolean NOT NULL DEFAULT true;
-- ^ Alert when athlete misses a class

ALTER TABLE escolas ADD COLUMN notif_relatorio_mensal  boolean NOT NULL DEFAULT false;
-- ^ Monthly report sent at start of each month; disabled by default
