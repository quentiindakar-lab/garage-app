import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { joursDepuisEmission } from "./claude.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  throw new Error(
    "Variable d'environnement TELEGRAM_BOT_TOKEN manquante. Créez un bot via @BotFather."
  );
}

if (!chatId) {
  throw new Error(
    "Variable d'environnement TELEGRAM_CHAT_ID manquante. Indiquez l'ID du chat de notification."
  );
}

const bot = new TelegramBot(token, { polling: false });

/** Échappe les caractères spéciaux pour parse_mode HTML Telegram */
function escapeHtml(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Formate un montant TTC style français (ex. "12 500€ TTC").
 * @param {number|string} montant
 */
export function formatMontantTtc(montant) {
  const valeur = typeof montant === "number" ? montant : parseFloat(montant) || 0;
  const formate = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(valeur);
  return `${formate}€ TTC`;
}

/**
 * Envoie un message HTML au chat configuré.
 * @param {string} texte
 */
export async function envoyerMessage(texte) {
  return bot.sendMessage(chatId, texte, { parse_mode: "HTML" });
}

/**
 * Notification détaillée pour une relance devis suggérée.
 * @param {object} devis
 * @param {string} messageGenere
 */
export async function envoyerRelanceDevis(devis, messageGenere) {
  const jours = joursDepuisEmission(devis.date_emission);

  const lignes = [
    "🔔 <b>Relance devis suggérée</b>",
    "",
    `📄 Devis <code>${escapeHtml(devis.numero)}</code>`,
    `👤 <b>${escapeHtml(devis.client_nom)}</b>`,
    `💰 ${escapeHtml(formatMontantTtc(devis.total_ttc))}`,
    `⏰ Envoyé il y a ${jours} jour${jours > 1 ? "s" : ""}`,
  ];

  if (devis.client_telephone) {
    const tel = escapeHtml(devis.client_telephone);
    lignes.push(`📞 <a href="tel:${tel}">${tel}</a>`);
  }

  if (devis.client_email) {
    const email = escapeHtml(devis.client_email);
    lignes.push(`✉️ <a href="mailto:${email}">${email}</a>`);
  }

  lignes.push(
    "—————",
    `<i>${escapeHtml(messageGenere)}</i>`,
    "",
    "👆 Copie-colle ce message au client"
  );

  return envoyerMessage(lignes.join("\n"));
}

/**
 * Alerte d'erreur agent.
 * @param {string} nomAgent
 * @param {Error} erreur
 */
export async function envoyerErreur(nomAgent, erreur) {
  const msg = `❌ <b>Erreur dans ${escapeHtml(nomAgent)}</b>\n\n<code>${escapeHtml(erreur.message)}</code>`;
  return envoyerMessage(msg);
}
