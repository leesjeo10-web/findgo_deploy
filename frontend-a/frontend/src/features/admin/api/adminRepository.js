import {
  makeCredential,
  publicMember,
  withUser,
  AccessError,
} from '../../auth/api/authRepository.js'

export function validateStudent(values) {
  const fields = {}
  if (!/^\d{6}$/.test(values.loginId?.trim() || ''))
    fields.loginId = '학생 아이디는 숫자 6자리로 입력해 주세요.'
  if (!values.name?.trim() || values.name.trim().length > 40)
    fields.name = '학생 이름을 1~40자로 입력해 주세요.'
  if (
    !values.password ||
    values.password.length < 8 ||
    values.password.length > 64
  )
    fields.password = '초기 비밀번호를 8~64자로 입력해 주세요.'
  return fields
}
export function listStudents() {
  return withUser(
    ['items'],
    'readonly',
    ({ members, items }, done) => {
      const users = members.getAll(),
        posts = items.getAll()
      let students, registered
      const finish = () => {
        if (students && registered)
          done(
            students
              .filter((user) => user.role === 'STUDENT')
              .map((user) => ({
                ...publicMember(user),
                itemCount: registered.filter((item) => item.userId === user.id)
                  .length,
              }))
              .sort((a, b) => a.loginId.localeCompare(b.loginId)),
          )
      }
      users.onsuccess = () => {
        students = users.result
        finish()
      }
      posts.onsuccess = () => {
        registered = posts.result
        finish()
      }
    },
    { admin: true },
  )
}
export async function createStudent(values) {
  const fields = validateStudent(values)
  if (Object.keys(fields).length)
    throw Object.assign(new Error('학생 정보를 확인해 주세요.'), { fields })
  await withUser([], 'readonly', (_, done) => done(), { admin: true })
  const credential = await makeCredential(values.password)
  return withUser(
    [],
    'readwrite',
    ({ members }, done, fail) => {
      const request = members.getAll()
      request.onsuccess = () => {
        if (
          request.result.some((user) => user.loginId === values.loginId.trim())
        )
          return fail(
            Object.assign(new Error('이미 사용 중인 학생 아이디예요.'), {
              fields: { loginId: '이미 사용 중인 아이디예요.' },
            }),
          )
        const student = {
          id: crypto.randomUUID(),
          loginId: values.loginId.trim(),
          name: values.name.trim(),
          role: 'STUDENT',
          phone: '',
          mustChangePassword: true,
          credential,
          createdAt: new Date().toISOString(),
        }
        members.add(student)
        done(publicMember(student))
      }
    },
    { admin: true },
  )
}
export async function resetStudentPassword(id, password) {
  if (!password || password.length < 8 || password.length > 64)
    throw new Error('초기 비밀번호는 8~64자로 입력해 주세요.')
  await withUser([], 'readonly', (_, done) => done(), { admin: true })
  const credential = await makeCredential(password)
  return withUser(
    [],
    'readwrite',
    ({ members, sessions }, done, fail) => {
      const request = members.get(id)
      request.onsuccess = () => {
        if (!request.result || request.result.role !== 'STUDENT')
          return fail(
            new AccessError('초기화할 학생 계정을 찾을 수 없어요.', 404),
          )
        members.put({ ...request.result, credential, mustChangePassword: true })
        const tokens = sessions.getAll()
        tokens.onsuccess = () => {
          tokens.result
            .filter((token) => token.userId === id)
            .forEach((token) => sessions.delete(token.id))
          done()
        }
      }
    },
    { admin: true },
  )
}
export function deleteStudent(id) {
  return withUser(
    ['items'],
    'readwrite',
    ({ members, items, sessions }, done, fail) => {
      const request = members.get(id)
      request.onsuccess = () => {
        if (!request.result || request.result.role !== 'STUDENT')
          return fail(
            new AccessError('삭제할 학생 계정을 찾을 수 없어요.', 404),
          )
        members.delete(id)
        const posts = items.getAll(),
          tokens = sessions.getAll()
        posts.onsuccess = () =>
          posts.result
            .filter((item) => item.userId === id)
            .forEach((item) => items.delete(item.id))
        tokens.onsuccess = () => {
          tokens.result
            .filter((token) => token.userId === id)
            .forEach((token) => sessions.delete(token.id))
          done()
        }
      }
    },
    { admin: true },
  )
}
