import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'claro'
  })

  useEffect(() => {
    const root = document.documentElement
    if (tema === 'oscuro') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('tema', tema)
  }, [tema])

  return (
    <ThemeContext.Provider value={{ tema, setTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}