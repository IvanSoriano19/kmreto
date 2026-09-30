import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { ListCard } from '@/components/km/Card'
import { IconDeporte } from '@/components/icons'
import { useAppUI } from '@/context/AppUIContext'
import { cn } from '@/lib/utils'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export default function Historial() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const grupoId = searchParams.get('grupo')
  const { refreshKey } = useAppUI()
  const [myUserId, setMyUserId] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [grupo, setGrupo] = useState(null)
  const [actividades, setActividades] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [totalKm, setTotalKm] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId, grupoId, refreshKey])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setMyUserId(user.id)

    const targetId = userId || user.id

    // Con ?grupo= (desde la clasificación) solo las que cuentan en ese grupo;
    // sin él, todas las actividades de la persona.
    const consulta = grupoId
      ? supabase.from('actividades_reto').select('*').eq('reto_id', grupoId)
      : supabase.from('actividades').select('*')

    const [{ data: prof }, { data: acts }, { data: retoData }] = await Promise.all([
      supabase.from('profiles').select().eq('id', targetId).single(),
      consulta.eq('user_id', targetId).order('fecha', { ascending: false }),
      grupoId ? supabase.from('retos').select('nombre').eq('id', grupoId).maybeSingle() : Promise.resolve({ data: null }),
    ])

    setPerfil(prof)
    setGrupo(retoData)
    setActividades(acts || [])
    setTotalKm(acts?.reduce((sum, a) => sum + Number(a.distancia_km), 0) || 0)
    setLoading(false)
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Eliminar esta actividad?')) return
    const updated = actividades.filter(a => a.id !== id)
    setActividades(updated)
    setTotalKm(updated.reduce((sum, a) => sum + Number(a.distancia_km), 0))
    await supabase.from('actividades').delete().eq('id', id)
  }

  function agruparPorMes(acts) {
    const grupos = {}
    acts.forEach(a => {
      const fecha = new Date(a.fecha + 'T00:00:00')
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(a)
    })
    return grupos
  }

  const filtradas = filtro === 'Todos' ? actividades : actividades.filter(a => a.deporte === filtro)
  const agrupadas = agruparPorMes(filtradas)
  const deportesUsados = ['Todos', ...new Set(actividades.map(a => a.deporte))]
  const esMiPerfil = !userId || userId === myUserId

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-k-bg">
      <div className="text-k-text3 text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
      <div className="flex flex-col gap-5 pb-8 pt-8 md:mx-auto md:max-w-2xl">
        <div className="flex flex-col gap-0.5 px-4 md:px-6">
          {!esMiPerfil && (
            <button onClick={() => navigate(-1)} className="mb-1 flex items-center gap-0.5 self-start text-k-accent-ink">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              <span className="text-[15px]">Atrás</span>
            </button>
          )}
          <div className="text-[13px] font-semibold text-k-text2">
            {actividades.length} actividades · {totalKm.toFixed(1)} km{grupo && ` en ${grupo.nombre}`}
          </div>
          <div className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-k-text">
            {esMiPerfil ? 'Historial' : perfil?.nombre}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 md:px-6">
          {deportesUsados.map(d => (
            <button
              key={d}
              onClick={() => setFiltro(d)}
              className={cn(
                'flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium',
                filtro === d
                  ? 'bg-k-accent-soft text-k-accent-ink'
                  : 'border border-k-sep text-k-text2'
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4.5">
          {Object.keys(agrupadas).length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-k-text3 md:px-6">
              No hay actividades {filtro !== 'Todos' ? `de ${filtro}` : ''}
            </div>
          ) : (
            Object.entries(agrupadas).map(([mes, acts]) => {
              const kmMes = acts.reduce((sum, a) => sum + Number(a.distancia_km), 0)
              return (
                <div key={mes} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 px-4 md:px-6">
                    <p className="whitespace-nowrap text-[13px] font-semibold capitalize text-k-text2">{mes}</p>
                    <div className="h-px flex-1 bg-k-sep" />
                    <p className="text-xs tabular-nums text-k-text2">{kmMes.toFixed(1)} km</p>
                  </div>
                  <ListCard className="mx-4 md:mx-6">
                    {acts.map((act, i) => (
                      <div key={act.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-k-sep')}>
                        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-k-fill">
                          <IconDeporte deporte={act.deporte} className="h-[19px] w-[19px] text-k-text" strokeWidth={1.6} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-k-text">{act.deporte}</div>
                          <div className="truncate text-xs text-k-text2">
                            {act.nota ? `${act.nota} · ` : ''}
                            {new Date(act.fecha + 'T00:00:00').getDate()} {MESES[new Date(act.fecha + 'T00:00:00').getMonth()]}
                          </div>
                        </div>
                        <div className="flex-none text-sm font-semibold tabular-nums text-k-text">{Number(act.distancia_km).toFixed(1)} km</div>
                        {esMiPerfil && (
                          <button onClick={() => handleEliminar(act.id)} className="flex-none p-1 text-k-text3">
                            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                          </button>
                        )}
                      </div>
                    ))}
                  </ListCard>
                </div>
              )
            })
          )}
        </div>
      </div>
      <NavBar />
    </div>
  )
}
