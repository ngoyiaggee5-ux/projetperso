-- FreshStock v2 — Migration Supabase Auth + RLS
-- Ré-exécutable : DROP IF EXISTS avant chaque CREATE POLICY
-- Si erreur "policy already exists" : exécutez seulement setup-auth.sql

-- 1. Colonnes & index
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON public.utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_auth_id ON public.utilisateurs(auth_id);

-- 2. Fonctions helper
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.utilisateurs
  WHERE auth_id = auth.uid()
     OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_user_role() = 'admin', false);
$$;

-- 3. Activer RLS
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.details_ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies utilisateurs
DROP POLICY IF EXISTS "users_read_own" ON public.utilisateurs;
DROP POLICY IF EXISTS "users_admin_all" ON public.utilisateurs;

CREATE POLICY "users_read_own" ON public.utilisateurs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth_id = auth.uid()
      OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
      OR public.is_admin()
    )
  );

CREATE POLICY "users_admin_all" ON public.utilisateurs FOR ALL
  USING (public.is_admin());

-- 5. Policies données métier
DROP POLICY IF EXISTS "data_read_auth" ON public.categories;
DROP POLICY IF EXISTS "data_write_roles" ON public.categories;
CREATE POLICY "data_read_auth" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "data_write_roles" ON public.categories FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'magasinier'));

DROP POLICY IF EXISTS "fourn_read" ON public.fournisseurs;
DROP POLICY IF EXISTS "fourn_write" ON public.fournisseurs;
CREATE POLICY "fourn_read" ON public.fournisseurs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "fourn_write" ON public.fournisseurs FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS "prod_read" ON public.produits;
DROP POLICY IF EXISTS "prod_write" ON public.produits;
CREATE POLICY "prod_read" ON public.produits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prod_write" ON public.produits FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'magasinier'));

DROP POLICY IF EXISTS "entrees_read" ON public.entrees;
DROP POLICY IF EXISTS "entrees_write" ON public.entrees;
CREATE POLICY "entrees_read" ON public.entrees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "entrees_write" ON public.entrees FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'magasinier'));

DROP POLICY IF EXISTS "sorties_read" ON public.sorties;
DROP POLICY IF EXISTS "sorties_write" ON public.sorties;
CREATE POLICY "sorties_read" ON public.sorties FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sorties_write" ON public.sorties FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'magasinier'));

DROP POLICY IF EXISTS "ventes_read" ON public.ventes;
DROP POLICY IF EXISTS "ventes_write" ON public.ventes;
CREATE POLICY "ventes_read" ON public.ventes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ventes_write" ON public.ventes FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'caissier'));

DROP POLICY IF EXISTS "details_read" ON public.details_ventes;
DROP POLICY IF EXISTS "details_write" ON public.details_ventes;
CREATE POLICY "details_read" ON public.details_ventes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "details_write" ON public.details_ventes FOR ALL
  USING (public.get_user_role() IN ('admin', 'manager', 'caissier'));

DROP POLICY IF EXISTS "audit_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_read" ON public.audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Ensuite exécutez setup-auth.sql (Auth users + liaison auth_id)
