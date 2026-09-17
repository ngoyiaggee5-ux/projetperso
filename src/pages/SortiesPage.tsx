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
import { createSortieWithStock } from '@/services/api'
import { formatDate } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  perte: 'Perte',
  utilisation: 'Utilisation',
  transfert: 'Transfert',
}

export function SortiesPage() {
  const queryClient = useQueryClient()
  const { sorties, produits, isLoading, isError, errorMessage, refetchAll } = useAppData('sorties')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ produit_id: '', type_sortie: 'utilisation', quantite: 1, motif: '' })

  const createMutation = useMutation({
    mutationFn: () =>
      createSortieWithStock({
        produit_id: Number(form.produit_id),
        type_sortie: form.type_sortie,
        quantite: Number(form.quantite),
        motif: form.motif || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] })
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Sortie enregistrée — stock mis à jour')
      setModalOpen(false)
      setForm({ produit_id: '', type_sortie: 'utilisation', quantite: 1, motif: '' })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur lors de la sortie'),
  })

  const getProduitNom = (id: number) => produits.find((p) => p.id === id)?.nom ?? `#${id}`

  if (isLoading) return <LoadingScreen />
  if (isError) return <DataError message={errorMessage} onRetry={() => void refetchAll()} />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle sortie</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Motif</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {sorties.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucune sortie</td></tr>
            ) : sorties.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{getProduitNom(s.produit_id)}</td>
                <td className="px-4 py-3">{TYPE_LABELS[s.type_sortie] ?? s.type_sortie}</td>
                <td className="px-4 py-3">{s.quantite}</td>
                <td className="px-4 py-3">{s.motif ?? '-'}</td>
                <td className="px-4 py-3">{formatDate(s.date_sortie)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Sortie de stock</h3>
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
              <Label>Type *</Label>
              <Select value={form.type_sortie} onChange={(e) => setForm({ ...form, type_sortie: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup><Label>Quantité *</Label><Input type="number" min={1} value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} /></FormGroup>
            <FormGroup><Label>Motif</Label><Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} /></FormGroup>
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
