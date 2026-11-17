import 'fake-indexeddb/auto'
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { withStores } from '../src/shared/lib/browserDatabase.js'
import {
  login,
  logout,
  getCurrentUser,
  changePassword,
  updatePhone,
  withUser,
  makeCredential,
} from '../src/features/auth/api/authRepository.js'
import {
  setSessionId,
  getSessionId,
} from '../src/features/auth/model/session.js'
import {
  canDeleteItem,
  canEditItem,
  nextAuthPath,
  validatePassword,
  validPhone,
  formatPhone,
} from '../src/features/auth/model/authModel.js'
import {
  createStudent,
  listStudents,
  resetStudentPassword,
  deleteStudent,
} from '../src/features/admin/api/adminRepository.js'
import {
  createItem,
  getItem,
  listItems,
  updateItem,
  deleteItem,
  getItemCounts,
} from '../src/features/items/api/itemRepository.js'
import { emptyItem } from '../src/features/items/model/itemModel.js'
import { signInAdmin, ADMIN_PASSWORD } from './helpers/auth.js'

beforeEach(async () => {
  setSessionId('')
  await withStores(
    ['members', 'sessions', 'items'],
    'readwrite',
    (stores, done) => {
      Object.values(stores).forEach((store) => store.clear())
      done()
    },
  )
})
const studentValues = {
  loginId: '1101',
  name: '검증 학생',
  password: 'Student-initial-1',
}
const validItem = () => ({
  ...emptyItem(),
  name: '검증 물품',
  description: '특징',
  location: '도서관',
  storageLocation: '학생부실',
})
async function studentAccount() {
  await signInAdmin()
  return createStudent(studentValues)
}
async function signInStudent({ complete = true } = {}) {
  const user = await login({
    loginId: studentValues.loginId,
    password: studentValues.password,
  })
  if (!complete) return user
  await changePassword({
    currentPassword: studentValues.password,
    newPassword: 'Student-changed-1',
    confirmation: 'Student-changed-1',
  })
  return updatePhone('010-1111-1111')
}

test('앱 초기화 때 관리자 권한의 선생님 계정 하나를 만들고 변경한 비밀번호를 유지한다', async () => {
  assert.deepEqual(
    await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentUser()]),
    [null, null, null],
  )
  const readMembers = () =>
    withStores(['members'], 'readonly', ({ members }, done) => {
      const request = members.getAll()
      request.onsuccess = () => done(request.result)
    })
  const initial = await readMembers()
  assert.equal(initial.length, 1)
  assert.deepEqual(
    initial.map((user) => user.loginId),
    ['0000'],
  )
  await assert.rejects(login({ loginId: 'admin', password: '0000' }), {
    status: 401,
  })
  assert.ok(
    initial.every((user) => user.role === 'ADMIN' && user.mustChangePassword),
  )
  await signInAdmin()
  const changed = (await readMembers()).find((user) => user.loginId === '0000')
  await logout()
  await getCurrentUser()
  const restored = await readMembers()
  assert.equal(restored.length, 1)
  const teacher = restored.find((user) => user.loginId === '0000')
  assert.equal(teacher.credential.hash, changed.credential.hash)
  assert.equal(teacher.mustChangePassword, false)
  await assert.rejects(login({ loginId: '0000', password: '0000' }), {
    status: 401,
  })
  assert.equal(
    (await login({ loginId: '0000', password: ADMIN_PASSWORD })).role,
    'ADMIN',
  )
})

test('초기 관리자 0000은 첫 비밀번호 변경과 연락처 입력 전 서비스에 접근할 수 없다', async () => {
  await assert.rejects(listItems(), { status: 401 })
  const initial = await login({ loginId: '0000', password: '0000' })
  assert.equal(initial.role, 'ADMIN')
  assert.equal(nextAuthPath(initial), '/auth/password')
  assert.equal(initial.credential, undefined)
  await assert.rejects(listItems(), { status: 428 })
  await assert.rejects(updatePhone('010-0000-0000'), { status: 428 })
  const changed = await changePassword({
    currentPassword: '0000',
    newPassword: ADMIN_PASSWORD,
    confirmation: ADMIN_PASSWORD,
  })
  assert.equal(nextAuthPath(changed), '/auth/phone')
  await assert.rejects(createItem(validItem()), { status: 428 })
  assert.equal(nextAuthPath(await updatePhone('010-0000-0000')), '/')
  await logout()
  await assert.rejects(login({ loginId: '0000', password: '0000' }), {
    status: 401,
  })
  assert.equal(
    (await login({ loginId: '0000', password: ADMIN_PASSWORD }))
      .mustChangePassword,
    false,
  )
})

