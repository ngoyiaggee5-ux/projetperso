-- ================================================================
-- FreshStock — Configuration Auth (À EXÉCUTER APRÈS migration.sql)
-- ================================================================
-- Si vous voyez "Profil utilisateur introuvable" :
--   1. Authentication → Users → vérifiez que le user existe (Auto Confirm)
--   2. Exécutez CE SCRIPT en entier
-- ================================================================

-- 1. Lier auth_id automatiquement (utilisateurs ↔ auth.users)
UPDATE public.utilisateurs u
SET auth_id = au.id
FROM auth.users au
WHERE lower(trim(u.email)) = lower(trim(au.email))
  AND (u.auth_id IS NULL OR u.auth_id != au.id);

-- 2. Activer les comptes par défaut
UPDATE public.utilisateurs
SET statut = 'active'
WHERE lower(email) IN (
  'admin@freshstock.com',
  'manager@freshstock.com',
  'caissier@freshstock.com',
  'magasinier@freshstock.com'
);

UPDATE public.utilisateurs
SET role = 'admin', statut = 'active'
WHERE lower(email) = 'admin@freshstock.com';

-- 3. Fonctions helper (SECURITY DEFINER = contourne RLS en interne)
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

-- 4. Fonction pour récupérer SON propre profil (utilisée par l'app)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT to_json(u.*)
  FROM public.utilisateurs u
  WHERE u.auth_id = auth.uid()
     OR lower(trim(u.email)) = lower(trim(auth.jwt() ->> 'email'))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. Policies utilisateurs — on supprime les anciennes puis on recrée
DROP POLICY IF EXISTS "users_read_own" ON public.utilisateurs;
DROP POLICY IF EXISTS "users_admin_all" ON public.utilisateurs;
DROP POLICY IF EXISTS "users_insert_own" ON public.utilisateurs;
DROP POLICY IF EXISTS "users_update_own" ON public.utilisateurs;
DROP POLICY IF EXISTS "users_admin_manage" ON public.utilisateurs;

CREATE POLICY "users_read_own" ON public.utilisateurs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth_id = auth.uid()
      OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
      OR public.is_admin()
    )
  );

CREATE POLICY "users_insert_own" ON public.utilisateurs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
  );

CREATE POLICY "users_update_own" ON public.utilisateurs
  FOR UPDATE
  USING (
    auth_id = auth.uid()
    OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
    OR public.is_admin()
  );

CREATE POLICY "users_admin_manage" ON public.utilisateurs
  FOR ALL
  USING (public.is_admin());

-- 6. Lecture des données métier (utilisateur connecté)
DROP POLICY IF EXISTS "data_write_roles" ON public.categories;
DROP POLICY IF EXISTS "fourn_write" ON public.fournisseurs;
DROP POLICY IF EXISTS "prod_write" ON public.produits;
DROP POLICY IF EXISTS "entrees_write" ON public.entrees;
DROP POLICY IF EXISTS "sorties_write" ON public.sorties;
DROP POLICY IF EXISTS "ventes_write" ON public.ventes;
DROP POLICY IF EXISTS "details_write" ON public.details_ventes;

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

DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Profil automatique à chaque inscription Auth (inscription publique)
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.utilisateurs u
  SET
    auth_id = NEW.id,
    nom = COALESCE(nullif(trim(NEW.raw_user_meta_data->>'nom'), ''), u.nom)
  WHERE lower(trim(u.email)) = lower(trim(NEW.email));

  IF NOT FOUND THEN
    INSERT INTO public.utilisateurs (nom, email, role, statut, auth_id, date_creation)
    VALUES (
      COALESCE(nullif(trim(NEW.raw_user_meta_data->>'nom'), ''), split_part(NEW.email, '@', 1)),
      lower(trim(NEW.email)),
      'magasinier',
      'pending',
      NEW.id,
      timezone('utc', now())
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- 8. Droits API (authenticated = utilisateur connecté)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Vérification
SELECT u.id, u.nom, u.email, u.role, u.statut, u.auth_id, au.email AS auth_email
FROM public.utilisateurs u
LEFT JOIN auth.users au ON au.id = u.auth_id
ORDER BY u.id;

-- auth_id doit être rempli | statut = active | auth_email = email
