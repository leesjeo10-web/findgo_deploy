import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

function memoryStorage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key), clear: () => entries.clear() };
}

test('demo registration, ownership, edit, status, deletion and reload', async () => {
  globalThis.localStorage = memoryStorage();
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
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

test('real Axios requests: bearer auth, multipart, endpoints and failures', async () => {
  const vite = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    define: { 'import.meta.env.VITE_USE_MOCK': JSON.stringify('false'), 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.example.test') },
  });
  try {
    const { http, isDemo, setAccessToken, errorMessage } = await vite.ssrLoadModule('/src/api/http.js');
    const { itemsApi, authApi } = await vite.ssrLoadModule('/src/api/services.js');
    assert.equal(isDemo, false);
    const requests = [];
    http.defaults.adapter = async config => {
      requests.push(config);
      const data = config.method === 'get' && config.url === '/items' ? { items: [] } : { user: { id: 'real', name: '테스트' }, accessToken: 'test-token', id: 'item' };
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    const session = await authApi.login({ email: 'test@example.com', password: 'test-only' });
    assert.equal(session.accessToken, 'test-token');
    setAccessToken(session.accessToken);
    assert.deepEqual(await itemsApi.list(), []);
    await itemsApi.create({ name: '사진', imageFile: new Blob(['image'], { type: 'image/png' }) }, session.user);
    assert.equal(requests.at(-1).headers.Authorization, 'Bearer test-token');
    assert.ok(requests.at(-1).data instanceof FormData);
    assert.equal(requests.at(-1).data.get('image').size, 5);
    await itemsApi.update('a/b', { name: '수정' }, session.user);
    assert.equal(requests.at(-1).url, '/items/a%2Fb');
    assert.equal(requests.at(-1).method, 'patch');
    await itemsApi.remove('item', session.user);
    assert.equal(requests.at(-1).method, 'delete');
    assert.match(errorMessage({ code: 'ERR_NETWORK' }), /서버/);
    assert.match(errorMessage({ response: { status: 403 } }), /권한/);
    http.defaults.adapter = async () => { throw { code: 'ERR_NETWORK' }; };
    await assert.rejects(itemsApi.list());
  } finally { await vite.close(); }
});
