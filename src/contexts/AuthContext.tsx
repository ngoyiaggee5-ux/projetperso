import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { addAuditLog, createUtilisateurProfile, fetchProfileByEmail } from '@/services/api'
import type { AuthProfile, UserRole } from '@/types'
import { ADMIN_PAGES, HIDDEN_PAGES } from '@/types'

interface AuthContextValue {
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (nom: string, email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  canAccessPage: (page: string) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadProfile(session: Session): Promise<AuthProfile | null> {
  const email = session.user.email
  if (!email) return null

  let profile = await fetchProfileByEmail(email)
  if (!profile) {
    profile = await createUtilisateurProfile({
      nom: session.user.user_metadata?.nom ?? email.split('@')[0],
      email,
      role: 'magasinier',
      statut: 'pending',
      auth_id: session.user.id,
      date_creation: new Date().toISOString(),
    })
  }

  return { ...profile, sessionEmail: email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        try {
          setProfile(await loadProfile(data.session))
        } catch {
          setProfile(null)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        try {
          setProfile(await loadProfile(nextSession))
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'Email ou mot de passe incorrect.' }

    const userProfile = await fetchProfileByEmail(email)
    if (!userProfile) return { error: 'Profil utilisateur introuvable.' }
    if (userProfile.statut === 'inactive') {
      await supabase.auth.signOut()
      return { error: 'Votre compte est désactivé.' }
    }
    if (userProfile.statut === 'pending') {
      await supabase.auth.signOut()
      return { error: 'Votre compte est en attente d\'activation.' }
    }

    setProfile({ ...userProfile, sessionEmail: email })
    await addAuditLog({
      utilisateur: email,
      action: 'Connexion',
      details: `Login réussi - Rôle: ${userProfile.role}`,
    })

    if (data.session) setSession(data.session)
    return {}
  }

  const signUp = async (nom: string, email: string, password: string) => {
    const existing = await fetchProfileByEmail(email)
    if (existing) return { error: 'Cet email est déjà utilisé.' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
    })
    if (error) return { error: error.message }

    if (data.user) {
      await createUtilisateurProfile({
        nom,
        email,
        role: 'magasinier',
        statut: 'pending',
        auth_id: data.user.id,
        date_creation: new Date().toISOString(),
      })
      await addAuditLog({
        utilisateur: email,
        action: 'Inscription',
        details: 'Nouvel utilisateur inscrit - En attente',
      })
    }

    await supabase.auth.signOut()
    return {}
  }

  const signOut = async () => {
    if (profile) {
      await addAuditLog({
        utilisateur: profile.email,
        action: 'Déconnexion',
        details: 'Logout',
      })
    }
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'

  const canAccessPage = (page: string) => {
    if (!profile) return false
    const role = profile.role as UserRole
    if (ADMIN_PAGES.includes(page) && role !== 'admin') return false
    return !HIDDEN_PAGES[role]?.includes(page)
  }

  const value = useMemo(
    () => ({ session, profile, loading, signIn, signUp, signOut, canAccessPage, isAdmin }),
    [session, profile, loading, isAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
