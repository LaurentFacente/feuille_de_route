# Guide de déploiement production (< 30 min)

Objectif : mettre l'application en ligne, partagée et temps réel, en moins de
30 minutes.

## 1. Base de données — Supabase (~10 min)

1. Créer un projet sur https://supabase.com (région proche de l'équipe, ex.
   `eu-west-3`). Noter le **mot de passe DB**.
2. Lier le repo et pousser le schéma :

```bash
npx supabase login
npx supabase link --project-ref <bifouveizpilfulvspys>
npm run db:push        # applique 0001_init.sql + 0002_rls_realtime.sql
```

3. Importer les données existantes :

```bash
# .env doit contenir SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (du projet cloud)
npm run db:seed
```

4. Vérifier dans **Table editor** que les jours/étapes/équipe/checklists sont là.

> Le temps réel et les RLS (accès via clé anon) sont déjà configurés par les
> migrations : aucune authentification ni réglage Realtime à activer.

## 2. Frontend — Vercel (~10 min)

1. Pousser le repo sur GitHub.
2. Sur https://vercel.com : **New Project → Import** le repo. Le `vercel.json`
   configure déjà build (`npm run build`), output (`dist`) et le fallback SPA.
3. **Settings → Environment Variables** (Production) :

| Variable | Valeur |
| -------- | ------ |
| `VITE_SUPABASE_URL` | Project URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé `anon` publique |
| `VITE_PROJECT_ID` | `tehazed` |

4. **Deploy**. L'URL de production est prête — c'est l'URL à partager avec
   l'équipe (elle fait office de secret d'accès).

## 3. CI/CD (optionnel mais recommandé)

Deux workflows GitHub Actions sont fournis :

- `.github/workflows/ci.yml` — lint + typecheck + build sur chaque PR/push.
- `.github/workflows/deploy.yml` — sur push `main` : `supabase db push` puis
  déploiement Vercel.

Secrets GitHub à configurer (**Settings → Secrets and variables → Actions**) :

| Secret | Source |
| ------ | ------ |
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | Référence du projet (dans l'URL du dashboard) |
| `SUPABASE_DB_PASSWORD` | Mot de passe DB choisi à l'étape 1 |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | `vercel link` puis `.vercel/project.json` |

## Checklist de mise en ligne

- [ ] Projet Supabase créé, mot de passe DB noté
- [ ] `npm run db:push` exécuté sans erreur
- [ ] `npm run db:seed` exécuté, données visibles dans Studio
- [ ] Variables d'env Vercel renseignées
- [ ] Déploiement Vercel réussi
- [ ] Test temps réel à deux navigateurs OK

## Coûts

Free tier Supabase (jusqu'à 500 Mo DB, realtime inclus) + Vercel Hobby = **0 €**
pour un usage d'un week-end de tournage avec 5-20 utilisateurs.
