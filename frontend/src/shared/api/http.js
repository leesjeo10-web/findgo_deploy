// A 담당자는 자신의 인증 상태와 토큰 읽기·만료 처리를 아래 연결점에 주입한다.
const env = import.meta.env || {
  DEV: true
};
export const API_ORIGIN = (env.VITE_API_BASE_URL || (env.DEV ? 'http://localhost:8080' : '')).replace(/\/$/, '');
// 토큰 저장 위치는 A가 결정한다. B는 주입받은 함수로만 읽는다.
let tokenReader = () => '';
let unauthorizedHandler = null;
const beforeUnauthorized = new Set();
let handlingUnauthorized = null;
export function configureApiAuth({
  getToken,
  onUnauthorized
} = {}) {
  if (getToken) tokenReader = getToken;
  if (onUnauthorized) unauthorizedHandler = onUnauthorized;
}
export function onBeforeUnauthorized(callback) {
  beforeUnauthorized.add(callback);
  return () => beforeUnauthorized.delete(callback);
}
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = status === 404 ? 'ItemNotFoundError' : 'ApiError';
    this.status = status;
  }
}
async function expireSession() {
  if (!handlingUnauthorized) {
    handlingUnauthorized = (async () => {
      // 임시 저장이 완료된 후 토큰을 지우고 이동한다.
      await Promise.allSettled([...beforeUnauthorized].map(callback => Promise.resolve().then(callback)));
      if (unauthorizedHandler) await unauthorizedHandler();else if (globalThis.window) window.dispatchEvent(new CustomEvent('finder:unauthorized'));
    })().finally(() => {
      handlingUnauthorized = null;
    });
  }
  return handlingUnauthorized;
}
export async function apiRequest(path, {
  method = 'GET',
  body,
  signal,
  authenticate = true
} = {}) {
  if (!API_ORIGIN) throw new Error('서버 주소가 설정되지 않았어요. VITE_API_BASE_URL을 확인해주세요.');
  const token = authenticate ? tokenReader() : '';
  const multipart = body instanceof FormData;
  let response;
  try {
    response = await fetch(API_ORIGIN + '/api' + path, {
      method,
      signal,
      headers: {
        ...(token ? {
          Authorization: `Bearer ${token}`
        } : {}),
        ...(body && !multipart ? {
          'Content-Type': 'application/json'
        } : {})
      },
      body: body ? multipart ? body : JSON.stringify(body) : undefined
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('서버에 연결하지 못했어요. 연결 상태와 서버 주소를 확인해주세요.');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new ApiError(response.status, data.message || `요청에 실패했어요. (${response.status})`);
    if (response.status === 401 && authenticate && token === tokenReader()) await expireSession();
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
export function imageSource(path) {
  if (!path) return '';
  try {
    const origin = API_ORIGIN || globalThis.location?.origin;
    const url = new URL(path, origin);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === new URL(origin).origin ? url.href : '';
  } catch {
    return '';
  }
}
