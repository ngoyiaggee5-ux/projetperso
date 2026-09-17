import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from '@/components/ui/Icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormGroup, Input, Label, Select } from '@/components/ui/Form'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DataError } from '@/components/DataError'
import { useAppData } from '@/hooks/useAppData'
import { createEntreeWithStock } from '@/services/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export function EntreesPage() {
  const queryClient = useQueryClient()
  const { entrees, produits, fournisseurs, isLoading, isError, errorMessage, refetchAll } = useAppData('entrees')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ produit_id: '', fournisseur_id: '', quantite: 1, prix_unitaire: 0 })

  const createMutation = useMutation({
    mutationFn: () =>
      createEntreeWithStock({
        produit_id: Number(form.produit_id),
        fournisseur_id: form.fournisseur_id ? Number(form.fournisseur_id) : null,
        quantite: Number(form.quantite),
        prix_unitaire: Number(form.prix_unitaire),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrees'] })
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Entrée enregistrée — stock mis à jour')
      setModalOpen(false)
      setForm({ produit_id: '', fournisseur_id: '', quantite: 1, prix_unitaire: 0 })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'entrée'),
  })

  const getProduitNom = (id: number) => produits.find((p) => p.id === id)?.nom ?? `#${id}`
  const getFournisseurNom = (id?: number | null) => (id ? fournisseurs.find((f) => f.id === id)?.nom : null) ?? '-'

  if (isLoading) return <LoadingScreen />
  if (isError) return <DataError message={errorMessage} onRetry={() => void refetchAll()} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle entrée</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">P.U.</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {entrees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune entrée</td></tr>
            ) : entrees.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{getProduitNom(e.produit_id)}</td>
                <td className="px-4 py-3">{getFournisseurNom(e.fournisseur_id)}</td>
                <td className="px-4 py-3">{e.quantite}</td>
                <td className="px-4 py-3">{formatCurrency(e.prix_unitaire)}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(e.quantite * e.prix_unitaire)}</td>
                <td className="px-4 py-3">{formatDate(e.date_entree)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Entrée de stock</h3>
            <FormGroup>
              <Label>Produit *</Label>
              <Select value={form.produit_id} onChange={(e) => setForm({ ...form, produit_id: e.target.value })}>
                <option value="">— Choisir —</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom} ({p.code}) — stock: {p.quantite_stock}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Fournisseur</Label>
              <Select value={form.fournisseur_id} onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value })}>
                <option value="">—</option>
                {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Select>
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup><Label>Quantité *</Label><Input type="number" min={1} value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} /></FormGroup>
              <FormGroup><Label>Prix unitaire</Label><Input type="number" min={0} value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: Number(e.target.value) })} /></FormGroup>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.produit_id || form.quantite < 1 || createMutation.isPending}
              >
                Enregistrer
              </Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
