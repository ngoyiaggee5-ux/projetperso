import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Form'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DataError } from '@/components/DataError'
import { addAuditLog, fetchUtilisateurs, updateUtilisateur } from '@/services/api'
import type { UserRole, UserStatus, Utilisateur } from '@/types'
import { ROLE_LABELS } from '@/types'
import { cn, formatDate, getErrorMessage } from '@/lib/utils'

const STATUT_LABELS: Record<UserStatus, string> = {
  active: 'Actif',
  pending: 'En attente',
  inactive: 'Désactivé',
}

const STATUT_STYLES: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800',
  pending: 'bg-amber-50 text-amber-900',
  inactive: 'bg-slate-100 text-slate-600',
}

type Filter = 'all' | UserStatus

export function UsersPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: utilisateurs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: fetchUtilisateurs,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Utilisateur> }) =>
      updateUtilisateur(id, updates),
    onSuccess: async (_data, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      if (profile && (updates.statut || updates.role)) {
        try {
          await addAuditLog({
            utilisateur: profile.email,
            action: 'Gestion utilisateurs',
            details: `Mise à jour: ${JSON.stringify(updates)}`,
          })
        } catch {
          // non bloquant
        }
      }
      toast.success('Utilisateur mis à jour')
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Erreur — droits admin ou RLS (setup-auth.sql)'),
  })

  const filtered = useMemo(() => {
    if (filter === 'all') return utilisateurs
    return utilisateurs.filter((u) => u.statut === filter)
  }, [utilisateurs, filter])

  const pendingCount = utilisateurs.filter((u) => u.statut === 'pending').length

  function setStatut(user: Utilisateur, statut: UserStatus) {
    if (user.statut === statut) return
    const label = STATUT_LABELS[statut]
    if (!confirm(`Changer le statut de ${user.nom} en « ${label} » ?`)) return
    updateMutation.mutate({ id: user.id, updates: { statut } })
  }

  function setRole(user: Utilisateur, role: UserRole) {
    if (user.role === role) return
    if (!confirm(`Attribuer le rôle « ${ROLE_LABELS[role]} » à ${user.nom} ?`)) return
    updateMutation.mutate({ id: user.id, updates: { role } })
  }

  if (isLoading) return <LoadingScreen />
  if (isError) {
    return (
      <DataError
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{pendingCount}</strong> inscription{pendingCount > 1 ? 's' : ''} en attente d&apos;activation.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'active', 'inactive'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              filter === key ? 'bg-[#667eea] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {key === 'all' ? `Tous (${utilisateurs.length})` : `${STATUT_LABELS[key]} (${utilisateurs.filter((u) => u.statut === key).length})`}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun utilisateur</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{u.nom}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <Select
                    className="min-w-[8rem] py-1 text-xs"
                    value={u.role}
                    disabled={updateMutation.isPending || u.id === profile?.id}
                    onChange={(e) => setRole(u, e.target.value as UserRole)}
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUT_STYLES[u.statut])}>
                    {STATUT_LABELS[u.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.date_creation)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.statut === 'pending' && (
                      <Button size="sm" variant="success" onClick={() => setStatut(u, 'active')}>
                        Activer
                      </Button>
                    )}
                    {u.statut === 'active' && u.id !== profile?.id && (
                      <Button size="sm" variant="secondary" onClick={() => setStatut(u, 'inactive')}>
                        Désactiver
                      </Button>
                    )}
                    {u.statut === 'inactive' && (
                      <Button size="sm" variant="success" onClick={() => setStatut(u, 'active')}>
                        Réactiver
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-slate-500">
        Les visiteurs s&apos;inscrivent depuis la page de connexion. Tant que le statut est « En attente », ils ne peuvent pas accéder à l&apos;application.
      </p>
    </div>
  )
}
