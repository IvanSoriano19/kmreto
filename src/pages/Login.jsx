import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconTrail } from '@/components/icons'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-k-bg px-6 transition-colors">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-k-accent">
            <IconTrail className="h-[26px] w-[26px] text-white" strokeWidth={1.8} />
          </div>
          <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-k-text">Senda</h1>
          <p className="text-[15px] leading-relaxed text-k-text2">Suma y sigue. Los kilómetros de tu grupo, en un solo sitio.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
          <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="h-px bg-k-sep" />
            <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-[13px] text-k-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="mt-1 justify-start">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={handleGoogle} className="justify-start gap-2.5 font-medium">
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </Button>
        </form>

        <p className="mt-6 text-[13px] text-k-text2">
          ¿Nuevo por aquí?{' '}
          <button onClick={() => navigate('/register')} className="font-medium text-k-accent-ink">
            Crear una cuenta
          </button>
        </p>
      </div>
    </div>
  )
}
