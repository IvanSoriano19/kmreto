// Mini gráfica de barras de "Tu actividad" (semana/mes). Las barras a 0
// se pintan en `k-fill`; el resto, en el acento.
export function BarChart({ values, labels }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex h-[104px] items-end gap-2">
      {values.map((val, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-[5px] rounded-b-[2px]"
              style={{
                height: `${Math.max(Math.round((val / max) * 76), 3)}px`,
                background: val === 0 ? 'var(--k-fill)' : 'var(--k-accent)',
              }}
            />
          </div>
          <div className="text-[11px] text-k-text2">{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}
