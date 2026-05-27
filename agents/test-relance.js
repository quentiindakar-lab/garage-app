import "dotenv/config";
import relanceDevisAgent from "./jobs/relance-devis.js";

console.log("🧪 Test manuel — agent Relance Devis\n");

relanceDevisAgent()
  .then(() => {
    console.log("\n🧪 Test terminé avec succès.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n🧪 Test en échec :", err.message);
    process.exit(1);
  });
