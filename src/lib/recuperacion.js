import { useSyncExternalStore } from 'react'

// Estado "recuperación de contraseña pendiente".
//
// El enlace del correo de recuperación inicia sesión igual que un login normal,
// así que hay que recordar aparte que esa sesión viene del enlace: mientras esté
// marcada, la app solo deja entrar a /restablecer-contrasena. Se guarda en
// localStorage para que sobreviva a recargas y a otras pestañas; se limpia al
// guardar la nueva contraseña, al entrar con email/contraseña o Google, y al
// cerrar sesión.

const CLAVE = 'senda:recuperacion-pendiente'
const CLAVE_ERROR = 'senda:error-enlace'
const oyentes = new Set()

function leer() {
  try { return localStorage.getItem(CLAVE) === '1' } catch { return false }
}

function escribir(valor) {
  try {
    if (valor) localStorage.setItem(CLAVE, '1')
    else localStorage.removeItem(CLAVE)
  } catch { /* sin almacenamiento: el estado vive solo en memoria */ }
  estado = valor
  oyentes.forEach(fn => fn())
}

let estado = leer()

export const marcarRecuperacion = () => { if (!estado) escribir(true) }
export const limpiarRecuperacion = () => { if (estado) escribir(false) }

function suscribir(fn) {
  oyentes.add(fn)
  // Mantiene sincronizadas las pestañas abiertas a la vez.
  const alCambiarOtraPestana = e => { if (e.key === CLAVE) { estado = leer(); fn() } }
  window.addEventListener('storage', alCambiarOtraPestana)
  return () => { oyentes.delete(fn); window.removeEventListener('storage', alCambiarOtraPestana) }
}

export function useRecuperacion() {
  return useSyncExternalStore(suscribir, () => estado)
}

// Tiene que ejecutarse antes de crear el cliente de Supabase: el cliente lee el
// hash del enlace (#access_token=…&type=recovery) y lo borra de la URL.
export function detectarEnlaceDeRecuperacion() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
  if (params.get('error_code')) {
    try { sessionStorage.setItem(CLAVE_ERROR, '1') } catch { /* nada */ }
    return
  }
  if (params.get('type') === 'recovery') escribir(true)
}

// Si el último enlace que se abrió había caducado o ya se había usado. Leer y
// olvidar van por separado para que el doble render de StrictMode no lo pierda.
export function hayErrorDeEnlace() {
  try { return sessionStorage.getItem(CLAVE_ERROR) === '1' } catch { return false }
}

export function olvidarErrorDeEnlace() {
  try { sessionStorage.removeItem(CLAVE_ERROR) } catch { /* nada */ }
}
