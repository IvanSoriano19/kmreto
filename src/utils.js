// Orden de deportes tal y como aparece en el selector de "Nueva actividad"
// del rediseño. Los iconos de línea viven en components/icons.jsx.
export const DEPORTES_LIST = ['Correr', 'Caminar', 'Bici', 'Trail', 'Senderismo', 'Otro']

export function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(min / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return d === 1 ? 'ayer' : `hace ${d} días`
  if (h > 0) return `hace ${h}h`
  if (min > 0) return `hace ${min} min`
  return 'ahora'
}

// Kilómetros por día de la semana actual (lunes a domingo), para la gráfica
// de "Tu actividad" en Resumen. `acts` es una lista de { fecha, distancia_km }.
export function semanaActual(acts) {
  const hoy = new Date()
  const dow = (hoy.getDay() + 6) % 7 // 0 = lunes … 6 = domingo
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - dow)
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const vals = labels.map((_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    const key = d.toISOString().split('T')[0]
    return acts.filter(a => a.fecha === key).reduce((s, a) => s + Number(a.distancia_km), 0)
  })
  return { labels, vals }
}

// Kilómetros por mes de los últimos `n` meses (incluido el actual).
export function mesesRecientes(acts, n = 6) {
  const hoy = new Date()
  const meses = Array.from({ length: n }, (_, i) => new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1))
  const labels = meses.map(d => d.toLocaleDateString('es-ES', { month: 'short' }))
  const vals = meses.map(d => acts
    .filter(a => {
      const ad = new Date(a.fecha + 'T00:00:00')
      return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
    })
    .reduce((s, a) => s + Number(a.distancia_km), 0))
  return { labels, vals }
}
