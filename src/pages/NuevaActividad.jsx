import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import imageCompression from 'browser-image-compression'
import { DEPORTES_LIST as DEPORTES } from '../utils'

export default function NuevaActividad() {
    const navigate = useNavigate()
    const [deporte, setDeporte] = useState('Correr')
    const [distancia, setDistancia] = useState('')
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
    const [nota, setNota] = useState('')
    const [foto, setFoto] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [retoId, setRetoId] = useState(null)

    useEffect(() => {
        async function loadReto() {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: miembro } = await supabase
                .from('reto_miembros')
                .select('reto_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()
            if (miembro) setRetoId(miembro.reto_id)
        }
        loadReto()
    }, [])

    async function handleFoto(e) {
        const file = e.target.files[0]
        if (!file) return

        const compressed = await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        })

        setFoto(compressed)
        setFotoPreview(URL.createObjectURL(compressed))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!distancia || Number(distancia) <= 0) {
            setError('Introduce una distancia válida')
            return
        }
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        let foto_url = null

        if (foto) {
            const fileName = `${user.id}/${Date.now()}.jpg`
            const { error: uploadError } = await supabase.storage
                .from('fotos-actividades')
                .upload(fileName, foto)

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('fotos-actividades')
                    .getPublicUrl(fileName)
                foto_url = urlData.publicUrl
            }
        }

        const { error: actError } = await supabase.from('actividades').insert({
            user_id: user.id,
            reto_id: retoId,
            deporte,
            distancia_km: Number(distancia),
            fecha,
            nota: nota || null,
            foto_url,
        })

        if (actError) {
            setError('Error al guardar la actividad')
            setLoading(false)
            return
        }

        setLoading(false)
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
                <button onClick={() => navigate(-1)} className="text-gray-400 text-2xl leading-none">‹</button>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Nueva actividad</h1>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4 pb-10">

                {/* Deporte */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Tipo de deporte</p>
                    <div className="grid grid-cols-3 gap-2">
                        {DEPORTES.map(d => (
                            <button key={d.id} type="button" onClick={() => setDeporte(d.id)}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${deporte === d.id
                                        ? 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-400'
                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <span className="text-2xl">{d.emoji}</span>
                                {d.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Distancia */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Distancia</p>
                    <div className="relative">
                        <input type="number" step="0.1" min="0" placeholder="0.0"
                            value={distancia} onChange={e => setDistancia(e.target.value)}
                            className="w-full text-3xl font-semibold text-gray-900 dark:text-white outline-none text-center bg-gray-50 dark:bg-gray-700 rounded-xl py-3 pr-14"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium text-lg pointer-events-none">km</span>
                    </div>
                </div>

                {/* Fecha */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Fecha</p>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm text-gray-800 outline-none"
                    />
                </div>

                {/* Nota */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                        Nota <span className="text-gray-300 dark:text-gray-600">(opcional)</span>
                    </p>
                    <textarea placeholder="¿Cómo fue?" value={nota} onChange={e => setNota(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none resize-none"
                    />
                </div>

                {/* Foto */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                        Foto <span className="text-gray-300 dark:text-gray-600">(opcional)</span>
                    </p>
                    {fotoPreview ? (
                        <div className="relative">
                            <img src={fotoPreview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                            <button type="button" onClick={() => { setFoto(null); setFotoPreview(null) }}
                                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full text-white text-xs flex items-center justify-center"
                            >✕</button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-6 cursor-pointer hover:border-green-400 transition-colors">
                            <span className="text-3xl">📷</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Añadir foto</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">Cámara o galería</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
                        </label>
                    )}
                </div>

                {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                <button type="submit" disabled={loading}
                    className="bg-green-600 text-white rounded-2xl py-4 text-sm font-medium shadow-lg hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar actividad'}
                </button>
            </form>
        </div>
    )
}