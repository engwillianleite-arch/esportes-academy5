ALTER TABLE escolas
  ADD COLUMN IF NOT EXISTS notif_aniversario_atleta boolean NOT NULL DEFAULT true;
