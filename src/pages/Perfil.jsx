import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast'
import { useTema } from '../ThemeContext'
import { DEPORTES, iniciales } from '../utils'

export default function Perfil() {
    const navigate = useNavigate()
    const [perfil, setPerfil] = useState(null)
    const [reto, setReto] = useState(null)
    const [miembroId, setMiembroId] = useState(null)
    const [stats, setStats] = useState({ km: 0, actividades: 0, deporteFav: null })
    const [objetivoEdit, setObjetivoEdit] = useState(null)
    const [editando, setEditando] = useState(false)
    const [nombreEdit, setNombreEdit] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)
    const { tema, setTema } = useTema()

    const showToast = useCallback((msg) => setToast(msg), [])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()

        const [{ data: prof }, { data: miembro }] = await Promise.all([
            supabase.from('profiles').select().eq('id', user.id).single(),
            supabase.from('reto_miembros').select(`id, reto_id, objetivo_km, retos(id, nombre, objetivo_km, year, codigo_invitacion)`).eq('user_id', user.id).limit(1).single(),
        ])

        setPerfil(prof)
        setNombreEdit(prof?.nombre || '')

        if (!miembro) { setLoading(false); return }

        setReto(miembro.retos)
        setMiembroId(miembro.id)
        setObjetivoEdit(miembro.objetivo_km || miembro.retos.objetivo_km)

        const { data: acts } = await supabase
            .from('actividades')
            .select('distancia_km, deporte')
            .eq('user_id', user.id)
            .eq('reto_id', miembro.reto_id)

        const km = acts?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0
        const conteo = {}
        acts?.forEach(a => { conteo[a.deporte] = (conteo[a.deporte] || 0) + 1 })
        const deporteFav = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || null

        setStats({ km, actividades: acts?.length || 0, deporteFav })
        setLoading(false)
    }

    async function handleGuardarNombre() {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('profiles').update({ nombre: nombreEdit }).eq('id', user.id)
        setPerfil(p => ({ ...p, nombre: nombreEdit }))
        setEditando(false)
        showToast('Nombre actualizado')
    }

    async function handleGuardarObjetivo() {
        await supabase.from('reto_miembros').update({ objetivo_km: objetivoEdit }).eq('id', miembroId)
        showToast('Meta actualizada')
    }

    async function handleCopiarCodigo() {
        await navigator.clipboard.writeText(reto.codigo_invitacion)
        showToast('¡Código copiado!')
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
            <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}

            <div className="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Mi perfil</h1>
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">

                {/* Avatar y nombre */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl font-semibold text-green-700 dark:text-green-400">
                        {iniciales(perfil?.nombre)}
                    </div>
                    {editando ? (
                        <div className="flex gap-2 w-full">
                            <input value={nombreEdit} onChange={e => setNombreEdit(e.target.value)}
                                className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
                            />
                            <button onClick={handleGuardarNombre} className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium">
                                Guardar
                            </button>
                            <button onClick={() => setEditando(false)} className="text-gray-400 px-2 text-xs">
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{perfil?.nombre}</p>
                            <button onClick={() => setEditando(true)} className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Editar
                            </button>
                        </div>
                    )}
                    {reto && <p className="text-xs text-gray-400 dark:text-gray-500">{reto.nombre} · desde {reto.year}</p>}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { val: stats.km.toFixed(1), lbl: 'km totales' },
                        { val: stats.actividades, lbl: 'actividades' },
                        { val: stats.deporteFav ? DEPORTES[stats.deporteFav] : '—', lbl: 'deporte top' },
                    ].map(s => (
                        <div key={s.lbl} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm text-center">
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">{s.val}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.lbl}</p>
                        </div>
                    ))}
                </div>

                {/* Meta personal */}
                {reto && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Mi meta personal</p>
                        <div className="flex items-center gap-3">
                            <input type="number" value={objetivoEdit || ''} onChange={e => setObjetivoEdit(Number(e.target.value))}
                                className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500"
                                min="1"
                            />
                            <span className="text-sm text-gray-400 dark:text-gray-500">km</span>
                            <button onClick={handleGuardarObjetivo} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-medium">
                                Guardar
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">El reto tiene una meta de {reto.objetivo_km} km por defecto</p>
                    </div>
                )}

                {/* Código invitación */}
                {reto?.codigo_invitacion && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                        <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Código de invitación</p>
                        <div className="flex items-center gap-3">
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400 tracking-widest flex-1">
                                {reto.codigo_invitacion}
                            </p>
                            <button onClick={handleCopiarCodigo} className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium">
                                Copiar
                            </button>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">Comparte este código con tu familia para que se unan</p>
                    </div>
                )}

                {/* Apariencia */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Apariencia</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setTema('claro')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                                tema === 'claro'
                                    ? 'bg-green-50 border-green-400 text-green-700'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            ☀️ Claro
                        </button>
                        <button onClick={() => setTema('oscuro')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                                tema === 'oscuro'
                                    ? 'bg-gray-700 border-gray-500 text-white'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            🌙 Oscuro
                        </button>
                    </div>
                </div>

                {/* Cerrar sesión */}
                <button onClick={handleLogout} className="text-center text-sm text-red-400 py-2">
                    Cerrar sesión
                </button>

            </div>
            <NavBar />
        </div>
    )
}
