const listeners = new Set()

export const subscribeSuppliersChanged = (callback) => {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export const notifySuppliersChanged = () => {
  listeners.forEach((callback) => {
    try {
      callback()
    } catch (err) {
      console.error('Error in supplier event listener:', err)
    }
  })
}
