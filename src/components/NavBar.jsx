import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/',         icon: '⌂',  label: 'Inicio'    },
  { path: '/ranking',  icon: '☰',  label: 'Ranking'   },
  { path: '/historial',icon: '◷',  label: 'Historial' },
  { path: '/perfil',   icon: '◯',  label: 'Perfil'    },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-around py-2">
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs ${active ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}