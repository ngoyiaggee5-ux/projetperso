interface DataErrorProps {
  message?: string
  onRetry?: () => void
}

export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="mb-2 text-lg font-bold text-red-900">Impossible de charger les données</h2>
      <p className="mb-4 text-sm text-red-800">
        {message ?? 'Les requêtes Supabase ont échoué. Vérifiez les policies RLS (exécutez supabase/setup-auth.sql).'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
