import { Loader2 } from '@/components/ui/Icons'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8]">
      <div className="flex flex-col items-center gap-3 text-[#667eea]">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Chargement de FreshStock...</p>
      </div>
    </div>
  )
}
