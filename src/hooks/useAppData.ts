import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchDetailsVentes,
  fetchEntrees,
  fetchFournisseurs,
  fetchProduits,
  fetchSorties,
  fetchVentes,
} from '@/services/api'
import { getErrorMessage } from '@/lib/utils'

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

type TrackedQuery = {
  name: string
  query: UseQueryResult<unknown, unknown>
  optional?: boolean
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

  const tracked: TrackedQuery[] = [
    ...(needProduits ? [{ name: 'produits', query: produits as UseQueryResult<unknown, unknown> }] : []),
    ...(needCategories ? [{ name: 'categories', query: categories as UseQueryResult<unknown, unknown> }] : []),
    ...(needFournisseurs ? [{ name: 'fournisseurs', query: fournisseurs as UseQueryResult<unknown, unknown> }] : []),
    ...(needEntrees ? [{ name: 'entrees', query: entrees as UseQueryResult<unknown, unknown> }] : []),
    ...(needSorties ? [{ name: 'sorties', query: sorties as UseQueryResult<unknown, unknown> }] : []),
    ...(needVentes ? [{ name: 'ventes', query: ventes as UseQueryResult<unknown, unknown>, optional: true }] : []),
    ...(needDetails
      ? [{ name: 'details_ventes', query: detailsVentes as UseQueryResult<unknown, unknown>, optional: true }]
      : []),
  ]

  const required = tracked.filter((t) => !t.optional)
  const isLoading = tracked.some((t) => t.query.isLoading)
  const failedRequired = required.filter((t) => t.query.isError)
  const isError = failedRequired.length > 0
  const errorMessage = failedRequired
    .map((t) => getErrorMessage(t.query.error))
    .join(' | ')

  const refetchAll = () => Promise.all(tracked.map((t) => t.query.refetch()))

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
    refetchAll,
  }
}
