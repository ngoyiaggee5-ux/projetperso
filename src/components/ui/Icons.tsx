import type { ComponentType, ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/utils'

type IconProps = SVGProps<SVGSVGElement> & { className?: string }

function IconBase({ className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', className)} {...props}>
      {children}
    </svg>
  )
}

export function Boxes(props: IconProps) {
  return <IconBase {...props}><path d="M2.97 12.96 12 18l9.03-5.04M12 22V12M21 7.5 12 2.5 3 7.5M12 12 3 7.5M12 12l9-4.5" /></IconBase>
}
export function LogIn(props: IconProps) { return <IconBase {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></IconBase> }
export function UserPlus(props: IconProps) { return <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" /></IconBase> }
export function Eye(props: IconProps) { return <IconBase {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></IconBase> }
export function EyeOff(props: IconProps) { return <IconBase {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></IconBase> }
export function Loader2(props: IconProps) { return <IconBase {...props} className={cn('animate-spin', props.className)}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></IconBase> }
export function Plus(props: IconProps) { return <IconBase {...props}><path d="M5 12h14M12 5v14" /></IconBase> }
export function Trash2(props: IconProps) { return <IconBase {...props}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></IconBase> }
export function Pencil(props: IconProps) { return <IconBase {...props}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></IconBase> }
export function AlertTriangle(props: IconProps) { return <IconBase {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4M12 17h.01" /></IconBase> }
export function Package(props: IconProps) { return <IconBase {...props}><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M3.29 7 12 12l8.71-5M12 22V12" /></IconBase> }
export function CalendarX(props: IconProps) { return <IconBase {...props}><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="m14 14-4 4M10 14l4 4" /></IconBase> }
export function Tags(props: IconProps) { return <IconBase {...props}><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l6.59-6.59a1 1 0 0 0 0-1.41L12 2Z" /><path d="M7 7h.01" /></IconBase> }
export function DollarSign(props: IconProps) { return <IconBase {...props}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></IconBase> }
export function Menu(props: IconProps) { return <IconBase {...props}><path d="M4 6h16M4 12h16M4 18h16" /></IconBase> }
export function X(props: IconProps) { return <IconBase {...props}><path d="M18 6 6 18M6 6l12 12" /></IconBase> }
export function LogOut(props: IconProps) { return <IconBase {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></IconBase> }
export function LayoutDashboard(props: IconProps) { return <IconBase {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></IconBase> }
export function Truck(props: IconProps) { return <IconBase {...props}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></IconBase> }
export function ArrowDown(props: IconProps) { return <IconBase {...props}><path d="M12 5v14M19 12l-7 7-7-7" /></IconBase> }
export function ArrowUp(props: IconProps) { return <IconBase {...props}><path d="M12 19V5M5 12l7-7 7 7" /></IconBase> }
export function ShoppingCart(props: IconProps) { return <IconBase {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></IconBase> }
export function CreditCard(props: IconProps) { return <IconBase {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></IconBase> }
export function FileText(props: IconProps) { return <IconBase {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M10 13H8M16 13h-2M10 17H8M16 17h-2" /></IconBase> }
export function BarChart3(props: IconProps) { return <IconBase {...props}><path d="M3 3v18h18M7 16V9M12 16V5M17 16v-3" /></IconBase> }
export function Lightbulb(props: IconProps) { return <IconBase {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4" /></IconBase> }
export function History(props: IconProps) { return <IconBase {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></IconBase> }
export function Users(props: IconProps) { return <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></IconBase> }
export function Settings(props: IconProps) { return <IconBase {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></IconBase> }
export function Info(props: IconProps) { return <IconBase {...props}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></IconBase> }

export type LucideIcon = ComponentType<IconProps>