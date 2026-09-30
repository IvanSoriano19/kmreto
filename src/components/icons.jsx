// Iconos de línea a medida del rediseño "Nativa" (Opción A) — cero emoji.
// Trazos copiados literalmente del boceto de Claude Design para mantener
// la forma exacta (monocromos, heredan `currentColor`/`stroke`).

function Svg({ size = 24, className, children, viewBox = '0 0 24 24', ...props }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconHome(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </Svg>
  )
}

export function IconRanking(props) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <path d="M5 19V11M12 19V5M19 19v-6" />
    </Svg>
  )
}

export function IconHistorial(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.4l3 1.8" />
    </Svg>
  )
}

export function IconPerfil(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8" />
    </Svg>
  )
}

export function IconGrupos(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c1.1-3 3.3-4.5 6-4.5s4.9 1.5 6 4.5" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.4 15.3c1.6.6 2.8 2 3.6 4.2" />
    </Svg>
  )
}

export function IconTrail(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <path d="M3 18l5.5-8 3.5 5 2.5-3.5L21 18z" />
    </Svg>
  )
}

export function IconCorrer(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <circle cx="14.5" cy="5" r="2.2" />
      <path d="M13 8.6 9.4 11.2l2 3.2-2.6 5.2M11.4 14.4l4.4 1.2 1 4.2M9.4 11.2 6 10.6" />
    </Svg>
  )
}

export function IconCaminar(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <circle cx="12.6" cy="4.8" r="2.2" />
      <path d="M12 8.4 10.2 13l2.2 1.6.9 5.4M12.4 14.6 9.6 20M10.6 10.4 7.8 12.2M13.6 9.8l2.6 2.4" />
    </Svg>
  )
}

export function IconBici(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <circle cx="5.8" cy="16.8" r="3.4" />
      <circle cx="18.2" cy="16.8" r="3.4" />
      <path d="M6 16.8 10.4 8.6h3.8l4 8.2M10 8.6h5" />
    </Svg>
  )
}

export function IconSenderismo(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <path d="M7 4v16M7 5h9.5l-2.2 3.4L16.5 12H7" />
    </Svg>
  )
}

export function IconOtro(props) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <path d="M12 5v14M5.5 8.5l13 7M18.5 8.5l-13 7" />
    </Svg>
  )
}

export function IconCrear(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconUnirse(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </Svg>
  )
}

export function IconRacha(props) {
  return (
    <Svg strokeWidth={1.7} {...props}>
      <path d="M5 19V11M12 19V5M19 19v-6" />
    </Svg>
  )
}

// Deporte → icono, usado en el feed, historial y el selector de la hoja modal.
export const DEPORTE_ICONOS = {
  Correr: IconCorrer,
  Caminar: IconCaminar,
  Bici: IconBici,
  Trail: IconTrail,
  Senderismo: IconSenderismo,
  Otro: IconOtro,
}

export function IconDeporte({ deporte, ...props }) {
  const Icon = DEPORTE_ICONOS[deporte] || IconOtro
  return <Icon {...props} />
}
