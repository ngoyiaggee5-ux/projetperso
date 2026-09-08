import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProduitsPage } from '@/pages/ProduitsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { FournisseursPage } from '@/pages/FournisseursPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><DashboardPage /></ProtectedRoute>} />
        <Route path="/produits" element={<ProtectedRoute page="produits"><ProduitsPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute page="categories"><CategoriesPage /></ProtectedRoute>} />
        <Route path="/fournisseurs" element={<ProtectedRoute page="fournisseurs"><FournisseursPage /></ProtectedRoute>} />
        <Route path="/entrees" element={<ProtectedRoute page="entrees"><PlaceholderPage title="Entrées stock" icon="ArrowDown" /></ProtectedRoute>} />
        <Route path="/sorties" element={<ProtectedRoute page="sorties"><PlaceholderPage title="Sorties stock" icon="ArrowUp" /></ProtectedRoute>} />
        <Route path="/ventes" element={<ProtectedRoute page="ventes"><PlaceholderPage title="Ventes" icon="ShoppingCart" /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute page="pos"><PlaceholderPage title="Point de vente" icon="CreditCard" /></ProtectedRoute>} />
        <Route path="/factures" element={<ProtectedRoute page="factures"><PlaceholderPage title="Factures" icon="FileText" /></ProtectedRoute>} />
        <Route path="/rapports" element={<ProtectedRoute page="rapports"><PlaceholderPage title="Rapports" icon="BarChart3" /></ProtectedRoute>} />
        <Route path="/suggestions" element={<ProtectedRoute page="suggestions"><PlaceholderPage title="Suggestions" icon="Lightbulb" /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute page="audit"><PlaceholderPage title="Journal d'audit" icon="History" /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute page="users"><PlaceholderPage title="Gestion utilisateurs" icon="Users" adminOnly /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute page="settings"><PlaceholderPage title="Paramètres" icon="Settings" adminOnly /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute page="about"><PlaceholderPage title="À propos" icon="Info" /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
