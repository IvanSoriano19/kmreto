import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { iniciales } from '../utils'

export default function Ranking() {
    const navigate = useNavigate()
    const [miembros, setMiembros] = useState([])
    const [reto, setReto] = useState(null)
    const [kmGrupo, setKmGrupo] = useState(0)
    const [myUserId, setMyUserId] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()
        setMyUserId(user.id)

        const { data: miembro } = await supabase
            .from('reto_miembros')
            .select(`reto_id, retos(id, nombre, objetivo_km, year)`)
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!miembro) { setLoading(false); return }

        const retoData = miembro.retos
        setReto(retoData)

        const [{ data: todosMiembros }, { data: actividades }] = await Promise.all([
            supabase.from('reto_miembros').select(`user_id, objetivo_km, profiles(id, nombre)`).eq('reto_id', retoData.id),
            supabase.from('actividades').select('user_id, distancia_km').eq('reto_id', retoData.id),
        ])

        const kmPorUsuario = {}
        actividades?.forEach(a => {
            kmPorUsuario[a.user_id] = (kmPorUsuario[a.user_id] || 0) + Number(a.distancia_km)
        })

        const total = Object.values(kmPorUsuario).reduce((sum, km) => sum + km, 0)
        setKmGrupo(total)

        const ranking = todosMiembros?.map(m => ({
            user_id: m.user_id,
            nombre: m.profiles?.nombre || 'Sin nombre',
            km: kmPorUsuario[m.user_id] || 0,
            objetivo: m.objetivo_km || retoData.objetivo_km,
        })).sort((a, b) => b.km - a.km)

        setMiembros(ranking || [])
        setLoading(false)
    }

    const coloresAvatar = [
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    ]

    const medallas = ['🥇', '🥈', '🥉']

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
            <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
    )

    const mediaProgreso = miembros.length > 0
        ? Math.round(miembros.reduce((sum, m) => sum + (m.km / m.objetivo) * 100, 0) / miembros.length)
        : 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
            <div className="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Clasificación</h1>
                {reto && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Meta: {reto.objetivo_km} km por persona</p>}
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { val: miembros.length, lbl: 'participantes' },
                        { val: kmGrupo.toFixed(0), lbl: 'km del grupo' },
                        { val: `${mediaProgreso}%`, lbl: 'media' },
                    ].map(s => (
                        <div key={s.lbl} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm text-center">
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">{s.val}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.lbl}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Clasificación</p>
                    </div>
                    {miembros.map((m, i) => {
                        const porcentaje = Math.min(Math.round((m.km / m.objetivo) * 100), 100)
                        const esYo = m.user_id === myUserId
                        return (
                            <div key={m.user_id}
                                onClick={() => navigate(`/historial/${m.user_id}`)}
                                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${esYo ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                            >
                                <div className="w-6 text-center flex-shrink-0">
                                    {i < 3 ? <span className="text-lg">{medallas[i]}</span>
                                        : <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{i + 1}</span>}
                                </div>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${coloresAvatar[i % coloresAvatar.length]}`}>
                                    {iniciales(m.nombre)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.nombre}</p>
                                        {esYo && <span className="text-xs text-green-600 dark:text-green-400 font-medium">· tú</span>}
                                    </div>
                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${porcentaje}%` }} />
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">{m.km.toFixed(1)}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">km</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {miembros.length > 1 && (() => {
                    const yo = miembros.find(m => m.user_id === myUserId)
                    const miPos = miembros.findIndex(m => m.user_id === myUserId)
                    const lider = miembros[0]
                    if (!yo) return null
                    if (miPos === 0) return (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 text-center">
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">🏆 ¡Vas primero! Sigue así</p>
                        </div>
                    )
                    const diff = (lider.km - yo.km).toFixed(1)
                    return (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center">
                            <p className="text-xs text-green-600 dark:text-green-400">vas {diff} km por detrás de {lider.nombre}</p>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400 mt-1">¡Ponte las pilas! 💪</p>
                        </div>
                    )
                })()}
            </div>
            <NavBar />
        </div>
    )
}
