import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/SupabaseClient'
import { useAppUI } from '@/context/AppUIContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetCloseButton } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEPORTES_LIST } from '@/utils'
import { DEPORTE_ICONOS } from '@/components/icons'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ATAJOS = ['5', '10', '21,1', '42,2']

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

function hoyLegible() {
  return new Date().toLocaleDateString('es-ES', { weekday: undefined, day: 'numeric', month: 'short' })
}

export default function NuevaActividadSheet() {
  const { sheetOpen, closeSheet, notifySaved, showToast } = useAppUI()
  const [deporte, setDeporte] = useState('Correr')
  const [dist, setDist] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [nota, setNota] = useState('')
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const km = parseFloat(String(dist).replace(',', '.'))
  const distOk = km > 0

  function reset() {
    setDeporte('Correr'); setDist(''); setFecha(hoyISO()); setNota(''); setFoto(null); setFotoPreview(null)
  }

  function handleClose(open) {
    if (!open && !loading) { closeSheet(); reset() }
  }

  async function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true })
    setFoto(compressed)
    setFotoPreview(URL.createObjectURL(compressed))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!distOk) { showToast('Introduce una distancia válida'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: miembro } = await supabase
      .from('reto_miembros').select('reto_id').eq('user_id', user.id).limit(1).single()

    let foto_url = null
    if (foto) {
      const fileName = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('fotos-actividades').upload(fileName, foto)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('fotos-actividades').getPublicUrl(fileName)
        foto_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('actividades').insert({
      user_id: user.id,
      reto_id: miembro?.reto_id,
      deporte,
      distancia_km: km,
      fecha,
      nota: nota || null,
      foto_url,
    })

    setLoading(false)
    if (error) { showToast('Error al guardar la actividad'); return }

    const dLabel = String(dist).trim()
    closeSheet()
    reset()
    notifySaved()
    showToast(`Actividad guardada · ${dLabel} km`)
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nueva actividad</SheetTitle>
          <SheetCloseButton />
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-5 pb-9 pt-1">
          {/* Distancia */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-center gap-1.5">
              <input
                value={dist}
                onChange={e => setDist(e.target.value)}
                placeholder="0,0"
                inputMode="decimal"
                autoFocus
                className="w-[150px] bg-transparent text-right text-[62px] font-semibold tracking-[-0.04em] text-k-text outline-none tabular-nums placeholder:text-k-text3"
              />
              <span className="text-[22px] text-k-text2">km</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {ATAJOS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDist(q)}
                  className="whitespace-nowrap rounded-full border border-k-sep px-3.5 py-1.5 text-[13px] tabular-nums text-k-text"
                >
                  {q} km
                </button>
              ))}
            </div>
          </div>

          {/* Deporte */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[13px] font-semibold text-k-text2">Deporte</p>
            <div className="grid grid-cols-3 gap-2">
              {DEPORTES_LIST.map(d => {
                const Icon = DEPORTE_ICONOS[d]
                const active = deporte === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeporte(d)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-medium transition-colors',
                      active
                        ? 'border-k-accent bg-k-accent-soft text-k-accent-ink'
                        : 'border-k-sep bg-transparent text-k-text2'
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fecha · nota · foto */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
            <label className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-k-text">Fecha</span>
              <span className="relative text-[15px] text-k-text2">
                {fecha === hoyISO() ? `Hoy, ${hoyLegible()}` : new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  max={hoyISO()}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </span>
            </label>
            <div className="h-px bg-k-sep" />
            <Input
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Nota (opcional)"
              className="h-auto py-3.5"
            />
            <div className="h-px bg-k-sep" />
            {fotoPreview ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <img src={fotoPreview} alt="" className="h-10 w-10 flex-none rounded-lg object-cover" />
                <span className="flex-1 truncate text-[14px] text-k-text2">Foto añadida</span>
                <button type="button" onClick={() => { setFoto(null); setFotoPreview(null) }} className="flex-none text-k-text3">
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2.5 px-4 py-3.5">
                <Camera className="h-5 w-5 text-k-accent-ink" strokeWidth={1.6} />
                <span className="text-[15px] text-k-accent-ink">Añadir una foto</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
              </label>
            )}
          </div>

          <Button type="submit" size="lg" disabled={!distOk || loading} variant={distOk ? 'default' : 'secondary'} className="justify-start text-left disabled:opacity-100">
            {loading ? 'Guardando…' : distOk ? `Guardar ${dist} km de ${deporte.toLowerCase()}` : 'Guardar'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
