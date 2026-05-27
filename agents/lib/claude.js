import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "Variable d'environnement ANTHROPIC_API_KEY manquante. Ajoutez votre clé Anthropic dans agents/.env"
  );
}

const anthropic = new Anthropic({ apiKey });

/**
 * Nombre de jours calendaires entre date_emission et aujourd'hui (UTC date).
 * @param {string} dateEmission — format YYYY-MM-DD
 */
export function joursDepuisEmission(dateEmission) {
  const emission = new Date(`${dateEmission}T00:00:00`);
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  emission.setHours(0, 0, 0, 0);
  const diffMs = aujourdHui.getTime() - emission.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Génère un corps de message de relance pour un devis (sans formule d'appel ni signature).
 * @param {object} devis
 */
export async function genererMessageRelance(devis) {
  const jours = joursDepuisEmission(devis.date_emission);
  const montant =
    typeof devis.total_ttc === "number"
      ? devis.total_ttc
      : parseFloat(devis.total_ttc) || 0;

  const prompt = `Tu es l'assistant d'un entrepreneur du BTP français.

Contexte : le devis n°${devis.numero} d'un montant de ${montant}€ TTC a été envoyé à ${devis.client_nom} il y a ${jours} jour${jours > 1 ? "s" : ""}, sans réponse du client.

Rédige un message de relance professionnel en français : courtois, pas insistant, qui rappelle le devis, montre de l'intérêt pour le projet et propose d'être disponible pour répondre aux questions.

Contraintes strictes :
- 3 à 4 lignes maximum
- PAS de "Bonjour" au début
- PAS de "Cordialement" ni formule de politesse finale
- Uniquement le corps du message brut, prêt à copier-coller`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const bloc = message.content?.find((c) => c.type === "text");
  if (!bloc?.text) {
    throw new Error("Réponse Claude vide ou invalide pour la relance devis.");
  }

  return bloc.text.trim();
}
