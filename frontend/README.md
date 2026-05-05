# RouePYP

Application web de tirage au sort pour des breaks **Pick Your Player — Give Edition**.

Elle permet de configurer une session de break, d'ajouter les joueurs "give", les spots payants, puis d'attribuer les gives via une roue animée ou un tirage rapide. Les sessions et l'historique sont sauvegardés dans Supabase.

## Stack

- React 19
- TypeScript
- Vite
- Zustand avec persistance localStorage
- Supabase
- Canvas pour la roue

## Prérequis

- Node.js 22+
- Un projet Supabase

## Installation

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase

Exécuter le schéma SQL à la racine du repo :

```bash
../supabase_schema.sql
```

Tables utilisées :

- `sessions` : configuration d'un break
- `draws` : résultats des tirages

> ⚠️ Le schéma actuel ouvre les policies RLS en lecture/écriture publique. C'est pratique pour un usage privé ou prototype, mais à durcir avant une app publique.

## Commandes

```bash
npm run dev      # serveur local Vite
npm run build    # typecheck + build production
npm run lint     # lint ESLint
npm run preview  # preview du build
```

## Fonctionnalités

- Configuration d'un break
- Ajout/suppression des joueurs give
- Ajout/suppression des spots payants
- Tirage roue animé
- Tirage rapide multi-give
- Mode stream plein écran
- Historique des tirages
- Export CSV
- Reprise d'une session existante

## Notes de sécurité / intégrité

Pour rendre les tirages plus auditables, prochaines améliorations recommandées :

- enregistrer une seed de tirage
- sauvegarder l'ordre initial des participants
- exporter une preuve JSON du tirage
- limiter les droits Supabase via auth ou token d'admin
