import { AlertTriangle, Boxes, CalendarX, DollarSign, Package, Tags } from '@/components/ui/Icons'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAppData } from '@/hooks/useAppData'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#667eea', '#2e7d32', '#f57c00', '#c62828', '#1a73e8', '#00695c']

export function DashboardPage() {
  const { produits, categories, ventes, detailsVentes, isLoading } = useAppData()

  if (isLoading) return <LoadingScreen />

  const stockTotal = produits.reduce((sum, p) => sum + p.quantite_stock, 0)
  const alertes = produits.filter((p) => p.quantite_stock <= p.seuil_alerte)
  const perimes = produits.filter((p) => p.date_peremption && new Date(p.date_peremption) < new Date())
  const ventesJour = ventes.filter((v) => new Date(v.date_vente).toDateString() === new Date().toDateString())
  const caJour = ventesJour.reduce((sum, v) => sum + v.montant_total, 0)

  const ventesParMois = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    const total = ventes.filter((v) => v.date_vente.startsWith(key)).reduce((sum, v) => sum + v.montant_total, 0)
    return { name: label, total }
  })
  const maxVente = Math.max(...ventesParMois.map((v) => v.total), 1)

  const produitsParCategorie = categories.map((c) => ({
    name: c.nom,
    value: produits.filter((p) => p.categorie_id === c.id).length,
  })).filter((c) => c.value > 0)

  const topProduits = detailsVentes.reduce<Record<number, number>>((acc, d) => {
    acc[d.produit_id] = (acc[d.produit_id] ?? 0) + d.quantite
    return acc
  }, {})
  const top5 = Object.entries(topProduits).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id, qty]) => ({
    nom: produits.find((p) => p.id === Number(id))?.nom ?? `#${id}`,
    qty,
  }))

  const stats = [
    { label: 'Total Produits', value: produits.length, icon: Boxes, color: 'text-[#667eea]' },
    { label: 'Stock Total', value: stockTotal, icon: Package, color: 'text-emerald-700' },
    { label: 'Alertes Stock', value: alertes.length, icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'Produits périmés', value: perimes.length, icon: CalendarX, color: 'text-red-600' },
    { label: 'Catégories', value: categories.length, icon: Tags, color: 'text-blue-600' },
    { label: "Ventes aujourd'hui", value: formatCurrency(caJour), icon: DollarSign, color: 'text-teal-700' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardBody>
              <stat.icon className={`mx-auto mb-1 h-6 w-6 ${stat.color}`} />
              <div className="text-2xl font-extrabold">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>Ventes mensuelles</CardHeader>
          <CardBody>
            <div className="flex h-48 items-end gap-2">
              {ventesParMois.map((v) => (
                <div key={v.name} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-[#667eea]" style={{ height: `${Math.max(8, (v.total / maxVente) * 160)}px` }} title={formatCurrency(v.total)} />
                  <span className="text-[10px] text-slate-500">{v.name}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Produits par catégorie</CardHeader>
          <CardBody className="space-y-2">
            {produitsParCategorie.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
            ) : produitsParCategorie.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1">{c.name}</span>
                <strong>{c.value}</strong>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>Alertes stock</CardHeader>
          <CardBody className="max-h-64 space-y-2 overflow-y-auto p-0">
            {alertes.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">✅ Aucune alerte</p>
            ) : alertes.map((p) => (
              <div key={p.id} className="border-b border-slate-100 px-4 py-3 text-sm last:border-0">
                <strong>{p.nom}</strong>
                <span className="ml-2 text-red-600">Stock: {p.quantite_stock} / Seuil: {p.seuil_alerte}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Top 5 produits vendus</CardHeader>
          <CardBody className="max-h-64 space-y-2 overflow-y-auto p-0">
            {top5.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">Aucune vente</p>
            ) : top5.map((p, i) => (
              <div key={p.nom} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-0">
                <span><strong>#{i + 1}</strong> {p.nom}</span>
                <span className="font-semibold text-[#667eea]">{p.qty} vendus</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
