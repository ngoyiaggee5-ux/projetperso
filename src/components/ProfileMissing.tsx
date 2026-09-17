import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function ProfileMissing() {
  const { signOut } = useAuth()

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="mb-2 text-lg font-bold text-amber-900">Profil utilisateur introuvable</h2>
      <p className="mb-4 text-sm text-amber-800">
        Vous êtes connecté via Supabase Auth, mais le profil dans <code>utilisateurs</code> est inaccessible.
        Exécutez le script SQL ci-dessous dans Supabase.
      </p>
      <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-amber-900">
        <li>Supabase → <strong>SQL Editor</strong> → coller et exécuter <code>supabase/setup-auth.sql</code></li>
        <li>Vérifiez le résultat en bas : <code>auth_id</code> rempli et <code>statut = active</code></li>
        <li>Déconnectez-vous puis reconnectez-vous</li>
      </ol>
      <p className="mb-4 text-xs text-amber-700">
        L'email dans Authentication doit être <strong>identique</strong> à celui dans la table utilisateurs.
      </p>
      <Button variant="secondary" onClick={() => void signOut()}>Se déconnecter</Button>
    </div>
  )
}
