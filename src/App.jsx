import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './SupabaseClient'
import { AppUIProvider } from './context/AppUIContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Ranking from './pages/Ranking'
import Historial from './pages/Historial'
import Perfil from './pages/Perfil'
import Onboarding from './pages/Onboarding'
import DesktopSidebar from './components/DesktopSidebar'
import NuevaActividadSheet from './components/NuevaActividadSheet'
import Toast from './components/Toast'

function PrivateRoute({ session, children }) {
  return session ? children : <Navigate to="/login" />
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
              {/* Sidebar lateral — solo escritorio, solo con sesión */}
              {session && <DesktopSidebar />}

              {/* Contenido principal */}
              <main className={`flex-1 flex flex-col min-w-0 ${session ? 'md:ml-56' : ''}`}>
                <Routes>
                  <Route path="/login"    element={!session ? <Login />    : <Navigate to="/" />} />
                  <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
                  <Route path="/"               element={<PrivateRoute session={session}><Dashboard /></PrivateRoute>} />
                  <Route path="/nueva-actividad" element={<Navigate to="/" replace />} />
                  <Route path="/ranking"         element={<PrivateRoute session={session}><Ranking /></PrivateRoute>} />
                  <Route path="/historial/:userId?" element={<PrivateRoute session={session}><Historial /></PrivateRoute>} />
                  <Route path="/perfil"           element={<PrivateRoute session={session}><Perfil /></PrivateRoute>} />
                  <Route path="/onboarding"       element={<PrivateRoute session={session}><Onboarding /></PrivateRoute>} />
                </Routes>
              </main>

              {session && <NuevaActividadSheet />}
            </div>
          )}
        </BrowserRouter>
        <Toast />
      </div>
    </AppUIProvider>
  )
}
