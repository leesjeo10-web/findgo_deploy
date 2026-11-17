import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, configureApiAuth, onBeforeUnauthorized, imageSource } from '../src/shared/api/http.js';
test('Bearer와 JSON, multipart, 204, 오류, 만료 처리 순서', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const order = [];
  globalThis.localStorage = {
    getItem: () => 'test-token',
    removeItem: () => order.push('clear')
  };
  configureApiAuth({
    getToken: () => 'test-token',
    onUnauthorized: () => {
      order.push('clear');
      order.push('redirect');
    }
  });
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = {
      url,
      ...options
    };
    return new Response(JSON.stringify({
      id: 1
    }), {
      status: 200
    });
  };
  try {
    await apiRequest('/items', {
      method: 'POST',
      body: {
        name: '우산'
      }
    });
    assert.equal(captured.headers.Authorization, 'Bearer test-token');
    assert.equal(captured.headers['Content-Type'], 'application/json');
    assert.equal(captured.body, '{"name":"우산"}');
    const body = new FormData();
    body.append('file', new Blob(['photo']), 'a.jpg');
    await apiRequest('/images', {
      method: 'POST',
      body
    });
    assert.equal(captured.body, body);
    assert.equal(captured.headers['Content-Type'], undefined);
    globalThis.fetch = async () => new Response(null, {
      status: 204
    });
    assert.equal(await apiRequest('/items/1', {
      method: 'DELETE'
    }), null);
    globalThis.fetch = async () => new Response('{"message":"권한 없음"}', {
      status: 403
    });
    await assert.rejects(apiRequest('/items/1'), error => error.status === 403 && error.message === '권한 없음');
    assert.deepEqual(order, []);
    const stop = onBeforeUnauthorized(async () => {
      await Promise.resolve();
      order.push('save');
    });
    globalThis.fetch = async () => new Response('{"message":"만료"}', {
      status: 401
    });
    await assert.rejects(apiRequest('/items'), error => error.status === 401);
    stop();
    assert.deepEqual(order, ['save', 'clear', 'redirect']);
    assert.match(imageSource('/api/images/test.jpg'), /^http:\/\/localhost:8080\/api\/images\/test.jpg$/);
    assert.equal(imageSource('https://other.example/photo.jpg'), '');
    assert.equal(imageSource('javascript:alert(1)'), '');
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalStorage;
  }
});
