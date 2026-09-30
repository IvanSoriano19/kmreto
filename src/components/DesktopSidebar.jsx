import { useNavigate, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAppUI } from '@/context/AppUIContext'
import { IconHome, IconGrupos, IconHistorial, IconPerfil } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/',          icon: IconHome,      label: 'Inicio'    },
  { path: '/grupos',    icon: IconGrupos,    label: 'Grupos'    },
  { path: '/historial', icon: IconHistorial, label: 'Historial' },
  { path: '/perfil',    icon: IconPerfil,    label: 'Perfil'    },
]

// Misma paleta y trazos que la barra de pestañas móvil, adaptados a una
// navegación lateral fija para pantallas de escritorio.
export default function DesktopSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { openSheet } = useAppUI()

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-56 flex-col border-r border-k-sep bg-k-surface md:flex">
      <div className="flex items-center gap-2.5 border-b border-k-sep px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-k-accent">
          <IconHome className="h-[18px] w-[18px] text-white" strokeWidth={1.9} />
        </div>
        <span className="text-[15px] font-semibold text-k-text">Senda</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                active ? 'bg-k-accent-soft text-k-accent-ink' : 'text-k-text2 hover:bg-k-fill'
              )}
            >
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2 : 1.7} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 pb-6">
        <Button onClick={openSheet} className="w-full justify-center gap-1.5">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Añadir actividad
        </Button>
      </div>
    </aside>
  )
}
