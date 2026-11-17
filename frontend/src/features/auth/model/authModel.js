export const ROLES = { ADMIN: 'ADMIN', STUDENT: 'STUDENT' }
export function nextAuthPath(user) {
  if (!user) return '/login'
  if (user.role !== ROLES.ADMIN && user.mustChangePassword) return '/auth/password'
  if (!user.phone || (user.role === ROLES.ADMIN && !user.officePhone)) return '/auth/phone'
  return '/'
}
export function canEditItem(user, item) {
  return !!user && !!item && String(user.id) === String(item.userId)
}
export function canDeleteItem(user, item) {
  return (
    !!user && !!item && (user.role === ROLES.ADMIN || canEditItem(user, item))
  )
}
export function validatePassword(values) {
  const errors = {}
  if (!values.currentPassword)
    errors.currentPassword = '현재 비밀번호를 입력해 주세요.'
  if (values.newPassword.length < 8 || values.newPassword.length > 64)
    errors.newPassword = '새 비밀번호는 8~64자로 입력해 주세요.'
  if (!values.confirmation || values.confirmation !== values.newPassword)
    errors.confirmation = '새 비밀번호가 일치하지 않아요.'
  return errors
}
export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)]
    .filter(Boolean)
    .join('-')
}
export const validPhone = (value) => /^010-\d{4}-\d{4}$/.test(value)

export function validateLogin(values) {
  const fields = {}
  if (!/^\d{4}$/.test(values.loginId?.trim() || '')) fields.loginId = '숫자 4자리 아이디를 입력해주세요.'
  if (!values.password) fields.password = '비밀번호를 입력해주세요.'
  return fields
}
