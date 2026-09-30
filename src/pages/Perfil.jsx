import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import CambiarContrasenaSheet from '../components/CambiarContrasenaSheet'
import { ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { StatRow } from '@/components/km/StatTile'
import { Segmented } from '@/components/km/Segmented'
import { useTema } from '../ThemeContext'
import { useAppUI } from '@/context/AppUIContext'

export default function Perfil() {
    const navigate = useNavigate()
    const { showToast, refreshKey } = useAppUI()
    const [perfil, setPerfil] = useState(null)
    const [nGrupos, setNGrupos] = useState(0)
    const [stats, setStats] = useState({ km: 0, actividades: 0, deporteFav: null })
    const [objetivoEdit, setObjetivoEdit] = useState('')
    const [nombreEdit, setNombreEdit] = useState('')
    const [loading, setLoading] = useState(true)
    const [contrasenaOpen, setContrasenaOpen] = useState(false)
    const { tema, setTema } = useTema()

    useEffect(() => {
        loadData()
    }, [refreshKey])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()

        const [{ data: prof }, { data: acts }, { count }] = await Promise.all([
            supabase.from('profiles').select().eq('id', user.id).single(),
            supabase.from('actividades').select('distancia_km, deporte').eq('user_id', user.id),
            supabase.from('reto_miembros').select('reto_id', { count: 'exact', head: true }).eq('user_id', user.id),
        ])

        setPerfil(prof)
        setNombreEdit(prof?.nombre || '')
        setObjetivoEdit(prof?.objetivo_km ? String(prof.objetivo_km) : '')
        setNGrupos(count || 0)

        const km = acts?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0
        const conteo = {}
        acts?.forEach(a => { conteo[a.deporte] = (conteo[a.deporte] || 0) + 1 })
        const deporteFav = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || null

        setStats({ km, actividades: acts?.length || 0, deporteFav })
        setLoading(false)
    }

    async function handleGuardarNombre() {
        if (!nombreEdit.trim() || nombreEdit === perfil?.nombre) { setNombreEdit(perfil?.nombre || ''); return }
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('profiles').update({ nombre: nombreEdit.trim() }).eq('id', user.id)
        setPerfil(p => ({ ...p, nombre: nombreEdit.trim() }))
        showToast('Nombre actualizado')
    }

    // Meta anual personal, independiente de los grupos. Vacía = sin meta.
    async function handleGuardarObjetivo() {
        const nueva = objetivoEdit ? parseInt(objetivoEdit, 10) : null
        if (nueva === (perfil?.objetivo_km ?? null)) return
        if (nueva !== null && !(nueva > 0)) { setObjetivoEdit(perfil?.objetivo_km ? String(perfil.objetivo_km) : ''); return }
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('profiles').update({ objetivo_km: nueva }).eq('id', user.id)
        setPerfil(p => ({ ...p, objetivo_km: nueva }))
        showToast(nueva ? 'Meta actualizada' : 'Meta quitada')
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-5 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <ScreenHeader
                    kicker={nGrupos === 1 ? 'En 1 grupo' : `En ${nGrupos} grupos`}
                    title={perfil?.nombre || 'Perfil'}
                />

                <StatRow stats={[
                    { value: stats.km.toFixed(1), label: 'km totales' },
                    { value: stats.actividades, label: 'actividades' },
                    { value: stats.deporteFav || '—', label: 'más frecuente' },
                ]} />

                <ListCard>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-[15px] text-k-text">Tu nombre</span>
                        <input
                            value={nombreEdit}
                            onChange={e => setNombreEdit(e.target.value)}
                            onBlur={handleGuardarNombre}
                            className="w-36 rounded-lg bg-k-fill px-2.5 py-1.5 text-right text-sm font-medium text-k-text outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-[15px] text-k-text">Mi meta anual</span>
                            <span className="text-xs text-k-text2">Tuya, aparte de la de cada grupo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                placeholder="—"
                                value={objetivoEdit}
                                onChange={e => setObjetivoEdit(e.target.value)}
                                onBlur={handleGuardarObjetivo}
                                className="w-[66px] rounded-lg bg-k-fill px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-k-text outline-none placeholder:text-k-text3"
                            />
                            <span className="text-[13px] text-k-text2">km</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                        <span className="text-[15px] text-k-text">Apariencia</span>
                        <Segmented
                            value={tema}
                            onChange={setTema}
                            options={[{ value: 'claro', label: 'Claro' }, { value: 'oscuro', label: 'Oscuro' }]}
                        />
                    </div>

                    <div onClick={() => setContrasenaOpen(true)} className="flex cursor-pointer items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                        <span className="text-[15px] text-k-text">Cambiar contraseña</span>
                        <ChevronRight className="h-4 w-4 text-k-text3" strokeWidth={2} />
                    </div>
                </ListCard>

                <button onClick={handleLogout} className="py-2 text-center text-sm text-k-danger">
                    Cerrar sesión
                </button>
            </div>
            <NavBar />
            <CambiarContrasenaSheet open={contrasenaOpen} onOpenChange={setContrasenaOpen} />
        </div>
    )
}
