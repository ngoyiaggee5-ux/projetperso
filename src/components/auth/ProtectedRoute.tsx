import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProfileMissing } from '@/components/ProfileMissing'

export function ProtectedRoute({ page, children }: { page: string; children: ReactNode }) {
  const { canAccessPage, loading, session, profile } = useAuth()

  if (loading) return <LoadingScreen />

  if (session && !profile) {
    return <ProfileMissing />
  }

  if (!canAccessPage(page)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
