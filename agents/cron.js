import "dotenv/config";
import cron from "node-cron";
import relanceDevisAgent from "./jobs/relance-devis.js";
import { envoyerMessage } from "./lib/telegram.js";

// Tous les jours à 20h00 (Europe/Paris)
cron.schedule(
  "0 20 * * *",
  async () => {
    console.log("⏰ [CRON 20h] Déclenchement Relance Devis");
    try {
      await relanceDevisAgent();
    } catch (error) {
      console.error("❌ [CRON 20h] Relance Devis en échec :", error);
    }
  },
  { timezone: "Europe/Paris" }
);

envoyerMessage(
  "🚀 <b>BTP Pro Agents démarré</b>\n\n✅ Relance Devis planifiée tous les jours à 20h00 (Europe/Paris)"
).catch((err) => {
  console.error("Impossible d'envoyer le message de démarrage Telegram :", err.message);
});

console.log("📡 En attente des tâches planifiées... (Ctrl+C pour stop)");
