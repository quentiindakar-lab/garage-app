import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Variable d'environnement SUPABASE_URL manquante. Copiez .env.example vers .env et renseignez l'URL Supabase."
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "Variable d'environnement SUPABASE_SECRET_KEY manquante. Utilisez la clé secrète serveur (sb_secret_...), jamais côté client."
  );
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);

/**
 * Statuts « devis envoyé, en attente de réponse » — alignés sur app/(admin)/admin/devis/page.tsx
 * et app/api/devis/[id]/route.ts : brouillon | envoye | signe | refuse
 */
const STATUTS_DEVIS_A_RELANCER = ["envoye"];

/**
 * Devis envoyés au client sans réponse, émis depuis au moins `joursMin` jours.
 * @param {number} [joursMin=3]
 */
export async function getDevisARelancer(joursMin = 3) {
  const limite = new Date();
  limite.setDate(limite.getDate() - joursMin);
  const dateLimite = limite.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("devis")
    .select(
      "id, numero, client_nom, client_email, client_telephone, total_ttc, date_emission, statut"
    )
    .in("statut", STATUTS_DEVIS_A_RELANCER)
    .lte("date_emission", dateLimite)
    .order("date_emission", { ascending: true });

  if (error) {
    throw new Error(`Erreur Supabase (getDevisARelancer) : ${error.message}`);
  }

  return data ?? [];
}
