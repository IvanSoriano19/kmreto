// Trío de estadísticas pequeñas (Perfil): valor grande +
// etiqueta, en tres tarjetas iguales con un filete superior.
export function StatTile({ value, label }) {
  return (
    <div className="flex-1 rounded-lg border-t border-k-sep bg-k-surface px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.05)] dark:shadow-none">
      <div className="text-xl font-semibold tabular-nums text-k-text">{value}</div>
      <div className="text-xs text-k-text2">{label}</div>
    </div>
  )
}

export function StatRow({ stats }) {
  return (
    <div className="flex gap-2.5">
      {stats.map(s => (
        <StatTile key={s.label} value={s.value} label={s.label} />
      ))}
    </div>
  )
}
