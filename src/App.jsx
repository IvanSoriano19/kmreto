import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { supabase } from './SupabaseClient'
import { AppUIProvider } from './context/AppUIContext'
import { useRecuperacion, marcarRecuperacion, limpiarRecuperacion } from './lib/recuperacion'
import Login from './pages/Login'
import Register from './pages/Register'
import Inicio from './pages/Inicio'
import Grupos from './pages/Grupos'
import Grupo from './pages/Grupo'
import NuevoGrupo from './pages/NuevoGrupo'
import Historial from './pages/Historial'
import Perfil from './pages/Perfil'
import RestablecerContrasena from './pages/RestablecerContrasena'
import DesktopSidebar from './components/DesktopSidebar'
import NuevaActividadSheet from './components/NuevaActividadSheet'
import Toast from './components/Toast'

// Cada grupo de rutas tiene su guardián. Deciden solo con la sesión y el estado
// de recuperación, así que da igual si se llega escribiendo la URL a mano.

// Login y registro: solo sin sesión.
function RutasInvitado({ session, recuperando }) {
  if (session) return <Navigate to={recuperando ? '/restablecer-contrasena' : '/'} replace />
  return <Outlet />
}

// Pantalla de nueva contraseña: solo con la sesión que abre el enlace del correo.
function RutaRecuperacion({ session, recuperando }) {
  if (!session) return <Navigate to="/login" replace />
  if (!recuperando) return <Navigate to="/" replace />
  return <Outlet />
}

// La app: sesión normal. Una sesión de recuperación no entra hasta que se
// elige la nueva contraseña. La barra lateral y la hoja de nueva actividad
// viven aquí para que nunca aparezcan fuera de la app.
function RutasPrivadas({ session, recuperando }) {
  if (!session) return <Navigate to="/login" replace />
  if (recuperando) return <Navigate to="/restablecer-contrasena" replace />
  return (
    <>
      <DesktopSidebar />
      <main className="flex-1 flex flex-col min-w-0 md:ml-56">
        <Outlet />
      </main>
      <NuevaActividadSheet />
    </>
  )
}

function SinBarras() {
  return (
    <main className="flex-1 flex flex-col min-w-0">
      <Outlet />
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const recuperando = useRecuperacion()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') marcarRecuperacion()
      // Sin sesión no hay recuperación que terminar (cierre de sesión, enlace caducado…).
      if (!session) limpiarRecuperacion()
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AppUIProvider>
      <div className="flex-1 flex flex-col bg-k-bg">
        <BrowserRouter>
          {session === undefined ? (
            <div className="flex items-center justify-center h-screen">
              <div className="text-k-text3 text-sm">Cargando...</div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-screen">
              <Routes>
                <Route element={<SinBarras />}>
                  <Route element={<RutasInvitado session={session} recuperando={recuperando} />}>
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />
                  </Route>
                  <Route element={<RutaRecuperacion session={session} recuperando={recuperando} />}>
                    <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
                  </Route>
                </Route>

                <Route element={<RutasPrivadas session={session} recuperando={recuperando} />}>
                  <Route path="/"                   element={<Inicio />} />
                  <Route path="/grupos"             element={<Grupos />} />
                  <Route path="/grupos/nuevo"       element={<NuevoGrupo />} />
                  <Route path="/grupos/:id"         element={<Grupo />} />
                  <Route path="/historial/:userId?" element={<Historial />} />
                  <Route path="/perfil"             element={<Perfil />} />
                  {/* Direcciones antiguas */}
                  <Route path="/ranking"            element={<Navigate to="/grupos" replace />} />
                  <Route path="/onboarding"         element={<Navigate to="/grupos/nuevo" replace />} />
                  <Route path="/nueva-actividad"    element={<Navigate to="/" replace />} />
                </Route>

                {/* Cualquier otra URL vuelve al inicio, y desde ahí los guardianes deciden */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          )}
        </BrowserRouter>
        <Toast />
      </div>
    </AppUIProvider>
  )
}
