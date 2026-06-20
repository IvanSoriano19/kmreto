import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './SupabaseClient'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NuevaActividad from './pages/NuevaActividad'
import Ranking from './pages/Ranking'
import Historial from './pages/Historial'
import Perfil from './pages/Perfil'
import Onboarding from './pages/Onboarding'

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
    /* Fondo exterior visible a los lados en tablet/desktop */
    <div className="flex-1 bg-gray-200 dark:bg-gray-950 flex flex-col">
      {/* Contenedor centrado tipo "móvil" — crece hasta llenar la pantalla */}
      <div className="relative mx-auto w-full max-w-md flex-1 bg-gray-50 dark:bg-gray-900 shadow-xl flex flex-col">
        <BrowserRouter>
          {session === undefined ? (
            <div className="flex items-center justify-center h-screen">
              <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
          ) : (
            <Routes>
              <Route path="/login"    element={!session ? <Login />    : <Navigate to="/" />} />
              <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
              <Route path="/"               element={<PrivateRoute session={session}><Dashboard /></PrivateRoute>} />
              <Route path="/nueva-actividad" element={<PrivateRoute session={session}><NuevaActividad /></PrivateRoute>} />
              <Route path="/ranking"         element={<PrivateRoute session={session}><Ranking /></PrivateRoute>} />
              <Route path="/historial/:userId?" element={<PrivateRoute session={session}><Historial /></PrivateRoute>} />
              <Route path="/perfil"           element={<PrivateRoute session={session}><Perfil /></PrivateRoute>} />
              <Route path="/onboarding"       element={<PrivateRoute session={session}><Onboarding /></PrivateRoute>} />
            </Routes>
          )}
        </BrowserRouter>
      </div>
    </div>
  )
}
