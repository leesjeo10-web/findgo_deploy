const KEY = 'chatgo-session-v2'
let memorySession = ''
export function getSessionId() {
  return typeof sessionStorage === 'undefined'
    ? memorySession
    : sessionStorage.getItem(KEY) || ''
}
export function setSessionId(value) {
  if (typeof sessionStorage !== 'undefined')
    value ? sessionStorage.setItem(KEY, value) : sessionStorage.removeItem(KEY)
  memorySession = value
}
