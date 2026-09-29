import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ListRowLink } from '@/components/km/ListRow'
import { IconCrear, IconUnirse } from '@/components/icons'

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="mb-1 flex items-center gap-0.5 self-start text-[15px] text-k-accent-ink">
      <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
      Atrás
    </button>
  )
}

function CrearReto({ onBack }) {
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [objetivoKm, setObjetivoKm] = useState(1000)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function generarCodigo() {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    async function handleCrear(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        const { data: perfil } = await supabase
            .from('profiles').select().eq('id', user.id).single()

        if (!perfil) {
            await supabase.from('profiles').insert({
                id: user.id,
                nombre: user.email.split('@')[0],
            })
        }

        const { data: retoExistente } = await supabase
            .from('retos').select()
            .eq('creado_por', user.id)
            .order('created_at', { ascending: false })
            .limit(1).single()

        let retoId

        if (retoExistente) {
            retoId = retoExistente.id
        } else {
            const { data: reto, error: retoError } = await supabase
                .from('retos')
                .insert({
                    nombre,
                    objetivo_km: objetivoKm,
                    year: new Date().getFullYear(),
                    codigo_invitacion: generarCodigo(),
                    creado_por: user.id,
                })
                .select().single()

            if (retoError) { setError(retoError.message); setLoading(false); return }
            retoId = reto.id
        }

        const { data: miembroExistente } = await supabase
            .from('reto_miembros').select()
            .eq('reto_id', retoId).eq('user_id', user.id).single()

        if (!miembroExistente) {
            await supabase.from('reto_miembros').insert({ reto_id: retoId, user_id: user.id })
        }

        setLoading(false)
        navigate('/')
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-5">
            <BackButton onClick={onBack} />
            <div className="flex flex-col gap-2">
                <h2 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-k-text">Crear el reto</h2>
                <p className="text-[15px] leading-relaxed text-k-text2">Puedes cambiar el nombre y la meta más adelante.</p>
            </div>
            <form onSubmit={handleCrear} className="flex flex-col gap-2.5">
                <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
                    <Input
                        placeholder="Ej: Familia García 2026"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        required
                    />
                    <div className="h-px bg-k-sep" />
                    <div className="flex items-center px-4">
                        <input
                            type="number"
                            value={objetivoKm}
                            onChange={e => setObjetivoKm(Number(e.target.value))}
                            min="1"
                            required
                            className="h-[50px] flex-1 bg-transparent text-[15px] text-k-text outline-none"
                        />
                        <span className="text-[13px] text-k-text2">km por persona</span>
                    </div>
                </div>
                {error && <p className="text-[13px] text-k-danger">{error}</p>}
                <Button type="submit" size="lg" disabled={loading} className="mt-1 justify-start">
                    {loading ? 'Creando…' : 'Crear y entrar'}
                </Button>
            </form>
        </div>
    )
}

function UnirseReto({ onBack }) {
    const navigate = useNavigate()
    const [codigo, setCodigo] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const refs = useRef([])

    function setDigit(i, val) {
        const chars = codigo.padEnd(6, ' ').split('')
        chars[i] = val.slice(-1).toUpperCase()
        const next = chars.join('').replace(/\s+$/, '')
        setCodigo(next)
        if (val && i < 5) refs.current[i + 1]?.focus()
    }

    function handleKeyDown(i, e) {
        if (e.key === 'Backspace' && !codigo[i] && i > 0) refs.current[i - 1]?.focus()
    }

    async function handleUnirse(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        const { data: perfil } = await supabase
            .from('profiles').select().eq('id', user.id).single()

        if (!perfil) {
            await supabase.from('profiles').insert({
                id: user.id,
                nombre: user.email.split('@')[0],
            })
        }

        const { data: reto, error: retoError } = await supabase
            .from('retos').select()
            .eq('codigo_invitacion', codigo.toUpperCase()).single()

        if (retoError || !reto) {
            setError('Código no encontrado, revísalo')
            setLoading(false)
            return
        }

        const { error: memberError } = await supabase
            .from('reto_miembros')
            .insert({ reto_id: reto.id, user_id: user.id })

        if (memberError) {
            setError('Ya eres miembro de este reto')
            setLoading(false)
            return
        }

        setLoading(false)
        navigate('/')
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-5">
            <BackButton onClick={onBack} />
            <div className="flex flex-col gap-2">
                <h2 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-k-text">Tu código</h2>
                <p className="text-[15px] leading-relaxed text-k-text2">Pídeselo a quien creó el reto.</p>
            </div>
            <form onSubmit={handleUnirse} className="flex flex-col gap-4">
                <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <input
                            key={i}
                            ref={el => (refs.current[i] = el)}
                            value={codigo[i] || ''}
                            onChange={e => setDigit(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            maxLength={1}
                            className="h-[52px] flex-1 rounded-xl border border-k-sep bg-k-surface text-center text-[22px] font-semibold tabular-nums text-k-text outline-none focus:border-k-accent"
                        />
                    ))}
                </div>
                {error && <p className="text-[13px] text-k-danger">{error}</p>}
                <Button type="submit" size="lg" disabled={loading || codigo.length < 6} className="justify-start">
                    {loading ? 'Buscando…' : 'Unirme'}
                </Button>
            </form>
        </div>
    )
}

export default function Onboarding() {
    const location = useLocation()
    const [vista, setVista] = useState(location.state?.vista || 'menu')
    const [nombre, setNombre] = useState('')

    useEffect(() => {
        async function loadNombre() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: prof } = await supabase.from('profiles').select('nombre').eq('id', user.id).single()
            setNombre(prof?.nombre?.split(' ')[0] || '')
        }
        loadNombre()
    }, [])

    return (
        <div className="flex min-h-screen flex-col justify-center bg-k-bg px-6 transition-colors">
            {vista === 'menu' && (
                <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-k-text">
                            {nombre ? `Hola, ${nombre}` : '¡Bienvenido!'}
                        </h2>
                        <p className="text-[15px] leading-relaxed text-k-text2">Un reto es el grupo con el que sumas kilómetros durante el año.</p>
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
                        <ListRowLink icon={IconCrear} title="Crear un reto" subtitle="Tú pones la meta y compartes el código" onClick={() => setVista('crear')} />
                        <div className="h-px bg-k-sep" />
                        <ListRowLink icon={IconUnirse} title="Unirme con un código" subtitle="Seis caracteres que te pasa tu familia" onClick={() => setVista('unirse')} />
                    </div>
                </div>
            )}
            {vista === 'crear'  && <div className="mx-auto flex w-full justify-center"><CrearReto  onBack={() => setVista('menu')} /></div>}
            {vista === 'unirse' && <div className="mx-auto flex w-full justify-center"><UnirseReto onBack={() => setVista('menu')} /></div>}
        </div>
    )
}
