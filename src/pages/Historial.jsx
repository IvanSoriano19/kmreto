import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { DEPORTES, COLORES_DEPORTE, iniciales } from '../utils'

export default function Historial() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [myUserId, setMyUserId] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [reto, setReto] = useState(null)
  const [actividades, setActividades] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [totalKm, setTotalKm] = useState(0)
  const [objetivo, setObjetivo] = useState(1000)
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setMyUserId(user.id)

    const targetId = userId || user.id

    const [{ data: prof }, { data: miembro }] = await Promise.all([
      supabase.from('profiles').select().eq('id', targetId).single(),
      supabase.from('reto_miembros').select(`reto_id, objetivo_km, retos(id, nombre, objetivo_km, year)`).eq('user_id', user.id).limit(1).single(),
    ])

    setPerfil(prof)
    if (!miembro) { setLoading(false); return }

    setReto(miembro.retos)
    setObjetivo(miembro.objetivo_km || miembro.retos.objetivo_km)

    const { data: acts } = await supabase
      .from('actividades')
      .select('*')
      .eq('user_id', targetId)
      .eq('reto_id', miembro.reto_id)
      .order('fecha', { ascending: false })

    setActividades(acts || [])
    setTotalKm(acts?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
    setLoading(false)
  }

  async function handleEliminar(id) {
    const updated = actividades.filter(a => a.id !== id)
    setActividades(updated)
    setTotalKm(updated.reduce((sum, a) => sum + Number(a.distancia_km), 0))
    setConfirmId(null)
    await supabase.from('actividades').delete().eq('id', id)
  }

  function agruparPorMes(acts) {
    const grupos = {}
    acts.forEach(a => {
      const fecha = new Date(a.fecha + 'T00:00:00')
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(a)
    })
    return grupos
  }

  const filtradas = filtro === 'Todos' ? actividades : actividades.filter(a => a.deporte === filtro)
  const agrupadas = agruparPorMes(filtradas)
  const deportesUsados = ['Todos', ...new Set(actividades.map(a => a.deporte))]
  const porcentaje = Math.min(Math.round((totalKm / objetivo) * 100), 100)
  const esMiPerfil = !userId || userId === myUserId

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
      <div className="text-gray-400 text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
      <div className="bg-white dark:bg-gray-800 px-4 pt-6 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          {!esMiPerfil && (
            <button onClick={() => navigate(-1)} className="text-gray-400 text-2xl leading-none">‹</button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              {esMiPerfil ? 'Mi historial' : `Historial de ${perfil?.nombre}`}
            </h1>
            {reto && <p className="text-xs text-gray-400 dark:text-gray-500">{reto.nombre}</p>}
          </div>
          <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-400">
            {iniciales(perfil?.nombre)}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {deportesUsados.map(d => (
            <button key={d} onClick={() => setFiltro(d)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filtro === d
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              {d !== 'Todos' && DEPORTES[d]} {d}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { val: totalKm.toFixed(1), lbl: 'km totales' },
              { val: `${porcentaje}%`, lbl: 'del reto' },
              { val: actividades.length, lbl: 'actividades' },
            ].map(s => (
              <div key={s.lbl} className="text-center">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{s.val}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.lbl}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
            {Math.max(objetivo - totalKm, 0).toFixed(1)} km para la meta
          </p>
        </div>

        {Object.keys(agrupadas).length === 0 ? (
          <div className="text-center py-10 text-gray-300 dark:text-gray-600 text-sm">
            No hay actividades {filtro !== 'Todos' ? `de ${filtro}` : ''}
          </div>
        ) : (
          Object.entries(agrupadas).map(([mes, acts]) => {
            const kmMes = acts.reduce((sum, a) => sum + Number(a.distancia_km), 0)
            return (
              <div key={mes}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide capitalize">{mes}</p>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">{kmMes.toFixed(1)} km</p>
                </div>
                <div className="flex flex-col gap-2">
                  {acts.map(act => (
                    <div key={act.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                      {act.foto_url && (
                        <img src={act.foto_url} alt="actividad" className="w-full h-40 object-cover" />
                      )}
                      <div className="flex items-center gap-3 p-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${COLORES_DEPORTE[act.deporte] || 'bg-gray-100 dark:bg-gray-700'}`}>
                          {DEPORTES[act.deporte] || '🏅'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{act.deporte}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(act.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </p>
                          {act.nota && <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5 truncate">"{act.nota}"</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{Number(act.distancia_km).toFixed(1)} km</p>
                          {esMiPerfil && (
                            confirmId === act.id ? (
                              <div className="flex gap-2 mt-1 justify-end">
                                <button onClick={() => handleEliminar(act.id)} className="text-xs text-red-500 font-medium">Sí</button>
                                <button onClick={() => setConfirmId(null)} className="text-xs text-gray-400">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmId(act.id)} className="text-xs text-red-400 mt-0.5">
                                Eliminar
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
      <NavBar />
    </div>
  )
}
