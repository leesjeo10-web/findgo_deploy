import { apiRequest } from '../../../shared/api/http.js'
import { getAccessToken, setAccessToken } from '../model/session.js'
export async function getCurrentUser() {
  if (!getAccessToken()) return null
  return apiRequest('/auth/me')
}
export async function login({ loginId, password }) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: { loginId: loginId.trim(), password }, authenticate: false })
  if (!result.accessToken || !result.user) throw new Error('로그인 응답을 확인할 수 없어요.')
  setAccessToken(result.accessToken)
  return result.user
}
export async function logout() { setAccessToken('') }
export async function changePassword({ currentPassword, newPassword }) {
  await apiRequest('/auth/me/password', { method: 'PATCH', body: { currentPassword, newPassword } })
  return apiRequest('/auth/me')
}
export const updatePhone = (phone, officePhone) => apiRequest('/auth/me', { method: 'PATCH', body: { phone, ...(officePhone !== undefined ? { officePhone } : {}) } })
