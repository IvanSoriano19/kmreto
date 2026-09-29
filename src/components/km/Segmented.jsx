import { cn } from '@/lib/utils'

// Control segmentado tipo iOS (Semana/Mes, Claro/Oscuro): píldora de fondo
// `k-fill` con un botón activo resaltado en superficie.
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn('flex gap-0.5 rounded-full bg-k-fill p-0.5', className)}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-[5px] text-xs font-medium text-k-text2 transition-colors',
              active && 'bg-k-surface font-semibold text-k-text shadow-[0_1px_2px_rgba(0,0,0,.1)]'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
