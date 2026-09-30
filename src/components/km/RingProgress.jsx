// Anillo de progreso circular de Inicio y de cada grupo. Radio y grosor
// tomados del boceto (r=52, stroke=13, circunferencia 326.7).
export function RingProgress({ pct, size = 112, label = 'de tu meta' }) {
  const dash = `${(pct / 100) * 326.7} 326.7`
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--k-accent-soft)" strokeWidth="13" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke="var(--k-accent)" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={dash}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <div className="text-2xl font-semibold tracking-[-0.02em] tabular-nums text-k-text">{pct}%</div>
        <div className="text-[10px] text-k-text2">{label}</div>
      </div>
    </div>
  )
}
