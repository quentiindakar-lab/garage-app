# BTP Pro — Agents IA (backend)

Sous-projet Node.js indépendant du dashboard Next.js. Les agents lisent et écrivent dans la **même base Supabase** que l'application principale, via la clé secrète serveur.

## Installation

```bash
cd agents
npm install
cp .env.example .env
# Renseigner les 5 variables dans .env
npm run test:db          # Vérifier la connexion Supabase (affiche quelques devis)
npm run test:relance     # Tester l'agent Relance Devis immédiatement
npm start                # Lancer le cron en production (20h Europe/Paris)
```

## Structure

```
agents/
├── lib/
│   ├── supabase.js    # Client Supabase + getDevisARelancer()
│   ├── claude.js      # Génération de messages (Anthropic Haiku)
│   └── telegram.js    # Notifications Telegram (HTML)
├── jobs/
│   └── relance-devis.js   # Agent Relance Devis
├── cron.js            # Orchestrateur node-cron
├── test-relance.js    # Test manuel sans cron
├── package.json
├── .env.example
└── README.md
```

| Fichier | Rôle |
|---------|------|
| `lib/supabase.js` | Connexion BDD, requête des devis `statut = envoye` émis depuis ≥ 3 jours |
| `lib/claude.js` | Appel Claude pour rédiger le corps du message de relance |
| `lib/telegram.js` | Envoi des notifications à l'entrepreneur |
| `jobs/relance-devis.js` | Logique métier Relance Devis |
| `cron.js` | Planification quotidienne 20h00 (Europe/Paris) |

### Statuts devis (alignés sur le dashboard)

Valeurs utilisées dans Next.js : `brouillon`, `envoye`, `signe`, `refuse`.  
L'agent Relance cible uniquement **`envoye`** (devis envoyé, en attente de réponse).

## Ajouter un nouvel agent

1. Créer `jobs/mon-agent.js` qui exporte une fonction async (avec try/catch + logs).
2. Importer cette fonction dans `cron.js`.
3. Ajouter un `cron.schedule(...)` avec la fréquence souhaitée et le fuseau `Europe/Paris`.

## Sécurité

- **Ne jamais committer** `agents/.env` (déjà dans `.gitignore`).
- `SUPABASE_SECRET_KEY` contourne les RLS : accès complet à la base. **Serveur / agents uniquement**, jamais dans le navigateur.
- `TELEGRAM_BOT_TOKEN` et `ANTHROPIC_API_KEY` sont également confidentiels.

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm start` | Démarre `cron.js` (processus long) |
| `npm run test:relance` | Exécute une fois l'agent Relance Devis |
| `npm run test:db` | Affiche 5 devis depuis Supabase |
