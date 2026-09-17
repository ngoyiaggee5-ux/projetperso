import {
  flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  useReactTable, type ColumnDef,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from '@/components/ui/Icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormGroup, Input, Label, Select, Textarea } from '@/components/ui/Form'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { DataError } from '@/components/DataError'
import { useAppData } from '@/hooks/useAppData'
import { createProduit, deleteProduit, updateProduit } from '@/services/api'
import type { Produit } from '@/types'
import { formatDate } from '@/lib/utils'

export function ProduitsPage() {
  const queryClient = useQueryClient()
  const { produits, categories, fournisseurs, isLoading, isError, errorMessage, refetchAll } = useAppData('produits')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [form, setForm] = useState({
    nom: '', description: '', categorie_id: '', fournisseur_id: '',
    prix_achat: 0, prix_vente: 0, quantite_stock: 0, seuil_alerte: 5,
    unite: 'pièce', date_peremption: '', statut: 'actif',
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nom: form.nom,
        description: form.description || null,
        categorie_id: form.categorie_id ? Number(form.categorie_id) : null,
        fournisseur_id: form.fournisseur_id ? Number(form.fournisseur_id) : null,
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        quantite_stock: Number(form.quantite_stock),
        seuil_alerte: Number(form.seuil_alerte),
        unite: form.unite,
        date_peremption: form.date_peremption || null,
        statut: form.statut as Produit['statut'],
      }
      if (editing) return updateProduit(editing.id, payload)
      return createProduit(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success(editing ? 'Produit modifié' : 'Produit créé')
      setModalOpen(false)
      setEditing(null)
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Produit supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const getCatNom = (id?: number | null) => categories.find((c) => c.id === id)?.nom ?? '-'

  const columns = useMemo<ColumnDef<Produit>[]>(() => [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'nom', header: 'Nom' },
    { id: 'categorie', header: 'Catégorie', cell: ({ row }) => getCatNom(row.original.categorie_id) },
    { accessorKey: 'quantite_stock', header: 'Stock' },
    { accessorKey: 'seuil_alerte', header: 'Seuil' },
    { id: 'peremption', header: 'Péremption', cell: ({ row }) => formatDate(row.original.date_peremption) },
    { accessorKey: 'statut', header: 'Statut' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row.original)}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="danger" onClick={() => {
            if (confirm('Supprimer ce produit ?')) deleteMutation.mutate(row.original.id)
          }}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ),
    },
  ], [categories])

  const table = useReactTable({
    data: produits,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _col, filter) => {
      const q = String(filter).toLowerCase()
      return row.original.nom.toLowerCase().includes(q) || row.original.code.toLowerCase().includes(q)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm({ nom: '', description: '', categorie_id: '', fournisseur_id: '', prix_achat: 0, prix_vente: 0, quantite_stock: 0, seuil_alerte: 5, unite: 'pièce', date_peremption: '', statut: 'actif' })
    setModalOpen(true)
  }

  function openEdit(p: Produit) {
    setEditing(p)
    setForm({
      nom: p.nom, description: p.description ?? '', categorie_id: String(p.categorie_id ?? ''),
      fournisseur_id: String(p.fournisseur_id ?? ''), prix_achat: p.prix_achat, prix_vente: p.prix_vente,
      quantite_stock: p.quantite_stock, seuil_alerte: p.seuil_alerte, unite: p.unite,
      date_peremption: p.date_peremption?.slice(0, 10) ?? '', statut: p.statut,
    })
    setModalOpen(true)
  }

  if (isLoading) return <LoadingScreen />
  if (isError) return <DataError message={errorMessage} onRetry={() => void refetchAll()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau produit</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">Aucun produit</td></tr>
            ) : table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <FormGroup><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></FormGroup>
            <FormGroup><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup><Label>Catégorie</Label>
                <Select value={form.categorie_id} onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </Select>
              </FormGroup>
              <FormGroup><Label>Fournisseur</Label>
                <Select value={form.fournisseur_id} onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value })}>
                  <option value="">—</option>
                  {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </Select>
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup><Label>Prix achat</Label><Input type="number" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: Number(e.target.value) })} /></FormGroup>
              <FormGroup><Label>Prix vente</Label><Input type="number" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) })} /></FormGroup>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormGroup><Label>Stock</Label><Input type="number" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })} /></FormGroup>
              <FormGroup><Label>Seuil</Label><Input type="number" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })} /></FormGroup>
              <FormGroup><Label>Unité</Label><Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} /></FormGroup>
            </div>
            <FormGroup><Label>Péremption</Label><Input type="date" value={form.date_peremption} onChange={(e) => setForm({ ...form, date_peremption: e.target.value })} /></FormGroup>
            {editing && (
              <FormGroup><Label>Statut</Label>
                <Select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="rupture">Rupture</option>
                </Select>
              </FormGroup>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.nom || saveMutation.isPending}>Enregistrer</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