test('기존 별도 admin 계정과 세션은 제거하고 물품·사진을 선생님에게 보존한다', async () => {
  const teacher = await signInAdmin()
  const teacherItem = await createItem(validItem())
  const student = await createStudent(studentValues)
  const credential = await makeCredential('Legacy-admin-password')
  const retiredId = 'chatgo-system-admin',
    retiredSession = 'legacy-admin-session'
  const snapshot = await withStores(
    ['members', 'sessions', 'items'],
    'readwrite',
    ({ members, sessions, items }, done) => {
      members.add({
        id: retiredId,
        loginId: 'admin',
        name: '관리자',
        role: 'ADMIN',
        phone: '010-2222-2222',
        credential,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      })
      sessions.add({
        id: retiredSession,
        userId: retiredId,
        expiresAt: Date.now() + 60000,
      })
      items.add({
        ...validItem(),
        id: 'legacy-admin-item',
        userId: retiredId,
        createdAt: '2026-11-17T00:00:00.000Z',
        imageBlob: new Blob(['preserved-photo'], { type: 'image/png' }),
      })
      const request = members.get(teacher.id)
      request.onsuccess = () => done(request.result)
    },
  )
  setSessionId(retiredSession)
  assert.equal(await getCurrentUser(), null)
  const stored = await withStores(
    ['members', 'sessions'],
    'readonly',
    ({ members, sessions }, done) => {
      const users = members.getAll(),
        tokens = sessions.getAll()
      let people, active
      const finish = () => {
        if (people && active) done({ people, active })
      }
      users.onsuccess = () => {
        people = users.result
        finish()
      }
      tokens.onsuccess = () => {
        active = tokens.result
        finish()
      }
    },
  )
  assert.equal(
    stored.people.some((user) => user.loginId === 'admin'),
    false,
  )
  assert.equal(
    stored.active.some((session) => session.userId === retiredId),
    false,
  )
  const preserved = stored.people.find((user) => user.id === teacher.id)
  assert.equal(preserved.credential.hash, snapshot.credential.hash)
  assert.equal(preserved.mustChangePassword, false)
  assert.ok(stored.people.some((user) => user.id === student.id))
  await assert.rejects(
    login({ loginId: 'admin', password: 'Legacy-admin-password' }),
    { status: 401 },
  )
  await login({ loginId: '0000', password: ADMIN_PASSWORD })
  const transferred = await getItem('legacy-admin-item')
  assert.equal(transferred.userId, teacher.id)
  assert.equal(transferred.createdAt, '2026-11-17T00:00:00.000Z')
  assert.equal(await transferred.imageBlob.text(), 'preserved-photo')
  assert.equal((await getItem(teacherItem.id)).userId, teacher.id)
  assert.equal((await listItems({ mine: true })).totalElements, 2)
  assert.equal((await listStudents()).length, 1)
})

test('잘못된 현재 비밀번호·길이·확인·같은 비밀번호를 거부하고 평문을 저장하지 않는다', async () => {
  await login({ loginId: '0000', password: '0000' })
  await assert.rejects(
    changePassword({
      currentPassword: 'wrong',
      newPassword: ADMIN_PASSWORD,
      confirmation: ADMIN_PASSWORD,
    }),
    /현재 비밀번호/,
  )
  for (const values of [
    { currentPassword: '0000', newPassword: 'short', confirmation: 'short' },
    {
      currentPassword: '0000',
      newPassword: ADMIN_PASSWORD,
      confirmation: 'mismatch',
    },
    {
      currentPassword: ADMIN_PASSWORD,
      newPassword: ADMIN_PASSWORD,
      confirmation: ADMIN_PASSWORD,
    },
  ])
    assert.ok(Object.keys(validatePassword(values)).length)
  assert.equal(validPhone(''), false)
  assert.equal(validPhone(formatPhone('01011111111')), true)
  await signInAdmin()
  const records = await withStores(
    ['members'],
    'readonly',
    ({ members }, done) => {
      const request = members.getAll()
      request.onsuccess = () => done(request.result)
    },
  )
  assert.equal(JSON.stringify(records).includes(ADMIN_PASSWORD), false)
  assert.equal(records[0].credential.hash.length, 64)
})

test('학생은 관리자 조회·생성·초기화·삭제를 직접 호출해도 접근할 수 없다', async () => {
  const student = await studentAccount()
  await signInStudent()
  await assert.rejects(listStudents(), { status: 403 })
  await assert.rejects(createStudent({ ...studentValues, loginId: '1102' }), {
    status: 403,
  })
  await assert.rejects(resetStudentPassword(student.id, 'new-password'), {
    status: 403,
  })
  await assert.rejects(deleteStudent(student.id), { status: 403 })
  assert.equal((await getCurrentUser()).role, 'STUDENT')
})

