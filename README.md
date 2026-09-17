# FreshStock ERP v2

Application ERP de gestion d'entrepôt — **React + Vite + TypeScript + Supabase Auth**.

## Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS 3**
- **Supabase Auth** (authentification sécurisée)
- **TanStack Query** (cache & sync données)
- **TanStack Table** (tableaux produits)
- **React Router** (navigation)
- **Sonner** (notifications)

## Déploiement Netlify

1. Connectez le repo GitHub à Netlify
2. Netlify utilise `netlify.toml` (build + redirects SPA)
3. **Obligatoire** — **Site configuration → Environment variables** :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploys → Trigger deploy → Clear cache and deploy site**
5. Supabase → **Authentication → URL Configuration** : ajoutez votre URL Netlify

Sans les variables, un message d'erreur s'affiche (plus d'écran blanc).

## Démarrage local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

## Configuration

Copier `.env.example` vers `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## Connexion / Auth Supabase

La v2 utilise **Supabase Auth** (pas `mot_de_passe` de la table).

### Étapes (dans l'ordre)

1. Exécuter `supabase/migration.sql` (RLS + policies)
2. **Dashboard → Authentication → Users → Add user**
   - Email identique à `utilisateurs` (ex. `admin@freshstock.com`)
   - Nouveau mot de passe (pas l'ancien `admin123`)
   - Cocher **Auto Confirm User**
3. Exécuter `supabase/setup-auth.sql` (lie `auth_id`, active les comptes, corrige RLS)
4. Se connecter avec le mot de passe **Supabase Auth**

### Inscription publique (visiteurs)

1. **Authentication → Providers → Email** : activé ; « Confirm email » désactivé recommandé pour l’ERP.
2. Exécuter `setup-auth.sql` (trigger `handle_auth_user_created` + policies).
3. Les visiteurs s’inscrivent sur la page **Inscription** → statut `pending`.
4. L’**admin** ouvre **Utilisateurs** → **Activer** le compte.
5. L’utilisateur peut alors se connecter.

### Erreurs courantes

| Message | Solution |
|---------|----------|
| Identifiants incorrects | Créer le user dans Authentication (étape 2) |
| Compte en attente | Admin → **Utilisateurs** → **Activer** |
| Profil bloqué RLS | Exécuter `setup-auth.sql` |

## Migration depuis v1 (legacy)

L'ancienne version est dans `legacy/` (HTML + JS vanilla).

### Étapes Supabase

1. Exécuter `supabase/migration.sql`
2. Créer les comptes dans **Authentication → Users**
3. Exécuter `supabase/setup-auth.sql`
4. Supprimer `mot_de_passe` une fois tous les users migrés

### Pages migrées

| Page | Statut |
|------|--------|
| Login / Inscription | ✅ Supabase Auth |
| Dashboard | ✅ |
| Produits | ✅ CRUD complet |
| Catégories | ✅ CRUD |
| Fournisseurs | ✅ CRUD |
| Entrées, Sorties stock | ✅ |
| Ventes, POS, Factures | 🚧 À migrer |
| Rapports, Suggestions, Audit | 🚧 À migrer |
| Utilisateurs (activation admin) | ✅ |
| Paramètres | 🚧 À migrer |

## Scripts

```bash
npm run dev      # Développement
npm run build    # Build production
npm run preview  # Prévisualiser le build
```

## Structure

```
src/
├── components/   # UI, layout, auth
├── contexts/     # AuthContext
├── hooks/        # useAppData
├── lib/          # supabase, utils
├── pages/        # Pages de l'app
├── providers/    # QueryClient, Router
├── services/     # API Supabase
└── types/        # TypeScript types
legacy/           # Ancienne version v1
supabase/         # Scripts SQL migration
```
