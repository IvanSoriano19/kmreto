import { cn } from '@/lib/utils'

// Superficie agrupada de la "Nativa": fondo plano, radio de 18px, sombra casi
// imperceptible. Es la unidad base de cada pantalla del rediseño.
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-lg bg-k-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.05)] dark:shadow-none', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Variante sin padding, para listas cuyas filas ya traen su propio espaciado.
export function ListCard({ className, children, ...props }) {
  return (
    <div className={cn('overflow-hidden rounded-lg bg-k-surface shadow-[0_1px_2px_rgba(0,0,0,.05)] dark:shadow-none', className)} {...props}>
      {children}
    </div>
  )
}

// Etiqueta pequeña en mayúsculas suaves usada como cabecera de sección
// ("TU PROGRESO", "TU ACTIVIDAD"…).
export function Kicker({ className, children, ...props }) {
  return (
    <p className={cn('text-[13px] font-semibold text-k-text2', className)} {...props}>
      {children}
    </p>
  )
}
