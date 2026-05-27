import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getDevisARelancer } from "../lib/supabase.js";
import { genererMessageRelance } from "../lib/claude.js";
import {
  envoyerMessage,
  envoyerRelanceDevis,
  envoyerErreur,
} from "../lib/telegram.js";

const PAUSE_ENTRE_DEVIS_MS = 1000;

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Agent Relance Devis : identifie les devis « envoye » anciens et propose des messages via Telegram.
 */
export async function relanceDevisAgent() {
  console.log("🤖 [Relance Devis] Démarrage...");

  try {
    const devis = await getDevisARelancer(3);
    console.log(`📋 ${devis.length} devis à relancer trouvés`);

    if (devis.length === 0) {
      await envoyerMessage(
        "✅ <b>Relance Devis</b>\n\nAucun devis à relancer aujourd'hui 👍"
      );
      console.log("✅ [Relance Devis] Terminé avec succès");
      return;
    }

    await envoyerMessage(
      `📋 <b>${devis.length} devis à relancer aujourd'hui</b>`
    );

    for (let i = 0; i < devis.length; i++) {
      const d = devis[i];
      console.log(`💬 Génération du message pour ${d.client_nom}...`);

      const messageGenere = await genererMessageRelance(d);
      await envoyerRelanceDevis(d, messageGenere);

      if (i < devis.length - 1) {
        await attendre(PAUSE_ENTRE_DEVIS_MS);
      }
    }

    console.log("✅ [Relance Devis] Terminé avec succès");
  } catch (error) {
    console.error("❌ [Relance Devis] Erreur :", error);
    await envoyerErreur("Relance Devis", error);
    throw error;
  }
}

const __filename = fileURLToPath(import.meta.url);
const estExecuteDirectement =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (estExecuteDirectement) {
  relanceDevisAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default relanceDevisAgent;
