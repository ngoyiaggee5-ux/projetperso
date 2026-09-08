import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from '@/components/ui/Icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormGroup, Input, Label, Textarea } from '@/components/ui/Form'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAppData } from '@/hooks/useAppData'
import { createCategorie, deleteCategorie } from '@/services/api'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const { categories, produits, isLoading } = useAppData()
  const [modalOpen, setModalOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createCategorie({ nom, description: description || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie créée')
      setModalOpen(false)
      setNom('')
      setDescription('')
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategorie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie supprimée')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  if (isLoading) return <LoadingScreen />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Produits</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Aucune catégorie</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{c.nom}</td>
                <td className="px-4 py-3">{c.description ?? '-'}</td>
                <td className="px-4 py-3">{produits.filter((p) => p.categorie_id === c.id).length}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="danger" onClick={() => {
                    if (confirm('Supprimer cette catégorie ?')) deleteMutation.mutate(c.id)
                  }}><Trash2 className="h-3 w-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Nouvelle catégorie</h3>
            <FormGroup><Label>Nom *</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} /></FormGroup>
            <FormGroup><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></FormGroup>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!nom}>Enregistrer</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
