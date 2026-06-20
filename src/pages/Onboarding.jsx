import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'

function CrearReto({ onBack }) {
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [objetivoKm, setObjetivoKm] = useState(1000)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function generarCodigo() {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    async function handleCrear(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        const { data: perfil } = await supabase
            .from('profiles').select().eq('id', user.id).single()

        if (!perfil) {
            await supabase.from('profiles').insert({
                id: user.id,
                nombre: user.email.split('@')[0],
            })
        }

        const { data: retoExistente } = await supabase
            .from('retos').select()
            .eq('creado_por', user.id)
            .order('created_at', { ascending: false })
            .limit(1).single()

        let retoId

        if (retoExistente) {
            retoId = retoExistente.id
        } else {
            const { data: reto, error: retoError } = await supabase
                .from('retos')
                .insert({
                    nombre,
                    objetivo_km: objetivoKm,
                    year: new Date().getFullYear(),
                    codigo_invitacion: generarCodigo(),
                    creado_por: user.id,
                })
                .select().single()

            if (retoError) { setError(retoError.message); setLoading(false); return }
            retoId = reto.id
        }

        const { data: miembroExistente } = await supabase
            .from('reto_miembros').select()
            .eq('reto_id', retoId).eq('user_id', user.id).single()

        if (!miembroExistente) {
            await supabase.from('reto_miembros').insert({ reto_id: retoId, user_id: user.id })
        }

        setLoading(false)
        navigate('/')
    }

    return (
        <div className="w-full max-w-sm">
            <button onClick={onBack} className="text-gray-400 dark:text-gray-500 text-sm mb-6 flex items-center gap-1">
                ‹ Volver
            </button>
            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🏆</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crear un reto</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Configura el reto y comparte el código con tu familia</p>
            </div>
            <form onSubmit={handleCrear} className="flex flex-col gap-3">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nombre del reto</label>
                    <input
                        type="text"
                        placeholder="Ej: Reto Familia García 2026"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Objetivo en km (por persona)</label>
                    <input
                        type="number"
                        value={objetivoKm}
                        onChange={e => setObjetivoKm(Number(e.target.value))}
                        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                        min="1"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 mt-2"
                >
                    {loading ? 'Creando...' : 'Crear reto'}
                </button>
            </form>
        </div>
    )
}

function UnirseReto({ onBack }) {
    const navigate = useNavigate()
    const [codigo, setCodigo] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleUnirse(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        const { data: perfil } = await supabase
            .from('profiles').select().eq('id', user.id).single()

        if (!perfil) {
            await supabase.from('profiles').insert({
                id: user.id,
                nombre: user.email.split('@')[0],
            })
        }

        const { data: reto, error: retoError } = await supabase
            .from('retos').select()
            .eq('codigo_invitacion', codigo.toUpperCase()).single()

        if (retoError || !reto) {
            setError('Código no encontrado, revísalo')
            setLoading(false)
            return
        }

        const { error: memberError } = await supabase
            .from('reto_miembros')
            .insert({ reto_id: reto.id, user_id: user.id })

        if (memberError) {
            setError('Ya eres miembro de este reto')
            setLoading(false)
            return
        }

        setLoading(false)
        navigate('/')
    }

    return (
        <div className="w-full max-w-sm">
            <button onClick={onBack} className="text-gray-400 dark:text-gray-500 text-sm mb-6 flex items-center gap-1">
                ‹ Volver
            </button>
            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔗</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Unirse con código</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Pide el código a quien creó el reto</p>
            </div>
            <form onSubmit={handleUnirse} className="flex flex-col gap-3">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Código de invitación</label>
                    <input
                        type="text"
                        placeholder="Ej: ABC123"
                        value={codigo}
                        onChange={e => setCodigo(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 uppercase tracking-widest text-center text-lg font-semibold"
                        maxLength={6}
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50 mt-2"
                >
                    {loading ? 'Buscando...' : 'Unirse al reto'}
                </button>
            </form>
        </div>
    )
}

export default function Onboarding() {
    const [vista, setVista] = useState('menu')

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6 transition-colors">
            {vista === 'menu' && (
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <div className="text-5xl mb-3">👋</div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">¡Bienvenido!</h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">¿Qué quieres hacer?</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setVista('crear')}
                            className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-left hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        >
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏆</div>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">Crear un reto</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Crea el reto y comparte el código con tu familia</div>
                            </div>
                            <span className="text-gray-300 ml-auto text-lg">›</span>
                        </button>
                        <button
                            onClick={() => setVista('unirse')}
                            className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔗</div>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">Unirse con código</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Alguien ya creó el reto y te compartió un código</div>
                            </div>
                            <span className="text-gray-300 ml-auto text-lg">›</span>
                        </button>
                    </div>
                    <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex gap-2">
                        <span className="text-base">💡</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Puedes pertenecer a varios retos a la vez y cambiar entre ellos fácilmente.</p>
                    </div>
                </div>
            )}
            {vista === 'crear'   && <CrearReto  onBack={() => setVista('menu')} />}
            {vista === 'unirse'  && <UnirseReto onBack={() => setVista('menu')} />}
        </div>
    )
}
