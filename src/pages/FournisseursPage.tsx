import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from '@/components/ui/Icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormGroup, Input, Label } from '@/components/ui/Form'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAppData } from '@/hooks/useAppData'
import { createFournisseur, deleteFournisseur } from '@/services/api'

export function FournisseursPage() {
  const queryClient = useQueryClient()
  const { fournisseurs, isLoading } = useAppData('fournisseurs')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nom: '', contact: '', telephone: '', email: '' })

  const createMutation = useMutation({
    mutationFn: () => createFournisseur({
      nom: form.nom,
      contact: form.contact || null,
      telephone: form.telephone || null,
      email: form.email || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast.success('Fournisseur créé')
      setModalOpen(false)
      setForm({ nom: '', contact: '', telephone: '', email: '' })
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFournisseur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast.success('Fournisseur supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  if (isLoading) return <LoadingScreen />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouveau fournisseur</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {fournisseurs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun fournisseur</td></tr>
            ) : fournisseurs.map((f) => (
              <tr key={f.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{f.nom}</td>
                <td className="px-4 py-3">{f.contact ?? '-'}</td>
                <td className="px-4 py-3">{f.telephone ?? '-'}</td>
                <td className="px-4 py-3">{f.email ?? '-'}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="danger" onClick={() => {
                    if (confirm('Supprimer ce fournisseur ?')) deleteMutation.mutate(f.id)
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
            <h3 className="mb-4 text-lg font-bold">Nouveau fournisseur</h3>
            <FormGroup><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></FormGroup>
            <FormGroup><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></FormGroup>
            <FormGroup><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></FormGroup>
            <FormGroup><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormGroup>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!form.nom}>Enregistrer</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
