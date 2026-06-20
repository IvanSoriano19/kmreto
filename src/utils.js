export const DEPORTES = {
  'Trail':      '⛰️',
  'Correr':     '🏃',
  'Caminar':    '🚶',
  'Bici':       '🚴',
  'Senderismo': '🥾',
  'Otro':       '🏅',
}

export const DEPORTES_LIST = [
  { id: 'Trail',      emoji: '⛰️' },
  { id: 'Correr',     emoji: '🏃' },
  { id: 'Caminar',    emoji: '🚶' },
  { id: 'Bici',       emoji: '🚴' },
  { id: 'Senderismo', emoji: '🥾' },
  { id: 'Otro',       emoji: '🏅' },
]

export const COLORES_DEPORTE = {
  'Trail':      'bg-green-100 dark:bg-green-900/30',
  'Correr':     'bg-lime-100 dark:bg-lime-900/30',
  'Caminar':    'bg-yellow-100 dark:bg-yellow-900/30',
  'Bici':       'bg-blue-100 dark:bg-blue-900/30',
  'Senderismo': 'bg-orange-100 dark:bg-orange-900/30',
  'Otro':       'bg-gray-100 dark:bg-gray-700',
}

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