test('내 물품은 실제 작성자 기준이며 학생은 다른 사람 물품 수정·삭제를 할 수 없다', async () => {
  const admin = await signInAdmin()
  const other = await createItem(validItem())
  await createStudent(studentValues)
  const student = await signInStudent()
  const mine = await createItem({ ...validItem(), userId: admin.id })
  assert.equal(mine.userId, student.id)
  assert.equal((await listItems()).totalElements, 2)
  assert.equal((await listItems({ mine: true })).totalElements, 1)
  assert.deepEqual(await getItemCounts({ mine: true }), { FOUND: 1, LOST: 0 })
  assert.equal((await getItem(mine.id)).userPhone, '010-1111-1111')
  await assert.rejects(
    updateItem(other.id, { ...other, name: '타인 글 변경' }),
    { status: 403 },
  )
  await assert.rejects(deleteItem(other.id), { status: 403 })
  await assert.rejects(createItem(validItem(), other.id), { status: 403 })
  await updateItem(mine.id, { ...mine, name: '내 글 수정', userId: admin.id })
  assert.equal((await getItem(mine.id)).userId, student.id)
  await deleteItem(mine.id)
})

test('관리자는 학생 물품을 삭제할 수 있지만 학생 글을 수정할 수 없다', async () => {
  await studentAccount()
  await signInStudent()
  const item = await createItem(validItem())
  await login({ loginId: '0000', password: ADMIN_PASSWORD })
  assert.equal(canDeleteItem(await getCurrentUser(), item), true)
  assert.equal(canEditItem(await getCurrentUser(), item), false)
  await assert.rejects(updateItem(item.id, { ...item, name: '관리자 수정' }), {
    status: 403,
  })
  await deleteItem(item.id)
  await assert.rejects(getItem(item.id), { name: 'ItemNotFoundError' })
})

test('학생 초기화는 기존 세션을 해제하고 새 비밀번호의 첫 변경을 강제한다', async () => {
  const student = await studentAccount()
  await signInStudent()
  const oldSession = getSessionId()
  await login({ loginId: '0000', password: ADMIN_PASSWORD })
  await resetStudentPassword(student.id, 'Reset-password-1')
  const adminSession = getSessionId()
  setSessionId(oldSession)
  assert.equal(await getCurrentUser(), null)
  setSessionId(adminSession)
  await assert.rejects(
    login({ loginId: student.loginId, password: 'Student-changed-1' }),
    { status: 401 },
  )
  const reset = await login({
    loginId: student.loginId,
    password: 'Reset-password-1',
  })
  assert.equal(reset.mustChangePassword, true)
  assert.equal(reset.phone, '010-1111-1111')
  await assert.rejects(listItems(), { status: 428 })
})

test('학생 삭제는 해당 학생의 사진·물품·세션을 모두 지우고 다른 계정을 보존한다', async () => {
  const student = await studentAccount()
  await signInStudent()
  await createItem({
    ...validItem(),
    imageBlob: new Blob(['photo'], { type: 'image/png' }),
  })
  const studentSession = getSessionId()
  const admin = await login({ loginId: '0000', password: ADMIN_PASSWORD })
  const retained = await createItem(validItem())
  await deleteStudent(student.id)
  assert.equal((await listStudents()).length, 0)
  assert.equal((await listItems()).totalElements, 1)
  assert.equal((await getItem(retained.id)).userId, admin.id)
  await assert.rejects(deleteStudent(admin.id), { status: 404 })
  const adminSession = getSessionId()
  setSessionId(studentSession)
  assert.equal(await getCurrentUser(), null)
  setSessionId(adminSession)
  await assert.rejects(
    login({ loginId: student.loginId, password: 'Student-changed-1' }),
    { status: 401 },
  )
})

test('학생 생성 중복·형식을 검증하고 세션 만료·로그아웃 뒤 API를 차단한다', async () => {
  await signInAdmin()
  await createStudent(studentValues)
  await assert.rejects(createStudent(studentValues), /이미 사용/)
  await assert.rejects(
    createStudent({ ...studentValues, loginId: '0000' }),
    /이미 사용/,
  )
  for (const loginId of ['123', '12345', '261101', 'abcd']) {
    await assert.rejects(
      createStudent({ ...studentValues, loginId }),
      /학생 정보/,
    )
  }
  const leadingZero = await createStudent({ ...studentValues, loginId: '0001' })
  assert.equal(leadingZero.loginId, '0001')
  const id = getSessionId()
  await withStores(['sessions'], 'readwrite', ({ sessions }, done) => {
    const request = sessions.get(id)
    request.onsuccess = () => {
      sessions.put({ ...request.result, expiresAt: 0 })
      done()
    }
  })
  await assert.rejects(listItems(), { status: 401 })
  assert.equal(await getCurrentUser(), null)
  await login({ loginId: '0000', password: ADMIN_PASSWORD })
  await logout()
  await assert.rejects(
    withUser([], 'readonly', (_, done) => done()),
    { status: 401 },
  )
})
