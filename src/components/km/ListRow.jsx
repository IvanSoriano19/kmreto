import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Fila de 52px con separador superior — usada en Perfil (ajustes) y en las
// pantallas de alta (Nuevo grupo). El separador se omite en la primera fila
// de cada tarjeta pasando `first`.
export function ListRow({ className, first = false, onClick, children, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex min-h-[52px] items-center justify-between gap-3 px-4 py-3',
        !first && 'border-t border-k-sep',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ListRowLink({ icon: Icon, title, subtitle, onClick }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer items-center gap-3.5 p-4">
      {Icon && <Icon className="h-[22px] w-[22px] flex-none text-k-accent-ink" />}
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-k-text">{title}</div>
        {subtitle && <div className="mt-0.5 text-[13px] text-k-text2">{subtitle}</div>}
      </div>
      <ChevronRight className="h-4 w-4 flex-none text-k-text3" strokeWidth={2} />
    </div>
  )
}
