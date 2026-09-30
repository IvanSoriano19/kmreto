import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../SupabaseClient'
import NavBar from '../components/NavBar'
import { ListCard } from '@/components/km/Card'
import { ScreenHeader } from '@/components/km/ScreenHeader'
import { ListRowLink } from '@/components/km/ListRow'
import { GrupoFila } from '@/components/km/GrupoFila'
import { IconCrear, IconUnirse } from '@/components/icons'
import { useAppUI } from '@/context/AppUIContext'
import { cargarMisGrupos } from '@/lib/grupos'

export default function Grupos() {
    const navigate = useNavigate()
    const { refreshKey } = useAppUI()
    const [grupos, setGrupos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            setGrupos(await cargarMisGrupos(user.id))
            setLoading(false)
        }
        loadData()
    }, [refreshKey])

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-k-bg">
            <div className="text-k-text3 text-sm">Cargando...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-k-bg pb-nav md:pb-8 transition-colors">
            <div className="flex flex-col gap-5 px-4 pb-8 pt-8 md:mx-auto md:max-w-2xl md:px-6">
                <ScreenHeader
                    kicker={grupos.length === 1 ? '1 grupo' : `${grupos.length} grupos`}
                    title="Grupos"
                />

                {grupos.length > 0 ? (
                    <ListCard>
                        {grupos.map((g, i) => (
                            <GrupoFila key={g.id} grupo={g} first={i === 0} onClick={() => navigate(`/grupos/${g.id}`)} />
                        ))}
                    </ListCard>
                ) : (
                    <p className="text-[15px] leading-relaxed text-k-text2">
                        Cada actividad que registras cuenta en todos tus grupos a la vez, con la meta de cada uno.
                    </p>
                )}

                <ListCard>
                    <ListRowLink icon={IconCrear} title="Crear un grupo" subtitle="Tú pones las reglas y compartes el código" onClick={() => navigate('/grupos/nuevo', { state: { vista: 'crear' } })} />
                    <div className="h-px bg-k-sep" />
                    <ListRowLink icon={IconUnirse} title="Unirme con un código" subtitle="Seis caracteres que te pasa el grupo" onClick={() => navigate('/grupos/nuevo', { state: { vista: 'unirse' } })} />
                </ListCard>
            </div>
            <NavBar />
        </div>
    )
}
