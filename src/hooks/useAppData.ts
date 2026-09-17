import { useQuery } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchDetailsVentes,
  fetchEntrees,
  fetchFournisseurs,
  fetchProduits,
  fetchSorties,
  fetchVentes,
} from '@/services/api'

export type AppDataScope =
  | 'dashboard'
  | 'produits'
  | 'categories'
  | 'fournisseurs'
  | 'entrees'
  | 'sorties'

function scopeNeeds(scope: AppDataScope, ...scopes: AppDataScope[]) {
  return scopes.includes(scope)
}

/** Charge uniquement les tables nécessaires à la page (évite erreurs RLS / requêtes inutiles). */
export function useAppData(scope: AppDataScope = 'dashboard') {
  const needProduits = scopeNeeds(scope, 'dashboard', 'produits', 'categories', 'entrees', 'sorties')
  const needCategories = scopeNeeds(scope, 'dashboard', 'produits', 'categories')
  const needFournisseurs = scopeNeeds(scope, 'produits', 'entrees')
  const needEntrees = scope === 'entrees'
  const needSorties = scope === 'sorties'
  const needVentes = scope === 'dashboard'
  const needDetails = scope === 'dashboard'

  const produits = useQuery({ queryKey: ['produits'], queryFn: fetchProduits, enabled: needProduits })
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, enabled: needCategories })
  const fournisseurs = useQuery({ queryKey: ['fournisseurs'], queryFn: fetchFournisseurs, enabled: needFournisseurs })
  const entrees = useQuery({ queryKey: ['entrees'], queryFn: fetchEntrees, enabled: needEntrees })
  const sorties = useQuery({ queryKey: ['sorties'], queryFn: fetchSorties, enabled: needSorties })
  const ventes = useQuery({ queryKey: ['ventes'], queryFn: fetchVentes, enabled: needVentes })
  const detailsVentes = useQuery({ queryKey: ['details_ventes'], queryFn: fetchDetailsVentes, enabled: needDetails })

  const activeQueries = [
    ...(needProduits ? [produits] : []),
    ...(needCategories ? [categories] : []),
    ...(needFournisseurs ? [fournisseurs] : []),
    ...(needEntrees ? [entrees] : []),
    ...(needSorties ? [sorties] : []),
    ...(needVentes ? [ventes] : []),
    ...(needDetails ? [detailsVentes] : []),
  ]

  const isLoading = activeQueries.some((q) => q.isLoading)
  const isError = activeQueries.some((q) => q.isError)
  const failed = activeQueries.find((q) => q.isError)
  const errorMessage =
    failed?.error instanceof Error ? failed.error.message : 'Erreur de chargement des données'

  return {
    produits: produits.data ?? [],
    categories: categories.data ?? [],
    fournisseurs: fournisseurs.data ?? [],
    entrees: entrees.data ?? [],
    sorties: sorties.data ?? [],
    ventes: ventes.data ?? [],
    detailsVentes: detailsVentes.data ?? [],
    isLoading,
    isError,
    errorMessage,
    refetchAll: () => Promise.all(activeQueries.map((q) => q.refetch())),
  }
}
