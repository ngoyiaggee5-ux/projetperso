import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, Topbar } from '@/components/layout/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/produits': 'Produits',
  '/categories': 'Catégories',
  '/fournisseurs': 'Fournisseurs',
  '/entrees': 'Entrées stock',
  '/sorties': 'Sorties stock',
  '/ventes': 'Ventes',
  '/pos': 'Point de vente',
  '/factures': 'Factures',
  '/rapports': 'Rapports',
  '/suggestions': 'Suggestions',
  '/audit': 'Journal d\'audit',
  '/users': 'Utilisateurs',
  '/settings': 'Paramètres',
  '/about': 'À propos',
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut } = useAuth()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'FreshStock'

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={signOut} />
      <div className="lg:ml-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="p-4 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
