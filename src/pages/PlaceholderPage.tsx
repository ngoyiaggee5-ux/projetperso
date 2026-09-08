import {
  ArrowDown, ArrowUp, BarChart3, Boxes, CreditCard, FileText, History,
  Info, Lightbulb, Settings, ShoppingCart, Users, type LucideIcon,
} from '@/components/ui/Icons'
import { Card, CardBody } from '@/components/ui/Card'

const icons: Record<string, LucideIcon> = {
  ArrowDown, ArrowUp, BarChart3, Boxes, CreditCard, FileText, History,
  Info, Lightbulb, Settings, ShoppingCart, Users,
}

export function PlaceholderPage({ title, icon, adminOnly }: { title: string; icon: string; adminOnly?: boolean }) {
  const Icon = icons[icon] ?? Boxes

  return (
    <Card>
      <CardBody className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#667eea]/10 text-[#667eea]">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1a2332]">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          {adminOnly
            ? 'Page réservée aux administrateurs. Migration en cours depuis la version legacy.'
            : 'Cette section sera migrée depuis l\'ancienne version. Le dashboard, produits, catégories et fournisseurs sont déjà fonctionnels.'}
        </p>
        <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">🚧 En cours de migration</span>
      </CardBody>
    </Card>
  )
}
