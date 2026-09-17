-- FreshStock — Corriger « Impossible de charger les données »
-- Exécuter dans SQL Editor si le dashboard échoue après connexion

-- 1. Lecture garantie pour les utilisateurs connectés (authenticated)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'categories', 'fournisseurs', 'produits', 'entrees', 'sorties',
    'ventes', 'details_ventes', 'audit_logs'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'fs_authenticated_select', tbl);
      EXECUTE format(
        'CREATE POLICY fs_authenticated_select ON public.%I FOR SELECT TO authenticated USING (true)',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- 2. Droits API
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Test rapide (doit retourner des lignes ou 0 ligne, pas d'erreur)
SELECT 'categories' AS table_name, count(*)::int AS rows FROM public.categories
UNION ALL
SELECT 'produits', count(*)::int FROM public.produits;
