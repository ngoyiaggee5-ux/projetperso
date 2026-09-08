import { useQuery } from '@tanstack/react-query'
import {
  fetchAuditLogs, fetchCategories, fetchDetailsVentes, fetchEntrees,
  fetchFournisseurs, fetchProduits, fetchSorties, fetchUtilisateurs, fetchVentes,
} from '@/services/api'

export function useAppData() {
  const produits = useQuery({ queryKey: ['produits'], queryFn: fetchProduits })
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const fournisseurs = useQuery({ queryKey: ['fournisseurs'], queryFn: fetchFournisseurs })
  const entrees = useQuery({ queryKey: ['entrees'], queryFn: fetchEntrees })
  const sorties = useQuery({ queryKey: ['sorties'], queryFn: fetchSorties })
  const ventes = useQuery({ queryKey: ['ventes'], queryFn: fetchVentes })
  const detailsVentes = useQuery({ queryKey: ['details_ventes'], queryFn: fetchDetailsVentes })
  const utilisateurs = useQuery({ queryKey: ['utilisateurs'], queryFn: fetchUtilisateurs })
  const auditLogs = useQuery({ queryKey: ['audit_logs'], queryFn: fetchAuditLogs })

  const queries = [produits, categories, fournisseurs, entrees, sorties, ventes, detailsVentes, utilisateurs, auditLogs]

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const errorMessage = queries.find((q) => q.error)?.error instanceof Error
    ? (queries.find((q) => q.error)?.error as Error).message
    : 'Erreur de chargement'

  return {
    produits: produits.data ?? [],
    categories: categories.data ?? [],
    fournisseurs: fournisseurs.data ?? [],
    entrees: entrees.data ?? [],
    sorties: sorties.data ?? [],
    ventes: ventes.data ?? [],
    detailsVentes: detailsVentes.data ?? [],
    utilisateurs: utilisateurs.data ?? [],
    auditLogs: auditLogs.data ?? [],
    isLoading,
    isError,
    errorMessage,
    refetchAll: () => Promise.all(queries.map((q) => q.refetch())),
  }
}
