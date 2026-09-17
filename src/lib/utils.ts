import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'FC') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export function formatDate(date: string | null | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

/** Message lisible pour erreurs Supabase / fetch (souvent pas des instance Error). */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Erreur inconnue'
  if (error instanceof Error) return error.message

  if (typeof error === 'object') {
    const o = error as Record<string, unknown>
    const msg = typeof o.message === 'string' ? o.message : ''
    if (msg) {
      const parts = [msg]
      if (typeof o.details === 'string' && o.details) parts.push(o.details)
      if (typeof o.hint === 'string' && o.hint) parts.push(o.hint)
      const code = String(o.code ?? '')
      if (code === '42501' || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('row-level security')) {
        parts.push('Exécutez supabase/migration.sql puis supabase/setup-auth.sql dans Supabase.')
      }
      if (msg.toLowerCase().includes('does not exist') || code === '42P01') {
        parts.push('La table semble absente : créez le schéma ou importez vos données.')
      }
      return parts.join(' — ')
    }
  }

  return 'Erreur de chargement des données'
}

export function escapeHtml(text: string) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
