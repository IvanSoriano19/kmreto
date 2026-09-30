import { useState } from 'react'
import { supabase } from '@/SupabaseClient'
import { useAppUI } from '@/context/AppUIContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetCloseButton } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const MIN_LONGITUD = 6

// Traduce los códigos de error de Supabase Auth a mensajes legibles.
function mensajeError(error) {
  switch (error.code) {
    case 'same_password': return 'La nueva contraseña tiene que ser distinta de la actual'
    case 'weak_password': return 'La contraseña es demasiado débil'
    case 'reauthentication_needed': return 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiarla'
    default: return 'No se ha podido cambiar la contraseña'
  }
}

// Formulario de nueva contraseña. Lo usan la hoja de Perfil y la pantalla a la
// que llega el enlace de recuperación del correo.
export function NuevaContrasenaForm({ onDone, className = '' }) {
  const { showToast } = useAppUI()
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const valida = nueva.length >= MIN_LONGITUD && nueva === repetir

  async function handleSubmit(e) {
    e.preventDefault()
    if (nueva.length < MIN_LONGITUD) { setError(`Mínimo ${MIN_LONGITUD} caracteres`); return }
    if (nueva !== repetir) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password: nueva })
    setLoading(false)

    if (error) { setError(mensajeError(error)); return }
    showToast('Contraseña actualizada')
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
        <Input
          type="password"
          placeholder="Nueva contraseña"
          autoComplete="new-password"
          autoFocus
          value={nueva}
          onChange={e => setNueva(e.target.value)}
        />
        <div className="h-px bg-k-sep" />
        <Input
          type="password"
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          value={repetir}
          onChange={e => setRepetir(e.target.value)}
        />
      </div>
      <p className={`text-[13px] ${error ? 'text-k-danger' : 'text-k-text2'}`}>
        {error || `Mínimo ${MIN_LONGITUD} caracteres.`}
      </p>
      <Button type="submit" size="lg" disabled={!valida || loading} variant={valida ? 'default' : 'secondary'} className="mt-1 justify-start disabled:opacity-100">
        {loading ? 'Guardando…' : 'Guardar contraseña'}
      </Button>
    </form>
  )
}

export default function CambiarContrasenaSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Cambiar contraseña</SheetTitle>
          <SheetCloseButton />
        </SheetHeader>
        {/* Se desmonta al cerrar, así el formulario vuelve vacío la próxima vez */}
        {open && <NuevaContrasenaForm onDone={() => onOpenChange(false)} className="px-5 pb-9 pt-1" />}
      </SheetContent>
    </Sheet>
  )
}
