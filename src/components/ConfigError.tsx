export function ConfigError() {
  const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] p-6">
      <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <div className="mb-4 text-3xl">⚠️</div>
        <h1 className="mb-2 text-xl font-bold text-[#1a2332]">Configuration Supabase manquante</h1>
        <p className="mb-4 text-sm text-slate-600">
          Les variables d'environnement <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> et{' '}
          <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> ne sont pas définies.
        </p>

        {isNetlify ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold">Sur Netlify :</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Site configuration → Environment variables</li>
              <li>Ajoutez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code></li>
              <li>Deploys → Trigger deploy → <strong>Clear cache and deploy site</strong></li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold">En local :</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Copiez <code>.env.example</code> vers <code>.env</code></li>
              <li>Remplissez vos identifiants Supabase</li>
              <li>Relancez <code>npm run dev</code></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
