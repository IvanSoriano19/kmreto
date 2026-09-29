import { useAppUI } from '@/context/AppUIContext'

// Pastilla oscura centrada, igual que en el boceto (fondo #1C1C1E al 92%,
// texto blanco, esquinas totalmente redondeadas).
export default function Toast() {
  const { toast } = useAppUI()
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[90] flex justify-center px-4">
      <div className="animate-toast-in rounded-full bg-[rgba(28,28,30,.92)] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
        {toast}
      </div>
    </div>
  )
}
