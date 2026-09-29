import { cn } from '@/lib/utils'

// Cabecera de pantalla: kicker pequeño + título grande de 32px. Aparece en
// Resumen, Ranking, Historial y Perfil.
export function ScreenHeader({ kicker, title, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        {kicker && <div className="truncate text-[13px] font-semibold text-k-text2">{kicker}</div>}
        <div className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-k-text">{title}</div>
      </div>
      {action}
    </div>
  )
}
