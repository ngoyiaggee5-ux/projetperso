import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { mapAuthError, mapProfileError } from '@/lib/auth-errors'
import { supabase } from '@/lib/supabase'
import { addAuditLog, createUtilisateurProfile, fetchProfileByEmail, updateUtilisateur } from '@/services/api'
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
  } else if (!profile.auth_id) {
    profile = await updateUtilisateur(profile.id, { auth_id: session.user.id })
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
    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })
    if (error) return { error: mapAuthError(error) }

    let userProfile: AuthProfile | null = null
    try {
      let profile = await fetchProfileByEmail(normalizedEmail)
      if (!profile) {
        return {
          error:
            'Compte Auth OK, mais aucun profil dans la table utilisateurs. ' +
            'Exécutez supabase/setup-auth.sql ou inscrivez-vous via l\'application.',
        }
      }

      if (!profile.auth_id && data.user) {
        profile = await updateUtilisateur(profile.id, { auth_id: data.user.id })
      }

      userProfile = { ...profile, sessionEmail: normalizedEmail }
    } catch (err) {
      await supabase.auth.signOut()
      return { error: mapProfileError(err) }
    }

    if (userProfile.statut === 'inactive') {
      await supabase.auth.signOut()
      return { error: 'Votre compte est désactivé. Contactez un administrateur.' }
    }
    if (userProfile.statut === 'pending') {
      await supabase.auth.signOut()
      return {
        error:
          'Votre compte est en attente d\'activation. ' +
          'Un admin doit exécuter : UPDATE utilisateurs SET statut = \'active\' WHERE email = \'...\';',
      }
    }

    setProfile(userProfile)
    try {
      await addAuditLog({
        utilisateur: normalizedEmail,
        action: 'Connexion',
        details: `Login réussi - Rôle: ${userProfile.role}`,
      })
    } catch {
      // audit non bloquant
    }

    if (data.session) setSession(data.session)
    return {}
  }

  const signUp = async (nom: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const existing = await fetchProfileByEmail(normalizedEmail)
      if (existing) return { error: 'Cet email est déjà utilisé.' }
    } catch {
      // continue — profil peut être inaccessible avant auth
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { nom } },
    })
    if (error) return { error: mapAuthError(error) }

    if (data.user) {
      try {
        await createUtilisateurProfile({
          nom,
          email: normalizedEmail,
          role: 'magasinier',
          statut: 'pending',
          auth_id: data.user.id,
          date_creation: new Date().toISOString(),
        })
        await addAuditLog({
          utilisateur: normalizedEmail,
          action: 'Inscription',
          details: 'Nouvel utilisateur inscrit - En attente',
        })
      } catch (err) {
        return { error: mapProfileError(err) }
      }
    }

    await supabase.auth.signOut()
    return {}
  }

  const signOut = async () => {
    if (profile) {
      try {
        await addAuditLog({
          utilisateur: profile.email,
          action: 'Déconnexion',
          details: 'Logout',
        })
      } catch {
        // audit non bloquant
      }
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
