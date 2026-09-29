import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { StatRow } from '@/components/km/StatTile'
import { IconRanking } from '@/components/icons'
import { useAppUI } from '@/context/AppUIContext'
import { iniciales } from '../utils'
import { cn } from '@/lib/utils'

export default function Ranking() {
    const navigate = useNavigate()
    const { refreshKey } = useAppUI()
    const [miembros, setMiembros] = useState([])
    const [reto, setReto] = useState(null)
    const [kmGrupo, setKmGrupo] = useState(0)
    const [myUserId, setMyUserId] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [refreshKey])

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

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    const mediaProgreso = miembros.length > 0
        ? Math.round(miembros.reduce((sum, m) => sum + (m.km / m.objetivo) * 100, 0) / miembros.length)
        : 0
    const yo = miembros.find(m => m.user_id === myUserId)
    const miPos = miembros.findIndex(m => m.user_id === myUserId)
    const lider = miembros[0]

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-5 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <ScreenHeader kicker={reto ? `Meta ${reto.objetivo_km} km por persona` : undefined} title="Clasificación" />

                <StatRow stats={[
                    { value: miembros.length, label: 'participan' },
                    { value: kmGrupo.toFixed(0), label: 'km del grupo' },
                    { value: `${mediaProgreso}%`, label: 'media' },
                ]} />

                <ListCard>
                    {miembros.map((m, i) => {
                        const pct = Math.min(Math.round((m.km / m.objetivo) * 100), 100)
                        const esYo = m.user_id === myUserId
                        return (
                            <div
                                key={m.user_id}
                                onClick={() => navigate(`/historial/${m.user_id}`)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 px-4 py-3',
                                    i > 0 && 'border-t border-k-sep',
                                    esYo && 'bg-k-accent-soft'
                                )}
                            >
                                <div className="w-[18px] flex-none text-center text-[13px] font-semibold tabular-nums text-k-text2">{i + 1}</div>
                                <div className={cn(
                                    'flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-xs font-semibold',
                                    esYo ? 'border border-k-accent text-k-accent-ink' : 'bg-k-fill text-k-text2'
                                )}>
                                    {iniciales(m.nombre)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-sm font-medium text-k-text">{m.nombre}</span>
                                        {esYo && <span className="text-[11px] font-semibold text-k-accent-ink">tú</span>}
                                    </div>
                                    <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-k-fill">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: esYo ? 'var(--k-accent)' : 'var(--k-text3)' }} />
                                    </div>
                                </div>
                                <div className="flex-none text-right">
                                    <div className="text-sm font-semibold tabular-nums text-k-text">{m.km.toFixed(1)}</div>
                                    <div className="text-[10px] text-k-text2">km</div>
                                </div>
                            </div>
                        )
                    })}
                </ListCard>

                {yo && miembros.length > 1 && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-k-accent-soft p-3.5">
                        <IconRanking className="mt-0.5 h-[18px] w-[18px] flex-none text-k-accent-ink" strokeWidth={1.7} />
                        <p className="text-[13px] leading-relaxed text-k-accent-ink">
                            {miPos === 0
                                ? <>¡Vas primero! Sigue así.</>
                                : <>Estás a <span className="font-semibold">{(lider.km - yo.km).toFixed(1)} km</span> de {lider.nombre}.</>}
                        </p>
                    </div>
                )}
            </div>
            <NavBar />
        </div>
    )
}
