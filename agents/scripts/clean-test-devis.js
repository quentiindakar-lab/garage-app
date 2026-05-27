import { supabase } from '../lib/supabase.js'

async function cleanTestDevis() {
  console.log('🧹 Nettoyage des données de test...\n')

  // 1. Supprimer les devis de test
  const { data: devisSupprimes, error: errDevis } = await supabase
    .from('devis')
    .delete()
    .like('numero', 'TEST-RELANCE-%')
    .select()

  if (errDevis) {
    console.error('❌ Erreur suppression devis:', errDevis)
    process.exit(1)
  }
  console.log(`✓ ${devisSupprimes?.length || 0} devis de test supprimés`)

  // 2. Supprimer le client de test
  const { data: clientsSupprimes, error: errClient } = await supabase
    .from('clients')
    .delete()
    .eq('email', 'test.relance@btppro.fr')
    .select()

  if (errClient) {
    console.error('❌ Erreur suppression client:', errClient)
    process.exit(1)
  }
  console.log(`✓ ${clientsSupprimes?.length || 0} client de test supprimé`)

  console.log('\n✅ Base nettoyée, prête pour la production')
}

cleanTestDevis()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur fatale:', err)
    process.exit(1)
  })
