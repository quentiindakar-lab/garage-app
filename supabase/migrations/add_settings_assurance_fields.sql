-- Migration : ajout des champs manquants dans la table settings
-- À exécuter dans Supabase SQL Editor

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS forme_juridique            text,
  ADD COLUMN IF NOT EXISTS numero_tva                 text,
  ADD COLUMN IF NOT EXISTS assureur_nom               text,
  ADD COLUMN IF NOT EXISTS assurance_numero_police    text,
  ADD COLUMN IF NOT EXISTS assurance_zone_couverture  text;
