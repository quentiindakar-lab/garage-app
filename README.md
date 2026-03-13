# Garage Dupont — Application de gestion

Application web complète pour garage automobile / carrosserie. Gestion des ordres de réparation, devis, facturation, suivi client en temps réel, assistant IA, et fidélisation automatique.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Next.js API Routes + Prisma ORM
- **Base de données** : PostgreSQL
- **Auth** : NextAuth.js (3 rôles : ADMIN, TECHNICIEN, CLIENT)
- **IA** : OpenAI GPT-4o
- **SMS** : Twilio
- **Email** : Resend
- **Signature** : signature_pad (embarqué)
- **PDF** : @react-pdf/renderer

## Installation

### Prérequis

- Node.js 20+
- PostgreSQL 16+
- Comptes API : OpenAI, Twilio, Resend (optionnels pour le dev)

### Étapes

```bash
# 1. Cloner et installer
git clone <repo>
cd garage-app
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Personnaliser le garage
# Éditer config/garage.config.ts avec le nom, logo, couleurs, etc.

# 4. Initialiser la base de données
npx prisma db push
npm run db:seed

# 5. Démarrer en développement
npm run dev
```

### Avec Docker

```bash
docker-compose up -d
```

## Comptes par défaut (seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@garage-dupont.fr | admin123 |
| Technicien | marc@garage-dupont.fr | tech123 |
| Technicien | sophie@garage-dupont.fr | tech123 |

## Configuration garage

Toute la personnalisation se fait dans `config/garage.config.ts` :
- Nom, slogan, logo
- Couleurs (primaire, secondaire)
- Coordonnées, SIRET
- Horaires d'ouverture
- Nombre de ponts / capacité
- Préfixes de facturation
- Seuils de rappels

## Modules

1. **Accueil & Prise de RDV** — Page publique avec décodage plaque, sélection créneaux
2. **Ordres de réparation** — Gestion complète avec checklist, photos, assignation
3. **Devis & Facturation IA** — Génération IA, signature électronique, conversion facture
4. **Portail client temps réel** — Suivi véhicule par token, mises à jour instantanées
5. **Assistant IA technicien** — Chat diagnostic avec streaming, rapport technique
6. **Rappels & Fidélisation** — CT, révision, relance devis, avis Google
7. **Tableau de bord** — KPIs, graphiques CA, analytics

## Structure

```
/app              → Pages Next.js (App Router)
/app/api          → Routes API
/app/(public)     → Pages publiques (accueil, rdv, suivi, devis)
/app/(admin)      → Pages protégées admin/technicien
/components       → Composants réutilisables
/components/ui    → Composants shadcn/ui
/lib              → Utilitaires, clients API, helpers
/config           → garage.config.ts
/prisma           → Schema + seed
```
