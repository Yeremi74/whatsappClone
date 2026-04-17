/**
 * Origen del backend sin barra final (ej. https://api.onrender.com).
 * Vacío en local: el proxy de Vite sirve /api y /socket.io hacia el mismo puerto.
 */
const raw = import.meta.env.VITE_API_BASE?.trim()

export const apiOrigin = raw ? raw.replace(/\/$/, '') : ''

export const apiBaseURL = apiOrigin ? `${apiOrigin}/api` : '/api'
