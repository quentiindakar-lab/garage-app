import { supabase } from '../lib/supabase.js'

async function seedTestDevis() {
  console.log('🌱 Insertion de devis de test pour l\'agent Relance Devis...\n')

  // 1. Créer un client de test (ou récupérer s'il existe déjà)
  const clientEmail = 'test.relance@btppro.fr'

  let { data: clientExistant } = await supabase
    .from('clients')
    .select('*')
    .eq('email', clientEmail)
    .maybeSingle()

  let clientId
  if (clientExistant) {
    clientId = clientExistant.id
    console.log(`✓ Client de test existant retrouvé : ${clientExistant.nom} ${clientExistant.prenom || ''}`)
  } else {
    const { data: nouveauClient, error: errClient } = await supabase
      .from('clients')
      .insert({
        nom: 'Dupont',
        prenom: 'Jean',
        email: clientEmail,
        telephone: '0601020304',
        adresse: '12 rue de la Paix, 75002 Paris',
        type_client: 'particulier',
      })
      .select()
      .single()

    if (errClient) {
      console.error('❌ Erreur création client:', errClient)
      process.exit(1)
    }

    clientId = nouveauClient.id
    console.log(`✓ Client de test créé : ${nouveauClient.nom} ${nouveauClient.prenom}`)
  }

  // 2. Supprimer les anciens devis de test (idempotent)
  await supabase.from('devis').delete().like('numero', 'TEST-RELANCE-%')
  console.log('✓ Anciens devis de test supprimés (si présents)')

  // 3. Insérer 3 devis avec différentes anciennetés
  const aujourdhui = new Date()
  const dateIlYa = (jours) => {
    const d = new Date(aujourdhui)
    d.setDate(d.getDate() - jours)
    return d.toISOString().split('T')[0]
  }

  const devisATester = [
    {
      numero: 'TEST-RELANCE-001',
      statut: 'envoye',
      client_id: clientId,
      client_nom: 'Dupont Jean',
      client_email: clientEmail,
      client_telephone: '0601020304',
      client_adresse: '12 rue de la Paix, 75002 Paris',
      date_emission: dateIlYa(5),
      date_validite: dateIlYa(-25),
      lignes: [{ designation: 'Rénovation salle de bain complète', quantite: 1, prix_unitaire: 8500, total: 8500 }],
      total_ht: 8500,
      tva_montant: 1700,
      total_ttc: 10200,
      acompte_pourcentage: 30,
    },
    {
      numero: 'TEST-RELANCE-002',
      statut: 'envoye',
      client_id: clientId,
      client_nom: 'Dupont Jean',
      client_email: clientEmail,
      client_telephone: '0601020304',
      client_adresse: '12 rue de la Paix, 75002 Paris',
      date_emission: dateIlYa(7),
      date_validite: dateIlYa(-23),
      lignes: [{ designation: 'Isolation combles 80m²', quantite: 80, prix_unitaire: 45, total: 3600 }],
      total_ht: 3600,
      tva_montant: 720,
      total_ttc: 4320,
      acompte_pourcentage: 30,
    },
    {
      numero: 'TEST-RELANCE-003',
      statut: 'envoye',
      client_id: clientId,
      client_nom: 'Dupont Jean',
      client_email: clientEmail,
      client_telephone: '0601020304',
      client_adresse: '12 rue de la Paix, 75002 Paris',
      date_emission: dateIlYa(12),
      date_validite: dateIlYa(-18),
      lignes: [{ designation: 'Création terrasse béton 25m²', quantite: 25, prix_unitaire: 180, total: 4500 }],
      total_ht: 4500,
      tva_montant: 900,
      total_ttc: 5400,
      acompte_pourcentage: 30,
    },
  ]

  const { data: devisCrees, error: errDevis } = await supabase
    .from('devis')
    .insert(devisATester)
    .select()

  if (errDevis) {
    console.error('❌ Erreur insertion devis:', errDevis)
    process.exit(1)
  }

  console.log(`\n✅ ${devisCrees.length} devis de test insérés :`)
  devisCrees.forEach((d) => {
    const jours = Math.floor((new Date() - new Date(d.date_emission)) / (1000 * 60 * 60 * 24))
    console.log(`   • ${d.numero} — ${d.total_ttc}€ TTC — émis il y a ${jours} jours`)
  })

  console.log('\n👉 Tu peux maintenant lancer : npm run test:relance')
}

seedTestDevis()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur fatale:', err)
    process.exit(1)
  })
