import { useNavigate, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAppUI } from '@/context/AppUIContext'
import { IconHome, IconRanking, IconHistorial, IconPerfil } from '@/components/icons'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/',          icon: IconHome,      label: 'Resumen'   },
  { path: '/ranking',   icon: IconRanking,   label: 'Ranking'   },
  null, // hueco del botón central
  { path: '/historial', icon: IconHistorial, label: 'Historial' },
  { path: '/perfil',    icon: IconPerfil,    label: 'Perfil'    },
]

// Barra de pestañas nativa iOS — fondo con blur, 4 destinos + botón + central
// que abre la hoja modal de "Nueva actividad" en vez de navegar a una pantalla.
export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { openSheet } = useAppUI()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-k-sep bg-k-nav px-1.5 pt-2 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'calc(1.6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((tab) => {
        if (!tab) {
          return (
            <button
              key="add"
              onClick={openSheet}
              aria-label="Nueva actividad"
              className="mx-0.5 mb-0.5 flex h-[50px] w-[50px] flex-none items-center justify-center rounded-full bg-k-accent shadow-[0_4px_14px_var(--k-accent-soft)]"
            >
              <Plus className="h-[26px] w-[26px] text-white" strokeWidth={2.2} />
            </button>
          )
        }
        const Icon = tab.icon
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-1 flex-col items-center gap-[3px] px-0.5 py-1 text-[10px] font-medium',
              active ? 'text-k-accent-ink' : 'text-k-text2'
            )}
          >
            <Icon className="h-[25px] w-[25px]" />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
