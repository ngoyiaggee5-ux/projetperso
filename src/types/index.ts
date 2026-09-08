export type UserRole = 'admin' | 'manager' | 'caissier' | 'magasinier'
export type UserStatus = 'active' | 'pending' | 'inactive'
export type ProductStatus = 'actif' | 'inactif' | 'rupture'

export interface Utilisateur {
  id: number
  nom: string
  email: string
  role: UserRole
  statut: UserStatus
  auth_id?: string | null
  date_creation?: string | null
}

export interface Categorie {
  id: number
  nom: string
  description?: string | null
}

export interface Fournisseur {
  id: number
  nom: string
  contact?: string | null
  telephone?: string | null
  email?: string | null
}

export interface Produit {
  id: number
  code: string
  nom: string
  description?: string | null
  categorie_id?: number | null
  fournisseur_id?: number | null
  prix_achat: number
  prix_vente: number
  quantite_stock: number
  seuil_alerte: number
  unite: string
  date_peremption?: string | null
  statut: ProductStatus
}

export interface Entree {
  id: number
  produit_id: number
  fournisseur_id?: number | null
  quantite: number
  prix_unitaire: number
  date_entree: string
}

export interface Sortie {
  id: number
  produit_id: number
  type_sortie: string
  quantite: number
  motif?: string | null
  date_sortie: string
}

export interface Vente {
  id: number
  numero_vente: string
  client_nom?: string | null
  montant_total: number
  date_vente: string
  utilisateur?: string | null
}

export interface DetailVente {
  id: number
  vente_id: number
  produit_id: number
  quantite: number
  prix_unitaire: number
  sous_total: number
}

export interface AuditLog {
  id: number
  utilisateur: string
  action: string
  details?: string | null
  date_action: string
}

export interface AuthProfile extends Utilisateur {
  sessionEmail: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  caissier: 'Caissier',
  magasinier: 'Magasinier',
}

export const HIDDEN_PAGES: Record<UserRole, string[]> = {
  caissier: ['fournisseurs', 'entrees', 'sorties', 'rapports', 'suggestions', 'audit'],
  magasinier: ['ventes', 'pos', 'factures', 'rapports', 'suggestions', 'audit'],
  manager: ['users', 'settings', 'audit'],
  admin: [],
}

export const ADMIN_PAGES = ['users', 'settings']
