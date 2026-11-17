import { apiRequest } from '../../../shared/api/http.js'
export function validateStudent(values) {
  const fields = {}
  if (!/^\d{4}$/.test(values.loginId?.trim() || '') || values.loginId?.trim() === '0000') fields.loginId = '0000을 제외한 숫자 4자리 학번을 입력해주세요.'
  if (!values.name?.trim() || values.name.trim().length > 40) fields.name = '학생 이름을 1~40자로 입력해주세요.'
  if (!values.password || values.password.length < 8 || values.password.length > 64) fields.password = '초기 비밀번호를 8~64자로 입력해주세요.'
  return fields
}
export const listStudents = () => apiRequest('/admin/members')
export function createStudent(values) {
  const fields = validateStudent(values)
  if (Object.keys(fields).length) throw Object.assign(new Error('학생 정보를 확인해주세요.'), { fields })
  return apiRequest('/admin/members', { method: 'POST', body: { loginId: values.loginId.trim(), name: values.name.trim(), password: values.password } })
}
export function resetStudentPassword(id, password) {
  if (!password || password.length < 8 || password.length > 64) throw new Error('초기 비밀번호는 8~64자로 입력해주세요.')
  return apiRequest('/admin/members/' + encodeURIComponent(id) + '/password', { method: 'PATCH', body: { password } })
}
export const deleteStudent = id => apiRequest('/admin/members/' + encodeURIComponent(id), { method: 'DELETE' })
