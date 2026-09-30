import { useState } from 'react'
import { supabase } from '@/SupabaseClient'
import { useAppUI } from '@/context/AppUIContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetCloseButton } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEPORTES_LIST } from '@/utils'
import { cn } from '@/lib/utils'

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

function Fila({ label, children, first = false }) {
  return (
    <label className={cn('flex min-h-[50px] items-center justify-between gap-3 px-4', !first && 'border-t border-k-sep')}>
      <span className="flex-none text-[15px] text-k-text">{label}</span>
      {children}
    </label>
  )
}

const inputDerecha = 'min-w-0 bg-transparent text-right text-[15px] text-k-text outline-none placeholder:text-k-text3'

// Reglas de un grupo: nombre, metas, deportes que cuentan y fechas. Lo usan la
// pantalla de crear grupo y los ajustes del grupo.
export function ReglasGrupoForm({ inicial = {}, submitLabel, onSubmit, children }) {
  const [nombre, setNombre] = useState(inicial.nombre || '')
  const [objetivo, setObjetivo] = useState(String(inicial.objetivo_km || 1000))
  const [objetivoGrupo, setObjetivoGrupo] = useState(inicial.objetivo_grupo_km ? String(inicial.objetivo_grupo_km) : '')
  const [deportes, setDeportes] = useState(inicial.deportes || [])
  const [fechaInicio, setFechaInicio] = useState(inicial.fecha_inicio || hoyISO())
  const [fechaFin, setFechaFin] = useState(inicial.fecha_fin || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleDeporte(d) {
    setDeportes(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const meta = parseInt(objetivo, 10)
    const metaGrupo = objetivoGrupo ? parseInt(objetivoGrupo, 10) : null
    if (!nombre.trim()) { setError('Ponle un nombre al grupo'); return }
    if (!(meta > 0)) { setError('La meta por persona tiene que ser mayor que 0'); return }
    if (objetivoGrupo && !(metaGrupo > 0)) { setError('La meta conjunta tiene que ser mayor que 0'); return }
    if (fechaFin && fechaFin < fechaInicio) { setError('La fecha de fin no puede ser anterior a la de inicio'); return }

    setLoading(true)
    setError('')
    const mensaje = await onSubmit({
      nombre: nombre.trim(),
      objetivo_km: meta,
      objetivo_grupo_km: metaGrupo,
      // Ninguno marcado = cuentan todos los deportes.
      deportes: deportes.length ? DEPORTES_LIST.filter(d => deportes.includes(d)) : null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
    })
    setLoading(false)
    if (mensaje) setError(mensaje)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
        <Input placeholder="Nombre del grupo, p. ej. Club Runners 2026" value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-k-text2">Metas</p>
        <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
          <Fila label="Por persona" first>
            <span className="flex items-baseline gap-1.5">
              <input type="number" inputMode="numeric" min="1" value={objetivo} onChange={e => setObjetivo(e.target.value)} className={cn(inputDerecha, 'w-20 tabular-nums')} />
              <span className="text-[13px] text-k-text2">km</span>
            </span>
          </Fila>
          <Fila label="Entre todos">
            <span className="flex items-baseline gap-1.5">
              <input type="number" inputMode="numeric" min="1" placeholder="Opcional" value={objetivoGrupo} onChange={e => setObjetivoGrupo(e.target.value)} className={cn(inputDerecha, 'w-24 tabular-nums')} />
              <span className="text-[13px] text-k-text2">km</span>
            </span>
          </Fila>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-k-text2">Deportes que cuentan</p>
        <div className="flex flex-wrap gap-2">
          {DEPORTES_LIST.map(d => {
            const activo = deportes.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDeporte(d)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-medium',
                  activo ? 'bg-k-accent-soft text-k-accent-ink' : 'border border-k-sep text-k-text2'
                )}
              >
                {d}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-k-text2">{deportes.length ? 'Solo suman los marcados.' : 'Sin marcar ninguno, cuentan todos.'}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-k-text2">Fechas</p>
        <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
          <Fila label="Empieza" first>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className={inputDerecha} />
          </Fila>
          <Fila label="Termina">
            <span className="flex items-center gap-2">
              <input type="date" value={fechaFin} min={fechaInicio} onChange={e => setFechaFin(e.target.value)} className={inputDerecha} />
              {fechaFin && (
                <button type="button" onClick={() => setFechaFin('')} className="text-[13px] text-k-accent-ink">Quitar</button>
              )}
            </span>
          </Fila>
        </div>
        <p className="text-xs text-k-text2">A cada persona le cuenta desde el día en que se une.</p>
      </div>

      {error && <p className="text-[13px] text-k-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={loading} className="justify-start">
        {loading ? 'Guardando…' : submitLabel}
      </Button>
      {children}
    </form>
  )
}

export default function GrupoAjustesSheet({ open, onOpenChange, reto, onGuardado, onEliminado }) {
  const { showToast } = useAppUI()

  async function guardar(cambios) {
    const { error } = await supabase.from('retos').update(cambios).eq('id', reto.id)
    if (error) return 'No se han podido guardar los cambios'
    onOpenChange(false)
    showToast('Grupo actualizado')
    onGuardado()
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar "${reto.nombre}" para todos sus miembros? Las actividades de cada uno no se borran.`)) return
    const { error } = await supabase.from('retos').delete().eq('id', reto.id)
    if (error) { showToast('No se ha podido eliminar el grupo'); return }
    onOpenChange(false)
    showToast('Grupo eliminado')
    onEliminado()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Ajustes del grupo</SheetTitle>
          <SheetCloseButton />
        </SheetHeader>
        {/* Se desmonta al cerrar para que vuelva a abrir con los valores guardados */}
        {open && (
          <div className="px-5 pb-9 pt-1">
            <ReglasGrupoForm inicial={reto} submitLabel="Guardar cambios" onSubmit={guardar}>
              <button type="button" onClick={eliminar} className="self-start text-[13px] text-k-danger">
                Eliminar grupo
              </button>
            </ReglasGrupoForm>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
