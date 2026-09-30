import { supabase } from '@/SupabaseClient'

// Datos de los grupos. Las actividades son de cada persona; qué actividades
// cuentan en cada grupo lo decide la vista `actividades_reto` de Supabase
// (desde que te uniste, dentro de las fechas del grupo y solo los deportes que
// cuentan). `cuentaEnGrupo` repite esa regla en el navegador para avisar, al
// registrar, de en qué grupos va a contar.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function fechaCorta(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function periodoGrupo(reto) {
  return reto.fecha_fin
    ? `${fechaCorta(reto.fecha_inicio)} – ${fechaCorta(reto.fecha_fin)}`
    : `Desde el ${fechaCorta(reto.fecha_inicio)}`
}

export function deportesGrupo(reto) {
  return reto.deportes?.length ? reto.deportes.join(', ') : 'Todos los deportes'
}

export function cuentaEnGrupo({ fecha, deporte }, reto, unidoEl) {
  const desde = reto.fecha_inicio > unidoEl ? reto.fecha_inicio : unidoEl
  if (fecha < desde) return false
  if (reto.fecha_fin && fecha > reto.fecha_fin) return false
  return !reto.deportes?.length || reto.deportes.includes(deporte)
}

// Km de cada miembro de un grupo, de más a menos. La suma la hace la vista
// `km_por_miembro` en la base de datos.
export function clasificacion(filas, retoId) {
  return filas
    .filter(f => f.reto_id === retoId)
    .map(f => ({ ...f, km: Number(f.km) }))
    .sort((a, b) => b.km - a.km)
}

// Mis grupos con el progreso de cada uno: mis km, km del grupo, miembros y mi
// puesto. Dos consultas en total, da igual cuántos grupos haya.
export async function cargarMisGrupos(userId) {
  const { data: membresias } = await supabase
    .from('reto_miembros')
    .select('unido_el, retos (*)')
    .eq('user_id', userId)

  const grupos = (membresias || []).filter(m => m.retos).map(m => ({ ...m.retos, unido_el: m.unido_el }))
  if (grupos.length === 0) return []

  const { data: filas } = await supabase
    .from('km_por_miembro')
    .select('reto_id, user_id, km')
    .in('reto_id', grupos.map(g => g.id))

  return grupos
    .map(g => {
      const orden = clasificacion(filas || [], g.id)
      return {
        ...g,
        miKm: orden.find(f => f.user_id === userId)?.km || 0,
        kmGrupo: orden.reduce((s, f) => s + f.km, 0),
        nMiembros: orden.length,
        miPuesto: orden.findIndex(f => f.user_id === userId) + 1,
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function generarCodigo() {
  // Sin 0/O ni 1/I/L, que se confunden al dictarlo.
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
}
