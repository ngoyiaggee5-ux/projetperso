-- FreshStock — Schéma minimal (si tables absentes)
-- Exécuter AVANT migration.sql sur un projet Supabase vide

CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'magasinier',
  statut TEXT NOT NULL DEFAULT 'pending',
  auth_id UUID REFERENCES auth.users(id),
  date_creation TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.fournisseurs (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS public.produits (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  categorie_id INTEGER REFERENCES public.categories(id),
  fournisseur_id INTEGER REFERENCES public.fournisseurs(id),
  prix_achat NUMERIC NOT NULL DEFAULT 0,
  prix_vente NUMERIC NOT NULL DEFAULT 0,
  quantite_stock INTEGER NOT NULL DEFAULT 0,
  seuil_alerte INTEGER NOT NULL DEFAULT 5,
  unite TEXT NOT NULL DEFAULT 'pièce',
  date_peremption DATE,
  statut TEXT NOT NULL DEFAULT 'actif'
);

CREATE TABLE IF NOT EXISTS public.entrees (
  id SERIAL PRIMARY KEY,
  produit_id INTEGER NOT NULL REFERENCES public.produits(id),
  fournisseur_id INTEGER REFERENCES public.fournisseurs(id),
  quantite INTEGER NOT NULL,
  prix_unitaire NUMERIC NOT NULL DEFAULT 0,
  date_entree TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sorties (
  id SERIAL PRIMARY KEY,
  produit_id INTEGER NOT NULL REFERENCES public.produits(id),
  type_sortie TEXT NOT NULL,
  quantite INTEGER NOT NULL,
  motif TEXT,
  date_sortie TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ventes (
  id SERIAL PRIMARY KEY,
  numero_vente TEXT NOT NULL,
  client_nom TEXT,
  montant_total NUMERIC NOT NULL DEFAULT 0,
  date_vente TIMESTAMPTZ NOT NULL DEFAULT now(),
  utilisateur TEXT
);

CREATE TABLE IF NOT EXISTS public.details_ventes (
  id SERIAL PRIMARY KEY,
  vente_id INTEGER NOT NULL REFERENCES public.ventes(id),
  produit_id INTEGER NOT NULL REFERENCES public.produits(id),
  quantite INTEGER NOT NULL,
  prix_unitaire NUMERIC NOT NULL,
  sous_total NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  utilisateur TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  date_action TIMESTAMPTZ NOT NULL DEFAULT now()
);
