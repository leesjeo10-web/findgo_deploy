import { withStores } from '../../../shared/lib/browserDatabase.js'
import { getSessionId, setSessionId } from '../model/session.js'
import { validPhone, validatePassword } from '../model/authModel.js'

// 기존 선생님 계정의 내부 id는 작성자 연결과 변경한 비밀번호 보존을 위해 유지한다.
const TEACHER_ACCOUNT = {
  id: 'chatgo-initial-admin',
  loginId: '0000',
  name: '선생님',
}
const RETIRED_ADMIN_ID = 'chatgo-system-admin'
export class AccessError extends Error {
  constructor(message = '로그인이 필요해요.', status = 401) {
    super(message)
    this.status = status
    this.name = 'AccessError'
  }
}
export const publicMember = (member) => {
  const { id, loginId, name, phone, role, mustChangePassword, createdAt } =
    member
  return { id, loginId, name, phone, role, mustChangePassword, createdAt }
}
export async function makeCredential(password, salt = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 210000,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return {
    salt,
    hash: Array.from(new Uint8Array(bits), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),
  }
}
export async function passwordMatches(password, credential) {
  return (
    (await makeCredential(password, credential.salt)).hash === credential.hash
  )
}
async function bootstrap() {
  const existing = await withStores(
    ['members'],
    'readonly',
    ({ members }, done) => {
      const request = members.getAll()
      request.onsuccess = () => done(request.result)
    },
  )
  const hasTeacher = existing.some((user) => user.id === TEACHER_ACCOUNT.id)
  const hasRetiredAdmin = existing.some(
    (user) => user.id === RETIRED_ADMIN_ID && user.loginId === 'admin',
  )
  if (hasTeacher && !hasRetiredAdmin) return
  const prepared = hasTeacher
    ? null
    : {
        ...TEACHER_ACCOUNT,
        credential: await makeCredential('0000'),
        phone: '',
        role: 'ADMIN',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      }
  // 이전 버전의 별도 관리자만 정리하고, 그 물품은 선생님에게 연결한다.
  // 계정·세션·물품을 한 트랜잭션으로 갱신해 사진과 기존 데이터를 보존한다.
  await withStores(
    ['members', 'sessions', 'items'],
    'readwrite',
    ({ members, sessions, items }, done, fail) => {
      const request = members.getAll()
      request.onsuccess = () => {
        if (!request.result.some((user) => user.id === TEACHER_ACCOUNT.id)) {
          if (
            request.result.some(
              (user) => user.loginId === TEACHER_ACCOUNT.loginId,
            )
          )
            return fail(
              new Error(
                '초기 선생님 아이디가 이미 사용 중이에요. 계정 정보를 확인해 주세요.',
              ),
            )
          members.add(prepared)
        }
        const retired = request.result.find(
          (user) => user.id === RETIRED_ADMIN_ID && user.loginId === 'admin',
        )
        if (retired) {
          members.delete(retired.id)
          const tokens = sessions.getAll(),
            posts = items.getAll()
          tokens.onsuccess = () =>
            tokens.result
              .filter((session) => session.userId === retired.id)
              .forEach((session) => sessions.delete(session.id))
          posts.onsuccess = () =>
            posts.result
              .filter((item) => item.userId === retired.id)
              .forEach((item) =>
                items.put({ ...item, userId: TEACHER_ACCOUNT.id }),
              )
        }
        done()
      }
    },
  )
}
// 모든 로컬 데이터 변경은 현재 세션과 저장된 역할을 다시 검증한다.
export function withUser(
  names,
  mode,
  operation,
  { admin = false, setup = false } = {},
) {
  const sessionId = getSessionId()
  if (!sessionId) return Promise.reject(new AccessError())
  return withStores(
    [...new Set(['members', 'sessions', ...names])],
    mode,
    (stores, done, fail) => {
      const sessionRequest = stores.sessions.get(sessionId)
      sessionRequest.onsuccess = () => {
        const session = sessionRequest.result
        if (!session || session.expiresAt <= Date.now())
          return fail(
            new AccessError('로그인이 만료되었어요. 다시 로그인해 주세요.'),
          )
        const memberRequest = stores.members.get(session.userId)
        memberRequest.onsuccess = () => {
          const user = memberRequest.result
          if (!user)
            return fail(
              new AccessError(
                '사용할 수 없는 계정이에요. 다시 로그인해 주세요.',
              ),
            )
          if (admin && user.role !== 'ADMIN')
            return fail(
              new AccessError('관리자만 사용할 수 있는 기능이에요.', 403),
            )
          if (!setup && (user.mustChangePassword || !user.phone))
            return fail(
              new AccessError(
                '비밀번호 변경과 전화번호 입력을 먼저 완료해 주세요.',
                428,
              ),
            )
          operation(stores, done, fail, user)
        }
      }
    },
  )
}
export async function getCurrentUser() {
  // 로그인 요청 전, 앱의 인증 초기화 단계에서 관리자 권한의 선생님 계정 하나를 준비한다.
  // 이미 존재하는 계정의 비밀번호·역할·첫 로그인 상태는 변경하지 않는다.
  await bootstrap()
  if (!getSessionId()) return null
  try {
    return await withUser(
      [],
      'readonly',
      (_, done, fail, user) => done(publicMember(user)),
      { setup: true },
    )
  } catch (error) {
    if (error.status === 401) {
      setSessionId('')
      return null
    }
    throw error
  }
}
export async function login({ loginId, password }) {
  await bootstrap()
  const member = await withStores(
    ['members'],
    'readonly',
    ({ members }, done) => {
      const request = members.getAll()
      request.onsuccess = () =>
        done(request.result.find((user) => user.loginId === loginId.trim()))
    },
  )
  if (!member || !(await passwordMatches(password, member.credential)))
    throw new AccessError('아이디 또는 비밀번호가 올바르지 않아요.')
  const id = crypto.randomUUID()
  const user = await withStores(
    ['members', 'sessions'],
    'readwrite',
    ({ members, sessions }, done, fail) => {
      const request = members.get(member.id)
      request.onsuccess = () => {
        if (
          !request.result ||
          request.result.credential.hash !== member.credential.hash
        )
          return fail(
            new AccessError('계정 정보가 변경됐어요. 다시 로그인해 주세요.'),
          )
        sessions.add({
          id,
          userId: member.id,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        })
        done(publicMember(request.result))
      }
    },
  )
  try {
    setSessionId(id)
  } catch (error) {
    await withStores(['sessions'], 'readwrite', ({ sessions }, done) => {
      sessions.delete(id)
      done()
    })
    throw error
  }
  return user
}
export async function logout() {
  const id = getSessionId()
  setSessionId('')
  if (id)
    await withStores(['sessions'], 'readwrite', ({ sessions }, done) => {
      sessions.delete(id)
      done()
    })
}
export async function changePassword(values) {
  const fields = validatePassword(values)
  if (Object.keys(fields).length)
    throw Object.assign(new Error('입력한 내용을 확인해 주세요.'), { fields })
  const member = await withUser(
    [],
    'readonly',
    (_, done, fail, user) => done(user),
    { setup: true },
  )
  if (!(await passwordMatches(values.currentPassword, member.credential)))
    throw Object.assign(new Error('현재 비밀번호가 올바르지 않아요.'), {
      fields: { currentPassword: '현재 비밀번호가 올바르지 않아요.' },
    })
  const credential = await makeCredential(values.newPassword)
  return withUser(
    [],
    'readwrite',
    ({ members, sessions }, done, fail, user) => {
      if (user.credential.hash !== member.credential.hash)
        return fail(
          new AccessError('비밀번호가 변경됐어요. 다시 로그인해 주세요.'),
        )
      const next = { ...user, credential, mustChangePassword: false }
      members.put(next)
      const request = sessions.getAll()
      request.onsuccess = () => {
        request.result
          .filter(
            (session) =>
              session.userId === user.id && session.id !== getSessionId(),
          )
          .forEach((session) => sessions.delete(session.id))
        done(publicMember(next))
      }
    },
    { setup: true },
  )
}
export function updatePhone(phone) {
  if (!validPhone(phone))
    return Promise.reject(
      Object.assign(new Error('010-0000-0000 형식으로 입력해 주세요.'), {
        fields: {
          phone: '010으로 시작하는 휴대전화 번호 11자리를 입력해 주세요.',
        },
      }),
    )
  return withUser(
    [],
    'readwrite',
    ({ members }, done, fail, user) => {
      if (user.mustChangePassword)
        return fail(new AccessError('먼저 비밀번호를 변경해 주세요.', 428))
      const next = { ...user, phone }
      members.put(next)
      done(publicMember(next))
    },
    { setup: true },
  )
}
