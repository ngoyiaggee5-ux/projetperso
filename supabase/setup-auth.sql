-- ================================================================
-- FreshStock — Configuration Auth (À EXÉCUTER APRÈS migration.sql)
-- ================================================================
-- ÉTAPE MANUELLE D'ABORD :
--   Supabase Dashboard → Authentication → Users → Add user
--   - Email : admin@freshstock.com (ou votre email)
--   - Password : choisissez un NOUVEAU mot de passe
--   - Cochez "Auto Confirm User"
--
-- Puis exécutez ce script :
-- ================================================================

-- 1. Lier automatiquement auth_id (table utilisateurs ↔ auth.users) par email
UPDATE public.utilisateurs u
SET auth_id = au.id
FROM auth.users au
WHERE lower(u.email) = lower(au.email)
  AND (u.auth_id IS NULL OR u.auth_id != au.id);

-- 2. Activer les comptes existants (adapter les emails si besoin)
UPDATE public.utilisateurs
SET statut = 'active'
WHERE email IN (
  'admin@freshstock.com',
  'manager@freshstock.com',
  'caissier@freshstock.com',
  'magasinier@freshstock.com'
);

-- 3. S'assurer que l'admin a le bon rôle
UPDATE public.utilisateurs
SET role = 'admin', statut = 'active'
WHERE email = 'admin@freshstock.com';

-- 4. Policies RLS manquantes pour login / inscription
DROP POLICY IF EXISTS "users_insert_own" ON public.utilisateurs;
CREATE POLICY "users_insert_own" ON public.utilisateurs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "users_update_own" ON public.utilisateurs;
CREATE POLICY "users_update_own" ON public.utilisateurs
  FOR UPDATE
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5. Lecture profil au login (own email ou admin)
DROP POLICY IF EXISTS "users_read_own" ON public.utilisateurs;
CREATE POLICY "users_read_own" ON public.utilisateurs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin())
  );

-- 7. Lecture données pour tout utilisateur authentifié (si tables vides à cause du RLS)
--    Ces policies remplacent les anciennes si déjà créées par migration.sql

DROP POLICY IF EXISTS "data_read_auth" ON public.categories;
CREATE POLICY "data_read_auth" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "fourn_read" ON public.fournisseurs;
CREATE POLICY "fourn_read" ON public.fournisseurs FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "prod_read" ON public.produits;
CREATE POLICY "prod_read" ON public.produits FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "entrees_read" ON public.entrees;
CREATE POLICY "entrees_read" ON public.entrees FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "sorties_read" ON public.sorties;
CREATE POLICY "sorties_read" ON public.sorties FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ventes_read" ON public.ventes;
CREATE POLICY "ventes_read" ON public.ventes FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "details_read" ON public.details_ventes;
CREATE POLICY "details_read" ON public.details_ventes FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "audit_read" ON public.audit_logs;
CREATE POLICY "audit_read" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);

-- 8. Vérification — doit afficher auth_id rempli et statut active
SELECT id, nom, email, role, statut, auth_id
FROM public.utilisateurs
ORDER BY id;

-- 9. (Optionnel) Une fois tous les users migrés vers Supabase Auth :
-- ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS mot_de_passe;
