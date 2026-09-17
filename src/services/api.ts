import { supabase } from '@/lib/supabase'
import type { AuditLog, Categorie, DetailVente, Entree, Fournisseur, Produit, Sortie, Utilisateur, Vente } from '@/types'

export async function fetchUtilisateurs() {
  const { data, error } = await supabase.from('utilisateurs').select('*').order('id')
  if (error) throw error
  return data as Utilisateur[]
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('id')
  if (error) throw error
  return data as Categorie[]
}

export async function fetchFournisseurs() {
  const { data, error } = await supabase.from('fournisseurs').select('*').order('id')
  if (error) throw error
  return data as Fournisseur[]
}

export async function fetchProduits() {
  const { data, error } = await supabase.from('produits').select('*').order('id')
  if (error) throw error
  return data as Produit[]
}

export async function fetchEntrees() {
  const { data, error } = await supabase.from('entrees').select('*').order('id', { ascending: false })
  if (error) throw error
  return data as Entree[]
}

export async function fetchSorties() {
  const { data, error } = await supabase.from('sorties').select('*').order('id', { ascending: false })
  if (error) throw error
  return data as Sortie[]
}

export async function fetchVentes() {
  const { data, error } = await supabase.from('ventes').select('*').order('id', { ascending: false })
  if (error) throw error
  return data as Vente[]
}

export async function fetchDetailsVentes() {
  const { data, error } = await supabase.from('details_ventes').select('*').order('id')
  if (error) throw error
  return data as DetailVente[]
}

export async function fetchAuditLogs() {
  const { data, error } = await supabase.from('audit_logs').select('*').order('id', { ascending: false })
  if (error) throw error
  return data as AuditLog[]
}

export async function fetchProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()
  if (error) throw error
  return data as Utilisateur | null
}

export async function fetchProfileByAuthId(authId: string) {
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle()
  if (error) throw error
  return data as Utilisateur | null
}

/** Récupère le profil connecté — RPC get_my_profile (contourne RLS) avec fallback */
export async function fetchMyProfile(): Promise<Utilisateur | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile')
  if (!rpcError && rpcData) {
    const row = typeof rpcData === 'string' ? (JSON.parse(rpcData) as Utilisateur) : (rpcData as Utilisateur)
    return row
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  if (user.id) {
    const byAuthId = await fetchProfileByAuthId(user.id)
    if (byAuthId) return byAuthId
  }

  if (user.email) {
    return fetchProfileByEmail(user.email)
  }

  return null
}

export async function createUtilisateurProfile(user: Omit<Utilisateur, 'id'> & { auth_id?: string }) {
  const { data, error } = await supabase.from('utilisateurs').insert([user]).select().single()
  if (error) throw error
  return data as Utilisateur
}

export async function updateUtilisateur(id: number, updates: Partial<Utilisateur>) {
  const { data, error } = await supabase.from('utilisateurs').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Utilisateur
}

export async function createProduit(produit: Omit<Produit, 'id' | 'code'> & { code?: string }) {
  const code = produit.code ?? `PRD-${Date.now()}`
  const { data, error } = await supabase.from('produits').insert([{ ...produit, code }]).select().single()
  if (error) throw error
  return data as Produit
}

export async function updateProduit(id: number, updates: Partial<Produit>) {
  const { data, error } = await supabase.from('produits').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Produit
}

export async function deleteProduit(id: number) {
  const { error } = await supabase.from('produits').delete().eq('id', id)
  if (error) throw error
}

export async function createCategorie(categorie: Omit<Categorie, 'id'>) {
  const { data, error } = await supabase.from('categories').insert([categorie]).select().single()
  if (error) throw error
  return data as Categorie
}

export async function deleteCategorie(id: number) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function createFournisseur(fournisseur: Omit<Fournisseur, 'id'>) {
  const { data, error } = await supabase.from('fournisseurs').insert([fournisseur]).select().single()
  if (error) throw error
  return data as Fournisseur
}

export async function deleteFournisseur(id: number) {
  const { error } = await supabase.from('fournisseurs').delete().eq('id', id)
  if (error) throw error
}

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'date_action'>) {
  const { error } = await supabase.from('audit_logs').insert([{
    ...log,
    date_action: new Date().toISOString(),
  }])
  if (error) throw error
}

export async function createEntreeWithStock(input: {
  produit_id: number
  fournisseur_id?: number | null
  quantite: number
  prix_unitaire: number
}) {
  const produit = await supabase.from('produits').select('quantite_stock').eq('id', input.produit_id).single()
  if (produit.error) throw produit.error

  const nouveauStock = (produit.data.quantite_stock ?? 0) + input.quantite
  const { error: stockError } = await supabase
    .from('produits')
    .update({ quantite_stock: nouveauStock })
    .eq('id', input.produit_id)
  if (stockError) throw stockError

  const { data, error } = await supabase
    .from('entrees')
    .insert([{
      produit_id: input.produit_id,
      fournisseur_id: input.fournisseur_id ?? null,
      quantite: input.quantite,
      prix_unitaire: input.prix_unitaire,
      date_entree: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data as Entree
}

export async function createSortieWithStock(input: {
  produit_id: number
  type_sortie: string
  quantite: number
  motif?: string | null
}) {
  const produit = await supabase.from('produits').select('quantite_stock').eq('id', input.produit_id).single()
  if (produit.error) throw produit.error

  const stockActuel = produit.data.quantite_stock ?? 0
  if (stockActuel < input.quantite) {
    throw new Error(`Stock insuffisant (disponible: ${stockActuel})`)
  }

  const { error: stockError } = await supabase
    .from('produits')
    .update({ quantite_stock: stockActuel - input.quantite })
    .eq('id', input.produit_id)
  if (stockError) throw stockError

  const { data, error } = await supabase
    .from('sorties')
    .insert([{
      produit_id: input.produit_id,
      type_sortie: input.type_sortie,
      quantite: input.quantite,
      motif: input.motif ?? null,
      date_sortie: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data as Sortie
}
