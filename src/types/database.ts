export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      utilisateurs: {
        Row: {
          id: number
          nom: string
          email: string
          role: string
          statut: string
          auth_id: string | null
          date_creation: string | null
          mot_de_passe?: string | null
        }
        Insert: {
          id?: number
          nom: string
          email: string
          role?: string
          statut?: string
          auth_id?: string | null
          date_creation?: string | null
        }
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>
      }
      categories: {
        Row: { id: number; nom: string; description: string | null }
        Insert: { id?: number; nom: string; description?: string | null }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      fournisseurs: {
        Row: { id: number; nom: string; contact: string | null; telephone: string | null; email: string | null }
        Insert: { id?: number; nom: string; contact?: string | null; telephone?: string | null; email?: string | null }
        Update: Partial<Database['public']['Tables']['fournisseurs']['Insert']>
      }
      produits: {
        Row: {
          id: number
          code: string
          nom: string
          description: string | null
          categorie_id: number | null
          fournisseur_id: number | null
          prix_achat: number
          prix_vente: number
          quantite_stock: number
          seuil_alerte: number
          unite: string
          date_peremption: string | null
          statut: string
        }
        Insert: {
          id?: number
          code?: string
          nom: string
          description?: string | null
          categorie_id?: number | null
          fournisseur_id?: number | null
          prix_achat?: number
          prix_vente?: number
          quantite_stock?: number
          seuil_alerte?: number
          unite?: string
          date_peremption?: string | null
          statut?: string
        }
        Update: Partial<Database['public']['Tables']['produits']['Insert']>
      }
      entrees: {
        Row: { id: number; produit_id: number; fournisseur_id: number | null; quantite: number; prix_unitaire: number; date_entree: string }
        Insert: { id?: number; produit_id: number; fournisseur_id?: number | null; quantite: number; prix_unitaire: number; date_entree?: string }
        Update: Partial<Database['public']['Tables']['entrees']['Insert']>
      }
      sorties: {
        Row: { id: number; produit_id: number; type_sortie: string; quantite: number; motif: string | null; date_sortie: string }
        Insert: { id?: number; produit_id: number; type_sortie: string; quantite: number; motif?: string | null; date_sortie?: string }
        Update: Partial<Database['public']['Tables']['sorties']['Insert']>
      }
      ventes: {
        Row: { id: number; numero_vente: string; client_nom: string | null; montant_total: number; date_vente: string; utilisateur: string | null }
        Insert: { id?: number; numero_vente: string; client_nom?: string | null; montant_total: number; date_vente?: string; utilisateur?: string | null }
        Update: Partial<Database['public']['Tables']['ventes']['Insert']>
      }
      details_ventes: {
        Row: { id: number; vente_id: number; produit_id: number; quantite: number; prix_unitaire: number; sous_total: number }
        Insert: { id?: number; vente_id: number; produit_id: number; quantite: number; prix_unitaire: number; sous_total: number }
        Update: Partial<Database['public']['Tables']['details_ventes']['Insert']>
      }
      audit_logs: {
        Row: { id: number; utilisateur: string; action: string; details: string | null; date_action: string }
        Insert: { id?: number; utilisateur: string; action: string; details?: string | null; date_action?: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
    }
  }
}
