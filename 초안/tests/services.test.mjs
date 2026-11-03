import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

function memoryStorage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key), clear: () => entries.clear() };
}

test('demo registration, ownership, edit, status, deletion and reload', async () => {
  globalThis.localStorage = memoryStorage();
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', define: { 'import.meta.env.VITE_USE_MOCK': JSON.stringify('true') } });
  try {
    const { itemsApi, authApi } = await vite.ssrLoadModule('/src/api/services.js');
    const { user } = await authApi.login({ email: 'test@example.com', password: 'test-only' });
    assert.equal(user.email, 'test@example.com');
    assert.equal((await itemsApi.list()).length, 8);
    const input = { type: 'found', name: '테스트 지갑', place: '도서관', date: '2026-10-22', storagePlace: '안내 데스크', status: 'stored', description: 'test', image: 'data:image/jpeg;base64,test' };
    const created = await itemsApi.create(input, user);
    assert.equal((await itemsApi.list()).length, 9);
    assert.equal((await itemsApi.get(created.id)).name, input.name);
    await assert.rejects(itemsApi.update(created.id, input, { id: 'other' }), /직접 등록/);
    const updated = await itemsApi.update(created.id, { ...input, name: '수정한 지갑', status: 'returned' }, user);
    assert.equal(updated.status, 'returned');
    assert.equal((await itemsApi.get(created.id)).name, '수정한 지갑');
    assert.equal((await itemsApi.get(created.id)).image, input.image);
    await assert.rejects(itemsApi.remove(created.id, { id: 'other' }), /직접 등록/);
    await itemsApi.remove(created.id, user);
    assert.equal((await itemsApi.list()).length, 8);
    await assert.rejects(itemsApi.get(created.id), /찾을 수 없/);
    const { user: signedUp } = await authApi.signup({ name: '테스트', email: 'signup@example.com', password: 'test-only' });
    assert.equal(signedUp.name, '테스트');
    assert.ok(!localStorage.getItem('chatgo-demo-items-v1').includes('test-only'));
  } finally { await vite.close(); delete globalThis.localStorage; }
});

test('real Axios requests: session login, CSRF, image upload, JSON items and failures', async () => {
  const vite = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    define: { 'import.meta.env.VITE_USE_MOCK': JSON.stringify('false'), 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.example.test') },
  });
  try {
    const { http, isDemo, errorMessage } = await vite.ssrLoadModule('/src/api/http.js');
    const { itemsApi, authApi } = await vite.ssrLoadModule('/src/api/services.js');
    assert.equal(isDemo, false);
    const requests = [];
    http.defaults.adapter = async config => {
      requests.push(config);
      const data = config.url === '/auth/csrf' ? { headerName: 'X-CSRF-TOKEN', token: 'csrf-test' } : config.url === '/auth/me' ? { id: 'real', name: '테스트' } : config.url === '/items' && config.method === 'get' ? { content: [] } : config.url === '/images' ? { imageUrl: '/api/images/test.jpg' } : { id: 'item', type: 'FOUND', status: 'OPEN', userId: 'real' };
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    const session = await authApi.login({ email: 'test@example.com', password: 'test-only' });
    assert.equal(session.user.name, '테스트');
    const login = requests.find(r => r.url === '/auth/login');
    assert.equal(new URLSearchParams(login.data).get('email'), 'test@example.com');
    assert.equal(login.headers['X-CSRF-TOKEN'], 'csrf-test');
    assert.equal(login.withCredentials, true);
    assert.equal(login.headers.Authorization, undefined);
    await authApi.signup({ name: '테스트', email: 'signup@example.com', password: 'test-only' });
    assert.ok(requests.some(r => r.url === '/auth/signup'));
    await authApi.logout();
    assert.equal(requests.at(-1).headers['X-CSRF-TOKEN'], 'csrf-test');
    assert.deepEqual(await itemsApi.list(), []);
    const created = await itemsApi.create({ type: 'found', name: '사진', description: '쿠키', place: '제과실', storagePlace: '교무실', date: '2026-10-31', status: 'stored', imageFile: new Blob(['image'], { type: 'image/png' }) }, session.user);
    assert.equal(created.type, 'found');
    assert.equal(created.ownerId, 'real');
    assert.equal(requests.at(-1).headers['X-CSRF-TOKEN'], 'csrf-test');
    const upload = requests.find(r => r.url === '/images');
    assert.ok(upload.data instanceof FormData);
    assert.equal(upload.data.get('file').size, 5);
    assert.equal(upload.headers['X-CSRF-TOKEN'], 'csrf-test');
    assert.deepEqual(JSON.parse(requests.at(-1).data), { type: 'FOUND', name: '사진', description: '쿠키', status: 'OPEN', location: '제과실', storageLocation: '교무실', lostFoundAt: '2026-10-31', imageUrl: '/api/images/test.jpg' });
    await itemsApi.update('a/b', { type: 'found', name: '수정', image: '/api/images/test.jpg', status: 'returned' }, session.user);
    assert.equal(requests.at(-1).url, '/items/a%2Fb');
    assert.equal(requests.at(-1).method, 'put');
    assert.equal(JSON.parse(requests.at(-1).data).status, 'RESOLVED');
    await itemsApi.remove('item', session.user);
    assert.equal(requests.at(-1).method, 'delete');
    assert.match(errorMessage({ code: 'ERR_NETWORK' }), /서버/);
    assert.match(errorMessage({ response: { status: 403 } }), /권한/);
    http.defaults.adapter = async () => { throw { code: 'ERR_NETWORK' }; };
    await assert.rejects(itemsApi.list());
  } finally { await vite.close(); }
});
