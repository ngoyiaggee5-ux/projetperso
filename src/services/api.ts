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
    .ilike('email', email)
    .maybeSingle()
  if (error) throw error
  return data as Utilisateur | null
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
