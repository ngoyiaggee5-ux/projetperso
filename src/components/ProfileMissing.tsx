export function ProfileMissing() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="mb-2 text-lg font-bold text-amber-900">Profil utilisateur introuvable</h2>
      <p className="mb-4 text-sm text-amber-800">
        Vous êtes connecté (Supabase Auth) mais votre profil dans la table <code>utilisateurs</code> est inaccessible.
        Cause fréquente : RLS mal configuré ou <code>auth_id</code> non lié.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-amber-900">
        <li>Supabase → Authentication → vérifiez que votre user existe</li>
        <li>Exécutez <code>supabase/setup-auth.sql</code> dans l'éditeur SQL</li>
        <li>Vérifiez : <code>SELECT email, statut, auth_id FROM utilisateurs;</code></li>
      </ol>
    </div>
  )
}
