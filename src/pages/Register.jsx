import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconTrail } from '@/components/icons'

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

    // El perfil lo crea un trigger de la base de datos con este nombre.
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre: nombre.trim() } } })
    if (error) { setError(error.message); setLoading(false); return }

    setLoading(false)
    navigate('/grupos/nuevo')
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-k-bg px-6 transition-colors">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-k-accent">
            <IconTrail className="h-[26px] w-[26px] text-white" strokeWidth={1.8} />
          </div>
          <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-k-text">Crear cuenta</h1>
          <p className="text-[15px] leading-relaxed text-k-text2">Únete al reto familiar.</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-2.5">
          <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
            <Input type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
            <div className="h-px bg-k-sep" />
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="h-px bg-k-sep" />
            <Input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-[13px] text-k-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="mt-1 justify-start">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-[13px] text-k-text2">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="font-medium text-k-accent-ink">
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  )
}
