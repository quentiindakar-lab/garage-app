# Prompt Cursor — Refonte UI BTP Pro « Liquid Glass » (v2)

> Coller ce prompt dans un chat Cursor avec le dossier **APP** ouvert.  
> Référence visuelle prioritaire : **Shopall** (dashboard e-commerce). Secondaires : **Flux** (glass prononcé), **DealDeck** (ombres + radius).

---

## Contexte projet

- **Chemin** : `C:\Users\Utilisateur\Desktop\APP`
- **Stack** : Next.js 14 (App Router) + React 18 + TypeScript + Tailwind 3 + shadcn/Radix + Prisma/Supabase
- **Zone admin** : `app/(admin)/layout.tsx` + pages sous `app/(admin)/admin/*`
- **Styles globaux** : `app/globals.css`
- **Identité** : vert forêt `#4a7c59` — **ne pas** remplacer par du violet Shopall

## Problème actuel (à corriger)

La v1 glass est **ratée** car :
1. Cartes quasi **opaques** (blanc 92–94 %) → aucun effet verre visible
2. Fond dégradé **trop pâle** → rien à flouter derrière les panneaux
3. **`ThemeProvider` en dark par défaut** → sidebar/header sombres incohérents
4. Nombreuses pages avec `bg-white` / `border-gray-200` **en dur** qui bypassent `.btp-card`
5. Pas de **mesh coloré** visible (blobs Shopall-like)
6. `backdrop-filter` sans fond contrasté = rendu « plat gris »

## Objectif visuel (mix discret ↔ prononcé)

| Couche | Rendu attendu |
|--------|----------------|
| **Fond** | Dégradé crème/vert/lavande/bleu **visible** + 3–4 blobs flous (opacity 0.22–0.35) |
| **Sidebar + topbar** | Verre clair `rgba(255,255,255,0.55–0.65)` + `blur(20–28px)` + bordure blanche fine |
| **Cartes KPI / listes** | `rgba(255,255,255,0.50–0.68)` + blur — **on doit voir le fond à travers** |
| **1 carte hero** | Dashboard « Dépenses du mois » : dégradé vert + grain (DealDeck) |
| **Kanban CRM** | Colonnes plus transparentes que les cartes prospect |
| **Texte / badges** | Lisibilité WCAG — badges statut inchangés sémantiquement |

## Règles techniques obligatoires

```css
/* Exemple tokens cibles */
--glass-card: rgba(255, 255, 255, 0.52);
--glass-blur: 20px;
backdrop-filter: blur(20px) saturate(160%);
border: 1px solid rgba(255, 255, 255, 0.85);
box-shadow: 0 10px 40px rgba(31, 38, 55, 0.1);
```

- Toujours `-webkit-backdrop-filter` + fallback `prefers-reduced-transparency`
- **Thème admin = light uniquement** : `ThemeProvider` défaut `light` ; `.dark` ne doit pas assombrir l’admin
- **Interdit** : `bg-white` opaque sur cartes admin → utiliser `.btp-card` ou `.glass-card-soft`
- Ne pas toucher logique API, Prisma, auth, routing

## Fichiers à modifier (ordre)

1. `components/theme-provider.tsx` — défaut `light`
2. `app/globals.css` — tokens + `.app-glass-mesh`, `.glass-sidebar`, `.glass-topbar`, `.btp-card`, `.glass-kpi-hero`
3. `app/(admin)/layout.tsx` — mesh blobs + sidebar/topbar glass
4. `components/ui/card.tsx` — déléguer à `.btp-card`
5. `app/(admin)/admin/dashboard/page.tsx` — hero KPI + cartes
6. Propager : `clients`, `chantiers`, `devis`, `crm`, `planning`, `bilan`, `equipe`, `estimation`
7. Remplacer patterns :
   - `rounded-2xl border border-gray-200 bg-white` → `btp-card`
   - `bg-gray-100` colonnes kanban → `glass-kanban-col`

## Pages avec `bg-white` encore à traiter

- `app/(admin)/admin/estimation/page.tsx`
- `app/(admin)/admin/chantiers/[id]/page.tsx`
- `app/(admin)/admin/chantiers/nouveau/page.tsx`
- `app/(admin)/admin/clients/[id]/page.tsx`
- `app/(admin)/admin/crm/emails/page.tsx`
- `app/(admin)/admin/parametres/page.tsx`
- modales CRM / équipe / planning

## Critères d’acceptation (checklist)

- [ ] Fond coloré **clairement visible** derrière les cartes
- [ ] Cartes **semi-transparentes** avec blur perceptible (pas des blocs opaques)
- [ ] Sidebar et header **clairs**, jamais charcoal/noir
- [ ] Dashboard : carte « Dépenses du mois » en hero vert dégradé
- [ ] Recherche pill glass sur Clients, Chantiers, Devis, Équipe
- [ ] CRM : colonnes translucides, cartes prospect plus opaques
- [ ] `npm run build` OK
- [ ] Aucune régression fonctionnelle

## Hors scope

- Nouvelles features, copy, graphiques Recharts (conteneurs seulement)
- Mode sombre admin complet

## Livrable Git

Branche `main` : commit message suggéré  
`feat(ui): refonte liquid glass v2 — mesh, transparence, thème clair`

Puis `git push origin main` pour déployer Vercel.

## Test local

```bash
npm run dev
```

Ouvrir `/admin/dashboard` et `/admin/chantiers` — comparer aux inspirations Shopall/Flux.
