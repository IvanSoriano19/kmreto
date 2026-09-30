import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Fila de un grupo en Inicio y en Grupos: nombre, mis km frente a la meta por
// persona de ese grupo, mi puesto y la barra de progreso.
export function GrupoFila({ grupo, first = false, onClick }) {
  const pct = Math.min(Math.round((grupo.miKm / grupo.objetivo_km) * 100), 100)
  return (
    <div
      onClick={onClick}
      className={cn('flex cursor-pointer items-center gap-3 px-4 py-3.5', !first && 'border-t border-k-sep')}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] font-medium text-k-text">{grupo.nombre}</span>
          <span className="flex-none text-[13px] tabular-nums text-k-text2">{pct}%</span>
        </div>
        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-k-fill">
          <div className="h-full rounded-full bg-k-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-xs tabular-nums text-k-text2">
          {grupo.miKm.toFixed(1)} de {grupo.objetivo_km} km
          {grupo.nMiembros > 1 && <> · {grupo.miPuesto}º de {grupo.nMiembros}</>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 flex-none text-k-text3" strokeWidth={2} />
    </div>
  )
}
