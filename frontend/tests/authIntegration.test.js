import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest, configureApiAuth, onBeforeUnauthorized } from '../src/shared/api/http.js'
import { getAccessToken, setAccessToken } from '../src/features/auth/model/session.js'
import { login, getCurrentUser, changePassword, updatePhone, logout } from '../src/features/auth/api/authRepository.js'
import { listStudents, createStudent, resetStudentPassword, deleteStudent, validateStudent } from '../src/features/admin/api/adminRepository.js'
import { nextAuthPath, canEditItem, canDeleteItem, validateLogin } from '../src/features/auth/model/authModel.js'

test('통합 로그인: 공개 요청·토큰 주입·초기 설정·서버 비밀번호 변경·관리자 API·만료 순서', async () => {
  const originalFetch = globalThis.fetch
  const originalStorage = globalThis.sessionStorage
  const storage = new Map(), calls = [], events = []
  globalThis.sessionStorage = { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) }
  configureApiAuth({ getToken: getAccessToken, onUnauthorized: async () => { await logout(); events.push('logout') } })
  const student = { id: 1, role: 'STUDENT', mustChangePassword: true, phone: null }
  globalThis.fetch = async (url, init) => {
    calls.push({ url, ...init })
    if (url.endsWith('/auth/login')) return new Response(JSON.stringify({ accessToken: 'server-jwt', user: student }))
    if (url.endsWith('/password') || init.method === 'DELETE') return new Response(null, { status: 204 })
    return new Response(JSON.stringify(url.endsWith('/admin/members') ? [] : { ...student, mustChangePassword: false, phone: '010-1234-5678' }))
  }
  try {
    assert.ok(validateLogin({loginId:'261109',password:'test'}).loginId)
    assert.deepEqual(validateLogin({loginId:'0000',password:'test'}), {})
    assert.deepEqual(validateLogin({loginId:'1109',password:'test'}), {})
    assert.equal(await getCurrentUser(), null)
    assert.equal(calls.length, 0)
    const user = await login({ loginId: '1109', password: 'test-password' })
    assert.equal(calls[0].headers.Authorization, undefined)
    assert.equal(getAccessToken(), 'server-jwt')
    assert.equal(nextAuthPath(user), '/auth/password')
    assert.equal(nextAuthPath({ ...user, mustChangePassword: false }), '/auth/phone')
    assert.equal(nextAuthPath({ id: 2, role: 'ADMIN', phone: '010-1234-5678', officePhone: null }), '/auth/phone')
    assert.equal(nextAuthPath({ ...user, mustChangePassword: false, phone: '010-1234-5678' }), '/')
    await getCurrentUser()
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer server-jwt')
    await changePassword({ currentPassword: 'old-password', newPassword: 'new-password', confirmation: 'new-password' })
    const change = calls.find(call => call.url.endsWith('/auth/me/password'))
    assert.deepEqual(JSON.parse(change.body), { currentPassword: 'old-password', newPassword: 'new-password' })
    await updatePhone('010-1234-5678', '02-123-4567')
    assert.equal(JSON.parse(calls.at(-1).body).officePhone, '02-123-4567')
    assert.ok(validateStudent({ loginId: '261109', name: '학생', password: 'test-password' }).loginId)
    assert.ok(validateStudent({ loginId: '0000', name: '학생', password: 'test-password' }).loginId)
    await createStudent({ loginId: '1109', name: '학생', password: 'test-password' })
    assert.equal(JSON.parse(calls.at(-1).body).loginId, '1109')
    await listStudents(); await resetStudentPassword(1, 'reset-password'); await deleteStudent(1)
    assert.equal(calls.at(-1).method, 'DELETE')
    assert.equal(canEditItem({id:1,role:'ADMIN'}, {userId:2}), false)
    assert.equal(canDeleteItem({id:1,role:'ADMIN'}, {userId:2}), true)
    assert.equal(canDeleteItem({id:1,role:'STUDENT'}, {userId:2}), false)
    globalThis.fetch = async () => new Response('{"message":"로그인 실패"}', { status: 401 })
    await assert.rejects(login({loginId:'1109',password:'wrong'}), error => error.status === 401)
    assert.equal(getAccessToken(), 'server-jwt'); assert.deepEqual(events, [])
    const stop = onBeforeUnauthorized(() => events.push('draft'))
    await assert.rejects(apiRequest('/items'), error => error.status === 401)
    stop(); assert.deepEqual(events, ['draft','logout']); assert.equal(getAccessToken(), '')
  } finally { globalThis.fetch=originalFetch; globalThis.sessionStorage=originalStorage }
})
