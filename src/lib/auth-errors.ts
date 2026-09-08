import type { AuthError } from '@supabase/supabase-js'

export function mapAuthError(error: AuthError): string {
  const code = error.code ?? ''
  const msg = error.message.toLowerCase()

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return (
      'Identifiants incorrects pour Supabase Auth. ' +
      'Créez le compte dans Supabase → Authentication → Users, puis exécutez supabase/setup-auth.sql. ' +
      "L'ancien mot_de_passe (table utilisateurs) ne fonctionne plus."
    )
  }

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Email non confirmé. Vérifiez votre boîte mail ou désactivez « Confirm email » dans Supabase → Authentication → Providers.'
  }

  if (msg.includes('too many requests')) {
    return 'Trop de tentatives. Réessayez dans quelques minutes.'
  }

  return error.message
}

export function mapProfileError(error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : ''

  if (msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('42501')) {
    return 'Accès au profil bloqué par RLS. Exécutez supabase/setup-auth.sql dans l\'éditeur SQL Supabase.'
  }

  return 'Erreur lors de la lecture du profil utilisateur.'
}
