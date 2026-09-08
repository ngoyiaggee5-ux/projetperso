import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#667eea]',
        props.className,
      )}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#667eea]',
        props.className,
      )}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#667eea]',
        props.className,
      )}
    />
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn('mb-1 block text-sm font-medium text-slate-700', className)}>{children}</label>
}

export function FormGroup({ children }: { children: ReactNode }) {
  return <div className="mb-3">{children}</div>
}
