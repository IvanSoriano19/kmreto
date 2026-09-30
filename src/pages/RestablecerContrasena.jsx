import { supabase } from '@/SupabaseClient'
import { NuevaContrasenaForm } from '@/components/CambiarContrasenaSheet'
import { limpiarRecuperacion } from '@/lib/recuperacion'

// Pantalla a la que llega el enlace de "¿Has olvidado tu contraseña?".
// El enlace ya ha iniciado sesión, pero el resto de la app sigue bloqueado
// (ver RutasPrivadas en App.jsx) hasta que se guarda la nueva contraseña.
export default function RestablecerContrasena() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-k-bg px-6 transition-colors">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-k-text">Nueva contraseña</h1>
          <p className="text-[15px] leading-relaxed text-k-text2">Elige la contraseña con la que entrarás a partir de ahora.</p>
        </div>
        {/* Al limpiar la marca, los guardianes de rutas llevan al inicio */}
        <NuevaContrasenaForm onDone={limpiarRecuperacion} />
        <button onClick={() => supabase.auth.signOut()} className="mt-6 text-[13px] text-k-text2">
          Cancelar y cerrar sesión
        </button>
      </div>
    </div>
  )
}
