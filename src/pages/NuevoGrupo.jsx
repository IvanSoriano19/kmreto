import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../SupabaseClient'
import { Button } from '@/components/ui/button'
import { ListRowLink } from '@/components/km/ListRow'
import { IconCrear, IconUnirse } from '@/components/icons'
import { ReglasGrupoForm } from '@/components/GrupoAjustesSheet'
import { useAppUI } from '@/context/AppUIContext'
import { generarCodigo } from '@/lib/grupos'

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="mb-1 flex items-center gap-0.5 self-start text-[15px] text-k-accent-ink">
      <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
      Atrás
    </button>
  )
}

function CrearGrupo({ onBack }) {
    const navigate = useNavigate()
    const { notifySaved } = useAppUI()

    async function crear(reglas) {
        const { data: { user } } = await supabase.auth.getUser()

        // El código es único; si coincide con otro (muy raro), se prueba otro.
        let reto = null
        for (let intento = 0; intento < 3 && !reto; intento++) {
            const { data, error } = await supabase
                .from('retos')
                .insert({ ...reglas, codigo_invitacion: generarCodigo(), creado_por: user.id })
                .select()
                .single()
            if (data) reto = data
            else if (error?.code !== '23505') return 'No se ha podido crear el grupo'
        }
        if (!reto) return 'No se ha podido crear el grupo'

        const { error: errorMiembro } = await supabase.from('reto_miembros').insert({ reto_id: reto.id, user_id: user.id })
        if (errorMiembro) return 'El grupo se ha creado, pero no se ha podido añadirte'

        notifySaved()
        navigate(`/grupos/${reto.id}`, { replace: true })
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-5">
            <BackButton onClick={onBack} />
            <div className="flex flex-col gap-2">
                <h2 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-k-text">Crear un grupo</h2>
                <p className="text-[15px] leading-relaxed text-k-text2">Podrás cambiar las reglas más adelante desde los ajustes del grupo.</p>
            </div>
            <ReglasGrupoForm submitLabel="Crear y entrar" onSubmit={crear} />
        </div>
    )
}

function UnirseGrupo({ onBack }) {
    const navigate = useNavigate()
    const { notifySaved } = useAppUI()
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

        // La búsqueda por código la hace la base de datos: sin ser miembro no se
        // pueden leer los grupos.
        const { data: retoId, error: rpcError } = await supabase.rpc('unirse_con_codigo', { codigo })
        setLoading(false)

        if (rpcError) {
            setError(rpcError.message?.includes('codigo_no_encontrado') ? 'Código no encontrado, revísalo' : 'No se ha podido entrar en el grupo')
            return
        }
        notifySaved()
        navigate(`/grupos/${retoId}`, { replace: true })
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-5">
            <BackButton onClick={onBack} />
            <div className="flex flex-col gap-2">
                <h2 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-k-text">Tu código</h2>
                <p className="text-[15px] leading-relaxed text-k-text2">Pídeselo a alguien del grupo. Tus actividades contarán desde hoy.</p>
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
                            className="h-[52px] min-w-0 flex-1 rounded-xl border border-k-sep bg-k-surface text-center text-[22px] font-semibold tabular-nums text-k-text outline-none focus:border-k-accent"
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

export default function NuevoGrupo() {
    const location = useLocation()
    const navigate = useNavigate()
    const [vista, setVista] = useState(location.state?.vista || 'menu')

    // Si se entró directo a crear o unirse, "Atrás" vuelve a donde se estaba
    // (o a Grupos si se abrió la URL sin historial previo).
    const salir = () => (location.key !== 'default' ? navigate(-1) : navigate('/grupos'))
    const volver = location.state?.vista ? salir : () => setVista('menu')

    return (
        <div className="flex min-h-screen flex-col justify-center bg-k-bg px-6 py-10 transition-colors">
            {vista === 'menu' && (
                <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                    <BackButton onClick={salir} />
                    <div className="flex flex-col gap-2">
                        <h2 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-k-text">Nuevo grupo</h2>
                        <p className="text-[15px] leading-relaxed text-k-text2">Cada actividad que registres contará en todos tus grupos a la vez, con las reglas de cada uno.</p>
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-lg border border-k-sep bg-k-surface">
                        <ListRowLink icon={IconCrear} title="Crear un grupo" subtitle="Tú pones las reglas y compartes el código" onClick={() => setVista('crear')} />
                        <div className="h-px bg-k-sep" />
                        <ListRowLink icon={IconUnirse} title="Unirme con un código" subtitle="Seis caracteres que te pasa el grupo" onClick={() => setVista('unirse')} />
                    </div>
                </div>
            )}
            {vista === 'crear'  && <div className="mx-auto flex w-full justify-center"><CrearGrupo  onBack={volver} /></div>}
            {vista === 'unirse' && <div className="mx-auto flex w-full justify-center"><UnirseGrupo onBack={volver} /></div>}
        </div>
    )
}
