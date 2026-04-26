-- Migration : création de la table devis
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS devis (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                text UNIQUE NOT NULL,
  statut                text NOT NULL DEFAULT 'brouillon'
                          CHECK (statut IN ('brouillon', 'envoye', 'signe', 'refuse')),
  client_id             uuid REFERENCES clients(id) ON DELETE SET NULL,
  prospect_id           uuid REFERENCES prospects(id) ON DELETE SET NULL,
  client_nom            text NOT NULL,
  client_email          text,
  client_telephone      text,
  client_adresse        text,
  chantier_adresse      text,
  date_emission         date NOT NULL DEFAULT CURRENT_DATE,
  date_validite         date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  lignes                jsonb NOT NULL DEFAULT '[]',
  total_ht              numeric(10,2) NOT NULL DEFAULT 0,
  tva_montant           numeric(10,2) NOT NULL DEFAULT 0,
  total_ttc             numeric(10,2) NOT NULL DEFAULT 0,
  acompte_pourcentage   numeric(5,2) NOT NULL DEFAULT 30,
  conditions_paiement   text DEFAULT '30% à la signature, solde à la fin des travaux',
  notes                 text,
  mention_dechets       text DEFAULT 'Conformément à la loi du 10/02/2020, les déchets de chantier seront évacués et traités dans des filières agréées.',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS devis_statut_idx ON devis(statut);
CREATE INDEX IF NOT EXISTS devis_created_at_idx ON devis(created_at DESC);
CREATE INDEX IF NOT EXISTS devis_client_id_idx ON devis(client_id);
