const KEY = 'finder-access-token'
export function getAccessToken() {
  try { return sessionStorage.getItem(KEY) || '' } catch { return '' }
}
export function setAccessToken(value) {
  if (value) sessionStorage.setItem(KEY, value)
  else { try { sessionStorage.removeItem(KEY) } catch { /* 이미 저장소를 사용할 수 없다. */ } }
}
