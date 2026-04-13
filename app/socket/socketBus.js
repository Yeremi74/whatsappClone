let ioRef = null

export function registerIo(io) {
  ioRef = io
}

export function emitInboxUpdate(userId) {
  if (!ioRef || userId == null) return
  ioRef.to(`user:${String(userId)}`).emit('inbox:update', {})
}
