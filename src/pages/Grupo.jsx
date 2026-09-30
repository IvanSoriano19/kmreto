import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import GrupoAjustesSheet from '../components/GrupoAjustesSheet'
import { Card, ListCard, Kicker } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { RingProgress } from '@/components/km/RingProgress'
import { ListRow } from '@/components/km/ListRow'
import { Button } from '@/components/ui/button'
import { IconDeporte, IconRanking } from '@/components/icons'
import { useAppUI } from '@/context/AppUIContext'
import { clasificacion, deportesGrupo, fechaCorta, periodoGrupo } from '@/lib/grupos'
import { iniciales, tiempoRelativo } from '../utils'
import { cn } from '@/lib/utils'

export default function Grupo() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { refreshKey, showToast } = useAppUI()
    const [myUserId, setMyUserId] = useState(null)
    const [reto, setReto] = useState(null)
    const [ranking, setRanking] = useState([])
    const [recientes, setRecientes] = useState([])
    const [ajustesOpen, setAjustesOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [id, refreshKey])

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser()
        setMyUserId(user.id)

        // El RLS solo devuelve el grupo si soy miembro (o quien lo creó).
        const [{ data: retoData }, { data: filas }, { data: ultimas }] = await Promise.all([
            supabase.from('retos').select().eq('id', id).maybeSingle(),
            supabase.from('km_por_miembro').select('reto_id, user_id, unido_el, km').eq('reto_id', id),
            supabase.from('actividades_reto').select('id, user_id, deporte, distancia_km, created_at').eq('reto_id', id).order('created_at', { ascending: false }).limit(5),
        ])

        if (!retoData || !filas?.some(f => f.user_id === user.id)) {
            setReto(null)
            setLoading(false)
            return
        }

        const { data: perfiles } = await supabase.from('profiles').select('id, nombre').in('id', filas.map(f => f.user_id))
        const nombre = Object.fromEntries((perfiles || []).map(p => [p.id, p.nombre]))

        setReto(retoData)
        setRanking(clasificacion(filas, id).map(f => ({ ...f, nombre: nombre[f.user_id] || 'Sin nombre' })))
        setRecientes((ultimas || []).map(a => ({ ...a, nombre: nombre[a.user_id] })))
        setLoading(false)
    }

    async function handleCopiarCodigo() {
        await navigator.clipboard.writeText(reto.codigo_invitacion)
        showToast('Código copiado')
    }

    async function handleSalir() {
        if (!window.confirm(`¿Seguro que quieres salir de "${reto.nombre}"? Tus actividades no se borran.`)) return
        await supabase.from('reto_miembros').delete().eq('reto_id', id).eq('user_id', myUserId)
        showToast('Has salido del grupo')
        navigate('/grupos', { replace: true })
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    if (!reto) return (
        <div className="flex min-h-screen flex-col justify-center gap-4 bg-k-bg px-6">
            <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-k-text">No estás en este grupo</h1>
            <p className="text-[15px] leading-relaxed text-k-text2">Puede que ya no exista o que te hayas salido. Pide el código a alguien del grupo para volver a entrar.</p>
            <Button size="lg" className="justify-start" onClick={() => navigate('/grupos', { replace: true })}>Ver mis grupos</Button>
        </div>
    )

    const esAdmin = reto.creado_por === myUserId
    const yo = ranking.find(m => m.user_id === myUserId)
    const miPos = ranking.findIndex(m => m.user_id === myUserId)
    const lider = ranking[0]
    const kmGrupo = ranking.reduce((s, m) => s + m.km, 0)
    const pct = Math.min(Math.round((yo.km / reto.objetivo_km) * 100), 100)
    const kmFaltan = Math.max(reto.objetivo_km - yo.km, 0)
    const pctGrupo = reto.objetivo_grupo_km ? Math.min(Math.round((kmGrupo / reto.objetivo_grupo_km) * 100), 100) : 0
    const cuentoDesde = yo.unido_el > reto.fecha_inicio ? yo.unido_el : null

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-5 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <button onClick={() => navigate('/grupos')} className="-mb-3 flex items-center gap-0.5 self-start text-[15px] text-k-accent-ink">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                    Grupos
                </button>

                <ScreenHeader
                    kicker={periodoGrupo(reto)}
                    title={reto.nombre}
                    action={esAdmin && (
                        <button onClick={() => setAjustesOpen(true)} aria-label="Ajustes del grupo" className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-k-fill text-k-text2">
                            <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </button>
                    )}
                />

                {/* Mi progreso en este grupo */}
                <Card className="flex items-center gap-5">
                    <RingProgress pct={pct} />
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-k-text">{yo.km.toFixed(1)}</span>
                            <span className="text-[15px] text-k-text2">km</span>
                        </div>
                        <p className="text-[13px] leading-snug text-k-text2">
                            {kmFaltan > 0
                                ? <>Te quedan <span className="font-medium text-k-text">{kmFaltan.toFixed(1)} km</span> para los {reto.objetivo_km} por persona.</>
                                : '¡Has cumplido la meta del grupo! 🎉'}
                        </p>
                    </div>
                </Card>

                {/* Entre todos */}
                <Card className="flex flex-col gap-3 bg-k-accent-soft shadow-none">
                    <p className="text-[13px] font-semibold text-k-accent-ink">Entre todos</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[30px] font-semibold tracking-[-0.025em] tabular-nums text-k-accent-ink">{kmGrupo.toFixed(1)}</span>
                        <span className="text-sm text-k-text2">
                            {reto.objetivo_grupo_km
                                ? `de ${reto.objetivo_grupo_km} km`
                                : `km entre ${ranking.length} ${ranking.length === 1 ? 'persona' : 'personas'}`}
                        </span>
                    </div>
                    {reto.objetivo_grupo_km && (
                        <>
                            <div className="h-[6px] overflow-hidden rounded-full bg-k-surface">
                                <div className="h-full rounded-full bg-k-accent" style={{ width: `${pctGrupo}%` }} />
                            </div>
                            <p className="text-[13px] text-k-text2">
                                {pctGrupo >= 100 ? '¡Meta conjunta conseguida! 🎉' : `${pctGrupo}% de la meta conjunta · ${ranking.length} personas`}
                            </p>
                        </>
                    )}
                </Card>

                {/* Clasificación */}
                <div className="flex flex-col gap-3">
                    <Kicker>Clasificación</Kicker>
                    <ListCard>
                        {ranking.map((m, i) => {
                            const pctM = Math.min(Math.round((m.km / reto.objetivo_km) * 100), 100)
                            const esYo = m.user_id === myUserId
                            return (
                                <div
                                    key={m.user_id}
                                    onClick={() => navigate(`/historial/${m.user_id}?grupo=${id}`)}
                                    className={cn('flex cursor-pointer items-center gap-3 px-4 py-3', i > 0 && 'border-t border-k-sep', esYo && 'bg-k-accent-soft')}
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
                                            <div className="h-full rounded-full" style={{ width: `${pctM}%`, background: esYo ? 'var(--k-accent)' : 'var(--k-text3)' }} />
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

                    {ranking.length > 1 && (
                        <div className="flex items-start gap-2.5 rounded-lg bg-k-accent-soft p-3.5">
                            <IconRanking className="mt-0.5 h-[18px] w-[18px] flex-none text-k-accent-ink" strokeWidth={1.7} />
                            <p className="text-[13px] leading-relaxed text-k-accent-ink">
                                {miPos === 0
                                    ? <>¡Vas primero! Sigue así.</>
                                    : <>Vas {miPos + 1}º, a <span className="font-semibold">{(lider.km - yo.km).toFixed(1)} km</span> de {lider.nombre}.</>}
                            </p>
                        </div>
                    )}
                </div>

                {/* Últimos movimientos */}
                <div className="flex flex-col gap-3">
                    <Kicker>Últimos movimientos</Kicker>
                    <ListCard>
                        {recientes.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-k-text3">Aún no hay actividades</p>
                        ) : recientes.map((act, i) => (
                            <div key={act.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-k-sep')}>
                                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-k-fill">
                                    <IconDeporte deporte={act.deporte} className="h-[18px] w-[18px] text-k-text2" strokeWidth={1.7} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm leading-tight text-k-text">
                                        <span className="font-medium">{act.nombre}</span> · {act.deporte}
                                    </div>
                                    <div className="text-xs text-k-text2">{tiempoRelativo(act.created_at)}</div>
                                </div>
                                <div className="flex-none text-sm font-semibold tabular-nums text-k-text">{Number(act.distancia_km).toFixed(1)} km</div>
                            </div>
                        ))}
                    </ListCard>
                </div>

                {/* Reglas e invitación */}
                <div className="flex flex-col gap-3">
                    <Kicker>El grupo</Kicker>
                    <ListCard>
                        <ListRow first>
                            <span className="text-[15px] text-k-text">Meta por persona</span>
                            <span className="text-[15px] tabular-nums text-k-text2">{reto.objetivo_km} km</span>
                        </ListRow>
                        <ListRow>
                            <span className="text-[15px] text-k-text">Cuentan</span>
                            <span className="truncate text-right text-[15px] text-k-text2">{deportesGrupo(reto)}</span>
                        </ListRow>
                        {cuentoDesde && (
                            <ListRow>
                                <span className="text-[15px] text-k-text">Te cuenta desde</span>
                                <span className="text-[15px] text-k-text2">{fechaCorta(cuentoDesde)}</span>
                            </ListRow>
                        )}
                        <ListRow>
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[15px] text-k-text">Código de invitación</span>
                                <span className="text-[19px] font-semibold tracking-[.18em] tabular-nums text-k-text">{reto.codigo_invitacion}</span>
                            </div>
                            <Button size="sm" variant="outline" className="text-k-accent-ink" onClick={handleCopiarCodigo}>Copiar</Button>
                        </ListRow>
                        {!esAdmin && (
                            <ListRow onClick={handleSalir}>
                                <span className="text-[15px] text-k-danger">Salir del grupo</span>
                                <ChevronRight className="h-4 w-4 text-k-text3" strokeWidth={2} />
                            </ListRow>
                        )}
                    </ListCard>
                </div>
            </div>

            {esAdmin && (
                <GrupoAjustesSheet
                    open={ajustesOpen}
                    onOpenChange={setAjustesOpen}
                    reto={reto}
                    onGuardado={loadData}
                    onEliminado={() => navigate('/grupos', { replace: true })}
                />
            )}
            <NavBar />
        </div>
    )
}
