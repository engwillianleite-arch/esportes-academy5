-- Migration: 20260408120000_escola_modulos_nota.sql
-- Story 8.3 — Feature flags por escola com expiração — UI completa
-- Adds optional `nota` column to escola_modulos for tracking the reason of a module change.

ALTER TABLE escola_modulos ADD COLUMN IF NOT EXISTS nota TEXT;
