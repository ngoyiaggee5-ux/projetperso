import {
  ArrowDown, ArrowUp, BarChart3, Boxes, CreditCard, FileText, History,
  Info, LayoutDashboard, Lightbulb, LogOut, Menu, Settings, ShoppingCart,
  Tags, Truck, Users, X,
} from '@/components/ui/Icons'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { section: 'Navigation', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { to: '/produits', label: 'Produits', icon: Boxes, page: 'produits' },
    { to: '/categories', label: 'Catégories', icon: Tags, page: 'categories' },
    { to: '/fournisseurs', label: 'Fournisseurs', icon: Truck, page: 'fournisseurs' },
    { to: '/entrees', label: 'Entrées stock', icon: ArrowDown, page: 'entrees' },
    { to: '/sorties', label: 'Sorties stock', icon: ArrowUp, page: 'sorties' },
  ]},
  { section: 'Ventes & Facturation', items: [
    { to: '/ventes', label: 'Ventes', icon: ShoppingCart, page: 'ventes' },
    { to: '/pos', label: 'POS', icon: CreditCard, page: 'pos' },
    { to: '/factures', label: 'Factures', icon: FileText, page: 'factures' },
  ]},
  { section: 'Rapports & Analyses', items: [
    { to: '/rapports', label: 'Rapports', icon: BarChart3, page: 'rapports' },
    { to: '/suggestions', label: 'Suggestions', icon: Lightbulb, page: 'suggestions' },
    { to: '/audit', label: 'Journal d\'audit', icon: History, page: 'audit' },
  ]},
  { section: 'Administration', adminOnly: true, items: [
    { to: '/users', label: 'Utilisateurs', icon: Users, page: 'users' },
    { to: '/settings', label: 'Paramètres', icon: Settings, page: 'settings' },
  ]},
  { section: 'Informations', items: [
    { to: '/about', label: 'À propos', icon: Info, page: 'about' },
  ]},
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const { canAccessPage, isAdmin } = useAuth()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-[#1a2332] to-[#0d1b2a] text-white transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
          <div>
            <h4 className="text-lg font-extrabold text-[#667eea]"><Boxes className="mr-2 inline h-5 w-5" />FreshStock</h4>
            <small className="text-xs text-white/50">ERP Gestion d'entrepôt</small>
          </div>
          <button className="lg:hidden" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((group) => {
            if (group.adminOnly && !isAdmin) return null
            const visibleItems = group.items.filter((item) => canAccessPage(item.page))
            if (visibleItems.length === 0) return null

            return (
              <div key={group.section}>
                <div className="px-5 py-2 text-[10px] uppercase tracking-wider text-white/30">{group.section}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 border-l-3 px-5 py-3 text-sm text-white/70 transition hover:bg-[#667eea]/15 hover:text-white',
                      isActive ? 'border-[#667eea] bg-[#667eea]/15 text-white' : 'border-transparent',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}

export function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  const { profile } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-[#1a2332]">{title}</h1>
      </div>
      {profile && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            profile.statut === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800',
          )}>
            {profile.statut === 'active' ? '✅ Actif' : '⏳ En attente'}
          </span>
          <span className="rounded-full bg-[#667eea]/10 px-2 py-0.5 text-[10px] font-semibold text-[#667eea]">
            {profile.role}
          </span>
          <span className="hidden sm:inline">{profile.nom}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#667eea] font-bold text-white">
            {profile.nom.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  )
}
