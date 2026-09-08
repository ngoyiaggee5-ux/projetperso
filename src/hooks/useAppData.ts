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

  const isLoading = [
    produits, categories, fournisseurs, entrees, sorties,
    ventes, detailsVentes, utilisateurs, auditLogs,
  ].some((q) => q.isLoading)

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
    refetchAll: () => Promise.all([
      produits.refetch(), categories.refetch(), fournisseurs.refetch(),
      entrees.refetch(), sorties.refetch(), ventes.refetch(),
      detailsVentes.refetch(), utilisateurs.refetch(), auditLogs.refetch(),
    ]),
  }
}
