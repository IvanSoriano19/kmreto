import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { StatRow } from '@/components/km/StatTile'
import { Segmented } from '@/components/km/Segmented'
import { Button } from '@/components/ui/button'
import { useTema } from '../ThemeContext'
import { useAppUI } from '@/context/AppUIContext'

export default function Perfil() {
    const navigate = useNavigate()
    const { showToast, refreshKey } = useAppUI()
    const [perfil, setPerfil] = useState(null)
    const [reto, setReto] = useState(null)
    const [miembroId, setMiembroId] = useState(null)
    const [stats, setStats] = useState({ km: 0, actividades: 0, deporteFav: null })
    const [objetivoEdit, setObjetivoEdit] = useState(null)
    const [nombreEdit, setNombreEdit] = useState('')
    const [loading, setLoading] = useState(true)
    const { tema, setTema } = useTema()

    useEffect(() => {
        loadData()
    }, [refreshKey])

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
        if (!nombreEdit.trim() || nombreEdit === perfil?.nombre) { setNombreEdit(perfil?.nombre || ''); return }
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('profiles').update({ nombre: nombreEdit.trim() }).eq('id', user.id)
        setPerfil(p => ({ ...p, nombre: nombreEdit.trim() }))
        showToast('Nombre actualizado')
    }

    async function handleGuardarObjetivo() {
        await supabase.from('reto_miembros').update({ objetivo_km: objetivoEdit }).eq('id', miembroId)
        showToast('Meta actualizada')
    }

    async function handleCopiarCodigo() {
        await navigator.clipboard.writeText(reto.codigo_invitacion)
        showToast('Código copiado')
    }

    async function handleSalirDelReto() {
        if (!window.confirm('¿Seguro que quieres salir de este reto?')) return
        await supabase.from('reto_miembros').delete().eq('id', miembroId)
        navigate('/onboarding')
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
                    kicker={reto ? `${reto.nombre} · desde ${reto.year}` : undefined}
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

                    {reto && (
                        <div className="flex items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                            <span className="text-[15px] text-k-text">Mi meta anual</span>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min="1"
                                    value={objetivoEdit || ''}
                                    onChange={e => setObjetivoEdit(Number(e.target.value))}
                                    onBlur={handleGuardarObjetivo}
                                    className="w-[66px] rounded-lg bg-k-fill px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-k-text outline-none"
                                />
                                <span className="text-[13px] text-k-text2">km</span>
                            </div>
                        </div>
                    )}

                    {reto?.codigo_invitacion && (
                        <div className="flex items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[15px] text-k-text">Código de invitación</span>
                                <span className="text-[19px] font-semibold tracking-[.18em] tabular-nums text-k-text">{reto.codigo_invitacion}</span>
                            </div>
                            <Button size="sm" variant="outline" className="text-k-accent-ink" onClick={handleCopiarCodigo}>Copiar</Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                        <span className="text-[15px] text-k-text">Apariencia</span>
                        <Segmented
                            value={tema}
                            onChange={setTema}
                            options={[{ value: 'claro', label: 'Claro' }, { value: 'oscuro', label: 'Oscuro' }]}
                        />
                    </div>

                    {reto && (
                        <div onClick={handleSalirDelReto} className="flex cursor-pointer items-center justify-between gap-3 border-t border-k-sep px-4 py-3">
                            <span className="text-[15px] text-k-text">Salir del reto</span>
                            <ChevronRight className="h-4 w-4 text-k-text3" strokeWidth={2} />
                        </div>
                    )}
                </ListCard>

                <button onClick={handleLogout} className="py-2 text-center text-sm text-k-danger">
                    Cerrar sesión
                </button>
            </div>
            <NavBar />
        </div>
    )
}
