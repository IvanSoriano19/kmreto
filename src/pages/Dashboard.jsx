import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { Card, ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { RingProgress } from '@/components/km/RingProgress'
import { Segmented } from '@/components/km/Segmented'
import { BarChart } from '@/components/km/BarChart'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IconDeporte, IconTrail } from '@/components/icons'
import { useAppUI } from '@/context/AppUIContext'
import { iniciales, tiempoRelativo, semanaActual, mesesRecientes } from '../utils'

export default function Dashboard() {
    const navigate = useNavigate()
    const { refreshKey } = useAppUI()
    const [profile, setProfile] = useState(null)
    const [reto, setReto] = useState(null)
    const [miKm, setMiKm] = useState(0)
    const [kmGrupo, setKmGrupo] = useState(0)
    const [nPersonas, setNPersonas] = useState(0)
    const [actividades, setActividades] = useState([])
    const [misActs, setMisActs] = useState([])
    const [rango, setRango] = useState('semana')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [refreshKey])

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

        const [{ data: misActsData }, { data: todasActs }, { data: miembros }, { data: recientes }] = await Promise.all([
            supabase.from('actividades').select('distancia_km, fecha').eq('user_id', user.id).eq('reto_id', retoData.id),
            supabase.from('actividades').select('distancia_km').eq('reto_id', retoData.id),
            supabase.from('reto_miembros').select('user_id').eq('reto_id', retoData.id),
            supabase.from('actividades').select('*, profiles(nombre)').eq('reto_id', retoData.id).order('created_at', { ascending: false }).limit(4),
        ])

        setMisActs(misActsData || [])
        setMiKm(misActsData?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
        setKmGrupo(todasActs?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
        setNPersonas(miembros?.length || 1)
        setActividades(recientes || [])
        setLoading(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    if (!reto) return (
        <div className="flex min-h-screen flex-col justify-center gap-5 bg-k-bg px-6 py-14">
            <IconTrail className="h-10 w-10 text-k-text3" strokeWidth={1.4} />
            <div className="flex flex-col gap-2">
                <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-k-text">Todavía no tienes un reto</h1>
                <p className="text-[15px] leading-relaxed text-k-text2">Crea uno para tu familia o entra con el código que te hayan pasado.</p>
            </div>
            <div className="mt-1 flex flex-col gap-2.5">
                <Button size="lg" className="justify-start" onClick={() => navigate('/onboarding', { state: { vista: 'crear' } })}>
                    Crear un reto
                </Button>
                <Button size="lg" variant="outline" className="justify-start" onClick={() => navigate('/onboarding', { state: { vista: 'unirse' } })}>
                    Unirse con un código
                </Button>
            </div>
        </div>
    )

    const objetivo = reto.objetivo_km_personal
    const pct = Math.min(Math.round((miKm / objetivo) * 100), 100)
    const kmFaltan = Math.max(objetivo - miKm, 0)
    const veces = (kmGrupo / 1000).toFixed(1).replace('.', ',')

    const { labels: semLabels, vals: semVals } = semanaActual(misActs)
    const { labels: mesLabels, vals: mesVals } = mesesRecientes(misActs)
    const esSemana = rango === 'semana'
    const vals = esSemana ? semVals : mesVals
    const rangoTotal = vals.reduce((a, b) => a + b, 0)

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-6 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <ScreenHeader
                    kicker={`${reto.nombre} · ${reto.year}`}
                    title="Resumen"
                    action={
                        <button onClick={() => navigate('/perfil')} className="h-[38px] w-[38px] flex-none rounded-full">
                            <Avatar className="h-full w-full border border-k-sep bg-k-accent-soft">
                                <AvatarFallback className="bg-transparent text-[13px] font-semibold text-k-accent-ink">
                                    {iniciales(profile?.nombre)}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    }
                />

                {/* Tu progreso */}
                <Card className="flex items-center gap-5">
                    <RingProgress pct={pct} />
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-k-text">{miKm.toFixed(1)}</span>
                            <span className="text-[15px] text-k-text2">km</span>
                        </div>
                        <p className="text-[13px] leading-snug text-k-text2">
                            {kmFaltan > 0
                                ? <>Te quedan <span className="font-medium text-k-text">{kmFaltan.toFixed(1)} km</span> para los {objetivo} del año.</>
                                : '¡Has completado tu reto! 🎉'}
                        </p>
                    </div>
                </Card>

                {/* Tu actividad */}
                <Card className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-k-text2">Tu actividad</p>
                        <Segmented
                            value={rango}
                            onChange={setRango}
                            options={[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]}
                        />
                    </div>
                    <BarChart values={vals} labels={esSemana ? semLabels : mesLabels} />
                    <div className="h-px bg-k-sep" />
                    <div className="flex items-baseline justify-between">
                        <div className="text-[13px] text-k-text2">{esSemana ? 'Esta semana' : 'Últimos 6 meses'}</div>
                        <div className="text-[15px] font-semibold tabular-nums text-k-text">{rangoTotal.toFixed(1)} km</div>
                    </div>
                </Card>

                {/* El grupo */}
                <Card className="flex flex-col gap-3 bg-k-accent-soft shadow-none">
                    <p className="text-[13px] font-semibold text-k-accent-ink">El grupo</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[30px] font-semibold tracking-[-0.025em] tabular-nums text-k-accent-ink">{kmGrupo.toFixed(1)}</span>
                        <span className="text-sm text-k-text2">km entre {nPersonas} {nPersonas === 1 ? 'persona' : 'personas'}</span>
                    </div>
                    <p className="text-[13px] leading-snug text-k-text2">
                        Equivale a cruzar España <span className="font-medium text-k-text">{veces} veces</span> de norte a sur.
                    </p>
                </Card>

                {/* Últimos movimientos */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-k-text2">Últimos movimientos</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/ranking')}>Ver todo</Button>
                    </div>
                    <ListCard>
                        {actividades.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-k-text3">Aún no hay actividades</p>
                        ) : actividades.map((act, i) => (
                            <div key={act.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-k-sep' : ''}`}>
                                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-k-fill">
                                    <IconDeporte deporte={act.deporte} className="h-[18px] w-[18px] text-k-text2" strokeWidth={1.7} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm leading-tight text-k-text">
                                        <span className="font-medium">{act.profiles?.nombre}</span> · {act.deporte}
                                    </div>
                                    <div className="text-xs text-k-text2">{tiempoRelativo(act.created_at)}</div>
                                </div>
                                <div className="flex-none text-sm font-semibold tabular-nums text-k-text">{Number(act.distancia_km).toFixed(1)} km</div>
                            </div>
                        ))}
                    </ListCard>
                </div>
            </div>

            <NavBar />
        </div>
    )
}
