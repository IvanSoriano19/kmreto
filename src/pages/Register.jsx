import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'

export default function Register() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setLoading(true)
    setError('')
  
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
  
    const { error: perfilError } = await supabase.from('profiles').insert({
      id: data.user.id,
      nombre: nombre.trim(),
    })
  
    setLoading(false)
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6 transition-colors">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏃</div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Crear cuenta</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Únete al reto familiar</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
            required
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
            required
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-green-600 font-medium">
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  )
}