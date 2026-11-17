import {
  changePassword,
  getCurrentUser,
  login,
  updatePhone,
} from '../../src/features/auth/api/authRepository.js'
export const ADMIN_PASSWORD = 'Admin-test-password'
export async function signInAdmin() {
  let user = await getCurrentUser()
  if (user?.role !== 'ADMIN') {
    try {
      user = await login({ loginId: '0000', password: ADMIN_PASSWORD })
    } catch {
      user = await login({ loginId: '0000', password: '0000' })
    }
  }
  if (user.mustChangePassword)
    user = await changePassword({
      currentPassword: '0000',
      newPassword: ADMIN_PASSWORD,
      confirmation: ADMIN_PASSWORD,
    })
  if (!user.phone) user = await updatePhone('010-0000-0000')
  return user
}
