import { io } from 'socket.io-client'
import { apiOrigin } from '../config/api'

export function createSocketIo(options) {
  const defaults = {
    path: '/socket.io',
    transports: ['websocket', 'polling']
  }
  const merged = { ...defaults, ...options }
  return apiOrigin ? io(apiOrigin, merged) : io(merged)
}
