const MIN_DELAY = 300
const MAX_DELAY = 800

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function simulateRequest(callback) {
  const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(structuredClone(callback()))
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}
