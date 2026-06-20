import { useEffect } from 'react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-xl pointer-events-none">
      {message}
    </div>
  )
}
