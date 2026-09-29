import { createContext, useCallback, useContext, useRef, useState } from 'react'

// Estado de interfaz compartido entre pantallas: la hoja modal de "Nueva
// actividad" (el diseño la saca del botón + de la barra de pestañas, así que
// cualquier pantalla debe poder abrirla), un contador que las pantallas con
// datos usan para refrescarse tras guardar, y el toast global.
const AppUIContext = createContext(null)

export function AppUIProvider({ children }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const value = {
    sheetOpen,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    refreshKey,
    notifySaved: () => setRefreshKey(k => k + 1),
    toast,
    showToast,
  }

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>
}

export function useAppUI() {
  const ctx = useContext(AppUIContext)
  if (!ctx) throw new Error('useAppUI debe usarse dentro de <AppUIProvider>')
  return ctx
}
