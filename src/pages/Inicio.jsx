import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { Card, ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { RingProgress } from '@/components/km/RingProgress'
import { Segmented } from '@/components/km/Segmented'
import { BarChart } from '@/components/km/BarChart'
import { GrupoFila } from '@/components/km/GrupoFila'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAppUI } from '@/context/AppUIContext'
import { cargarMisGrupos } from '@/lib/grupos'
import { iniciales, semanaActual, mesesRecientes } from '../utils'

// Resumen global: todas mis actividades, sin importar en qué grupos cuentan,
// frente a mi meta anual personal. Debajo, mi progreso en cada grupo.
export default function Inicio() {
    const navigate = useNavigate()
    const { refreshKey } = useAppUI()
    const [profile, setProfile] = useState(null)
    const [acts, setActs] = useState([])
    const [grupos, setGrupos] = useState([])
    const [rango, setRango] = useState('semana')
    const [loading, setLoading] = useState(true)

    const year = new Date().getFullYear()

    useEffect(() => {
        loadData()
    }, [refreshKey])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()

        // Desde el 1 de enero, o antes si la gráfica de 6 meses lo necesita.
        const hoy = new Date()
        const inicioGrafica = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)
        const desde = new Date(Math.min(inicioGrafica, new Date(year, 0, 1)))
        const desdeISO = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, '0')}-01`

        const [{ data: prof }, { data: misActs }, misGrupos] = await Promise.all([
            supabase.from('profiles').select().eq('id', user.id).single(),
            supabase.from('actividades').select('distancia_km, fecha').eq('user_id', user.id).gte('fecha', desdeISO),
            cargarMisGrupos(user.id),
        ])

        setProfile(prof)
        setActs(misActs || [])
        setGrupos(misGrupos)
        setLoading(false)
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    const kmYear = acts
        .filter(a => a.fecha >= `${year}-01-01`)
        .reduce((s, a) => s + Number(a.distancia_km), 0)
    const meta = profile?.objetivo_km
    const pct = meta ? Math.min(Math.round((kmYear / meta) * 100), 100) : 0
    const kmFaltan = meta ? Math.max(meta - kmYear, 0) : 0

    const { labels: semLabels, vals: semVals } = semanaActual(acts)
    const { labels: mesLabels, vals: mesVals } = mesesRecientes(acts)
    const esSemana = rango === 'semana'
    const vals = esSemana ? semVals : mesVals
    const rangoTotal = vals.reduce((a, b) => a + b, 0)

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-6 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <ScreenHeader
                    kicker={`Tu ${year}`}
                    title="Inicio"
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

                {/* Mi progreso global */}
                <Card className="flex items-center gap-5">
                    {meta && <RingProgress pct={pct} />}
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-k-text">{kmYear.toFixed(1)}</span>
                            <span className="text-[15px] text-k-text2">km este año</span>
                        </div>
                        <p className="text-[13px] leading-snug text-k-text2">
                            {!meta ? (
                                <>Sin meta personal. <button onClick={() => navigate('/perfil')} className="font-medium text-k-accent-ink">Ponte una</button></>
                            ) : kmFaltan > 0 ? (
                                <>Te quedan <span className="font-medium text-k-text">{kmFaltan.toFixed(1)} km</span> para tus {meta} del año.</>
                            ) : '¡Has cumplido tu meta del año! 🎉'}
                        </p>
                    </div>
                </Card>

                {/* Mi actividad */}
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

                {/* Mis grupos */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-k-text2">Tus grupos</p>
                        {grupos.length > 0 && (
                            <Button variant="link" size="sm" onClick={() => navigate('/grupos')}>Ver todos</Button>
                        )}
                    </div>
                    {grupos.length === 0 ? (
                        <Card className="flex flex-col gap-3">
                            <p className="text-[15px] leading-relaxed text-k-text2">
                                Aún no estás en ningún grupo. Tus actividades se guardan igual y contarán en los grupos a los que te unas a partir de ese día.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button className="justify-start" onClick={() => navigate('/grupos/nuevo', { state: { vista: 'crear' } })}>Crear un grupo</Button>
                                <Button variant="outline" className="justify-start" onClick={() => navigate('/grupos/nuevo', { state: { vista: 'unirse' } })}>Unirme con un código</Button>
                            </div>
                        </Card>
                    ) : (
                        <ListCard>
                            {grupos.map((g, i) => (
                                <GrupoFila key={g.id} grupo={g} first={i === 0} onClick={() => navigate(`/grupos/${g.id}`)} />
                            ))}
                        </ListCard>
                    )}
                </div>
            </div>

            <NavBar />
        </div>
    )
}
