-- FreshStock v2 — Migration Supabase Auth + RLS
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter auth_id à utilisateurs (si absent)
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 2. Index pour les lookups par email
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);

-- 3. Fonction helper : récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.utilisateurs
  WHERE email = auth.jwt() ->> 'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Fonction helper : vérifier si admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(get_user_role() = 'admin', false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. Activer RLS sur toutes les tables
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE details_ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Policies utilisateurs
CREATE POLICY "users_read_own" ON utilisateurs FOR SELECT
  USING (auth.uid() IS NOT NULL AND (email = auth.jwt() ->> 'email' OR is_admin()));

CREATE POLICY "users_admin_all" ON utilisateurs FOR ALL
  USING (is_admin());

-- 7. Policies données métier (lecture pour utilisateurs authentifiés actifs)
CREATE POLICY "data_read_auth" ON categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "data_write_roles" ON categories FOR ALL USING (get_user_role() IN ('admin', 'manager', 'magasinier'));

CREATE POLICY "fourn_read" ON fournisseurs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "fourn_write" ON fournisseurs FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "prod_read" ON produits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prod_write" ON produits FOR ALL USING (get_user_role() IN ('admin', 'manager', 'magasinier'));

CREATE POLICY "entrees_read" ON entrees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "entrees_write" ON entrees FOR ALL USING (get_user_role() IN ('admin', 'manager', 'magasinier'));

CREATE POLICY "sorties_read" ON sorties FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sorties_write" ON sorties FOR ALL USING (get_user_role() IN ('admin', 'manager', 'magasinier'));

CREATE POLICY "ventes_read" ON ventes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ventes_write" ON ventes FOR ALL USING (get_user_role() IN ('admin', 'manager', 'caissier'));

CREATE POLICY "details_read" ON details_ventes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "details_write" ON details_ventes FOR ALL USING (get_user_role() IN ('admin', 'manager', 'caissier'));

CREATE POLICY "audit_read" ON audit_logs FOR SELECT USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. IMPORTANT : Créer les comptes Auth pour les utilisateurs existants
-- Via le dashboard Supabase > Authentication > Users > Invite user
-- Ou via l'API Admin (service_role key — NE JAMAIS exposer côté client)
--
-- Pour chaque utilisateur existant :
--   1. Créer un user dans auth.users avec le même email
--   2. Mettre à jour : UPDATE utilisateurs SET auth_id = '<uuid>' WHERE email = '...';
--   3. Supprimer la colonne mot_de_passe une fois migré :
--      ALTER TABLE utilisateurs DROP COLUMN IF EXISTS mot_de_passe;
