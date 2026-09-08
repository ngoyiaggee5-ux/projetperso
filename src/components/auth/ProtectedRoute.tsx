import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export function ProtectedRoute({ page, children }: { page: string; children: ReactNode }) {
  const { canAccessPage, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!canAccessPage(page)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
