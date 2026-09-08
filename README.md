# FreshStock ERP v2

Application ERP de gestion d'entrepôt — **React + Vite + TypeScript + Supabase Auth**.

## Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase Auth** (authentification sécurisée)
- **TanStack Query** (cache & sync données)
- **TanStack Table** (tableaux produits)
- **Recharts** (graphiques dashboard)
- **React Router** (navigation)
- **Sonner** (notifications)

## Démarrage

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

## Migration depuis v1 (legacy)

L'ancienne version est dans `legacy/` (HTML + JS vanilla).

### Étapes Supabase

1. Exécuter `supabase/migration.sql` dans l'éditeur SQL Supabase
2. Créer les comptes Auth pour vos utilisateurs existants (Dashboard > Authentication)
3. Lier chaque user : `UPDATE utilisateurs SET auth_id = '...' WHERE email = '...'`
4. Activer le compte : `UPDATE utilisateurs SET statut = 'active' WHERE email = '...'`
5. Supprimer `mot_de_passe` une fois tous les users migrés

### Pages migrées

| Page | Statut |
|------|--------|
| Login / Inscription | ✅ Supabase Auth |
| Dashboard | ✅ |
| Produits | ✅ CRUD complet |
| Catégories | ✅ CRUD |
| Fournisseurs | ✅ CRUD |
| Entrées, Sorties, Ventes, POS, Factures | 🚧 À migrer |
| Rapports, Suggestions, Audit | 🚧 À migrer |
| Utilisateurs, Paramètres | 🚧 À migrer |

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
