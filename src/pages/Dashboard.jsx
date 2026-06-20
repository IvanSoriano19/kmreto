import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { DEPORTES, iniciales, tiempoRelativo } from '../utils'

export default function Dashboard() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [reto, setReto] = useState(null)
    const [miKm, setMiKm] = useState(0)
    const [kmGrupo, setKmGrupo] = useState(0)
    const [actividades, setActividades] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()

        const [{ data: prof }, { data: miembro }] = await Promise.all([
            supabase.from('profiles').select().eq('id', user.id).single(),
            supabase.from('reto_miembros').select(`
                reto_id,
                objetivo_km,
                retos (id, nombre, objetivo_km, year, codigo_invitacion)
            `).eq('user_id', user.id).limit(1).single(),
        ])

        setProfile(prof)
        if (!miembro) { setLoading(false); return }

        const retoData = miembro.retos
        setReto({ ...retoData, objetivo_km_personal: miembro.objetivo_km || retoData.objetivo_km })

        const [{ data: misActs }, { data: todasActs }, { data: recientes }] = await Promise.all([
            supabase.from('actividades').select('distancia_km').eq('user_id', user.id).eq('reto_id', retoData.id),
            supabase.from('actividades').select('distancia_km').eq('reto_id', retoData.id),
            supabase.from('actividades').select('*, profiles(nombre)').eq('reto_id', retoData.id).order('created_at', { ascending: false }).limit(5),
        ])

        setMiKm(misActs?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
        setKmGrupo(todasActs?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
        setActividades(recientes || [])
        setLoading(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
            <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
    )

    if (!reto) return (
        <div className="flex flex-col items-center justify-center h-screen px-6 gap-4 bg-white dark:bg-gray-900">
            <div className="text-5xl">🏆</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Aún no perteneces a ningún reto</p>
            <button onClick={() => navigate('/onboarding')} className="bg-green-600 text-white rounded-xl px-6 py-3 text-sm font-medium">
                Unirse o crear un reto
            </button>
        </div>
    )

    const objetivo = reto.objetivo_km_personal
    const porcentaje = Math.min(Math.round((miKm / objetivo) * 100), 100)
    const kmFaltan = Math.max(objetivo - miKm, 0)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
            <div className="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">{reto.nombre}</h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{reto.year}</p>
                </div>
                <div
                    onClick={() => navigate('/perfil')}
                    className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-400 cursor-pointer"
                >
                    {iniciales(profile?.nombre)}
                </div>
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">
                {/* Tu progreso */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Tu progreso</p>
                    <div className="flex items-end gap-1 mb-1">
                        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{miKm.toFixed(1)}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500 mb-1">km</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                        {kmFaltan > 0 ? `Te faltan ${kmFaltan.toFixed(1)} km para tu meta` : '¡Has completado tu reto! 🎉'}
                    </p>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-1">
                        <span>0 km</span>
                        <span className="text-green-500 font-medium">{porcentaje}%</span>
                        <span>{objetivo} km</span>
                    </div>
                </div>

                {/* El grupo */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Entre todos llevamos</p>
                    <p className="text-3xl font-semibold text-green-700 dark:text-green-400">{kmGrupo.toFixed(1)} km</p>
                    <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 inline-block">
                        <p className="text-xs text-green-600 dark:text-green-400">= cruzar España {(kmGrupo / 1000).toFixed(1)} veces</p>
                    </div>
                </div>

                {/* Actividad reciente */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Actividad reciente</p>
                    {actividades.length === 0 ? (
                        <p className="text-sm text-gray-300 dark:text-gray-600 text-center py-4">Aún no hay actividades</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {actividades.map(act => (
                                <div key={act.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 flex-shrink-0 mt-0.5">
                                        {iniciales(act.profiles?.nombre)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            <span className="font-medium">{act.profiles?.nombre}</span>
                                            {' '}añadió{' '}
                                            <span className="font-medium">{act.distancia_km} km</span>
                                            {' '}{DEPORTES[act.deporte] || '🏅'} {act.deporte}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{tiempoRelativo(act.created_at)}</p>
                                        {act.foto_url && (
                                            <img src={act.foto_url} alt="actividad" className="mt-2 w-full h-32 object-cover rounded-xl" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Botón añadir — fijo sobre la NavBar, perfectamente alineado con el contenedor */}
            <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-[4.5rem] pt-3 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none">
                <button
                    onClick={() => navigate('/nueva-actividad')}
                    className="w-full bg-green-600 text-white rounded-2xl py-3.5 text-sm font-medium shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors pointer-events-auto"
                >
                    + Añadir actividad
                </button>
            </div>

            <NavBar />
        </div>
    )
}
